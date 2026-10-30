from typing import Any, Dict, List
from app.repositories.interfaces import ISourceFileRepository


class LearningService:
    def __init__(self, source_repo: ISourceFileRepository):
        self.source_repo = source_repo

    async def get_learning_path(self, project_id: str) -> List[Dict[str, Any]]:
        """LearningMode: Generate curated walkthrough topics for understanding the repository."""
        files = await self.source_repo.list_files(project_id)
        paths = [f["path"] for f in files]

        topics = [
            {
                "id": "topic_1",
                "title": "Architecture Overview & Entry Points",
                "description": "Understand how the application boots up and initializes routes.",
                "file_references": [p for p in paths if "main" in p or "app" in p][:2],
                "difficulty": "beginner"
            },
            {
                "id": "topic_2",
                "title": "Business Logic & Services Layer",
                "description": "Learn the core domain workflows and algorithmic processing.",
                "file_references": [p for p in paths if "service" in p][:3],
                "difficulty": "intermediate"
            },
            {
                "id": "topic_3",
                "title": "Testing & Integration Contracts",
                "description": "Review test coverage and integration boundaries.",
                "file_references": [p for p in paths if "test" in p][:2],
                "difficulty": "intermediate"
            }
        ]
        return topics
