from fastapi import APIRouter, Depends
from app.dependencies import get_assistant_service, get_current_user
from app.services.assistant_service import AssistantService
from app.schemas.assistant import AssistantAskRequest, AssistantAskResponse

router = APIRouter(prefix="/assistant", tags=["AI Codebase Assistant"])


@router.post("/ask", response_model=AssistantAskResponse)
async def ask_assistant(
    req: AssistantAskRequest,
    current_user: dict = Depends(get_current_user),
    assistant: AssistantService = Depends(get_assistant_service)
):
    """Ask a question about the repository or code, returning source-backed evidence."""
    return await assistant.ask_question(req.query, req.repository_id, req.chat_id)
