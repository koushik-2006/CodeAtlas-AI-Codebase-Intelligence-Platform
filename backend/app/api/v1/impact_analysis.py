from fastapi import APIRouter, Depends
from app.dependencies import get_impact_service, get_current_user
from app.services.impact_service import ImpactService
from app.schemas.analysis import ImpactAnalyzeRequest, ImpactAnalyzeResponse

router = APIRouter(prefix="/impact", tags=["ChangeRadar & Impact Analysis"])


@router.post("/analyze", response_model=ImpactAnalyzeResponse)
async def analyze_impact(
    req: ImpactAnalyzeRequest,
    current_user: dict = Depends(get_current_user),
    impact_service: ImpactService = Depends(get_impact_service)
):
    """ChangeRadar: Estimate affected files and risk level when modifying code."""
    return await impact_service.analyze_impact(
        req.repository_id,
        req.file_path,
        req.changed_symbols,
        req.diff_or_code
    )
