from typing import Any, Dict
from app.integrations.ai.provider import get_ai_provider
from app.utils.language_detection import detect_language_from_code


class CodeExplanationService:
    def __init__(self):
        self.ai_provider = get_ai_provider()

    async def explain_code(self, code: str, language: str = None, level: str = "developer") -> Dict[str, Any]:
        if not language:
            language = detect_language_from_code(code)

        result = await self.ai_provider.explain_code(code, language, level)
        return result


code_explanation_service = CodeExplanationService()
