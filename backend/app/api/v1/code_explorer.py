from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.code_explanation_service import code_explanation_service
from app.services.comparison_service import comparison_service
from app.schemas.code import (
    CodeExplainRequest,
    CodeExplainResponse,
    CodeCompareRequest,
    CodeCompareResponse
)

router = APIRouter(prefix="/code", tags=["Code Explorer & Explanation"])


@router.post("/explain", response_model=CodeExplainResponse)
async def explain_code(
    req: CodeExplainRequest,
    current_user: dict = Depends(get_current_user)
):
    """Explain pasted or submitted code line by line with complexity, summary, and risks."""
    return await code_explanation_service.explain_code(req.code, req.language, req.level)


@router.post("/compare", response_model=CodeCompareResponse)
async def compare_code(
    req: CodeCompareRequest,
    current_user: dict = Depends(get_current_user)
):
    """Compare two code snippets or functions, reporting differences and breaking changes."""
    return await comparison_service.compare_snippets(req.code_a, req.code_b, req.language)
