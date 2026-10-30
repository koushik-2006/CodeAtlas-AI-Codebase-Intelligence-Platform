from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from app.repositories.interfaces import IAccountRepository
from app.integrations.github.oauth import github_oauth_client
from app.integrations.github.client import github_client
from app.security.csrf import generate_oauth_state
from app.security.encryption import encrypt_token, decrypt_token


class GitHubService:
    def __init__(self, account_repo: IAccountRepository):
        self.account_repo = account_repo

    def get_authorization_url(self) -> Dict[str, str]:
        state = generate_oauth_state()
        url = github_oauth_client.get_authorization_url(state)
        return {"authorization_url": url, "state": state}

    async def handle_callback(self, user_id: str, code: str) -> Dict[str, Any]:
        token_data = await github_oauth_client.exchange_code_for_token(code)
        access_token = token_data["access_token"]

        # Fetch GitHub user identity
        gh_user = await github_client.get_current_user(access_token)

        # Encrypt token and store in account repo
        encrypted_token = encrypt_token(access_token)
        account_rec = await self.account_repo.save_account({
            "user_id": user_id,
            "provider": "github",
            "provider_account_id": str(gh_user["id"]),
            "username": gh_user.get("login"),
            "avatar_url": gh_user.get("avatar_url"),
            "access_token_encrypted": encrypted_token,
            "scopes": token_data.get("scope", "repo,read:user")
        })

        return {
            "connected": True,
            "github_username": gh_user.get("login"),
            "avatar_url": gh_user.get("avatar_url"),
            "scopes": token_data.get("scope", "").split(",")
        }

    async def get_connection_status(self, user_id: str) -> Dict[str, Any]:
        account = await self.account_repo.get_by_user_id(user_id, "github")
        if not account:
            return {"connected": False}
        return {
            "connected": True,
            "github_username": account.get("username"),
            "avatar_url": account.get("avatar_url"),
            "scopes": [s.strip() for s in account.get("scopes", "").split(",") if s.strip()],
            "connected_at": account.get("created_at")
        }

    async def disconnect(self, user_id: str) -> bool:
        return await self.account_repo.delete_by_user_id(user_id, "github")

    async def get_user_token(self, user_id: str) -> str:
        account = await self.account_repo.get_by_user_id(user_id, "github")
        if not account or not account.get("access_token_encrypted"):
            from app.config import settings
            if settings.DEBUG:
                return "gho_mock_dev_token"
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="GitHub account not connected. Please authorize GitHub first."
            )
        decrypted = decrypt_token(account["access_token_encrypted"])
        if not decrypted:
            from app.config import settings
            if settings.DEBUG:
                return "gho_mock_dev_token"
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to decrypt GitHub credentials. Please reconnect GitHub."
            )
        return decrypted

    async def list_repositories(self, user_id: str) -> List[Dict[str, Any]]:
        token = await self.get_user_token(user_id)
        raw_repos = await github_client.list_repositories(token)
        results = []
        for r in raw_repos:
            owner = r.get("owner", {}).get("login", "")
            results.append({
                "id": r["id"],
                "name": r["name"],
                "full_name": r["full_name"],
                "owner": owner,
                "private": r.get("private", False),
                "html_url": r["html_url"],
                "description": r.get("description"),
                "default_branch": r.get("default_branch", "main"),
                "language": r.get("language"),
                "stars_count": r.get("stargazers_count", 0),
                "updated_at": r.get("updated_at"),
                "permissions": r.get("permissions", {})
            })
        return results


