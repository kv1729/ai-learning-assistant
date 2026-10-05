import json
from pathlib import Path


DATA_FILE = Path(__file__).parent.parent / "data" / "cards.json"


def get_cards():
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)
    