from typing import Any, Dict, Optional
import httpx
from fastapi import HTTPException, status
from app.config import settings


class GoogleOAuthClient:
    """Handles Google OAuth2 and OpenID Connect flows."""

    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"
    GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"

    def get_authorization_url(self, state: str) -> str:
        """Construct Google OAuth login URL."""
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID or "mock-google-client-id",
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "access_type": "offline",
            "state": state,
            "prompt": "select_account"
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.GOOGLE_AUTH_URL}?{query}"

    async def exchange_code_for_user(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for user profile."""
        # Development fallback if credentials are not configured
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET or settings.GOOGLE_CLIENT_ID == "mock-google-client-id":
            return {
                "sub": f"google_dev_{code[:8]}",
                "email": f"developer_{code[:6]}@example.com",
                "name": "CodeAtlas Developer",
                "picture": "https://avatars.githubusercontent.com/u/9919?v=4"
            }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                self.GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
                timeout=10.0
            )
            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Google token exchange failed: {resp.text}"
                )
            token_data = resp.json()
            access_token = token_data.get("access_token")

            userinfo_resp = await client.get(
                self.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0
            )
            if userinfo_resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to retrieve Google user information."
                )
            return userinfo_resp.json()


google_oauth_client = GoogleOAuthClient()
