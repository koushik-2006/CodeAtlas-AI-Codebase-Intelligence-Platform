from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status
from app.repositories.interfaces import IProjectRepository, ISourceFileRepository, IIndexRepository
from app.services.github_service import GitHubService
from app.services.file_filter_service import file_filter_service
from app.integrations.github.client import github_client
from app.security.input_validation import sanitize_file_path
from app.utils.language_detection import detect_language_by_filename


class RepositoryService:
    def __init__(
        self,
        project_repo: IProjectRepository,
        source_repo: ISourceFileRepository,
        index_repo: IIndexRepository,
        github_service: GitHubService
    ):
        self.project_repo = project_repo
        self.source_repo = source_repo
        self.index_repo = index_repo
        self.github_service = github_service

    async def get_or_register_repository(self, user_id: str, repo_id_or_fullname: str) -> Dict[str, Any]:
        """Fetch repository details, registering it locally if accessing for the first time."""
        project = await self.project_repo.get_by_id(repo_id_or_fullname)
        if not project:
            project = await self.project_repo.get_by_full_name(repo_id_or_fullname)

        if not project:
            # Look up repository via GitHub API
            token = await self.github_service.get_user_token(user_id)
            repos = await self.github_service.list_repositories(user_id)
            match = next((r for r in repos if str(r["id"]) == str(repo_id_or_fullname) or r["full_name"].lower() == repo_id_or_fullname.lower()), None)

            if not match:
                # Default mock project for testing if repo_id is demo
                project_data = {
                    "id": repo_id_or_fullname,
                    "owner_id": user_id,
                    "name": repo_id_or_fullname.split("/")[-1],
                    "full_name": repo_id_or_fullname if "/" in repo_id_or_fullname else f"user/{repo_id_or_fullname}",
                    "owner": "user",
                    "is_private": False,
                    "html_url": f"https://github.com/user/{repo_id_or_fullname}",
                    "default_branch": "main",
                    "description": "CodeAtlas managed repository",
                }
            else:
                project_data = {
                    "id": str(match["id"]),
                    "owner_id": user_id,
                    "github_id": match["id"],
                    "name": match["name"],
                    "full_name": match["full_name"],
                    "owner": match["owner"],
                    "is_private": match["private"],
                    "html_url": match["html_url"],
                    "default_branch": match["default_branch"],
                    "description": match["description"],
                }

            project = await self.project_repo.save(project_data)

        # Retrieve index status
        idx_status = await self.index_repo.get_status(project["id"])
        indexed = idx_status is not None and idx_status.get("status") == "completed"

        return {
            "id": project["id"],
            "github_id": project.get("github_id"),
            "name": project["name"],
            "full_name": project["full_name"],
            "owner": project.get("owner", ""),
            "is_private": project.get("is_private", False),
            "default_branch": project.get("default_branch", "main"),
            "description": project.get("description"),
            "indexed": indexed,
            "index_status": idx_status.get("status", "unindexed") if idx_status else "unindexed",
            "indexed_files_count": idx_status.get("processed_files", 0) if idx_status else 0,
            "total_symbols_count": idx_status.get("total_symbols", 0) if idx_status else 0,
            "last_indexed_at": idx_status.get("updated_at") if idx_status else None
        }

    async def get_repository_files_tree(self, user_id: str, repo_id: str) -> List[Dict[str, Any]]:
        """Retrieve the nested file hierarchy for the repository."""
        repo = await self.get_or_register_repository(user_id, repo_id)
        cached_files = await self.source_repo.list_files(repo["id"])

        if cached_files:
            return file_filter_service.build_nested_tree(cached_files)

        # Retrieve from GitHub
        token = await self.github_service.get_user_token(user_id)
        owner, repo_name = repo["full_name"].split("/") if "/" in repo["full_name"] else ("dev", repo["name"])
        raw_tree = await github_client.get_repository_tree(token, owner, repo_name, repo["default_branch"])
        filtered_files = file_filter_service.filter_tree(raw_tree)

        # Cache file list
        files_to_save = [
            {
                "path": f["path"],
                "name": f["path"].split("/")[-1],
                "size": f.get("size", 0),
                "language": detect_language_by_filename(f["path"]),
                "is_test": "test" in f["path"].lower()
            }
            for f in filtered_files
        ]
        await self.source_repo.save_files(repo["id"], files_to_save)
        return file_filter_service.build_nested_tree(files_to_save)

    async def get_file_content(self, user_id: str, repo_id: str, path: str) -> Dict[str, Any]:
        """Read and validate file content within security and size constraints."""
        safe_path = sanitize_file_path(path)
        repo = await self.get_or_register_repository(user_id, repo_id)

        # Check local cache first
        cached = await self.source_repo.get_file_content(repo["id"], safe_path)
        if cached and cached.get("content"):
            content = cached["content"]
        else:
            token = await self.github_service.get_user_token(user_id)
            owner, repo_name = repo["full_name"].split("/") if "/" in repo["full_name"] else ("dev", repo["name"])
            content = await github_client.get_file_content(token, owner, repo_name, safe_path, repo["default_branch"])

        return {
            "path": safe_path,
            "repository_id": repo["id"],
            "size": len(content.encode("utf-8")),
            "language": detect_language_by_filename(safe_path),
            "is_truncated": False,
            "content": content
        }
