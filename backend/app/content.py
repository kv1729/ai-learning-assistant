"""Learning-content models and their validation rules.

Every piece of content is validated here before it reaches the database: seed
data now, LLM output from Stages 3-4. Two layers:

- Schema validation: field types, required fields, lengths (Pydantic Field constraints).
- Business validation: rules across fields or objects, such as "answer_index points
  at an option", "facets appear in the fixed order" or "every parent node exists"
  (Pydantic model/field validators).
"""

import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

FACETS = ("why_it_matters", "intuition", "how_it_works", "worked_example", "pitfalls", "compare")
Facet = Literal["why_it_matters", "intuition", "how_it_works", "worked_example", "pitfalls", "compare"]
MAX_TREE_DEPTH = 4
KEY_PATTERN = r"^[a-z0-9]+(-[a-z0-9]+)*$"


def word_count(text: str) -> int:
    return len(text.split())


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Visual(StrictModel):
    type: Literal["formula", "mermaid", "icon"]
    content: str = Field(min_length=1)
    caption: str | None = None
    alt_text: str = Field(min_length=1)


class QuickCheck(StrictModel):
    question: str = Field(min_length=1)
    options: list[str] = Field(min_length=3, max_length=4)
    answer_index: int
    explanation: str = Field(min_length=1)

    @model_validator(mode="after")
    def check_options(self) -> "QuickCheck":
        if len(set(self.options)) != len(self.options):
            raise ValueError("options must be unique")
        if not 0 <= self.answer_index < len(self.options):
            raise ValueError(
                f"answer_index {self.answer_index} is out of range for {len(self.options)} options"
            )
        return self


class Detail(StrictModel):
    body_markdown: str
    misconceptions: list[str] = Field(default_factory=list)
    related_concepts: list[str] = Field(default_factory=list)
    takeaway: str = Field(min_length=1)

    @field_validator("body_markdown")
    @classmethod
    def check_length(cls, value: str) -> str:
        words = word_count(value)
        if not 300 <= words <= 700:
            raise ValueError(f"body_markdown has {words} words; expected 300-700")
        return value


class CardContent(StrictModel):
    facet: Facet
    title: str = Field(min_length=1, max_length=60)
    summary: str
    key_takeaway: str = Field(min_length=1)
    visual: Visual | None = None
    quick_check: QuickCheck
    detail: Detail | None = None

    @field_validator("summary")
    @classmethod
    def check_summary_length(cls, value: str) -> str:
        words = word_count(value)
        if not 80 <= words <= 130:
            raise ValueError(f"summary has {words} words; expected 80-130")
        return value


class ConceptContent(StrictModel):
    concept_key: str = Field(pattern=KEY_PATTERN)
    name: str = Field(min_length=1)
    cards: list[CardContent]

    @model_validator(mode="after")
    def check_facets(self) -> "ConceptContent":
        facets = tuple(card.facet for card in self.cards)
        if facets != FACETS:
            raise ValueError(f"cards must cover the facets in order {FACETS}; got {facets}")
        return self


class NodeSpec(StrictModel):
    key: str = Field(min_length=1)
    parent_key: str | None
    name: str = Field(min_length=1)
    description: str = ""
    position: int = Field(ge=0)
    concept_key: str | None = Field(default=None, pattern=KEY_PATTERN)


class CurriculumSpec(StrictModel):
    key: str = Field(pattern=KEY_PATTERN)
    title: str = Field(min_length=1)
    requested_topic: str = Field(min_length=1)
    nodes: list[NodeSpec] = Field(min_length=1)

    @model_validator(mode="after")
    def check_tree(self) -> "CurriculumSpec":
        validate_tree(self.nodes)
        return self

    def depths(self) -> dict[str, int]:
        by_key = {node.key: node for node in self.nodes}

        def depth(key: str) -> int:
            parent = by_key[key].parent_key
            return 0 if parent is None else depth(parent) + 1

        return {node.key: depth(node.key) for node in self.nodes}


def validate_tree(nodes: list[NodeSpec]) -> None:
    """Business rules for a curriculum tree. Raises ValueError with every problem found."""
    problems: list[str] = []
    by_key = {node.key: node for node in nodes}
    if len(by_key) != len(nodes):
        problems.append("node keys must be unique")

    roots = [node for node in nodes if node.parent_key is None]
    if len(roots) != 1:
        problems.append(f"expected exactly one root node, found {len(roots)}")

    children: dict[str, list[NodeSpec]] = {}
    for node in nodes:
        if node.parent_key is not None:
            if node.parent_key not in by_key:
                problems.append(f"node '{node.key}' has unknown parent '{node.parent_key}'")
            children.setdefault(node.parent_key, []).append(node)

    for node in nodes:
        # Walk up to the root, detecting cycles and measuring depth.
        seen, current, depth = {node.key}, node, 0
        while current.parent_key is not None and current.parent_key in by_key:
            current = by_key[current.parent_key]
            depth += 1
            if current.key in seen:
                problems.append(f"node '{node.key}' is part of a cycle")
                break
            seen.add(current.key)
        if depth > MAX_TREE_DEPTH:
            problems.append(f"node '{node.key}' is deeper than {MAX_TREE_DEPTH}")

        has_children = bool(children.get(node.key))
        if node.concept_key and has_children:
            problems.append(f"leaf node '{node.key}' has a concept but also children")
        if not node.concept_key and not has_children:
            problems.append(f"branch node '{node.key}' has no children and no concept")

    concept_keys = [node.concept_key for node in nodes if node.concept_key]
    if len(set(concept_keys)) != len(concept_keys):
        problems.append("a concept may appear only once per curriculum")

    if problems:
        raise ValueError("; ".join(problems))


# ---------- LLM-generated curricula (Stage 3) ----------

GENERIC_NODE_NAMES = {
    "introduction",
    "overview",
    "summary",
    "conclusion",
    "basics",
    "applications",
    "further reading",
    "case studies",
}
MIN_LEAVES, MAX_LEAVES, MAX_NODES = 6, 40, 80


class DraftNode(StrictModel):
    """One node as the LLM returns it. All fields are required and unconstrained in the
    schema (strict JSON-schema mode supports few keywords); limits are checked in draft_to_spec.
    """

    key: str
    parent_key: str | None
    name: str
    description: str


class CurriculumDraft(StrictModel):
    """The LLM's answer for a curriculum request."""

    in_scope: bool
    reason: str
    title: str
    nodes: list[DraftNode]


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "concept"


def draft_to_spec(draft: CurriculumDraft, requested_topic: str) -> CurriculumSpec:
    """Convert an in-scope draft into a CurriculumSpec, enforcing generation rules.

    Raises ValueError (or ValidationError) listing what is wrong, so the message can be
    fed back to the model in a repair attempt.
    """
    if not draft.in_scope:
        raise ValueError("draft is out of scope")
    problems: list[str] = []
    nodes = draft.nodes
    if len(nodes) > MAX_NODES:
        problems.append(f"too many nodes ({len(nodes)}); at most {MAX_NODES}")

    has_children = {n.parent_key for n in nodes if n.parent_key is not None}
    leaves = [n for n in nodes if n.key not in has_children and n.parent_key is not None]
    if not MIN_LEAVES <= len(leaves) <= MAX_LEAVES:
        problems.append(f"{len(leaves)} leaf concepts; expected {MIN_LEAVES}-{MAX_LEAVES}")

    bad_names = sorted(n.key for n in nodes if not 0 < len(n.name.strip()) <= 60)
    if bad_names:
        problems.append(f"node names must be 1-60 characters: {bad_names}")

    generic = sorted({n.name for n in nodes if n.name.strip().lower() in GENERIC_NODE_NAMES})
    if generic:
        problems.append(f"generic placeholder nodes are not allowed: {generic}")

    # Every node name must be unique: a branch must not repeat its own child (e.g. a
    # "Transformer" branch containing a "Transformer" leaf), and no concept may appear twice.
    names = [slugify(n.name) for n in nodes]
    duplicates = sorted({n.name for n in nodes if names.count(slugify(n.name)) > 1})
    if duplicates:
        problems.append(f"node names appear more than once (rename or merge them): {duplicates}")
    if problems:
        raise ValueError("; ".join(problems))

    position: dict[str | None, int] = {}
    spec_nodes = []
    for node in nodes:
        index = position.get(node.parent_key, 0)
        position[node.parent_key] = index + 1
        is_leaf = node.key not in has_children and node.parent_key is not None
        spec_nodes.append(
            {
                "key": node.key,
                "parent_key": node.parent_key,
                "name": node.name.strip(),
                "description": node.description.strip(),
                "position": index,
                "concept_key": slugify(node.name) if is_leaf else None,
            }
        )
    # CurriculumSpec runs the shared tree rules (single root, parents exist, no cycles, depth).
    return CurriculumSpec.model_validate(
        {
            "key": slugify(draft.title or requested_topic),
            "title": draft.title.strip() or requested_topic,
            "requested_topic": requested_topic,
            "nodes": spec_nodes,
        }
    )


# ---------- LLM-generated cards and details (Stage 4) ----------

# Icon names the frontend can render (frontend/src/components/visuals/VisualIcon.jsx).
ICON_NAMES = (
    "brain",
    "circle-dot",
    "git-fork",
    "percent",
    "sigma",
    "sparkles",
    "split",
    "target",
    "triangle-alert",
    "users",
)
MERMAID_STARTS = ("graph ", "flowchart ")
MAX_MERMAID_LINES = 14


class VisualDraft(StrictModel):
    """LLM-facing visual: every field required, no schema keywords beyond types (strict mode)."""

    type: Literal["formula", "mermaid", "icon"]
    content: str
    caption: str | None
    alt_text: str


class QuickCheckDraft(StrictModel):
    question: str
    options: list[str]
    answer_index: int
    explanation: str


class CardDraft(StrictModel):
    facet: Facet
    title: str
    summary: str
    key_takeaway: str
    visual: VisualDraft
    quick_check: QuickCheckDraft


class ConceptCardsDraft(StrictModel):
    """The LLM's answer for a concept: its six cards, in facet order."""

    cards: list[CardDraft]


class DetailDraft(StrictModel):
    """The LLM's answer for one card's Explore-in-Depth content."""

    body_markdown: str
    misconceptions: list[str]
    related_concepts: list[str]
    takeaway: str


def visual_problems(visual: VisualDraft, where: str) -> list[str]:
    """Cheap checks that catch visuals the frontend would have to replace with a fallback."""
    content = visual.content.strip()
    if visual.type == "icon" and content not in ICON_NAMES:
        return [f"{where}: icon must be one of {list(ICON_NAMES)}, got '{content}'"]
    if visual.type == "mermaid":
        lines = [line for line in content.splitlines() if line.strip()]
        if not content.startswith(MERMAID_STARTS):
            return [f"{where}: mermaid must start with 'graph TD', 'graph LR' or 'flowchart'"]
        if len(lines) > MAX_MERMAID_LINES:
            return [f"{where}: mermaid diagram too large ({len(lines)} lines; max {MAX_MERMAID_LINES})"]
    if visual.type == "formula":
        if "$" in content:
            return [f"{where}: formula must be bare LaTeX without $ delimiters"]
        if content.count("{") != content.count("}"):
            return [f"{where}: formula has unbalanced braces"]
    return []


def cards_draft_to_content(draft: ConceptCardsDraft, concept_key: str, name: str) -> ConceptContent:
    """Validate a cards draft with the shared content rules plus generation-specific checks.

    Raises ValueError/ValidationError listing the problems (fed back in a repair attempt).
    """
    problems: list[str] = []
    for index, card in enumerate(draft.cards, start=1):
        problems += visual_problems(card.visual, f"card {index} ({card.facet})")
    titles = [card.title.strip().lower() for card in draft.cards]
    if len(set(titles)) != len(titles):
        problems.append("card titles must be distinct")
    if problems:
        raise ValueError("; ".join(problems))
    # ConceptContent enforces: six cards in facet order, 80-130 word summaries, titles <= 60
    # characters, 3-4 unique options with a valid answer_index, non-empty explanations.
    return ConceptContent.model_validate(
        {"concept_key": concept_key, "name": name, "cards": [card.model_dump() for card in draft.cards]}
    )


def detail_draft_to_detail(draft: DetailDraft) -> Detail:
    """Detail enforces 300-700 words and a non-empty takeaway."""
    if "<" in draft.body_markdown and re.search(r"<\s*(script|iframe|style)", draft.body_markdown, re.I):
        raise ValueError("body_markdown must not contain HTML tags")
    return Detail.model_validate(draft.model_dump())
