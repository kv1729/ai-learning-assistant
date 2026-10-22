"""Lazy card and detail generation with a scripted fake provider (no network)."""

import contextlib
import threading
import time
from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import select

from app.content import ConceptCardsDraft, VisualDraft, cards_draft_to_content, visual_problems
from app.llm.provider import LLMError
from app.llm.singleflight import SingleFlight
from app.models import Card, Concept, LlmCall
from app.services import generation
from app.services.context import build_card_context, build_concept_context
from tests.conftest import find_node

FACETS = ["why_it_matters", "intuition", "how_it_works", "worked_example", "pitfalls", "compare"]
WORDS_100 = " ".join(["principal components capture the directions of largest variance in data"] * 10)


def make_cards(name="PCA"):
    visuals = [
        {"type": "icon", "content": "target", "caption": None, "alt_text": "target"},
        {"type": "icon", "content": "sparkles", "caption": None, "alt_text": "idea"},
        {
            "type": "formula",
            "content": r"\Sigma = \frac{1}{n} X^\top X",
            "caption": "Covariance",
            "alt_text": "cov",
        },
        {"type": "formula", "content": r"\lambda_1 = 4.2", "caption": "Eigenvalue", "alt_text": "eigenvalue"},
        {"type": "icon", "content": "triangle-alert", "caption": None, "alt_text": "warning"},
        {
            "type": "mermaid",
            "content": "graph LR\n  A[PCA] --> B[t-SNE]",
            "caption": "Neighbours",
            "alt_text": "x",
        },
    ]
    return {
        "cards": [
            {
                "facet": facet,
                "title": f"{name}: {facet.replace('_', ' ')} card",
                "summary": WORDS_100,
                "key_takeaway": "Remember this.",
                "visual": visuals[i],
                "quick_check": {
                    "question": "Which is right?",
                    "options": ["a", "b", "c", "d"],
                    "answer_index": i % 4,
                    "explanation": "Because.",
                },
            }
            for i, facet in enumerate(FACETS)
        ]
    }


def make_detail(related=("SVM", "Not In Curriculum")):
    body = "## Intuition\n" + " ".join(["The split criterion picks the most informative feature."] * 45)
    return {
        "body_markdown": body,
        "misconceptions": ["Trees do not need feature scaling."],
        "related_concepts": list(related),
        "takeaway": "Splits reduce impurity.",
    }


@pytest.fixture(autouse=True)
def background_uses_test_session(db, monkeypatch):
    """Run background generation inside the test's transaction."""
    monkeypatch.setattr(generation, "session_factory", lambda: contextlib.nullcontext(db))


def feed_for(client, name):
    node = find_node(client, name)
    return node, client.get(f"/api/nodes/{node['id']}/feed").json()


# ---------- concept cards ----------


def test_first_open_generates_and_stores_cards_second_open_uses_database(client, db, fake_llm):
    node, feed = feed_for(client, "PCA")
    assert feed["concept"]["content_status"] == "not_generated"

    fake_llm.responses = [make_cards()]
    response = client.post(f"/api/concepts/{node['concept_id']}/generate", params={"node_id": node["id"]})
    assert response.json() == {"content_status": "generating"}

    _, feed = feed_for(client, "PCA")  # the background task has run by now
    assert feed["concept"]["content_status"] == "ready"
    assert [c["facet"] for c in feed["cards"]] == FACETS
    assert not any(c["has_detail"] for c in feed["cards"])
    assert feed["cards"][2]["visual"]["type"] == "formula"

    # The prompt carried the curriculum context.
    prompt = fake_llm.calls[0][1]["content"]
    assert "Machine Learning › Unsupervised Learning › PCA" in prompt
    assert "K-Means Clustering" in prompt

    concept = db.get(Concept, node["concept_id"])
    assert concept.generation["prompt_version"] == "concept_cards/v1"
    assert db.scalar(select(LlmCall).where(LlmCall.purpose == "concept_cards")).status == "ok"

    # Second request: no LLM call, served from the database.
    again = client.post(f"/api/concepts/{node['concept_id']}/generate")
    assert again.json() == {"content_status": "ready"}
    assert len(fake_llm.calls) == 1


def test_unusable_output_marks_failed_and_retry_succeeds(client, fake_llm):
    node, _ = feed_for(client, "PCA")
    fake_llm.responses = ["not json", {"cards": []}]
    client.post(f"/api/concepts/{node['concept_id']}/generate")
    _, feed = feed_for(client, "PCA")
    assert feed["concept"]["content_status"] == "failed"
    assert feed["concept"]["generation_error"]["code"] == "llm_invalid_output"
    assert feed["concept"]["generation_error"]["retryable"] is True
    assert feed["cards"] == []

    fake_llm.responses = [make_cards()]
    assert client.post(f"/api/concepts/{node['concept_id']}/generate").json() == {
        "content_status": "generating"
    }
    _, feed = feed_for(client, "PCA")
    assert feed["concept"]["content_status"] == "ready" and len(feed["cards"]) == 6


def test_repair_attempt_fixes_a_bad_visual(client, fake_llm):
    node, _ = feed_for(client, "PCA")
    bad = make_cards()
    bad["cards"][0]["visual"] = {"type": "icon", "content": "rocket", "caption": None, "alt_text": "x"}
    fake_llm.responses = [bad, make_cards()]
    client.post(f"/api/concepts/{node['concept_id']}/generate")
    assert "icon must be one of" in fake_llm.calls[1][-1]["content"]
    _, feed = feed_for(client, "PCA")
    assert feed["concept"]["content_status"] == "ready"


def test_rate_limit_is_stored_as_retryable_failure(client, fake_llm):
    node, _ = feed_for(client, "PCA")
    fake_llm.responses = [LLMError("llm_rate_limited", "The AI is busy right now.", True, 429, "429")]
    client.post(f"/api/concepts/{node['concept_id']}/generate")
    _, feed = feed_for(client, "PCA")
    assert feed["concept"]["generation_error"] == {
        "code": "llm_rate_limited",
        "message": "The AI is busy right now.",
        "retryable": True,
    }


def test_missing_api_key_fails_fast_without_claiming(client, db, monkeypatch):
    from app.config import settings
    from app.llm.provider import get_llm_provider

    node, _ = feed_for(client, "PCA")
    get_llm_provider.cache_clear()
    monkeypatch.setattr(settings, "llm_api_key", None)
    response = client.post(f"/api/concepts/{node['concept_id']}/generate")
    get_llm_provider.cache_clear()
    assert response.status_code == 503 and response.json()["error"]["code"] == "llm_not_configured"
    assert db.get(Concept, node["concept_id"]).content_status == "not_generated"


def test_only_one_caller_wins_the_claim_and_stale_claims_are_reclaimable(client, db):
    node, _ = feed_for(client, "PCA")
    assert generation.claim_concept(db, node["concept_id"]) is True
    assert generation.claim_concept(db, node["concept_id"]) is False

    concept = db.get(Concept, node["concept_id"])
    concept.generation_started_at = datetime.now(UTC) - timedelta(hours=1)
    db.commit()
    assert generation.claim_concept(db, node["concept_id"]) is True


# ---------- card detail ----------


def test_detail_is_generated_on_first_open_then_served_from_database(client, db, fake_llm):
    _, feed = feed_for(client, "Decision Trees")
    card = feed["cards"][0]
    assert card["has_detail"] is False

    fake_llm.responses = [make_detail()]
    detail = client.get(f"/api/cards/{card['id']}/detail")
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["body_markdown"].startswith("## Intuition")
    related = {r["name"]: r["node_id"] for r in body["related_concepts"]}
    assert related["SVM"] == find_node(client, "SVM")["id"]
    assert related["Not In Curriculum"] is None

    prompt = fake_llm.calls[0][1]["content"]
    assert "Card type: why_it_matters" in prompt and "Other concepts in this curriculum" in prompt

    assert client.get(f"/api/cards/{card['id']}/detail").json() == body
    assert len(fake_llm.calls) == 1
    assert db.scalar(select(LlmCall).where(LlmCall.purpose == "card_detail")).status == "ok"


def test_unusable_detail_returns_error_and_stores_nothing(client, db, fake_llm):
    _, feed = feed_for(client, "Decision Trees")
    card = feed["cards"][1]
    fake_llm.responses = [{**make_detail(), "body_markdown": "Too short."}] * 2
    response = client.get(f"/api/cards/{card['id']}/detail")
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "llm_invalid_output"
    assert db.get(Card, card["id"]).detail is None


def test_seeded_detail_needs_no_llm(client, fake_llm):
    _, feed = feed_for(client, "Logistic Regression")
    assert client.get(f"/api/cards/{feed['cards'][0]['id']}/detail").status_code == 200
    assert fake_llm.calls == []


# ---------- building blocks ----------


def test_single_flight_runs_concurrent_calls_once():
    flights, calls = SingleFlight(), []

    def slow():
        calls.append(1)
        time.sleep(0.2)
        return "value"

    results = []
    threads = [threading.Thread(target=lambda: results.append(flights.do("k", slow))) for _ in range(3)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert results == ["value"] * 3 and len(calls) == 1


def test_context_builder(client, db):
    node = find_node(client, "Logistic Regression")
    concept = db.get(Concept, node["concept_id"])
    context = build_concept_context(db, concept, node["id"])
    assert context.path == ["Machine Learning", "Supervised Learning", "Classification"]
    assert context.siblings == ["SVM", "Decision Trees", "KNN", "Naive Bayes"]
    assert "Parent topic: Classification" in context.render()

    card = db.scalar(select(Card).where(Card.concept_id == concept.id, Card.position == 3))
    card_context = build_card_context(db, card)
    assert card_context.facet == "how_it_works" and len(card_context.other_cards) == 5
    assert (
        "PCA" in card_context.curriculum_concepts
        and "Logistic Regression" not in card_context.curriculum_concepts
    )


@pytest.mark.parametrize(
    ("visual", "message"),
    [
        ({"type": "icon", "content": "rocket"}, "icon must be one of"),
        ({"type": "mermaid", "content": "sequenceDiagram\n A->>B: hi"}, "must start with"),
        (
            {"type": "mermaid", "content": "graph TD\n" + "\n".join(f"A{i}-->B{i}" for i in range(20))},
            "too large",
        ),
        ({"type": "formula", "content": r"$x^2$"}, "without $ delimiters"),
        ({"type": "formula", "content": r"\frac{1}{2"}, "unbalanced braces"),
    ],
)
def test_visual_checks(visual, message):
    problems = visual_problems(VisualDraft(caption=None, alt_text="x", **visual), "card 1")
    assert problems and message in problems[0]


def test_cards_draft_rules():
    draft = make_cards()
    cards_draft_to_content(ConceptCardsDraft.model_validate(draft), "pca", "PCA")
    draft["cards"][1]["title"] = draft["cards"][0]["title"]
    with pytest.raises(ValueError, match="distinct"):
        cards_draft_to_content(ConceptCardsDraft.model_validate(draft), "pca", "PCA")
    with pytest.raises(ValueError, match="facets in order"):
        cards_draft_to_content(
            ConceptCardsDraft.model_validate({"cards": make_cards()["cards"][:5]}), "pca", "PCA"
        )
