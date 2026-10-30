from typing import Any, Dict, Optional
from app.integrations.ai.provider import get_ai_provider
from app.services.retrieval_service import RetrievalService


class DebuggingService:
    def __init__(self, retrieval_service: RetrievalService):
        self.retrieval = retrieval_service
        self.ai = get_ai_provider()

    async def analyze_error(
        self,
        error_message: str,
        stack_trace: Optional[str] = None,
        repo_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """BugTrail: Analyze error logs or traces, link to repository files, and suggest fixes."""
        context_files = []
        if repo_id and error_message:
            context_files = await self.retrieval.retrieve_relevant_chunks(repo_id, error_message, limit=3)

        return await self.ai.analyze_error(error_message, stack_trace, context_files)
