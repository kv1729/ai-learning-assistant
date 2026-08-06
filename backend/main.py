from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.cards import router as cards_router

app = FastAPI(title="AI Learning Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cards_router, prefix="/api")