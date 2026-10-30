from fastapi.testclient import TestClient
from app.main import app
from conftest import TEST_TOKEN

client = TestClient(app, headers={"Authorization": f"Bearer {TEST_TOKEN}"})


def test_search_and_assistant():
    repo_id = "sample-backend"
    # Ensure indexed
    client.post(f"/api/v1/repositories/{repo_id}/index")

    # Search
    search_resp = client.post("/api/v1/search", json={"repository_id": repo_id, "query": "payment"})
    assert search_resp.status_code == 200
    assert search_resp.json()["total_results"] > 0

    # Assistant ask
    ask_resp = client.post("/api/v1/assistant/ask", json={"repository_id": repo_id, "query": "How is payment handled?"})
    assert ask_resp.status_code == 200
    assert "answer" in ask_resp.json()


def test_bugtrail_and_impact():
    repo_id = "sample-backend"

    # BugTrail
    debug_resp = client.post("/api/v1/debug/analyze", json={
        "repository_id": repo_id,
        "error_message": "ValueError: Invalid payment amount",
        "stack_trace": "File 'app/services/payment.py', line 3, in process_payment"
    })
    assert debug_resp.status_code == 200
    assert len(debug_resp.json()["likely_causes"]) > 0

    # Impact
    impact_resp = client.post("/api/v1/impact/analyze", json={
        "repository_id": repo_id,
        "file_path": "app/services/payment.py",
        "changed_symbols": ["process_payment"]
    })
    assert impact_resp.status_code == 200
    assert "overall_risk" in impact_resp.json()


def test_testpilot_and_history():
    repo_id = "sample-backend"

    # TestPilot
    test_resp = client.post("/api/v1/tests/discover", json={"repository_id": repo_id})
    assert test_resp.status_code == 200
    assert test_resp.json()["total_test_files"] > 0

    # History save & retrieve
    save_resp = client.post("/api/v1/history", json={
        "title": "Payment Workflow Analysis",
        "analysis_type": "workflow",
        "data": {"status": "success"}
    })
    assert save_resp.status_code == 200
    analysis_id = save_resp.json()["id"]

    history_list = client.get("/api/v1/history")
    assert history_list.status_code == 200
    assert any(item["id"] == analysis_id for item in history_list.json())

    # Delete
    del_resp = client.delete(f"/api/v1/history/{analysis_id}")
    assert del_resp.status_code == 200
