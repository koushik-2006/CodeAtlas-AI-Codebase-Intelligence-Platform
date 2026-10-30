from typing import Any, Dict, List
from app.repositories.interfaces import ISourceFileRepository, ISymbolRepository


class RetrievalService:
    def __init__(self, source_repo: ISourceFileRepository, symbol_repo: ISymbolRepository):
        self.source_repo = source_repo
        self.symbol_repo = symbol_repo

    async def retrieve_relevant_chunks(self, project_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve most relevant files and symbol chunks matching query."""
        results = []
        files = await self.source_repo.list_files(project_id)
        q = query.lower()

        # Check symbol definitions
        symbols = await self.symbol_repo.search_symbols(project_id, query)
        for s in symbols[:limit]:
            results.append({
                "path": s.get("file_path", "unknown"),
                "file": s.get("file_path", "unknown"),
                "start_line": s.get("start_line", 1),
                "end_line": s.get("end_line", 10),
                "content": f"{s.get('signature', s['name'])}\n{s.get('docstring') or ''}",
                "score": 0.95
            })

        # Match file contents
        for f in files:
            content = f.get("content", "")
            if q in content.lower():
                lines = content.split("\n")
                matched_line_no = 1
                for idx, line in enumerate(lines, start=1):
                    if q in line.lower():
                        matched_line_no = idx
                        break

                chunk_content = "\n".join(lines[max(0, matched_line_no - 3): min(len(lines), matched_line_no + 10)])
                results.append({
                    "path": f["path"],
                    "file": f["path"],
                    "start_line": max(1, matched_line_no - 2),
                    "end_line": min(len(lines), matched_line_no + 10),
                    "content": chunk_content,
                    "score": 0.85
                })

        return results[:limit]
