from typing import List
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_github_service, get_current_user
from app.services.github_service import GitHubService
from app.schemas.github import GitHubConnectionStatus, GitHubRepoItem

router = APIRouter(prefix="/github", tags=["GitHub Integration"])


@router.get("/connect")
def github_connect(github_service: GitHubService = Depends(get_github_service)):
    """Start GitHub authorization flow."""
    return github_service.get_authorization_url()


@router.get("/callback", response_model=GitHubConnectionStatus)
async def github_callback(
    code: str = Query(..., description="OAuth code from GitHub"),
    state: str = Query(None, description="CSRF state"),
    current_user: dict = Depends(get_current_user),
    github_service: GitHubService = Depends(get_github_service)
):
    """Handle GitHub authorization callback."""
    return await github_service.handle_callback(current_user["id"], code)


@router.get("/status", response_model=GitHubConnectionStatus)
async def github_status(
    current_user: dict = Depends(get_current_user),
    github_service: GitHubService = Depends(get_github_service)
):
    """Check GitHub account connection status."""
    return await github_service.get_connection_status(current_user["id"])


@router.delete("/disconnect")
async def github_disconnect(
    current_user: dict = Depends(get_current_user),
    github_service: GitHubService = Depends(get_github_service)
):
    """Disconnect GitHub account and purge stored credentials."""
    success = await github_service.disconnect(current_user["id"])
    return {"success": success, "message": "GitHub disconnected successfully."}


@router.get("/repositories", response_model=List[GitHubRepoItem])
async def list_repositories(
    current_user: dict = Depends(get_current_user),
    github_service: GitHubService = Depends(get_github_service)
):
    """List accessible GitHub repositories (public and private)."""
    return await github_service.list_repositories(current_user["id"])
