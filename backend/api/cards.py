from fastapi import APIRouter
from services.card_service import get_cards

router = APIRouter()


@router.get("/cards")
def read_cards():
    return get_cards()