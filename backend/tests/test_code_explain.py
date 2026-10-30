from fastapi.testclient import TestClient
from app.main import app
from conftest import TEST_TOKEN

client = TestClient(app, headers={"Authorization": f"Bearer {TEST_TOKEN}"})


def test_code_explain():
    req_payload = {
        "code": "def add(a, b):\n    return a + b",
        "language": "python",
        "level": "beginner"
    }
    response = client.post("/api/v1/code/explain", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["language"] == "python"
    assert "summary" in data
    assert len(data["explanation"]) >= 2
    assert data["explanation"][0]["line"] == 1


def test_code_compare():
    req_payload = {
        "code_a": "def compute():\n    return 42",
        "code_b": "def compute():\n    # optimized\n    val = 42\n    return val",
        "language": "python"
    }
    response = client.post("/api/v1/code/compare", json=req_payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert len(data["differences"]) > 0
