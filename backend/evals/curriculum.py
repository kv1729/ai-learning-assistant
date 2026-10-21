"""Curriculum generation evals.

    uv run python -m evals.curriculum                         # default model, 5 topics, no judge
    uv run python -m evals.curriculum --models a:free,b:free --topics 12 --judge
    uv run python -m evals.curriculum --dry-run               # show the request budget only

For each model and golden topic it measures:
- validity: the output passed schema + business validation (after at most one repair)
- first-try validity and repair rate
- scope: in-scope topics accepted, out-of-scope topics refused
- coverage: share of the topic's must-cover keyword groups present in the tree
- size, latency and tokens
- optionally, an LLM judge's pass/fail rubric (prompts/curriculum_judge)

Reports are written to evals/reports/ as JSON (full detail) and Markdown (summary),
so quality can be compared across models and prompt versions over time.

Free OpenRouter models allow 20 requests/minute and 50/day without purchased credits,
so the runner throttles requests and refuses to start above --max-requests.
"""

import argparse
import json
import statistics
import sys
import time
from dataclasses import asdict
from datetime import UTC, datetime
from pathlib import Path

from pydantic import BaseModel

from app.config import settings
from app.content import CurriculumSpec, draft_to_spec
from app.llm.prompts import render_prompt
from app.llm.provider import LLMError, LLMProvider, build_provider
from app.llm.structured import GenerationFailed, generate_structured
from app.services.curricula import CURRICULUM_PROMPT_VERSION, generate_curriculum_draft

EVALS_DIR = Path(__file__).resolve().parent
REPORTS_DIR = EVALS_DIR / "reports"
JUDGE_PROMPT_VERSION = "v1"
SECONDS_BETWEEN_REQUESTS = 3.2  # stays under 20 requests/minute


class Criterion(BaseModel):
    passed: bool
    reason: str


class JudgeVerdict(BaseModel):
    logical_progression: Criterion
    appropriate_granularity: Criterion
    coverage: Criterion
    no_redundancy: Criterion
    technically_accurate: Criterion


def load_golden() -> list[dict]:
    return json.loads((EVALS_DIR / "golden_curricula.json").read_text(encoding="utf-8"))["topics"]


def tree_text(spec: CurriculumSpec) -> str:
    depths = spec.depths()
    children: dict[str | None, list] = {}
    for node in spec.nodes:
        children.setdefault(node.parent_key, []).append(node)
    lines: list[str] = []

    def walk(key: str | None) -> None:
        for node in sorted(children.get(key, []), key=lambda n: n.position):
            lines.append(f"{'  ' * depths[node.key]}- {node.name} — {node.description}")
            walk(node.key)

    walk(None)
    return "\n".join(lines)


def coverage(spec: CurriculumSpec, groups: list[list[str]]) -> tuple[float, list[list[str]]]:
    text = " ".join(f"{n.name} {n.description}" for n in spec.nodes).lower()
    missing = [group for group in groups if not any(keyword in text for keyword in group)]
    return (1 - len(missing) / len(groups)) if groups else 1.0, missing


class Throttle:
    def __init__(self) -> None:
        self.last = 0.0
        self.requests = 0

    def wait(self) -> None:
        delay = SECONDS_BETWEEN_REQUESTS - (time.monotonic() - self.last)
        if delay > 0 and self.requests:
            time.sleep(delay)
        self.last = time.monotonic()


class ThrottledProvider:
    """Wraps a provider to pace and count requests."""

    def __init__(self, inner: LLMProvider, throttle: Throttle):
        self.inner, self.throttle = inner, throttle
        self.provider, self.model = inner.provider, inner.model

    def complete(self, messages, *, json_schema, schema_name):
        self.throttle.wait()
        self.throttle.requests += 1
        return self.inner.complete(messages, json_schema=json_schema, schema_name=schema_name)


def judge(provider: LLMProvider, topic: str, spec: CurriculumSpec) -> dict:
    prompt = render_prompt("curriculum_judge", JUDGE_PROMPT_VERSION, topic=topic, tree=tree_text(spec))
    try:
        result = generate_structured(provider, prompt, JudgeVerdict)
    except GenerationFailed as exc:
        return {"error": exc.code}
    verdict = result.value.model_dump()
    return {"criteria": verdict, "passed": sum(c["passed"] for c in verdict.values()), "of": len(verdict)}


def evaluate_topic(provider: LLMProvider, judge_provider: LLMProvider | None, item: dict) -> dict:
    topic = item["topic"]
    row: dict = {"topic": topic, "expect_in_scope": item["expect_in_scope"]}
    try:
        result = generate_curriculum_draft(provider, topic)
    except GenerationFailed as exc:
        row.update(valid=False, error=exc.code, attempts=[asdict(a) for a in exc.attempts])
        return row

    attempts = result.attempts
    draft = result.value
    row.update(
        valid=True,
        first_try=len(attempts) == 1,
        attempts=[asdict(a) for a in attempts],
        latency_ms=sum(a.latency_ms or 0 for a in attempts),
        output_tokens=sum(a.output_tokens or 0 for a in attempts),
        in_scope=draft.in_scope,
        scope_correct=draft.in_scope == item["expect_in_scope"],
    )
    if draft.in_scope:
        spec = draft_to_spec(draft, topic)
        score, missing = coverage(spec, item["must_cover"])
        leaves = [n for n in spec.nodes if n.concept_key]
        row.update(
            coverage=round(score, 3),
            missing=missing,
            leaves=len(leaves),
            max_depth=max(spec.depths().values()),
            tree=tree_text(spec),
        )
        if judge_provider is not None:
            row["judge"] = judge(judge_provider, topic, spec)
    else:
        row["reason"] = draft.reason
    return row


def summarize(model: str, rows: list[dict]) -> dict:
    valid = [r for r in rows if r["valid"]]
    in_scope = [r for r in valid if r.get("in_scope")]
    judged = [r["judge"] for r in in_scope if "criteria" in r.get("judge", {})]
    criteria = list(JudgeVerdict.model_fields)
    return {
        "model": model,
        "topics": len(rows),
        "valid_rate": round(len(valid) / len(rows), 3) if rows else 0,
        "first_try_rate": round(sum(r["first_try"] for r in valid) / len(rows), 3) if rows else 0,
        "scope_accuracy": round(sum(r["scope_correct"] for r in valid) / len(rows), 3) if rows else 0,
        "mean_coverage": round(statistics.mean(r["coverage"] for r in in_scope), 3) if in_scope else None,
        "median_latency_ms": int(statistics.median(r["latency_ms"] for r in valid)) if valid else None,
        "mean_leaves": round(statistics.mean(r["leaves"] for r in in_scope), 1) if in_scope else None,
        "errors": sorted({r["error"] for r in rows if not r["valid"]}),
        "judge_pass_rate": {
            c: round(sum(j["criteria"][c]["passed"] for j in judged) / len(judged), 2) for c in criteria
        }
        if judged
        else None,
    }


def write_report(report: dict) -> Path:
    REPORTS_DIR.mkdir(exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    json_path = REPORTS_DIR / f"curriculum-{stamp}.json"
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        f"# Curriculum eval {stamp}",
        "",
        f"Prompt `curriculum/{report['prompt_version']}`, judge: {report['judge_model'] or 'off'}, "
        f"LLM requests: {report['requests']}.",
        "",
        "| Model | Valid | First try | Scope | Coverage | Median latency | Leaves | Errors |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for s in report["summary"]:
        cells = [
            f"`{s['model']}`",
            f"{s['valid_rate']:.0%}",
            f"{s['first_try_rate']:.0%}",
            f"{s['scope_accuracy']:.0%}",
            "–" if s["mean_coverage"] is None else str(s["mean_coverage"]),
            f"{s['median_latency_ms'] or '–'} ms",
            str(s["mean_leaves"] or "–"),
            ", ".join(s["errors"]) or "–",
        ]
        lines.append("| " + " | ".join(cells) + " |")
    for s in report["summary"]:
        if s["judge_pass_rate"]:
            lines += ["", f"Judge pass rate for `{s['model']}`:", ""]
            lines += [f"- {criterion}: {rate:.0%}" for criterion, rate in s["judge_pass_rate"].items()]
    md_path = json_path.with_suffix(".md")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return md_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--models",
        default=settings.llm_model,
        help="comma-separated model ids; append @json_object or @none to override the structured-output mode",
    )
    parser.add_argument(
        "--topics", type=int, default=5, help="number of golden topics to use (in file order)"
    )
    parser.add_argument("--judge", action="store_true", help="also score in-scope trees with an LLM judge")
    parser.add_argument("--judge-model", default=None, help="defaults to LLM_JUDGE_MODEL or LLM_MODEL")
    parser.add_argument("--max-requests", type=int, default=45, help="refuse to start above this worst case")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    models = [m.strip() for m in args.models.split(",") if m.strip()]
    golden = load_golden()[: args.topics]
    # Always include the out-of-scope probes when the selection would otherwise skip them.
    if not any(not t["expect_in_scope"] for t in golden) and args.topics >= 3:
        golden = golden[:-1] + [next(t for t in load_golden() if not t["expect_in_scope"])]
    in_scope_count = sum(t["expect_in_scope"] for t in golden)
    worst = len(models) * (2 * len(golden) + (2 * in_scope_count if args.judge else 0))
    best = len(models) * (len(golden) + (in_scope_count if args.judge else 0))
    print(f"{len(models)} model(s) x {len(golden)} topic(s); LLM requests: {best}-{worst} (worst case)")
    if args.dry_run:
        return 0
    if worst > args.max_requests:
        print(f"Worst case exceeds --max-requests={args.max_requests}; use fewer topics/models or raise it.")
        return 2

    throttle = Throttle()
    judge_model = (args.judge_model or settings.llm_judge_model or settings.llm_model) if args.judge else None
    try:
        judge_provider = ThrottledProvider(build_provider(judge_model), throttle) if judge_model else None
        results, summary = {}, []
        for model in models:
            model_id, _, mode = model.partition("@")
            provider = ThrottledProvider(build_provider(model_id, mode or None), throttle)
            rows = []
            for item in golden:
                print(f"  {model} :: {item['topic']} ...", end=" ", flush=True)
                row = evaluate_topic(provider, judge_provider, item)
                print("ok" if row["valid"] else row["error"])
                rows.append(row)
                # Don't spend quota on a model that is rate-limited, misconfigured or failing repeatedly.
                errors = [r.get("error") for r in rows[-2:] if not r["valid"]]
                if not row["valid"] and (
                    row["error"] in ("llm_rate_limited", "llm_misconfigured")
                    or (len(errors) == 2 and errors[0] == errors[1] != "llm_invalid_output")
                ):
                    print("  stopping this model early:", row["error"])
                    break
            results[model] = rows
            summary.append(summarize(model, rows))
    except LLMError as exc:
        print(f"Cannot run evals: {exc.message} ({exc.detail})")
        return 1

    report = {
        "created_at": datetime.now(UTC).isoformat(),
        "prompt_version": CURRICULUM_PROMPT_VERSION,
        "judge_model": judge_model,
        "judge_prompt_version": JUDGE_PROMPT_VERSION if judge_model else None,
        "requests": throttle.requests,
        "summary": summary,
        "results": results,
    }
    path = write_report(report)
    print(path.read_text(encoding="utf-8"))
    print(f"Full report: {path.with_suffix('.json')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
