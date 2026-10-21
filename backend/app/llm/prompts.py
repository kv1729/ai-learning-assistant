"""Versioned prompt files: backend/prompts/<name>/<version>.md

A prompt file has a `## system` and a `## user` section. Placeholders use
`$name` (string.Template), so JSON examples with braces need no escaping.
The version is stored with everything a prompt produces.
"""

from dataclasses import dataclass
from pathlib import Path
from string import Template

PROMPTS_DIR = Path(__file__).resolve().parents[2] / "prompts"


@dataclass(frozen=True)
class RenderedPrompt:
    name: str
    version: str
    messages: list[dict[str, str]]

    @property
    def ref(self) -> str:
        return f"{self.name}/{self.version}"


def _sections(text: str) -> dict[str, str]:
    sections: dict[str, list[str]] = {}
    current = None
    for line in text.splitlines():
        if line.strip().lower() in ("## system", "## user"):
            current = line.strip()[3:].lower()
            sections[current] = []
        elif current:
            sections[current].append(line)
    return {key: "\n".join(lines).strip() for key, lines in sections.items()}


def render_prompt(name: str, version: str, **values: str) -> RenderedPrompt:
    path = PROMPTS_DIR / name / f"{version}.md"
    sections = _sections(path.read_text(encoding="utf-8"))
    if set(sections) != {"system", "user"}:
        raise ValueError(f"{path} must contain exactly '## system' and '## user' sections")
    messages = [
        {"role": role, "content": Template(sections[role]).substitute(values)} for role in ("system", "user")
    ]
    return RenderedPrompt(name=name, version=version, messages=messages)
