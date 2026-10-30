from fastapi import APIRouter, Depends
from app.dependencies import get_search_service, get_current_user
from app.services.search_service import SearchService
from app.schemas.assistant import SearchRequest, SearchResponse

router = APIRouter(tags=["Search"])


@router.post("/search", response_model=SearchResponse)
async def search_codebase(
    req: SearchRequest,
    current_user: dict = Depends(get_current_user),
    search_service: SearchService = Depends(get_search_service)
):
    """Search repository code chunks and extracted symbols."""
    return await search_service.search(req.repository_id, req.query, req.type, req.limit)
