from typing import Any, Dict, List
from app.parsers.language_registry import language_registry


class SymbolExtractor:
    """Extracts symbols and inter-symbol relationships from source files."""

    def __init__(self):
        self.registry = language_registry

    def extract_from_file(self, content: str, file_path: str, language: str) -> List[Dict[str, Any]]:
        parser = self.registry.get_parser_for_language(language)
        return parser.parse_symbols(content, file_path)

    def extract_imports(self, content: str, language: str) -> List[str]:
        parser = self.registry.get_parser_for_language(language)
        return parser.extract_dependencies(content)

    def detect_calls(self, content: str, known_symbols: List[str]) -> List[str]:
        """Detect mentions of known symbol names inside file content."""
        called: List[str] = []
        for sym_name in known_symbols:
            if f"{sym_name}(" in content or f".{sym_name}(" in content:
                called.append(sym_name)
        return list(set(called))
