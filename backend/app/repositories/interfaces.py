from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime


class IUserRepository(ABC):
    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def update(self, user_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        pass


class IAccountRepository(ABC):
    @abstractmethod
    async def get_by_provider_account_id(self, provider: str, account_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_by_user_id(self, user_id: str, provider: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def save_account(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def delete_by_user_id(self, user_id: str, provider: str) -> bool:
        pass


class IProjectRepository(ABC):
    @abstractmethod
    async def get_by_id(self, project_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_by_full_name(self, full_name: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def list_by_owner(self, owner_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def save(self, project_data: Dict[str, Any]) -> Dict[str, Any]:
        pass


class IIndexRepository(ABC):
    @abstractmethod
    async def get_status(self, project_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def save_status(self, index_data: Dict[str, Any]) -> Dict[str, Any]:
        pass


class ISourceFileRepository(ABC):
    @abstractmethod
    async def save_files(self, project_id: str, files: List[Dict[str, Any]]) -> None:
        pass

    @abstractmethod
    async def list_files(self, project_id: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_file_content(self, project_id: str, path: str) -> Optional[Dict[str, Any]]:
        pass


class ISymbolRepository(ABC):
    @abstractmethod
    async def save_symbols(self, symbols: List[Dict[str, Any]]) -> None:
        pass

    @abstractmethod
    async def search_symbols(self, project_id: str, query: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_file_symbols(self, project_id: str, path: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def save_relationships(self, relationships: List[Dict[str, Any]]) -> None:
        pass

    @abstractmethod
    async def get_relationships(self, project_id: str) -> List[Dict[str, Any]]:
        pass


class IHistoryRepository(ABC):
    @abstractmethod
    async def save_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def list_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def delete(self, analysis_id: str, user_id: str) -> bool:
        pass
