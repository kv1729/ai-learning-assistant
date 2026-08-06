from pydantic import BaseModel
from typing import List


class QuickCheck(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str


class Card(BaseModel):
    id: int
    title: str
    image: str
    summary: str
    detailedExplanation: str
    quickCheck: QuickCheck


class TopicResponse(BaseModel):
    topic: str
    cards: List[Card]