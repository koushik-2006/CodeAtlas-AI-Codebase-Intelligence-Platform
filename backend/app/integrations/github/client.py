import base64
from typing import Any, Dict, List, Optional
import httpx
from fastapi import HTTPException, status
from app.utils.file_limits import should_ignore_path, is_file_size_permitted
from app.utils.language_detection import detect_language_by_filename


class GitHubClient:
    """Async client for interacting with the GitHub REST API v3."""

    BASE_URL = "https://api.github.com"

    def _headers(self, token: str) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "CodeAtlas-App"
        }

    async def get_current_user(self, token: str) -> Dict[str, Any]:
        """Fetch the authenticated user's profile from GitHub."""
        if token.startswith("gho_mock_"):
            return {
                "id": 123456,
                "login": "codeatlas-dev",
                "name": "CodeAtlas Developer",
                "avatar_url": "https://avatars.githubusercontent.com/u/9919?v=4",
                "email": "dev@example.com"
            }

        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.BASE_URL}/user", headers=self._headers(token), timeout=10.0)
            if resp.status_code == 401:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="GitHub access token expired or revoked.")
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=f"GitHub error: {resp.text}")
            return resp.json()

    async def list_repositories(self, token: str) -> List[Dict[str, Any]]:
        """List repositories accessible to the user (public and private)."""
        if token.startswith("gho_mock_"):
            return [
                {
                    "id": 101,
                    "name": "sample-backend",
                    "full_name": "codeatlas-dev/sample-backend",
                    "owner": {"login": "codeatlas-dev"},
                    "private": False,
                    "html_url": "https://github.com/codeatlas-dev/sample-backend",
                    "description": "Demo backend for CodeAtlas testing",
                    "default_branch": "main",
                    "language": "Python",
                    "stargazers_count": 42,
                    "updated_at": "2026-10-24T00:00:00Z",
                    "permissions": {"admin": True, "push": True, "pull": True}
                },
                {
                    "id": 102,
                    "name": "private-microservice",
                    "full_name": "codeatlas-dev/private-microservice",
                    "owner": {"login": "codeatlas-dev"},
                    "private": True,
                    "html_url": "https://github.com/codeatlas-dev/private-microservice",
                    "description": "Private microservice repository",
                    "default_branch": "main",
                    "language": "TypeScript",
                    "stargazers_count": 5,
                    "updated_at": "2026-10-23T12:00:00Z",
                    "permissions": {"admin": True, "push": True, "pull": True}
                }
            ]

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/user/repos?per_page=100&sort=updated",
                headers=self._headers(token),
                timeout=15.0
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="Failed to retrieve GitHub repositories.")
            return resp.json()

    async def get_repository_tree(self, token: str, owner: str, repo: str, branch: str = "main") -> List[Dict[str, Any]]:
        """Retrieve full recursive file tree from GitHub git database."""
        if token.startswith("gho_mock_"):
            return [
                {"path": "app/main.py", "type": "blob", "size": 1500, "sha": "mocksha1"},
                {"path": "app/services/payment.py", "type": "blob", "size": 3200, "sha": "mocksha2"},
                {"path": "app/api/payments.py", "type": "blob", "size": 2400, "sha": "mocksha3"},
                {"path": "tests/test_payment.py", "type": "blob", "size": 1800, "sha": "mocksha4"},
                {"path": "README.md", "type": "blob", "size": 500, "sha": "mocksha5"},
            ]

        async with httpx.AsyncClient() as client:
            # First get branch commit SHA
            ref_resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/git/ref/heads/{branch}",
                headers=self._headers(token),
                timeout=10.0
            )
            if ref_resp.status_code != 200:
                # Try default branch
                ref_resp = await client.get(f"{self.BASE_URL}/repos/{owner}/{repo}", headers=self._headers(token), timeout=10.0)
                if ref_resp.status_code != 200:
                    raise HTTPException(status_code=404, detail="Repository not found on GitHub.")
                branch = ref_resp.json().get("default_branch", "main")
                ref_resp = await client.get(f"{self.BASE_URL}/repos/{owner}/{repo}/git/ref/heads/{branch}", headers=self._headers(token), timeout=10.0)

            commit_sha = ref_resp.json()["object"]["sha"]

            # Fetch tree recursively
            tree_resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/git/trees/{commit_sha}?recursive=1",
                headers=self._headers(token),
                timeout=20.0
            )
            if tree_resp.status_code != 200:
                raise HTTPException(status_code=tree_resp.status_code, detail="Failed to fetch git tree.")

            raw_tree = tree_resp.json().get("tree", [])
            valid_files = []
            for item in raw_tree:
                if item.get("type") == "blob":
                    path = item.get("path", "")
                    if not should_ignore_path(path):
                        valid_files.append(item)
            return valid_files

    async def get_file_content(self, token: str, owner: str, repo: str, path: str, branch: str = "main") -> str:
        """Fetch and decode file content from GitHub repository."""
        if token.startswith("gho_mock_"):
            if "payment.py" in path:
                return (
                    "def process_payment(amount: float, currency: str = 'USD'):\n"
                    "    '''Processes payment transaction through payment gateway.'''\n"
                    "    if amount <= 0:\n"
                    "        raise ValueError('Invalid payment amount')\n"
                    "    gateway = get_payment_gateway()\n"
                    "    return gateway.charge(amount, currency)\n"
                )
            if "payments.py" in path:
                return (
                    "from app.services.payment import process_payment\n\n"
                    "def payment_controller(request):\n"
                    "    amount = request.get('amount')\n"
                    "    return process_payment(amount)\n"
                )
            if "test_payment.py" in path:
                return (
                    "from app.services.payment import process_payment\n\n"
                    "def test_process_payment_valid():\n"
                    "    res = process_payment(100)\n"
                    "    assert res is not None\n"
                )
            return f"# Content of {path}\nprint('Hello from {path}')\n"

        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/repos/{owner}/{repo}/contents/{path}?ref={branch}",
                headers=self._headers(token),
                timeout=15.0
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail=f"Failed to read file {path} from GitHub.")

            file_data = resp.json()
            if "content" in file_data:
                encoding = file_data.get("encoding", "base64")
                if encoding == "base64":
                    return base64.b64decode(file_data["content"]).decode("utf-8", errors="replace")
                return file_data["content"]
            return ""


github_client = GitHubClient()
