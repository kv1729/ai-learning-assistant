"""API contract tests (docs/stage-0/02-domain-model.md) against seeded test data."""

import uuid

from tests.conftest import find_node


def assert_error(response, status, code):
    assert response.status_code == status, response.text
    error = response.json()["error"]
    assert error["code"] == code
    assert isinstance(error["message"], str) and error["message"]
    assert isinstance(error["retryable"], bool)
    return error


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok", "database": "ok"}


def test_list_curricula(client):
    curricula = client.get("/api/curricula").json()
    assert [c["title"] for c in curricula] == ["Machine Learning"]
    assert len(curricula[0]["concept_ids"]) == 14


def test_curriculum_tree(client):
    curriculum_id = client.get("/api/curricula").json()[0]["id"]
    curriculum = client.get(f"/api/curricula/{curriculum_id}").json()
    nodes = {n["id"]: n for n in curriculum["nodes"]}
    assert len(nodes) == 21
    root = nodes[curriculum["root_node_id"]]
    assert root["parent_id"] is None and root["depth"] == 0
    for node in nodes.values():
        if node["parent_id"]:
            assert node["depth"] == nodes[node["parent_id"]]["depth"] + 1
        if node["concept_id"]:
            assert node["content_status"] in ("ready", "not_generated")
        else:
            assert node["content_status"] is None


def test_feed_for_ready_concept(client):
    node = find_node(client, "Logistic Regression")
    feed = client.get(f"/api/nodes/{node['id']}/feed").json()
    assert feed["curriculum"]["title"] == "Machine Learning"
    assert feed["parent"]["name"] == "Classification"
    assert [t["name"] for t in feed["tabs"]] == [
        "Logistic Regression",
        "SVM",
        "Decision Trees",
        "KNN",
        "Naive Bayes",
    ]
    assert feed["concept"]["content_status"] == "ready"
    assert [c["position"] for c in feed["cards"]] == [1, 2, 3, 4, 5, 6]
    assert feed["cards"][0]["facet"] == "why_it_matters"
    assert all(c["has_detail"] for c in feed["cards"])
    assert "detail" not in feed["cards"][0]


def test_feed_for_concept_without_content(client):
    node = find_node(client, "Gradient Descent")
    feed = client.get(f"/api/nodes/{node['id']}/feed").json()
    assert feed["concept"]["content_status"] == "not_generated"
    assert feed["cards"] == []


def test_feed_for_branch_node_is_not_found(client):
    node = find_node(client, "Classification")
    assert_error(client.get(f"/api/nodes/{node['id']}/feed"), 404, "not_found")


def test_unknown_and_malformed_ids(client):
    assert_error(client.get(f"/api/nodes/{uuid.uuid4()}/feed"), 404, "not_found")
    assert_error(client.get("/api/nodes/not-a-uuid/feed"), 422, "validation_error")
    assert_error(client.get("/api/does-not-exist"), 404, "not_found")


def test_card_detail_with_related_concept_links(client):
    node = find_node(client, "Logistic Regression")
    card = client.get(f"/api/nodes/{node['id']}/feed").json()["cards"][0]
    detail = client.get(f"/api/cards/{card['id']}/detail").json()
    assert 300 <= len(detail["body_markdown"].split()) <= 700
    related = {r["name"]: r["node_id"] for r in detail["related_concepts"]}
    assert related["SVM"] == find_node(client, "SVM")["id"]


def test_card_detail_not_written_yet(client):
    node = find_node(client, "Decision Trees")
    card = client.get(f"/api/nodes/{node['id']}/feed").json()["cards"][0]
    assert card["has_detail"] is False
    assert_error(client.get(f"/api/cards/{card['id']}/detail"), 404, "detail_not_generated")


def test_get_and_lookup_cards(client):
    node = find_node(client, "SVM")
    cards = client.get(f"/api/nodes/{node['id']}/feed").json()["cards"]
    single = client.get(f"/api/cards/{cards[1]['id']}").json()
    assert single == cards[1]

    ids = [cards[2]["id"], cards[0]["id"], str(uuid.uuid4())]
    found = client.get("/api/cards", params={"ids": ids}).json()
    assert [c["id"] for c in found] == ids[:2]  # request order kept, unknown ids skipped
    assert found[0]["concept_name"] == "SVM"
    assert found[0]["node_id"] == node["id"]
    assert found[0]["answer_index"] == cards[2]["quick_check"]["answer_index"]


def test_generate_for_ready_concept_reports_ready(client):
    node = find_node(client, "SVM")
    response = client.post(f"/api/concepts/{node['concept_id']}/generate")
    assert response.json() == {"content_status": "ready"}


def test_generate_is_not_available_before_stage_4(client):
    node = find_node(client, "PCA")
    assert_error(client.post(f"/api/concepts/{node['concept_id']}/generate"), 501, "generation_unavailable")


def test_create_curriculum_is_not_available_before_stage_3(client):
    assert_error(client.post("/api/curricula", json={"topic": "Deep Learning"}), 501, "not_available")
    assert_error(client.post("/api/curricula", json={"topic": ""}), 422, "validation_error")
