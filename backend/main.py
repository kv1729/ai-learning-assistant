from fastapi import FastAPI
from pydantic import BaseModel
from backend.services.llm_service import analyze_note

app = FastAPI()


class Note(BaseModel):
    text: str


@app.get("/")
async def home():
    return {
        "message": "AI Learning Assistant Running"
    }


@app.post("/note")
async def create_note(note: Note):

    analysis = analyze_note(note.text)

    return {
        "original_note": note.text,
        "analysis": analysis
    }