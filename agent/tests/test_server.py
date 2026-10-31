import pytest
from fastapi.testclient import TestClient
from app.server import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_investigate_endpoint(client):
    payload = {
        "patient_id": "P001",
        "thread_id": "TEST-INV-1",
        "question": "What changed between the last two admissions?"
    }
    res = client.post("/investigate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["patient_id"] == "P001"
    assert data["thread_id"] == "TEST-INV-1"
    assert "answer" in data
    assert "verification_status" in data
    assert isinstance(data["claims"], list)
    assert len(data["claims"]) > 0
    assert "key_findings" in data
    assert "missing_information" in data
    assert "contradictions_found" in data
