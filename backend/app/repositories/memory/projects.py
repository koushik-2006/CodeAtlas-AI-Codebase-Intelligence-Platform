import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from app.repositories.interfaces import IProjectRepository, ISourceFileRepository, ISymbolRepository


class MemoryProjectRepository(IProjectRepository, ISourceFileRepository, ISymbolRepository):
    """Temporary in-memory project, file, and symbol repository."""

    def __init__(self):
        self._projects: Dict[str, Dict[str, Any]] = {}
        self._files: Dict[str, List[Dict[str, Any]]] = {}  # project_id -> list of file dicts
        self._symbols: Dict[str, List[Dict[str, Any]]] = {}  # project_id -> list of symbol dicts
        self._relationships: Dict[str, List[Dict[str, Any]]] = {}  # project_id -> list of rels

    async def get_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        return self._projects.get(project_id)

    async def get_by_full_name(self, full_name: str) -> Optional[Dict[str, Any]]:
        for proj in self._projects.values():
            if proj.get("full_name", "").lower() == full_name.lower():
                return proj
        return None

    async def list_by_owner(self, owner_id: str) -> List[Dict[str, Any]]:
        return [p for p in self._projects.values() if p.get("owner_id") == owner_id]

    async def save(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        proj_id = project_data.get("id") or str(uuid.uuid4())
        project_data["id"] = proj_id
        project_data["created_at"] = project_data.get("created_at") or datetime.utcnow()
        project_data["updated_at"] = datetime.utcnow()
        self._projects[proj_id] = project_data
        return project_data

    # File operations
    async def save_files(self, project_id: str, files: List[Dict[str, Any]]) -> None:
        self._files[project_id] = files

    async def list_files(self, project_id: str) -> List[Dict[str, Any]]:
        return self._files.get(project_id, [])

    async def get_file_content(self, project_id: str, path: str) -> Optional[Dict[str, Any]]:
        files = self._files.get(project_id, [])
        for f in files:
            if f.get("path") == path:
                return f
        return None

    # Symbol operations
    async def save_symbols(self, symbols: List[Dict[str, Any]]) -> None:
        for sym in symbols:
            proj_id = sym.get("project_id", "default")
            if proj_id not in self._symbols:
                self._symbols[proj_id] = []
            self._symbols[proj_id].append(sym)

    async def search_symbols(self, project_id: str, query: str) -> List[Dict[str, Any]]:
        q = query.lower()
        results = []
        for sym in self._symbols.get(project_id, []):
            name_str = (sym.get("name") or "").lower()
            doc_str = (sym.get("docstring") or "").lower()
            if q in name_str or q in doc_str:
                results.append(sym)
        return results

    async def get_file_symbols(self, project_id: str, path: str) -> List[Dict[str, Any]]:
        return [
            s for s in self._symbols.get(project_id, [])
            if s.get("file_path") == path
        ]

    # Relationships
    async def save_relationships(self, relationships: List[Dict[str, Any]]) -> None:
        for rel in relationships:
            proj_id = rel.get("project_id", "default")
            if proj_id not in self._relationships:
                self._relationships[proj_id] = []
            self._relationships[proj_id].append(rel)

    async def get_relationships(self, project_id: str) -> List[Dict[str, Any]]:
        return self._relationships.get(project_id, [])
