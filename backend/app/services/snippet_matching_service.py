import difflib
from typing import Any, Dict, List, Optional
from app.repositories.interfaces import ISourceFileRepository, ISymbolRepository


class SnippetMatchingService:
    def __init__(self, source_repo: ISourceFileRepository, symbol_repo: ISymbolRepository):
        self.source_repo = source_repo
        self.symbol_repo = symbol_repo

    async def match_snippet(self, project_id: str, code_snippet: str) -> Dict[str, Any]:
        """Match snippet against indexed files using exact matching and fuzzy token similarity."""
        files = await self.source_repo.list_files(project_id)
        if not files:
            return {
                "match_status": "not_found",
                "matched_file": None,
                "confidence": 0.0,
                "sources": [],
                "symbol_name": None,
                "symbol_type": None
            }

        cleaned_snippet = code_snippet.strip()
        snippet_lines = [l.strip() for l in cleaned_snippet.split("\n") if l.strip()]

        best_match = None
        highest_score = 0.0
        best_line_start = 1
        best_line_end = 1

        # Check symbol names first (e.g. function defs)
        extracted_name = None
        for line in snippet_lines:
            if "def " in line or "function " in line:
                parts = line.split("(")
                extracted_name = parts[0].replace("def ", "").replace("function ", "").replace("async ", "").strip()
                break

        for f in files:
            file_content = f.get("content", "")
            if not file_content:
                continue

            # 1. Exact substring match
            if cleaned_snippet in file_content:
                lines = file_content.split("\n")
                # find start line
                first_line = snippet_lines[0] if snippet_lines else cleaned_snippet
                start = 1
                for idx, fl in enumerate(lines, start=1):
                    if first_line in fl:
                        start = idx
                        break
                return {
                    "match_status": "matched",
                    "matched_file": f["path"],
                    "confidence": 1.0,
                    "sources": [{
                        "file": f["path"],
                        "start_line": start,
                        "end_line": start + len(snippet_lines),
                        "match_score": 1.0
                    }],
                    "symbol_name": extracted_name,
                    "symbol_type": "function" if extracted_name else None
                }

            # 2. Sequence similarity matcher
            score = difflib.SequenceMatcher(None, cleaned_snippet, file_content).ratio()
            # If function name is present in file, boost score
            if extracted_name and extracted_name in file_content:
                score += 0.35

            if score > highest_score:
                highest_score = score
                best_match = f["path"]

        if highest_score >= 0.40 and best_match:
            status = "matched" if highest_score >= 0.65 else "ambiguous"
            return {
                "match_status": status,
                "matched_file": best_match,
                "confidence": round(min(highest_score, 0.95), 2),
                "sources": [{
                    "file": best_match,
                    "start_line": 1,
                    "end_line": min(len(snippet_lines) + 5, 50),
                    "match_score": round(min(highest_score, 0.95), 2)
                }],
                "symbol_name": extracted_name,
                "symbol_type": "function" if extracted_name else None
            }

        return {
            "match_status": "not_found",
            "matched_file": None,
            "confidence": 0.0,
            "sources": [],
            "symbol_name": None,
            "symbol_type": None
        }
