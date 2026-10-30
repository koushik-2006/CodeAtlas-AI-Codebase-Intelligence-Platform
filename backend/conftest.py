import sys
import os
import asyncio
import pytest
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.security.sessions import create_access_token
from app.dependencies import _memory_user_repo

# Seed test user into the in-memory repository synchronously
_memory_user_repo._users["test-user-001"] = {
    "id": "test-user-001",
    "email": "tester@codeatlas.local",
    "name": "Test Engineer",
    "display_name": "Test Engineer",
    "avatar_url": None,
    "is_active": True,
}
_memory_user_repo._email_index["tester@codeatlas.local"] = "test-user-001"

TEST_TOKEN = create_access_token({
    "sub": "test-user-001",
    "email": "tester@codeatlas.local",
    "name": "Test Engineer"
})


@pytest.fixture
def auth_headers():
    return {"Authorization": f"Bearer {TEST_TOKEN}"}


@pytest.fixture
def auth_client():
    return TestClient(app, headers={"Authorization": f"Bearer {TEST_TOKEN}"})
