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
