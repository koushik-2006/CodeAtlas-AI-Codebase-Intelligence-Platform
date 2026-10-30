import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from app.repositories.interfaces import IHistoryRepository


class MemoryHistoryRepository(IHistoryRepository):
    """Temporary in-memory history repository."""

    def __init__(self):
        self._history: Dict[str, Dict[str, Any]] = {}

    async def save_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis_id = analysis_data.get("id") or str(uuid.uuid4())
        record = {
            "id": analysis_id,
            "user_id": analysis_data["user_id"],
            "repository_id": analysis_data.get("repository_id"),
            "title": analysis_data["title"],
            "analysis_type": analysis_data["analysis_type"],
            "data": analysis_data["data"],
            "created_at": analysis_data.get("created_at") or datetime.utcnow(),
        }
        self._history[analysis_id] = record
        return record

    async def list_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        results = [
            item for item in self._history.values()
            if item.get("user_id") == user_id
        ]
        results.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
        return results[:limit]

    async def get_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        return self._history.get(analysis_id)

    async def delete(self, analysis_id: str, user_id: str) -> bool:
        item = self._history.get(analysis_id)
        if item and item.get("user_id") == user_id:
            del self._history[analysis_id]
            return True
        return False
