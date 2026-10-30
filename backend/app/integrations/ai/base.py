from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class BaseAIProvider(ABC):
    @abstractmethod
    async def explain_code(self, code: str, language: str, level: str) -> Dict[str, Any]:
        """Explain code line by line with summary, complexity, and potential risks."""
        pass

    @abstractmethod
    async def answer_question(self, query: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Answer codebase questions using retrieved source code chunks."""
        pass

    @abstractmethod
    async def compare_code(self, code_a: str, code_b: str, language: str) -> Dict[str, Any]:
        """Compare two code versions, highlighting logic differences, breaking changes, and performance."""
        pass

    @abstractmethod
    async def analyze_error(self, error_message: str, stack_trace: Optional[str], context_files: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze debugging logs, identify root cause, and suggest fixes."""
        pass
