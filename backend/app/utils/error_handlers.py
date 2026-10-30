import logging
from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger("uvicorn.error")


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format Pydantic validation errors consistently."""
    errors = exc.errors()
    first_error = errors[0] if errors else {}
    msg = first_error.get("msg", "Invalid request parameter")
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "detail": msg,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": msg,
                "field": field
            }
        }
    )


async def generic_exception_handler(request: Request, exc: Exception):
    """Format unhandled server exceptions cleanly without exposing secrets."""
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "detail": exc.detail,
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail
                }
            }
        )

    logger.error(f"[Server Error]: {type(exc).__name__}: {exc}")

    if isinstance(exc, SQLAlchemyError) or "database" in str(type(exc)).lower() or "psycopg" in str(type(exc)).lower():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "success": False,
                "detail": "Database service is unavailable. Please try again later.",
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "Database service is unavailable. Please try again later."
                }
            }
        )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "detail": "An unexpected server error occurred. Please try again later.",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later."
            }
        }
    )
