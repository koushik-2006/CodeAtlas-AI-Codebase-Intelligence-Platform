import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.repositories.interfaces import IHistoryRepository
from app.models.saved_analysis import SavedAnalysis


class PostgresHistoryRepository(IHistoryRepository):
    """PostgreSQL implementation of IHistoryRepository."""

    def __init__(self, db: Session):
        self.db = db

    def _to_dict(self, rec: SavedAnalysis) -> Dict[str, Any]:
        data = rec.result_data or {}
        title = data.get("title", rec.analysis_type.capitalize() + " Analysis")
        return {
            "id": str(rec.id),
            "user_id": str(rec.user_id),
            "repository_id": str(rec.repository_id) if rec.repository_id else None,
            "title": title,
            "analysis_type": rec.analysis_type,
            "data": data,
            "created_at": rec.created_at,
        }

    async def save_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        analysis_id = analysis_data.get("id") or str(uuid.uuid4())
        data_payload = analysis_data.get("data", {})
        if "title" not in data_payload and "title" in analysis_data:
            data_payload["title"] = analysis_data["title"]

        rec = SavedAnalysis(
            id=analysis_id,
            user_id=str(analysis_data["user_id"]),
            repository_id=str(analysis_data["repository_id"]) if analysis_data.get("repository_id") else None,
            analysis_type=analysis_data.get("analysis_type", "explain"),
            input_data={"title": analysis_data.get("title")},
            result_data=data_payload,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(rec)
        self.db.commit()
        self.db.refresh(rec)
        return self._to_dict(rec)

    async def list_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        items = self.db.query(SavedAnalysis).filter(
            SavedAnalysis.user_id == str(user_id)
        ).order_by(SavedAnalysis.created_at.desc()).limit(limit).all()
        return [self._to_dict(it) for it in items]

    async def get_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        it = self.db.query(SavedAnalysis).filter(SavedAnalysis.id == str(analysis_id)).first()
        if not it:
            return None
        return self._to_dict(it)

    async def delete(self, analysis_id: str, user_id: str) -> bool:
        deleted = self.db.query(SavedAnalysis).filter(
            SavedAnalysis.id == str(analysis_id),
            SavedAnalysis.user_id == str(user_id)
        ).delete()
        self.db.commit()
        return deleted > 0
