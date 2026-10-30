from typing import Dict
from app.parsers.base import BaseParser
from app.parsers.tree_sitter_parser import UniversalCodeParser


class LanguageRegistry:
    def __init__(self):
        self._universal_parser = UniversalCodeParser()

    def get_parser_for_language(self, language: str) -> BaseParser:
        return self._universal_parser


language_registry = LanguageRegistry()
