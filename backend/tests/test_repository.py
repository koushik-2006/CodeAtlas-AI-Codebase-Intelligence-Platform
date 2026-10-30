from fastapi.testclient import TestClient
from app.main import app
from conftest import TEST_TOKEN

client = TestClient(app, headers={"Authorization": f"Bearer {TEST_TOKEN}"})


def test_repository_indexing_and_tree():
    repo_id = "sample-backend"
    # 1. Trigger indexing
    idx_resp = client.post(f"/api/v1/repositories/{repo_id}/index")
    assert idx_resp.status_code == 200
    idx_data = idx_resp.json()
    assert idx_data["status"] == "completed"
    assert idx_data["total_files"] > 0

    # 2. Get repository details
    detail_resp = client.get(f"/api/v1/repositories/{repo_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["indexed"] is True

    # 3. Get repository file tree
    tree_resp = client.get(f"/api/v1/repositories/{repo_id}/files")
    assert tree_resp.status_code == 200
    tree_data = tree_resp.json()
    assert isinstance(tree_data, list)

    # 4. Read file content
    content_resp = client.get(f"/api/v1/repositories/{repo_id}/files/content?path=app/services/payment.py")
    assert content_resp.status_code == 200
    assert "process_payment" in content_resp.json()["content"]
