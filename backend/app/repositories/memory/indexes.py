from datetime import datetime
from typing import Any, Dict, Optional
from app.repositories.interfaces import IIndexRepository


class MemoryIndexRepository(IIndexRepository):
    """Temporary in-memory repository index tracker."""

    def __init__(self):
        self._indexes: Dict[str, Dict[str, Any]] = {}

    async def get_status(self, project_id: str) -> Optional[Dict[str, Any]]:
        record = self._indexes.get(project_id)
        if record and "repository_id" not in record:
            record["repository_id"] = project_id
        return record

    async def save_status(self, index_data: Dict[str, Any]) -> Dict[str, Any]:
        project_id = index_data["project_id"]
        index_data["repository_id"] = project_id
        index_data["updated_at"] = datetime.utcnow()
        if "created_at" not in index_data:
            index_data["created_at"] = datetime.utcnow()
        self._indexes[project_id] = index_data
        return index_data
