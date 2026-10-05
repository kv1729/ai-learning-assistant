"""Learning-content models and their validation rules.

Every piece of content is validated here before it reaches the database: seed
data now, LLM output from Stages 3-4. Two layers:

- Schema validation: field types, required fields, lengths (Pydantic Field constraints).
- Business validation: rules across fields or objects, such as "answer_index points
  at an option", "facets appear in the fixed order" or "every parent node exists"
  (Pydantic model/field validators).
"""

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
