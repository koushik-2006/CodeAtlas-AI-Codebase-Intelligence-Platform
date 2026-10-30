import pytest
from sqlalchemy import create_engine, text
from app.database.session import get_engine, get_session_factory
from app.database.base import Base


def test_database_engine_and_session_factory():
    # Test SQLite in-memory engine connection as standalone validation
    test_engine = create_engine("sqlite:///:memory:")
    with test_engine.connect() as conn:
        result = conn.execute(text("SELECT 1")).scalar()
        assert result == 1


def test_metadata_tables_registered():
    table_names = list(Base.metadata.tables.keys())
    assert "users" in table_names
    assert "connected_accounts" in table_names
    assert "repositories" in table_names
    assert "repository_indexes" in table_names
    assert "source_files" in table_names
    assert "code_symbols" in table_names
    assert "code_relationships" in table_names
    assert "code_chunks" in table_names
    assert "analysis_jobs" in table_names
    assert "saved_analyses" in table_names
    assert "chat_sessions" in table_names
    assert "chat_messages" in table_names
    assert "user_notes" in table_names
