from typing import Optional, Generator
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import settings
from app.security.sessions import decode_access_token

# In-memory singletons for Phase A
from app.repositories.memory.users import MemoryUserRepository
from app.repositories.memory.accounts import MemoryAccountRepository
from app.repositories.memory.projects import MemoryProjectRepository
from app.repositories.memory.indexes import MemoryIndexRepository
from app.repositories.memory.history import MemoryHistoryRepository

# Services
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.services.github_service import GitHubService
from app.services.repository_service import RepositoryService
from app.services.indexing_service import IndexingService
from app.services.symbol_service import SymbolService
from app.services.snippet_matching_service import SnippetMatchingService
from app.services.graph_service import GraphService
from app.services.retrieval_service import RetrievalService
from app.services.search_service import SearchService
from app.services.assistant_service import AssistantService
from app.services.debugging_service import DebuggingService
from app.services.impact_service import ImpactService
from app.services.test_discovery_service import TestDiscoveryService
from app.services.learning_service import LearningService
from app.services.history_service import HistoryService

security = HTTPBearer(auto_error=False)

# Phase A Global In-Memory Singletons
_memory_user_repo = MemoryUserRepository()
_memory_account_repo = MemoryAccountRepository()
_memory_project_repo = MemoryProjectRepository()
_memory_index_repo = MemoryIndexRepository()
_memory_history_repo = MemoryHistoryRepository()


from app.database.session import get_db
from app.repositories.postgres.users import PostgresUserRepository
from app.repositories.postgres.accounts import PostgresAccountRepository
from app.repositories.postgres.projects import PostgresProjectRepository
from app.repositories.postgres.indexes import PostgresIndexRepository
from app.repositories.postgres.history import PostgresHistoryRepository


def get_user_repo(db=Depends(get_db)):
    if settings.DATABASE_TYPE == "postgres":
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable. Please try again later."
            )
        return PostgresUserRepository(db)
    return _memory_user_repo


def get_account_repo(db=Depends(get_db)):
    if settings.DATABASE_TYPE == "postgres":
        if db is None:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database service is unavailable. Please try again later."
            )
        return PostgresAccountRepository(db)
    return _memory_account_repo


def get_project_repo(db=Depends(get_db)):
    if settings.DATABASE_TYPE == "postgres" and db is not None:
        return PostgresProjectRepository(db)
    return _memory_project_repo


def get_source_repo(db=Depends(get_db)):
    if settings.DATABASE_TYPE == "postgres" and db is not None:
        return PostgresProjectRepository(db)
    return _memory_project_repo


def get_symbol_repo(db=Depends(get_db)):
    if settings.DATABASE_TYPE == "postgres" and db is not None:
        return PostgresProjectRepository(db)
    return _memory_project_repo


def get_index_repo(db=Depends(get_db)):
    if settings.DATABASE_TYPE == "postgres" and db is not None:
        return PostgresIndexRepository(db)
    return _memory_index_repo


def get_history_repo(db=Depends(get_db)):
    if settings.DATABASE_TYPE == "postgres" and db is not None:
        return PostgresHistoryRepository(db)
    return _memory_history_repo


# Service dependencies
def get_auth_service(
    user_repo=Depends(get_user_repo),
    account_repo=Depends(get_account_repo)
) -> AuthService:
    return AuthService(user_repo, account_repo)


def get_user_service(
    user_repo=Depends(get_user_repo),
    account_repo=Depends(get_account_repo)
) -> UserService:
    return UserService(user_repo, account_repo)


def get_github_service(
    account_repo=Depends(get_account_repo)
) -> GitHubService:
    return GitHubService(account_repo)


def get_repository_service(
    project_repo=Depends(get_project_repo),
    source_repo=Depends(get_source_repo),
    index_repo=Depends(get_index_repo),
    github_service=Depends(get_github_service)
) -> RepositoryService:
    return RepositoryService(project_repo, source_repo, index_repo, github_service)


def get_indexing_service(
    index_repo=Depends(get_index_repo),
    source_repo=Depends(get_source_repo),
    symbol_repo=Depends(get_symbol_repo),
    repo_service=Depends(get_repository_service)
) -> IndexingService:
    return IndexingService(index_repo, source_repo, symbol_repo, repo_service)


def get_symbol_service(
    symbol_repo=Depends(get_symbol_repo)
) -> SymbolService:
    return SymbolService(symbol_repo)


def get_snippet_matcher(
    source_repo=Depends(get_source_repo),
    symbol_repo=Depends(get_symbol_repo)
) -> SnippetMatchingService:
    return SnippetMatchingService(source_repo, symbol_repo)


def get_graph_service(
    symbol_repo=Depends(get_symbol_repo),
    source_repo=Depends(get_source_repo),
    snippet_matcher=Depends(get_snippet_matcher)
) -> GraphService:
    return GraphService(symbol_repo, source_repo, snippet_matcher)


def get_retrieval_service(
    source_repo=Depends(get_source_repo),
    symbol_repo=Depends(get_symbol_repo)
) -> RetrievalService:
    return RetrievalService(source_repo, symbol_repo)


def get_search_service(
    source_repo=Depends(get_source_repo),
    symbol_repo=Depends(get_symbol_repo)
) -> SearchService:
    return SearchService(source_repo, symbol_repo)


def get_assistant_service(
    retrieval_service=Depends(get_retrieval_service)
) -> AssistantService:
    return AssistantService(retrieval_service)


def get_debugging_service(
    retrieval_service=Depends(get_retrieval_service)
) -> DebuggingService:
    return DebuggingService(retrieval_service)


def get_impact_service(
    symbol_repo=Depends(get_symbol_repo),
    source_repo=Depends(get_source_repo)
) -> ImpactService:
    return ImpactService(symbol_repo, source_repo)


def get_test_discovery_service(
    source_repo=Depends(get_source_repo),
    symbol_repo=Depends(get_symbol_repo)
) -> TestDiscoveryService:
    return TestDiscoveryService(source_repo, symbol_repo)


def get_learning_service(
    source_repo=Depends(get_source_repo)
) -> LearningService:
    return LearningService(source_repo)


def get_history_service(
    history_repo=Depends(get_history_repo)
) -> HistoryService:
    return HistoryService(history_repo)


async def get_optional_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    user_repo=Depends(get_user_repo)
) -> Optional[dict]:
    """Retrieve the current user if authenticated, without raising an exception if unauthenticated."""
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    elif request and request.cookies:
        token = request.cookies.get("codeatlas_session") or request.cookies.get("access_token")

    if not token:
        return None

    # 1. Attempt standard JWT decoding
    payload = decode_access_token(token)
    if payload and "sub" in payload:
        user = await user_repo.get_by_id(payload["sub"])
        if not user and payload.get("email"):
            # Auto-provision user from verified JWT claims
            user = await user_repo.create({
                "id": payload["sub"],
                "email": payload["email"],
                "name": payload.get("name") or payload["email"].split("@")[0],
                "display_name": payload.get("name") or payload["email"].split("@")[0],
                "avatar_url": payload.get("avatar_url") or payload.get("picture"),
                "is_active": True,
            })
        if user and user.get("is_active", True):
            return user

    # 2. Multi-tier fallback for Next.js session cookie or direct user ID (usr_*)
    if token.startswith("usr_"):
        user = await user_repo.get_by_id(token)
        if not user:
            clean_name = token.replace("usr_gh_", "GitHub ").replace("usr_g_", "Google ").replace("usr_", "").replace("_", " ").title()
            user = await user_repo.create({
                "id": token,
                "email": f"{token}@codeatlas.local",
                "name": clean_name,
                "display_name": clean_name,
                "is_active": True,
            })
        if user and user.get("is_active", True):
            return user

    return None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    user_repo=Depends(get_user_repo)
) -> dict:
    """Enforce authentication on protected endpoints via Bearer token or HttpOnly cookie."""
    user = await get_optional_current_user(request, credentials, user_repo)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated."
        )

    return user
