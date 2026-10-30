from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.github import router as github_router
from app.api.v1.repositories import router as repositories_router
from app.api.v1.code_explorer import router as code_explorer_router
from app.api.v1.visual_explorer import router as visual_explorer_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.search import router as search_router
from app.api.v1.architecture import router as architecture_router
from app.api.v1.impact_analysis import router as impact_router
from app.api.v1.debugging import router as debugging_router
from app.api.v1.tests_analysis import router as tests_router
from app.api.v1.comparisons import router as comparisons_router
from app.api.v1.learning import router as learning_router
from app.api.v1.history import router as history_router

api_router = APIRouter(prefix="/api/v1")

# Mount all endpoint routers
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(github_router)
api_router.include_router(repositories_router)
api_router.include_router(code_explorer_router)
api_router.include_router(visual_explorer_router)
api_router.include_router(assistant_router)
api_router.include_router(search_router)
api_router.include_router(architecture_router)
api_router.include_router(impact_router)
api_router.include_router(debugging_router)
api_router.include_router(tests_router)
api_router.include_router(comparisons_router)
api_router.include_router(learning_router)
api_router.include_router(history_router)
