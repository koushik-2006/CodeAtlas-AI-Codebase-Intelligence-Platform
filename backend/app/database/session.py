import logging
from typing import Generator, Optional
from fastapi import HTTPException, status
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.database.base import Base

logger = logging.getLogger("uvicorn.error")

engine = None
SessionLocal = None


def get_engine():
    global engine
    if engine is None:
        db_url = settings.DATABASE_URL
        # Normalize dialect if necessary
        if db_url.startswith("postgresql://"):
            db_url = db_url.replace("postgresql://", "postgresql+psycopg://")
        elif db_url.startswith("postgresql+asyncpg://"):
            db_url = db_url.replace("postgresql+asyncpg://", "postgresql+psycopg://")

        connect_args = {}
        if "sqlite" in db_url:
            connect_args = {"check_same_thread": False}
        else:
            connect_args = {"connect_timeout": 3}

        try:
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                echo=False,
                connect_args=connect_args
            )
        except Exception as e:
            logger.error(f"[Database] Failed to create database engine: {e}")
            engine = None
    return engine


def get_session_factory():
    global SessionLocal
    if SessionLocal is None:
        eng = get_engine()
        if eng is not None:
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=eng)
    return SessionLocal


def get_db() -> Generator[Optional[Session], None, None]:
    """FastAPI request-scoped database session dependency."""
    if settings.DATABASE_TYPE != "postgres":
        yield None
        return

    factory = get_session_factory()
    if factory is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Please try again later."
        )

    db = factory()
    try:
        yield db
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as exc:
        db.rollback()
        logger.error(f"[Database] Session error occurred: {type(exc).__name__}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service is unavailable. Please try again later."
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def create_all_tables(bind_engine=None):
    """Utility to create tables for local development and testing."""
    target_engine = bind_engine or get_engine()
    if target_engine is not None:
        Base.metadata.create_all(bind=target_engine)
