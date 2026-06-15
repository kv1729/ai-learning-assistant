from fastapi import FastAPI
from pydantic import BaseModel

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
    words = note.text.split()
    word_count = len(words)
    uppercase_version = note.text.upper()
    
    return {
        "original_note": note.text,
        "word_count": word_count,
        "character_count": len(note.text),
        "uppercase_version": uppercase_version
    }