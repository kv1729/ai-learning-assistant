import pytest

from backend.services.curriculum_service import parse_curriculum_payload, CurriculumResponse


def test_parse_curriculum_payload_accepts_valid_json():
    raw = '''
    {
      "topic": "Machine Learning",
      "nodes": [
        {"id": "root", "name": "Machine Learning", "parent_id": null, "depth": 0},
        {"id": "supervised", "name": "Supervised Learning", "parent_id": "root", "depth": 1},
        {"id": "classification", "name": "Classification", "parent_id": "supervised", "depth": 2}
      ]
    }
    '''

    validated = parse_curriculum_payload(raw)

    assert isinstance(validated, CurriculumResponse)
    assert validated.topic == "Machine Learning"
    assert len(validated.nodes) == 3


def test_parse_curriculum_payload_handles_markdown_wrapping():
    raw = '''
    ```json
    {
      "topic": "Deep Learning",
      "nodes": [
        {"id": "root", "name": "Deep Learning", "parent_id": null, "depth": 0}
      ]
    }
    ```
    '''

    validated = parse_curriculum_payload(raw)

    assert validated.topic == "Deep Learning"
    assert validated.nodes[0].name == "Deep Learning"


def test_parse_curriculum_payload_rejects_invalid_schema():
    raw = '''
    {
      "topic": "Math",
      "nodes": [
        {"id": "root", "name": "Math"}
      ]
    }
    '''

    with pytest.raises(ValueError):
        parse_curriculum_payload(raw)
