from typing import Any, Dict, List, Optional
from app.repositories.interfaces import IHistoryRepository


class HistoryService:
    def __init__(self, history_repo: IHistoryRepository):
        self.history_repo = history_repo

    async def save_analysis(self, user_id: str, title: str, analysis_type: str, data: Dict[str, Any], repo_id: Optional[str] = None) -> Dict[str, Any]:
        return await self.history_repo.save_analysis({
            "user_id": user_id,
            "repository_id": repo_id,
            "title": title,
            "analysis_type": analysis_type,
            "data": data
        })

    async def list_user_history(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        return await self.history_repo.list_by_user(user_id, limit)

    async def delete_analysis(self, user_id: str, analysis_id: str) -> bool:
        return await self.history_repo.delete(analysis_id, user_id)
