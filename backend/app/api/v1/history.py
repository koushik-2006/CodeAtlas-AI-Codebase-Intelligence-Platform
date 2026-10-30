from typing import List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.dependencies import get_history_service, get_current_user
from app.services.history_service import HistoryService
from app.schemas.analysis import SaveAnalysisRequest, SavedAnalysisItem

router = APIRouter(prefix="/history", tags=["CodeMemory & History"])


@router.get("", response_model=List[SavedAnalysisItem])
async def get_history(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    history_service: HistoryService = Depends(get_history_service)
):
    """Get the user's saved analysis history and bookmarks."""
    return await history_service.list_user_history(current_user["id"], limit)


@router.post("", response_model=SavedAnalysisItem)
async def save_analysis(
    req: SaveAnalysisRequest,
    current_user: dict = Depends(get_current_user),
    history_service: HistoryService = Depends(get_history_service)
):
    """Save an explanation, workflow graph, or debug analysis to history."""
    return await history_service.save_analysis(
        user_id=current_user["id"],
        title=req.title,
        analysis_type=req.analysis_type,
        data=req.data,
        repo_id=req.repository_id
    )


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    current_user: dict = Depends(get_current_user),
    history_service: HistoryService = Depends(get_history_service)
):
    """Delete a saved analysis from history."""
    deleted = await history_service.delete_analysis(current_user["id"], analysis_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved analysis not found or not owned by user.")
    return {"success": True, "message": "Analysis deleted successfully."}
