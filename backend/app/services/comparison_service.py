from typing import Any, Dict
from app.integrations.ai.provider import get_ai_provider


class ComparisonService:
    def __init__(self):
        self.ai = get_ai_provider()

    async def compare_snippets(self, code_a: str, code_b: str, language: str = "python") -> Dict[str, Any]:
        """CodeCompare: Compare two code snippets or functions."""
        return await self.ai.compare_code(code_a, code_b, language)


comparison_service = ComparisonService()
