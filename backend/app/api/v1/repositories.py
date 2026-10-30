from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_repository_service, get_indexing_service, get_current_user
from app.services.repository_service import RepositoryService
from app.services.indexing_service import IndexingService
from app.schemas.repository import RepositoryDetails, FileContentResponse, IndexRequest, IndexStatusResponse

router = APIRouter(prefix="/repositories", tags=["Repositories"])


@router.get("/{repo_id}", response_model=RepositoryDetails)
async def get_repository_details(
    repo_id: str,
    current_user: dict = Depends(get_current_user),
    repo_service: RepositoryService = Depends(get_repository_service)
):
    """Get repository details and indexing status."""
    return await repo_service.get_or_register_repository(current_user["id"], repo_id)


@router.get("/{repo_id}/files")
async def get_repository_files_tree(
    repo_id: str,
    current_user: dict = Depends(get_current_user),
    repo_service: RepositoryService = Depends(get_repository_service)
):
    """Retrieve filtered folder and file hierarchy for the repository."""
    return await repo_service.get_repository_files_tree(current_user["id"], repo_id)


@router.get("/{repo_id}/files/content", response_model=FileContentResponse)
async def get_repository_file_content(
    repo_id: str,
    path: str = Query(..., description="Relative path of file inside repository"),
    current_user: dict = Depends(get_current_user),
    repo_service: RepositoryService = Depends(get_repository_service)
):
    """Read an authorized source file within size and path limits."""
    return await repo_service.get_file_content(current_user["id"], repo_id, path)


@router.post("/{repo_id}/index", response_model=IndexStatusResponse)
async def request_repository_indexing(
    repo_id: str,
    req: Optional[IndexRequest] = None,
    current_user: dict = Depends(get_current_user),
    indexing_service: IndexingService = Depends(get_indexing_service)
):
    """Request code parsing and indexing of the repository."""
    force = req.force_reindex if req else False
    return await indexing_service.request_index(current_user["id"], repo_id, force)


@router.get("/{repo_id}/index/status", response_model=IndexStatusResponse)
async def get_indexing_status(
    repo_id: str,
    current_user: dict = Depends(get_current_user),
    indexing_service: IndexingService = Depends(get_indexing_service)
):
    """Get progress, total symbols, and indexing status."""
    return await indexing_service.get_index_status(repo_id)
