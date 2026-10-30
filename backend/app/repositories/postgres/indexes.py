from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.repositories.interfaces import IIndexRepository
from app.models.repository_index import RepositoryIndex


class PostgresIndexRepository(IIndexRepository):
    """PostgreSQL implementation of IIndexRepository."""

    def __init__(self, db: Session):
        self.db = db

    async def get_status(self, project_id: str) -> Optional[Dict[str, Any]]:
        idx = self.db.query(RepositoryIndex).filter(RepositoryIndex.repository_id == str(project_id)).first()
        if not idx:
            return None
        return {
            "repository_id": str(idx.repository_id),
            "status": idx.status,
            "progress_percentage": 100 if idx.status == "completed" else 50,
            "total_files": len(idx.source_files),
            "processed_files": len(idx.source_files),
            "total_symbols": sum(len(f.symbols) for f in idx.source_files),
            "error": idx.error_message,
            "updated_at": idx.completed_at or idx.created_at,
        }

    async def save_status(self, index_data: Dict[str, Any]) -> Dict[str, Any]:
        project_id = str(index_data["project_id"])
        idx = self.db.query(RepositoryIndex).filter(RepositoryIndex.repository_id == project_id).first()
        if idx:
            idx.status = index_data.get("status", idx.status)
            idx.error_message = index_data.get("error", idx.error_message)
            if idx.status == "completed":
                idx.completed_at = datetime.utcnow()
        else:
            idx = RepositoryIndex(
                repository_id=project_id,
                commit_sha=index_data.get("commit_sha", "main"),
                status=index_data.get("status", "unindexed"),
                error_message=index_data.get("error"),
                started_at=datetime.utcnow(),
                completed_at=datetime.utcnow() if index_data.get("status") == "completed" else None,
                created_at=datetime.utcnow(),
            )
            self.db.add(idx)
        self.db.commit()
        index_data["repository_id"] = project_id
        index_data["updated_at"] = idx.completed_at or idx.created_at or datetime.utcnow()
        return index_data
