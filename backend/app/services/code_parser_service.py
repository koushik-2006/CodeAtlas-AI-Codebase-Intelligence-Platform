from typing import Any, Dict, List
from app.parsers.symbol_extractor import SymbolExtractor


class CodeParserService:
    def __init__(self):
        self.extractor = SymbolExtractor()

    def parse_file(self, content: str, file_path: str, language: str) -> List[Dict[str, Any]]:
        return self.extractor.extract_from_file(content, file_path, language)

    def extract_dependencies(self, content: str, language: str) -> List[str]:
        return self.extractor.extract_imports(content, language)


code_parser_service = CodeParserService()
