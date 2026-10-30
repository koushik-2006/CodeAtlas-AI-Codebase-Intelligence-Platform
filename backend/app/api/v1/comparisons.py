from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.comparison_service import comparison_service
from app.schemas.code import CodeCompareRequest, CodeCompareResponse

router = APIRouter(prefix="/comparisons", tags=["Code Comparisons"])


@router.post("/diff", response_model=CodeCompareResponse)
async def compare_diff(
    req: CodeCompareRequest,
    current_user: dict = Depends(get_current_user)
):
    """Compare two code versions and identify functional and breaking changes."""
    return await comparison_service.compare_snippets(req.code_a, req.code_b, req.language)
