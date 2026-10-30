from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class FileTreeNode(BaseModel):
    path: str
    name: str
    type: str  # 'file' or 'dir'
    size: Optional[int] = None
    language: Optional[str] = None
    children: Optional[List["FileTreeNode"]] = None


class RepositoryDetails(BaseModel):
    id: str
    github_id: Optional[int] = None
    name: str
    full_name: str
    owner: str
    is_private: bool
    default_branch: str
    description: Optional[str] = None
    indexed: bool = False
    index_status: str = "unindexed"  # 'unindexed' | 'indexing' | 'indexed' | 'failed'
    indexed_files_count: int = 0
    total_symbols_count: int = 0
    last_indexed_at: Optional[datetime] = None


class FileContentResponse(BaseModel):
    path: str
    repository_id: str
    size: int
    language: str
    is_truncated: bool = False
    content: str


class IndexRequest(BaseModel):
    branch: Optional[str] = None
    force_reindex: bool = False


class IndexStatusResponse(BaseModel):
    repository_id: str
    status: str  # 'unindexed' | 'queued' | 'indexing' | 'completed' | 'failed'
    progress_percentage: int
    total_files: int
    processed_files: int
    total_symbols: int
    error: Optional[str] = None
    updated_at: datetime
