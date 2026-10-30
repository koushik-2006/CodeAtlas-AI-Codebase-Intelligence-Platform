from typing import Any, Dict, List
from app.repositories.interfaces import ISymbolRepository


class SymbolService:
    def __init__(self, symbol_repo: ISymbolRepository):
        self.symbol_repo = symbol_repo

    async def get_symbol_dependencies(self, project_id: str, symbol_name: str) -> Dict[str, Any]:
        """Retrieve known callers, callees, and imported components for a symbol."""
        symbols = await self.symbol_repo.search_symbols(project_id, symbol_name)
        target = next((s for s in symbols if s["name"] == symbol_name), None)

        relationships = await self.symbol_repo.get_relationships(project_id)
        callers = [r for r in relationships if r.get("target") == symbol_name]
        callees = [r for r in relationships if r.get("source") == symbol_name]

        return {
            "symbol": target or {"name": symbol_name},
            "callers": callers,
            "callees": callees,
            "total_dependencies": len(callers) + len(callees)
        }
