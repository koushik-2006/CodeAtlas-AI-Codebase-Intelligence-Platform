import asyncio
from datetime import datetime
from typing import Any, Dict, List
from app.repositories.interfaces import IIndexRepository, ISourceFileRepository, ISymbolRepository, IProjectRepository
from app.services.repository_service import RepositoryService
from app.services.code_parser_service import code_parser_service
from app.utils.language_detection import detect_language_by_filename


class IndexingService:
    def __init__(
        self,
        index_repo: IIndexRepository,
        source_repo: ISourceFileRepository,
        symbol_repo: ISymbolRepository,
        repo_service: RepositoryService
    ):
        self.index_repo = index_repo
        self.source_repo = source_repo
        self.symbol_repo = symbol_repo
        self.repo_service = repo_service

    async def get_index_status(self, repo_id: str) -> Dict[str, Any]:
        status = await self.index_repo.get_status(repo_id)
        if not status:
            return {
                "repository_id": repo_id,
                "status": "unindexed",
                "progress_percentage": 0,
                "total_files": 0,
                "processed_files": 0,
                "total_symbols": 0,
                "updated_at": datetime.utcnow()
            }
        return status

    async def request_index(self, user_id: str, repo_id: str, force: bool = False) -> Dict[str, Any]:
        """Trigger repository indexing."""
        repo = await self.repo_service.get_or_register_repository(user_id, repo_id)

        # Initialize status as indexing
        await self.index_repo.save_status({
            "project_id": repo["id"],
            "status": "indexing",
            "progress_percentage": 10,
            "total_files": 0,
            "processed_files": 0,
            "total_symbols": 0
        })

        # Fetch files tree
        await self.repo_service.get_repository_files_tree(user_id, repo["id"])
        files = await self.source_repo.list_files(repo["id"])

        total_files = len(files)
        total_symbols = 0
        all_symbols = []
        relationships = []
        known_function_names = []

        # Pass 1: Parse files and extract symbols
        for idx, file_meta in enumerate(files):
            path = file_meta["path"]
            lang = detect_language_by_filename(path)
            content_resp = await self.repo_service.get_file_content(user_id, repo["id"], path)
            content = content_resp["content"]

            file_symbols = code_parser_service.parse_file(content, path, lang)
            for s in file_symbols:
                s["project_id"] = repo["id"]
                known_function_names.append(s["name"])
            all_symbols.extend(file_symbols)
            total_symbols += len(file_symbols)

            # Update file content in storage
            file_meta["content"] = content

        await self.source_repo.save_files(repo["id"], files)
        await self.symbol_repo.save_symbols(all_symbols)

        # Pass 2: Detect relationships (caller -> callee)
        for file_meta in files:
            content = file_meta.get("content", "")
            path = file_meta["path"]
            for sym_name in known_function_names:
                if f"{sym_name}(" in content:
                    # Identify callers in this file
                    matching_symbols = [s for s in all_symbols if s["file_path"] == path and s["name"] != sym_name]
                    for parent_sym in matching_symbols:
                        relationships.append({
                            "project_id": repo["id"],
                            "source": parent_sym["name"],
                            "target": sym_name,
                            "type": "calls",
                            "source_file": path
                        })

        await self.symbol_repo.save_relationships(relationships)

        # Mark completed
        result = await self.index_repo.save_status({
            "project_id": repo["id"],
            "status": "completed",
            "progress_percentage": 100,
            "total_files": total_files,
            "processed_files": total_files,
            "total_symbols": total_symbols,
            "error": None
        })

        return result
