from fastapi import APIRouter, Depends
from app.dependencies import get_graph_service, get_symbol_service, get_current_user
from app.services.graph_service import GraphService
from app.services.symbol_service import SymbolService

router = APIRouter(prefix="/repositories", tags=["Architecture & Graphs"])


@router.get("/{repo_id}/architecture")
async def get_repository_architecture(
    repo_id: str,
    current_user: dict = Depends(get_current_user),
    graph_service: GraphService = Depends(get_graph_service)
):
    """Retrieve repository architecture graph with modules and inter-file dependencies."""
    return await graph_service.get_repository_architecture_graph(repo_id)


@router.get("/{repo_id}/symbols/{symbol_id}/dependencies")
async def get_symbol_dependencies(
    repo_id: str,
    symbol_id: str,
    current_user: dict = Depends(get_current_user),
    symbol_service: SymbolService = Depends(get_symbol_service)
):
    """Retrieve known callers, callees, and imports for a specific symbol."""
    return await symbol_service.get_symbol_dependencies(repo_id, symbol_id)
