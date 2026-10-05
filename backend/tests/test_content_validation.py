"""Schema and business validation of learning content (no database needed)."""

import copy
import json

import pytest
from pydantic import ValidationError

from app.content import ConceptContent, CurriculumSpec, QuickCheck
from seed.load import DATA_DIR, read_seed


def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture()
def concept_data():
    return load_json(DATA_DIR / "concepts" / "logistic-regression.json")


@pytest.fixture()
def curriculum_data():
    return load_json(DATA_DIR / "curriculum-machine-learning.json")


def test_seed_files_are_valid():
    curricula, concepts = read_seed()
    assert len(curricula) == 1
    assert len(concepts) == 5


def test_quick_check_answer_index_must_point_at_an_option():
    with pytest.raises(ValidationError, match="answer_index 4 is out of range"):
        QuickCheck(question="Q?", options=["a", "b", "c"], answer_index=4, explanation="e")


def test_quick_check_options_must_be_unique():
    with pytest.raises(ValidationError, match="options must be unique"):
        QuickCheck(question="Q?", options=["a", "a", "c"], answer_index=0, explanation="e")


def test_quick_check_needs_three_to_four_options():
    with pytest.raises(ValidationError):
        QuickCheck(question="Q?", options=["a", "b"], answer_index=0, explanation="e")


def test_cards_must_follow_the_facet_order(concept_data):
    concept_data["cards"][0], concept_data["cards"][1] = concept_data["cards"][1], concept_data["cards"][0]
    with pytest.raises(ValidationError, match="facets in order"):
        ConceptContent.model_validate(concept_data)


def test_summary_length_is_enforced(concept_data):
    concept_data["cards"][0]["summary"] = "Too short."
    with pytest.raises(ValidationError, match="summary has 2 words"):
        ConceptContent.model_validate(concept_data)


def test_unknown_fields_are_rejected(concept_data):
    concept_data["cards"][0]["confidence"] = 0.9
    with pytest.raises(ValidationError, match="Extra inputs"):
        ConceptContent.model_validate(concept_data)


def test_visual_type_is_restricted(concept_data):
    concept_data["cards"][0]["visual"] = {"type": "svg", "content": "<svg/>", "alt_text": "x"}
    with pytest.raises(ValidationError):
        ConceptContent.model_validate(concept_data)


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (lambda nodes: nodes.append({**nodes[0], "key": "second-root"}), "exactly one root"),
        (lambda nodes: nodes[1].update(parent_key="missing"), "unknown parent"),
        (lambda nodes: nodes[2].update(concept_key=None), "has no children and no concept"),
        (lambda nodes: nodes[1].update(concept_key="extra"), "has a concept but also children"),
        (lambda nodes: nodes[3].update(concept_key=nodes[2]["concept_key"]), "only once per curriculum"),
    ],
)
def test_curriculum_tree_rules(curriculum_data, mutate, message):
    data = copy.deepcopy(curriculum_data)
    mutate(data["nodes"])
    with pytest.raises(ValidationError, match=message):
        CurriculumSpec.model_validate(data)


def test_cycles_are_detected(curriculum_data):
    nodes = curriculum_data["nodes"]
    # foundations -> bias-variance -> foundations
    nodes[1]["parent_key"] = nodes[2]["key"]
    with pytest.raises(ValidationError, match="cycle"):
        CurriculumSpec.model_validate(curriculum_data)
