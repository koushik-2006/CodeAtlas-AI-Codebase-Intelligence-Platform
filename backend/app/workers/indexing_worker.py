from app.services.indexing_service import IndexingService


class IndexingWorker:
    """Background worker for repository indexing jobs."""

    def __init__(self, indexing_service: IndexingService):
        self.indexing_service = indexing_service

    async def process_job(self, user_id: str, repo_id: str):
        return await self.indexing_service.request_index(user_id, repo_id)
