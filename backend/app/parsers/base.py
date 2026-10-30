from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseParser(ABC):
    @abstractmethod
    def parse_symbols(self, code: str, file_path: str = "") -> List[Dict[str, Any]]:
        """Parse source code and return list of extracted symbols."""
        pass

    @abstractmethod
    def extract_dependencies(self, code: str) -> List[str]:
        """Extract imported module/package names."""
        pass
