"""Card generation evals.

    uv run python -m evals.cards --dry-run                     # request budget only
    uv run python -m evals.cards --concepts 4                  # default model and settings
    uv run python -m evals.cards --concepts 4 --judge          # add the LLM-judge rubric
    uv run python -m evals.cards --concepts 4 --reasoning low  # compare reasoning effort

For each golden concept it measures:
- validity after at most one repair, and first-try validity
- latency and output tokens (reasoning models spend hidden tokens thinking)
- keyword coverage of the cards' titles and summaries (must_mention groups)
- visual mix and answer_index spread (a model that always picks option B is a smell)
- optionally, an LLM judge's pass/fail rubric (prompts/concept_cards_judge)

Reports go to evals/reports/cards-<timestamp>.{json,md}.
"""

import argparse
import json
import statistics
import sys
from collections import Counter
from dataclasses import asdict
from datetime import UTC, datetime
from pathlib import Path

from pydantic import BaseModel

from app.config import settings
from app.content import ConceptContent
from app.llm.prompts import render_prompt
from app.llm.provider import LLMError, LLMProvider, build_provider
from app.llm.structured import GenerationFailed, generate_structured
from app.services.context import ConceptContext
from app.services.generation import CARDS_PROMPT_VERSION, generate_cards_draft
from evals.common import Throttle, ThrottledProvider

EVALS_DIR = Path(__file__).resolve().parent
REPORTS_DIR = EVALS_DIR / "reports"
JUDGE_PROMPT_VERSION = "v1"


class Criterion(BaseModel):
    passed: bool
    reason: str


class CardsVerdict(BaseModel):
    technically_accurate: Criterion
    facet_fidelity: Criterion
    worked_example_correct: Criterion
    quick_checks_sound: Criterion
    clear_for_engineers: Criterion
    no_redundancy: Criterion


def load_golden() -> list[dict]:
    return json.loads((EVALS_DIR / "golden_concepts.json").read_text(encoding="utf-8"))["concepts"]


def context_for(item: dict) -> ConceptContext:
    return ConceptContext(
        concept_name=item["concept"],
        curriculum_title=item["curriculum"],
        path=item["path"],
        parent_description=item["parent_description"],
        description=item["description"],
        siblings=item["siblings"],
    )


def cards_text(content: ConceptContent) -> str:
    blocks = []
    for i, card in enumerate(content.cards, start=1):
        qc = card.quick_check
        options = "\n".join(
            f"   {'*' if j == qc.answer_index else ' '} {chr(65 + j)}. {o}" for j, o in enumerate(qc.options)
        )
        visual = f"{card.visual.type}: {card.visual.content}" if card.visual else "none"
        blocks.append(
            f"[{i}] {card.facet} — {card.title}\n{card.summary}\nTakeaway: {card.key_takeaway}\n"
            f"Visual: {visual}\nQuick check: {qc.question}\n{options}\n(* = marked answer) {qc.explanation}"
        )
    return "\n\n".join(blocks)


def coverage(content: ConceptContent, groups: list[list[str]]) -> tuple[float, list[list[str]]]:
    text = " ".join(f"{c.title} {c.summary}" for c in content.cards).lower()
    missing = [g for g in groups if not any(k in text for k in g)]
    return (1 - len(missing) / len(groups)) if groups else 1.0, missing


def judge(provider: LLMProvider, concept: str, content: ConceptContent) -> dict:
    prompt = render_prompt(
        "concept_cards_judge", JUDGE_PROMPT_VERSION, concept=concept, cards=cards_text(content)
    )
    try:
        result = generate_structured(provider, prompt, CardsVerdict)
    except GenerationFailed as exc:
        return {"error": exc.code}
    verdict = result.value.model_dump()
    return {"criteria": verdict, "passed": sum(c["passed"] for c in verdict.values()), "of": len(verdict)}


def evaluate_concept(provider: LLMProvider, judge_provider: LLMProvider | None, item: dict) -> dict:
    row: dict = {"concept": item["concept"]}
    try:
        result, content = generate_cards_draft(provider, context_for(item), item["concept_key"])
    except GenerationFailed as exc:
        row.update(valid=False, error=exc.code, attempts=[asdict(a) for a in exc.attempts])
        return row
    score, missing = coverage(content, item["must_mention"])
    row.update(
        valid=True,
        first_try=len(result.attempts) == 1,
        attempts=[asdict(a) for a in result.attempts],
        latency_ms=sum(a.latency_ms or 0 for a in result.attempts),
        output_tokens=sum(a.output_tokens or 0 for a in result.attempts),
        coverage=round(score, 3),
        missing=missing,
        visuals=dict(Counter(c.visual.type for c in content.cards if c.visual)),
        answer_indexes=[c.quick_check.answer_index for c in content.cards],
        summary_words=[len(c.summary.split()) for c in content.cards],
        cards=cards_text(content),
    )
    if judge_provider is not None:
        row["judge"] = judge(judge_provider, item["concept"], content)
    return row


def summarize(label: str, rows: list[dict]) -> dict:
    valid = [r for r in rows if r["valid"]]
    judged = [r["judge"] for r in valid if "criteria" in r.get("judge", {})]
    criteria = list(CardsVerdict.model_fields)
    answer_spread = Counter(i for r in valid for i in r["answer_indexes"])
    return {
        "label": label,
        "concepts": len(rows),
        "valid_rate": round(len(valid) / len(rows), 3) if rows else 0,
        "first_try_rate": round(sum(r["first_try"] for r in valid) / len(rows), 3) if rows else 0,
        "mean_coverage": round(statistics.mean(r["coverage"] for r in valid), 3) if valid else None,
        "median_latency_ms": int(statistics.median(r["latency_ms"] for r in valid)) if valid else None,
        "median_output_tokens": int(statistics.median(r["output_tokens"] for r in valid)) if valid else None,
        "visuals": dict(sum((Counter(r["visuals"]) for r in valid), Counter())),
        "answer_index_spread": dict(sorted(answer_spread.items())),
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
    json_path = REPORTS_DIR / f"cards-{stamp}.json"
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    lines = [
        f"# Card eval {stamp}",
        "",
        f"Prompt `concept_cards/{report['prompt_version']}`, judge: {report['judge_model'] or 'off'}, "
        f"LLM requests: {report['requests']}.",
        "",
        "| Run | Valid | First try | Coverage | Median latency | Median output tokens | Visuals | Errors |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for s in report["summary"]:
        cells = [
            f"`{s['label']}`",
            f"{s['valid_rate']:.0%}",
            f"{s['first_try_rate']:.0%}",
            "–" if s["mean_coverage"] is None else str(s["mean_coverage"]),
            f"{s['median_latency_ms'] or '–'} ms",
            str(s["median_output_tokens"] or "–"),
            ", ".join(f"{k} {v}" for k, v in s["visuals"].items()) or "–",
            ", ".join(s["errors"]) or "–",
        ]
        lines.append("| " + " | ".join(cells) + " |")
    for s in report["summary"]:
        lines += ["", f"Answer index spread for `{s['label']}`: {s['answer_index_spread']}"]
        if s["judge_pass_rate"]:
            lines += ["", f"Judge pass rate for `{s['label']}`:", ""]
            lines += [f"- {criterion}: {rate:.0%}" for criterion, rate in s["judge_pass_rate"].items()]
    md_path = json_path.with_suffix(".md")
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return md_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--models", default=settings.llm_model, help="comma-separated; MODEL@json_object to override"
    )
    parser.add_argument("--concepts", type=int, default=4, help="number of golden concepts (in file order)")
    parser.add_argument(
        "--reasoning",
        default=None,
        help="comma-separated reasoning efforts to compare, e.g. 'default,low' (off|minimal|low|medium|high)",
    )
    parser.add_argument("--judge", action="store_true")
    parser.add_argument("--judge-model", default=None)
    parser.add_argument("--max-requests", type=int, default=40)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    models = [m.strip() for m in args.models.split(",") if m.strip()]
    efforts = [e.strip() for e in (args.reasoning or "default").split(",") if e.strip()]
    runs = [(m, e) for m in models for e in efforts]
    golden = load_golden()[: args.concepts]
    per_run_worst = 2 * len(golden) + (2 * len(golden) if args.judge else 0)
    per_run_best = len(golden) + (len(golden) if args.judge else 0)
    worst, best = len(runs) * per_run_worst, len(runs) * per_run_best
    print(f"{len(runs)} run(s) x {len(golden)} concept(s); LLM requests: {best}-{worst} (worst case)")
    if args.dry_run:
        return 0
    if worst > args.max_requests:
        print(f"Worst case exceeds --max-requests={args.max_requests}; use fewer concepts/runs or raise it.")
        return 2

    throttle = Throttle()
    judge_model = (args.judge_model or settings.llm_judge_model or settings.llm_model) if args.judge else None
    results, summary = {}, []
    try:
        judge_provider = ThrottledProvider(build_provider(judge_model), throttle) if judge_model else None
        for model, effort in runs:
            model_id, _, mode = model.partition("@")
            label = f"{model}" + ("" if effort == "default" else f" reasoning={effort}")
            provider = ThrottledProvider(
                build_provider(model_id, mode or None, None if effort == "default" else effort), throttle
            )
            rows = []
            for item in golden:
                print(f"  {label} :: {item['concept']} ...", end=" ", flush=True)
                row = evaluate_concept(provider, judge_provider, item)
                print("ok" if row["valid"] else row["error"])
                rows.append(row)
                errors = [r.get("error") for r in rows[-2:] if not r["valid"]]
                if not row["valid"] and (
                    row["error"] in ("llm_rate_limited", "llm_misconfigured")
                    or (len(errors) == 2 and errors[0] == errors[1] != "llm_invalid_output")
                ):
                    print("  stopping this run early:", row["error"])
                    break
            results[label] = rows
            summary.append(summarize(label, rows))
    except LLMError as exc:
        print(f"Cannot run evals: {exc.message} ({exc.detail})")
        return 1

    report = {
        "created_at": datetime.now(UTC).isoformat(),
        "prompt_version": CARDS_PROMPT_VERSION,
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
