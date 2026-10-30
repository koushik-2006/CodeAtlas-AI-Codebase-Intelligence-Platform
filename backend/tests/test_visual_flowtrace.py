from fastapi.testclient import TestClient
from app.main import app
from conftest import TEST_TOKEN

client = TestClient(app, headers={"Authorization": f"Bearer {TEST_TOKEN}"})


def test_visual_workflow_trace():
    payload = {
        "repository_id": "sample-repo",
        "code": "def process_payment(amount):\n    return gateway.charge(amount)",
        "language": "python"
    }
    response = client.post("/api/v1/visual/workflow", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "match_status" in data
    assert "nodes" in data
    assert "edges" in data


def test_visual_extract_fallback():
    # Test base64 extraction endpoint
    fake_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    response = client.post("/api/v1/visual/extract", data={"image_base64": fake_b64})
    assert response.status_code == 200
    data = response.json()
    assert "extracted_code" in data
    assert data["confidence"] > 0
