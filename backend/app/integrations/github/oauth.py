from typing import Any, Dict, Optional
import httpx
from fastapi import HTTPException, status
from app.config import settings


class GitHubOAuthClient:
    """Handles GitHub OAuth 2.0 Web Application Flow."""

    GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
    GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
    GITHUB_USER_URL = "https://api.github.com/user"

    def get_authorization_url(self, state: str) -> str:
        """Construct GitHub authorization URL requesting repo access."""
        params = {
            "client_id": settings.GITHUB_CLIENT_ID or "mock-github-client-id",
            "redirect_uri": settings.GITHUB_REDIRECT_URI,
            "scope": "repo,read:user,user:email",
            "state": state
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.GITHUB_AUTH_URL}?{query}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange GitHub OAuth code for access token."""
        if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET or settings.GITHUB_CLIENT_ID == "mock-github-client-id":
            # Developer mock token
            return {
                "access_token": f"gho_mock_token_{code}",
                "token_type": "bearer",
                "scope": "repo,read:user"
            }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self.GITHUB_TOKEN_URL,
                headers={"Accept": "application/json"},
                data={
                    "client_id": settings.GITHUB_CLIENT_ID,
                    "client_secret": settings.GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.GITHUB_REDIRECT_URI,
                },
                timeout=10.0
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub token exchange failed: {resp.text}"
                )
            data = resp.json()
            if "error" in data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"GitHub authorization error: {data.get('error_description', data.get('error'))}"
                )
            return data


github_oauth_client = GitHubOAuthClient()
