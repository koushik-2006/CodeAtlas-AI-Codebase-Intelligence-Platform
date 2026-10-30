from fastapi import APIRouter, Depends
from app.dependencies import get_test_discovery_service, get_current_user
from app.services.test_discovery_service import TestDiscoveryService
from app.schemas.analysis import TestDiscoverRequest, TestDiscoverResponse

router = APIRouter(prefix="/tests", tags=["TestPilot & Testing Analysis"])


@router.post("/discover", response_model=TestDiscoverResponse)
async def discover_tests(
    req: TestDiscoverRequest,
    current_user: dict = Depends(get_current_user),
    test_service: TestDiscoveryService = Depends(get_test_discovery_service)
):
    """TestPilot: Discover tests, outline untested areas, and suggest test cases."""
    return await test_service.discover_tests(req.repository_id, req.target_file)
