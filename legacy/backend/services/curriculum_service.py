import json
import re
from typing import Optional, List

from pydantic import BaseModel, Field, ValidationError


class CurriculumNode(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    depth: int = Field(ge=0)


class CurriculumResponse(BaseModel):
    topic: str
    nodes: List[CurriculumNode]


def _strip_markdown_code_block(raw: str) -> str:
    cleaned = raw.strip()
    match = re.search(r"```(?:json)?\s*(\{.*\})\s*```", cleaned, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1)
    return cleaned


def parse_curriculum_payload(raw_payload: str) -> CurriculumResponse:
    try:
        cleaned = _strip_markdown_code_block(raw_payload)
        payload = json.loads(cleaned)
        return CurriculumResponse.model_validate(payload)
    except (json.JSONDecodeError, ValidationError, TypeError, ValueError) as exc:
        raise ValueError(f"Invalid curriculum payload: {exc}") from exc
