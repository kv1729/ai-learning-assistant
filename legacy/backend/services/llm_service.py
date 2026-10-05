import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from backend.services.curriculum_service import parse_curriculum_payload

load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)


def generate_curriculum(topic: str):
    if not topic or not topic.strip():
        raise ValueError("Topic must not be empty.")

    prompt = f"""
You are generating a learning curriculum for the topic: {topic}

Return ONLY valid JSON in this exact schema:
{{
  "topic": "<topic name>",
  "nodes": [
    {{"id": "root", "name": "<topic>", "parent_id": null, "depth": 0}},
    {{"id": "<unique child id>", "name": "<branch name>", "parent_id": "root", "depth": 1}},
    {{"id": "<unique child id>", "name": "<leaf topic>", "parent_id": "<parent id>", "depth": 2}}
  ]
}}

Rules:
- Keep the structure hierarchical and realistic.
- Include the root topic as the first node.
- Use parent_id values that reference existing nodes.
- Create a clear curriculum tree, not a flat list.
- Do not include extra fields.
- Return JSON only, no markdown fences.
"""

    response = client.chat.completions.create(
        model="nex-agi/nex-n2-pro:free",
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content

    if not content:
        raise ValueError("LLM returned an empty response.")

    try:
        return parse_curriculum_payload(content)
    except ValueError as exc:
        raise ValueError(f"Invalid curriculum response from LLM: {exc}") from exc


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
        messages=[{"role": "user", "content": prompt}],
    )
    content = response.choices[0].message.content

    if not content:
        raise ValueError("LLM returned an empty response.")

    return json.loads(content)