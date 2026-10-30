from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.repositories.interfaces import IProjectRepository, ISourceFileRepository, ISymbolRepository
from app.models.repository import Repository
from app.models.repository_index import RepositoryIndex
from app.models.source_file import SourceFile
from app.models.code_symbol import CodeSymbol
from app.models.code_relationship import CodeRelationship


class PostgresProjectRepository(IProjectRepository, ISourceFileRepository, ISymbolRepository):
    """PostgreSQL implementation of IProjectRepository, ISourceFileRepository, ISymbolRepository."""

    def __init__(self, db: Session):
        self.db = db

    def _to_repo_dict(self, p: Repository) -> Dict[str, Any]:
        return {
            "id": str(p.id),
            "owner_id": str(p.user_id),
            "user_id": str(p.user_id),
            "github_id": p.github_repository_id,
            "github_repository_id": p.github_repository_id,
            "name": p.name,
            "full_name": p.full_name,
            "owner": p.owner,
            "is_private": p.is_private,
            "default_branch": p.default_branch,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }

    async def get_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        p = self.db.query(Repository).filter(Repository.id == str(project_id)).first()
        if not p:
            return None
        return self._to_repo_dict(p)

    async def get_by_full_name(self, full_name: str) -> Optional[Dict[str, Any]]:
        p = self.db.query(Repository).filter(Repository.full_name.ilike(full_name)).first()
        if not p:
            return None
        return self._to_repo_dict(p)

    async def list_by_owner(self, owner_id: str) -> List[Dict[str, Any]]:
        projects = self.db.query(Repository).filter(Repository.user_id == str(owner_id)).all()
        return [self._to_repo_dict(p) for p in projects]

    async def save(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(project_data.get("user_id") or project_data.get("owner_id"))
        p = self.db.query(Repository).filter(Repository.full_name.ilike(project_data["full_name"])).first()

        if p:
            p.name = project_data["name"]
            p.owner = project_data.get("owner", p.owner)
            p.default_branch = project_data.get("default_branch", p.default_branch)
            p.is_private = project_data.get("is_private", p.is_private)
        else:
            p = Repository(
                id=project_data.get("id"),
                user_id=user_id,
                github_repository_id=project_data.get("github_id") or project_data.get("github_repository_id"),
                name=project_data["name"],
                full_name=project_data["full_name"],
                owner=project_data.get("owner", project_data.get("owner_name", "user")),
                default_branch=project_data.get("default_branch", "main"),
                is_private=project_data.get("is_private", False),
            )
            self.db.add(p)

        self.db.commit()
        self.db.refresh(p)
        return self._to_repo_dict(p)

    # Source files operations
    def _get_or_create_index(self, project_id: str) -> RepositoryIndex:
        idx = self.db.query(RepositoryIndex).filter(RepositoryIndex.repository_id == str(project_id)).first()
        if not idx:
            idx = RepositoryIndex(repository_id=str(project_id), status="completed")
            self.db.add(idx)
            self.db.commit()
            self.db.refresh(idx)
        return idx

    async def save_files(self, project_id: str, files: List[Dict[str, Any]]) -> None:
        idx = self._get_or_create_index(project_id)
        for f in files:
            sf = self.db.query(SourceFile).filter(
                SourceFile.repository_index_id == idx.id,
                SourceFile.path == f["path"]
            ).first()
            if sf:
                sf.content = f.get("content", sf.content)
                sf.size_bytes = f.get("size", sf.size_bytes)
            else:
                sf = SourceFile(
                    repository_index_id=idx.id,
                    path=f["path"],
                    language=f.get("language", "text"),
                    content=f.get("content", ""),
                    size_bytes=f.get("size", 0)
                )
                self.db.add(sf)
        self.db.commit()

    async def list_files(self, project_id: str) -> List[Dict[str, Any]]:
        idx = self.db.query(RepositoryIndex).filter(RepositoryIndex.repository_id == str(project_id)).first()
        if not idx:
            return []
        records = self.db.query(SourceFile).filter(SourceFile.repository_index_id == idx.id).all()
        return [
            {
                "path": r.path,
                "name": r.path.split("/")[-1],
                "language": r.language,
                "size": r.size_bytes,
                "content": r.content
            }
            for r in records
        ]

    async def get_file_content(self, project_id: str, path: str) -> Optional[Dict[str, Any]]:
        idx = self.db.query(RepositoryIndex).filter(RepositoryIndex.repository_id == str(project_id)).first()
        if not idx:
            return None
        r = self.db.query(SourceFile).filter(
            SourceFile.repository_index_id == idx.id,
            SourceFile.path == path
        ).first()
        if not r:
            return None
        return {
            "path": r.path,
            "name": r.path.split("/")[-1],
            "language": r.language,
            "size": r.size_bytes,
            "content": r.content
        }

    # Symbols operations
    async def save_symbols(self, symbols: List[Dict[str, Any]]) -> None:
        for s in symbols:
            # find source file
            file_path = s.get("file_path", "")
            sf = self.db.query(SourceFile).filter(SourceFile.path == file_path).first()
            sf_id = sf.id if sf else str(s.get("source_file_id", "00000000-0000-0000-0000-000000000000"))

            sym = CodeSymbol(
                source_file_id=sf_id,
                name=s["name"],
                qualified_name=s.get("signature", s["name"]),
                symbol_type=s.get("symbol_type", "function"),
                start_line=s["start_line"],
                end_line=s["end_line"],
                signature=s.get("signature")
            )
            self.db.add(sym)
        self.db.commit()

    async def search_symbols(self, project_id: str, query: str) -> List[Dict[str, Any]]:
        q = f"%{query}%"
        symbols = self.db.query(CodeSymbol).filter(CodeSymbol.name.ilike(q)).all()
        return [
            {
                "name": s.name,
                "symbol_type": s.symbol_type,
                "start_line": s.start_line,
                "end_line": s.end_line,
                "signature": s.signature,
                "docstring": s.signature,
                "file_path": s.source_file.path if s.source_file else ""
            }
            for s in symbols
        ]

    async def get_file_symbols(self, project_id: str, path: str) -> List[Dict[str, Any]]:
        sf = self.db.query(SourceFile).filter(SourceFile.path == path).first()
        if not sf:
            return []
        return [
            {
                "name": s.name,
                "symbol_type": s.symbol_type,
                "start_line": s.start_line,
                "end_line": s.end_line,
                "signature": s.signature,
                "file_path": path
            }
            for s in sf.symbols
        ]

    async def save_relationships(self, relationships: List[Dict[str, Any]]) -> None:
        pass

    async def get_relationships(self, project_id: str) -> List[Dict[str, Any]]:
        return []
