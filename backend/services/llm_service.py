import os
import json
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

def analyze_note(note_text: str):

    prompt = f"""
Analyze the learning note below.

Return ONLY valid JSON.

Required format:

{{
    "summary": "short summary",
    "tags": ["tag1", "tag2"],
    "action_items": ["action1", "action2"]
}}

Learning Note:
{note_text}
"""
    response = client.chat.completions.create(
    model="nex-agi/nex-n2-pro:free",
    messages=[
        {
            "role": "user",
            "content": prompt
        }
    ]
)
    content = response.choices[0].message.content

    return json.loads(content)