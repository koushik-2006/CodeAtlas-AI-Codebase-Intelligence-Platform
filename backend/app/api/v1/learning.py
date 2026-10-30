from typing import List
from fastapi import APIRouter, Depends, Query
from app.dependencies import get_learning_service, get_current_user
from app.services.learning_service import LearningService
from app.schemas.analysis import LearningTopic

router = APIRouter(prefix="/learning", tags=["LearningMode"])


@router.get("/topics", response_model=List[LearningTopic])
async def get_learning_topics(
    repository_id: str = Query(..., description="Repository ID to explore"),
    current_user: dict = Depends(get_current_user),
    learning_service: LearningService = Depends(get_learning_service)
):
    """LearningMode: Retrieve structured repository learning walkthrough topics."""
    return await learning_service.get_learning_path(repository_id)
