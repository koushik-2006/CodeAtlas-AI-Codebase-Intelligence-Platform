import uuid
from typing import Any, Dict, Optional
from app.integrations.ai.provider import get_ai_provider
from app.services.retrieval_service import RetrievalService


class AssistantService:
    def __init__(self, retrieval_service: RetrievalService):
        self.retrieval = retrieval_service
        self.ai = get_ai_provider()

    async def ask_question(self, query: str, repo_id: Optional[str] = None, chat_id: Optional[str] = None) -> Dict[str, Any]:
        """Ask a contextual question about the repository or general code."""
        session_chat_id = chat_id or f"chat_{uuid.uuid4().hex[:8]}"

        context_chunks = []
        if repo_id:
            context_chunks = await self.retrieval.retrieve_relevant_chunks(repo_id, query)

        response = await self.ai.answer_question(query, context_chunks)
        response["chat_id"] = session_chat_id
        return response
