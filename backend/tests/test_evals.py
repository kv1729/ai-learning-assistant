"""The eval harness works end to end with a fake provider (no network, no quota)."""

from evals import curriculum as evals
from tests.conftest import FakeProvider
from tests.test_curriculum_generation import make_draft

PASS = {"passed": True, "reason": "fine"}
VERDICT = {
    "logical_progression": PASS,
    "appropriate_granularity": PASS,
    "coverage": {"passed": False, "reason": "no attention"},
    "no_redundancy": PASS,
    "technically_accurate": PASS,
}


def test_in_scope_topic_is_scored_and_judged():
    item = {"topic": "Deep Learning", "expect_in_scope": True, "must_cover": [["backprop"], ["attention"]]}
    generator, judge = FakeProvider([make_draft()]), FakeProvider([VERDICT])
    row = evals.evaluate_topic(generator, judge, item)
    assert row["valid"] and row["first_try"] and row["scope_correct"]
    assert row["coverage"] == 0.5 and row["missing"] == [["attention"]]
    assert row["leaves"] == 9
    assert row["judge"]["passed"] == 4
    assert "  - Perceptron" in row["tree"]


def test_out_of_scope_probe_and_summary():
    refuse = {"in_scope": False, "reason": "Cooking.", "title": "", "nodes": []}
    rows = [
        evals.evaluate_topic(
            FakeProvider([make_draft()]),
            None,
            {"topic": "Deep Learning", "expect_in_scope": True, "must_cover": [["backprop"]]},
        ),
        evals.evaluate_topic(
            FakeProvider([refuse]),
            None,
            {"topic": "French Cooking", "expect_in_scope": False, "must_cover": []},
        ),
        evals.evaluate_topic(
            FakeProvider(["nope", "still nope"]),
            None,
            {"topic": "MLOps", "expect_in_scope": True, "must_cover": []},
        ),
    ]
    summary = evals.summarize("fake-model", rows)
    assert summary["valid_rate"] == round(2 / 3, 3)
    assert summary["scope_accuracy"] == round(2 / 3, 3)
    assert summary["mean_coverage"] == 1.0
    assert summary["errors"] == ["llm_invalid_output"]


def test_dry_run_reports_budget(capsys):
    assert evals.main(["--models", "a,b", "--topics", "4", "--judge", "--dry-run"]) == 0
    assert "LLM requests" in capsys.readouterr().out


# ---------- card evals ----------

from evals import cards as card_evals  # noqa: E402
from tests.test_generation import make_cards  # noqa: E402

CARDS_VERDICT = {
    name: {"passed": name != "worked_example_correct", "reason": "x"}
    for name in card_evals.CardsVerdict.model_fields
}


def test_card_eval_scores_and_judges_a_concept():
    item = {**card_evals.load_golden()[0], "must_mention": [["principal"], ["learning rate"]]}
    row = card_evals.evaluate_concept(FakeProvider([make_cards()]), FakeProvider([CARDS_VERDICT]), item)
    assert row["valid"] and row["first_try"]
    assert row["coverage"] == 0.5 and row["missing"] == [["learning rate"]]
    assert row["visuals"] == {"icon": 3, "formula": 2, "mermaid": 1}
    assert row["answer_indexes"] == [0, 1, 2, 3, 0, 1]
    assert row["judge"]["passed"] == 5
    summary = card_evals.summarize("fake", [row])
    assert summary["judge_pass_rate"]["worked_example_correct"] == 0
    assert summary["answer_index_spread"] == {0: 2, 1: 2, 2: 1, 3: 1}


def test_card_eval_dry_run(capsys):
    assert card_evals.main(["--concepts", "3", "--reasoning", "default,low", "--judge", "--dry-run"]) == 0
    assert "2 run(s) x 3 concept(s)" in capsys.readouterr().out
