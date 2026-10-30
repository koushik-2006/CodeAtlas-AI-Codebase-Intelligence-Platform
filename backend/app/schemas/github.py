from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class GitHubConnectionStatus(BaseModel):
    connected: bool
    github_username: Optional[str] = None
    avatar_url: Optional[str] = None
    scopes: List[str] = []
    connected_at: Optional[datetime] = None


class GitHubRepoItem(BaseModel):
    id: int
    name: str
    full_name: str
    owner: str
    private: bool
    html_url: str
    description: Optional[str] = None
    default_branch: str
    language: Optional[str] = None
    stars_count: int = 0
    updated_at: Optional[str] = None
    permissions: dict = {}


class GitHubOAuthCallbackRequest(BaseModel):
    code: str
    state: Optional[str] = None
