from fastapi import APIRouter, Depends
from app.dependencies import get_debugging_service, get_current_user
from app.services.debugging_service import DebuggingService
from app.schemas.analysis import DebugAnalyzeRequest, DebugAnalyzeResponse

router = APIRouter(prefix="/debug", tags=["BugTrail Debugging"])


@router.post("/analyze", response_model=DebugAnalyzeResponse)
async def analyze_error(
    req: DebugAnalyzeRequest,
    current_user: dict = Depends(get_current_user),
    debugging_service: DebuggingService = Depends(get_debugging_service)
):
    """BugTrail: Analyze error logs or traces, identify root cause, and link to code files."""
    return await debugging_service.analyze_error(
        req.error_message or "",
        req.stack_trace,
        req.repository_id
    )
