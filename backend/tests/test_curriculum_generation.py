"""LLM curriculum generation, with a scripted fake provider (no network)."""

import json

import pytest
from sqlalchemy import select

from app.content import CurriculumDraft, draft_to_spec
from app.llm.prompts import render_prompt
from app.llm.provider import LLMError
from app.llm.structured import GenerationFailed, extract_json, generate_structured
from app.models import Concept, LlmCall
from tests.conftest import FakeProvider


def make_draft(title="Deep Learning", leaves=None):
    leaves = leaves or [
        ("Perceptron", "foundations"),
        ("Backpropagation", "foundations"),
        ("Activation Functions", "foundations"),
        ("Logistic Regression", "foundations"),
        ("Convolutional Neural Networks", "architectures"),
        ("Recurrent Neural Networks", "architectures"),
        ("Transformers", "architectures"),
        ("Dropout", "training"),
        ("Batch Normalization", "training"),
    ]
    nodes = [{"key": "root", "parent_key": None, "name": title, "description": f"All about {title}."}]
    for branch in dict.fromkeys(parent for _, parent in leaves):
        nodes.append(
            {"key": branch, "parent_key": "root", "name": branch.title(), "description": "A branch."}
        )
    for name, parent in leaves:
        nodes.append(
            {
                "key": name.lower().replace(" ", "-"),
                "parent_key": parent,
                "name": name,
                "description": "A leaf.",
            }
        )
    return {"in_scope": True, "reason": "", "title": title, "nodes": nodes}


# ---------- extract_json / generate_structured ----------


def test_extract_json_handles_fences_and_surrounding_text():
    assert extract_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert extract_json('Here you go: {"a": 1} hope it helps') == {"a": 1}


def prompt():
    return render_prompt("curriculum", "v1", topic="Deep Learning")


def test_prompt_renders_topic_and_both_roles():
    rendered = prompt()
    assert [m["role"] for m in rendered.messages] == ["system", "user"]
    assert '"Deep Learning"' in rendered.messages[1]["content"]
    assert rendered.ref == "curriculum/v1"


def test_valid_output_on_first_attempt():
    fake = FakeProvider([make_draft()])
    result = generate_structured(fake, prompt(), CurriculumDraft)
    assert result.value.title == "Deep Learning"
    assert [a.status for a in result.attempts] == ["ok"]
    assert result.generation_meta()["prompt_version"] == "curriculum/v1"


def test_invalid_output_is_repaired_with_validator_feedback():
    bad = make_draft(leaves=[("Perceptron", "foundations")])  # too few leaves
    fake = FakeProvider([bad, make_draft()])
    result = generate_structured(
        fake, prompt(), CurriculumDraft, validate=lambda d: draft_to_spec(d, "Deep Learning")
    )
    assert [a.status for a in result.attempts] == ["invalid_output", "ok"]
    repair_message = fake.calls[1][-1]["content"]
    assert "rejected by the validator" in repair_message and "1 leaf concepts" in repair_message


def test_gives_up_after_two_invalid_outputs():
    fake = FakeProvider(["not json at all", '{"in_scope": true}'])
    with pytest.raises(GenerationFailed) as failure:
        generate_structured(fake, prompt(), CurriculumDraft)
    assert failure.value.code == "llm_invalid_output"
    assert [a.status for a in failure.value.attempts] == ["invalid_output", "invalid_output"]


def test_provider_errors_are_not_retried():
    fake = FakeProvider([LLMError("llm_rate_limited", "busy", True, 429, "429 from upstream")])
    with pytest.raises(GenerationFailed) as failure:
        generate_structured(fake, prompt(), CurriculumDraft)
    assert failure.value.code == "llm_rate_limited"
    assert len(fake.calls) == 1


# ---------- draft_to_spec business rules ----------


def test_draft_to_spec_derives_positions_and_concept_keys():
    spec = draft_to_spec(CurriculumDraft.model_validate(make_draft()), "Deep Learning")
    leaf = next(n for n in spec.nodes if n.name == "Logistic Regression")
    assert leaf.concept_key == "logistic-regression"
    assert [n.position for n in spec.nodes if n.parent_key == "root"] == [0, 1, 2]
    assert next(n for n in spec.nodes if n.key == "root").concept_key is None


@pytest.mark.parametrize(
    ("mutate", "message"),
    [
        (lambda d: d["nodes"].append({**d["nodes"][-1], "key": "x2"}), "more than once"),
        # A branch that repeats its own child's name (seen in the NLP eval).
        (lambda d: d["nodes"][1].update(name="Perceptron"), "more than once"),
        (lambda d: d["nodes"][1].update(name="Introduction"), "generic placeholder"),
        (
            lambda d: d["nodes"].append({**d["nodes"][0], "key": "root2", "name": "Other Root"}),
            "exactly one root",
        ),
    ],
)
def test_draft_rules(mutate, message):
    draft = make_draft()
    mutate(draft)
    with pytest.raises(ValueError, match=message):
        draft_to_spec(CurriculumDraft.model_validate(draft), "Deep Learning")


# ---------- POST /api/curricula ----------


def test_create_curriculum_persists_tree_and_reuses_existing_concepts(client, db, fake_llm):
    fake_llm.responses = [make_draft()]
    response = client.post("/api/curricula", json={"topic": "  Deep   Learning "})
    assert response.status_code == 200, response.text
    curriculum = response.json()
    assert curriculum["title"] == "Deep Learning"
    assert curriculum["requested_topic"] == "Deep Learning"
    assert curriculum["generation"]["model"] == "fake-model"
    assert curriculum["generation"]["prompt_version"] == "curriculum/v1"

    leaves = {n["name"]: n for n in curriculum["nodes"] if n["concept_id"]}
    assert len(leaves) == 9
    # The seeded Logistic Regression concept (with cards) is shared, not duplicated.
    seeded = db.scalar(select(Concept).where(Concept.concept_key == "logistic-regression"))
    assert leaves["Logistic Regression"]["concept_id"] == str(seeded.id)
    assert leaves["Logistic Regression"]["content_status"] == "ready"
    assert leaves["Transformers"]["content_status"] == "not_generated"

    calls = db.scalars(select(LlmCall).where(LlmCall.subject == "Deep Learning")).all()
    assert [(c.status, c.prompt_version) for c in calls] == [("ok", "curriculum/v1")]

    titles = [c["title"] for c in client.get("/api/curricula").json()]
    assert "Deep Learning" in titles


def test_same_topic_returns_stored_curriculum_without_calling_the_llm(client, fake_llm):
    fake_llm.responses = [make_draft()]
    first = client.post("/api/curricula", json={"topic": "Deep Learning"}).json()
    second = client.post("/api/curricula", json={"topic": "deep learning"}).json()
    assert second["id"] == first["id"]
    assert len(fake_llm.calls) == 1


def test_out_of_scope_topic(client, db, fake_llm):
    fake_llm.responses = [{"in_scope": False, "reason": "It is about cooking.", "title": "", "nodes": []}]
    response = client.post("/api/curricula", json={"topic": "French Cooking"})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "topic_out_of_scope" and "cooking" in error["message"]
    assert db.scalar(select(LlmCall).where(LlmCall.subject == "French Cooking")).status == "ok"


def test_unusable_output_returns_retryable_error_and_logs_both_attempts(client, db, fake_llm):
    fake_llm.responses = ["{}", json.dumps({"in_scope": True})]
    response = client.post("/api/curricula", json={"topic": "Robotics"})
    assert response.status_code == 502
    assert response.json()["error"] == {
        "code": "llm_invalid_output",
        "message": "The AI produced an answer we couldn't use. Try again.",
        "retryable": True,
    }
    calls = db.scalars(select(LlmCall).where(LlmCall.subject == "Robotics").order_by(LlmCall.attempt)).all()
    assert [c.status for c in calls] == ["invalid_output", "invalid_output"]
    assert calls[0].response_excerpt == "{}"


def test_rate_limit_maps_to_429(client, fake_llm):
    fake_llm.responses = [
        LLMError("llm_rate_limited", "The AI is busy right now.", True, 429, "upstream 429")
    ]
    response = client.post("/api/curricula", json={"topic": "Computer Vision"})
    assert response.status_code == 429
    assert response.json()["error"]["code"] == "llm_rate_limited"
    assert response.json()["error"]["retryable"] is True


def test_missing_api_key_is_a_clear_server_error(client, monkeypatch):
    from app.config import settings
    from app.llm.provider import get_llm_provider

    get_llm_provider.cache_clear()
    monkeypatch.setattr(settings, "llm_api_key", None)
    response = client.post("/api/curricula", json={"topic": "Statistics for ML"})
    get_llm_provider.cache_clear()
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "llm_not_configured"


def test_topic_validation(client):
    assert client.post("/api/curricula", json={"topic": ""}).status_code == 422
    assert client.post("/api/curricula", json={"topic": "x" * 101}).status_code == 422
