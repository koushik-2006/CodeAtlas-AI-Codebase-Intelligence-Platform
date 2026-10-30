from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.api.router import api_router
from app.utils.error_handlers import validation_exception_handler, generic_exception_handler

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered codebase intelligence platform backend",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.github\.io",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Include API v1 router
app.include_router(api_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to CodeAtlas",
        "docs_url": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
