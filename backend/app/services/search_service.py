from typing import Any, Dict, List
from app.repositories.interfaces import ISourceFileRepository, ISymbolRepository
from app.services.retrieval_service import RetrievalService


class SearchService:
    def __init__(self, source_repo: ISourceFileRepository, symbol_repo: ISymbolRepository):
        self.source_repo = source_repo
        self.symbol_repo = symbol_repo
        self.retrieval = RetrievalService(source_repo, symbol_repo)

    async def search(self, project_id: str, query: str, search_type: str = "keyword", limit: int = 20) -> Dict[str, Any]:
        """Search repository source files by keyword, symbol, or semantic match."""
        results: List[Dict[str, Any]] = []
        q = query.lower()

        # 1. Symbol search
        symbols = await self.symbol_repo.search_symbols(project_id, query)
        for s in symbols:
            results.append({
                "file": s.get("file_path", "unknown"),
                "line": s.get("start_line", 1),
                "content": s.get("signature") or s["name"],
                "type": "symbol",
                "score": 0.95,
                "context": s.get("docstring")
            })

        # 2. Text line search
        files = await self.source_repo.list_files(project_id)
        for f in files:
            content = f.get("content", "")
            if q in content.lower():
                lines = content.split("\n")
                for idx, line in enumerate(lines, start=1):
                    if q in line.lower():
                        results.append({
                            "file": f["path"],
                            "line": idx,
                            "content": line.strip(),
                            "type": "line",
                            "score": 0.80,
                            "context": None
                        })
                        if len(results) >= limit:
                            break

        return {
            "query": query,
            "total_results": len(results),
            "results": results[:limit]
        }
