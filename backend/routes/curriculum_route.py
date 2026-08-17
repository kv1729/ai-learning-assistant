from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.llm_service import generate_curriculum

router = APIRouter(prefix="/api", tags=["curriculum"])


class CurriculumRequest(BaseModel):
    topic: str


@router.post("/curriculum")
async def create_curriculum(request: CurriculumRequest):
    try:
        curriculum = generate_curriculum(request.topic)
        return curriculum.model_dump()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
