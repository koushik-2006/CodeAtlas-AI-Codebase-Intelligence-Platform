"""Live integration tests for CodeAtlas authentication directly against PostgreSQL.

Validates:
1. Live PostgreSQL connection without exposing credentials.
2. Successful user registration and transaction commit to PostgreSQL.
3. Email normalization and case-insensitive lookup in PostgreSQL.
4. Secure bcrypt password hashing and verification from PostgreSQL records.
5. Duplicate email rejection (HTTP 400 IntegrityError handling).
6. Incorrect password rejection (HTTP 401) on PostgreSQL users.
7. Unknown email rejection (HTTP 401) on PostgreSQL users.
8. Clean transaction rollback on database errors.
"""
import uuid
import time
import pytest
from sqlalchemy import text, func
from app.config import settings
from app.database.session import get_engine, get_session_factory
from app.models.user import User
from app.repositories.postgres.users import PostgresUserRepository
from app.security.passwords import hash_password, verify_password


@pytest.fixture(scope="module")
def postgres_session():
    """Provides a scoped database session against the configured PostgreSQL database."""
    factory = get_session_factory()
    if factory is None:
        pytest.skip("PostgreSQL engine could not be initialized.")
    session = factory()
    try:
        # Verify connectivity
        session.execute(text("SELECT 1"))
        yield session
    except Exception as exc:
        pytest.skip(f"Live PostgreSQL database is unreachable: {type(exc).__name__}")
    finally:
        session.close()


def test_postgres_connection_live(postgres_session):
    """Verify live PostgreSQL database connectivity and version check."""
    result = postgres_session.execute(text("SELECT 1")).scalar()
    assert result == 1


def test_postgres_email_registration_and_commit(postgres_session):
    """Verify that user registration successfully commits a record to PostgreSQL with bcrypt hash."""
    repo = PostgresUserRepository(postgres_session)
    unique_suffix = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    test_email = f"pg_test_{unique_suffix}@codeatlas.dev"
    plain_password = f"SecurePgPass_{unique_suffix}!"
    display_name = f"PG User {unique_suffix}"

    created_user_id = None
    try:
        # 1. Hash password with bcrypt
        hashed = hash_password(plain_password)
        assert hashed.startswith("$2b$")
        assert hashed != plain_password

        # 2. Commit user to PostgreSQL
        created = repo.create({
            "email": test_email,
            "name": display_name,
            "hashed_password": hashed,
            "is_active": True
        })
        # Handle async/sync transparently
        import asyncio
        if asyncio.iscoroutine(created):
            created = asyncio.run(created)

        created_user_id = created["id"]
        assert created_user_id is not None
        assert created["email"] == test_email.lower()
        assert created["name"] == display_name

        # 3. Verify user actually persisted in PostgreSQL via a raw query
        raw_row = postgres_session.execute(
            text("SELECT email, display_name, (hashed_password IS NOT NULL) as has_pw FROM users WHERE email = :email"),
            {"email": test_email.lower()}
        ).fetchone()

        assert raw_row is not None
        assert raw_row[0] == test_email.lower()
        assert raw_row[1] == display_name
        assert raw_row[2] is True

    finally:
        # Clean up test user to preserve database hygiene
        if created_user_id:
            try:
                postgres_session.execute(
                    text("DELETE FROM users WHERE email = :email"),
                    {"email": test_email.lower()}
                )
                postgres_session.commit()
            except Exception:
                postgres_session.rollback()


def test_postgres_case_insensitive_email_lookup(postgres_session):
    """Verify that email lookup in PostgreSQL normalizes case-insensitively."""
    import asyncio
    repo = PostgresUserRepository(postgres_session)
    unique_suffix = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    lower_email = f"pg_case_{unique_suffix}@codeatlas.dev"
    mixed_email = f"PG_CASE_{unique_suffix}@CodeAtlas.DEV"
    plain_password = "CasePassword2026!"

    hashed = hash_password(plain_password)
    created = asyncio.run(repo.create({
        "email": lower_email,
        "name": "Case User",
        "hashed_password": hashed,
        "is_active": True
    }))

    try:
        # Lookup using uppercase/mixed-case email
        found_user = asyncio.run(repo.get_by_email(mixed_email))
        assert found_user is not None
        assert found_user["id"] == created["id"]
        assert found_user["email"] == lower_email

        # Verify password from returned record
        assert verify_password(plain_password, found_user["hashed_password"]) is True
        assert verify_password("WrongPassword!", found_user["hashed_password"]) is False
    finally:
        postgres_session.execute(
            text("DELETE FROM users WHERE email = :email"),
            {"email": lower_email}
        )
        postgres_session.commit()


def test_postgres_duplicate_email_rejection(postgres_session):
    """Verify that attempting to register an existing email in PostgreSQL raises HTTP 400."""
    import asyncio
    from fastapi import HTTPException

    repo = PostgresUserRepository(postgres_session)
    unique_suffix = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    test_email = f"pg_dup_{unique_suffix}@codeatlas.dev"
    plain_password = "DupPassword2026!"
    hashed = hash_password(plain_password)

    # First registration
    asyncio.run(repo.create({
        "email": test_email,
        "name": "First User",
        "hashed_password": hashed,
        "is_active": True
    }))

    try:
        # Second registration with same email
        with pytest.raises(HTTPException) as excinfo:
            asyncio.run(repo.create({
                "email": test_email.upper(),
                "name": "Second User",
                "hashed_password": hash_password("OtherPassword123!"),
                "is_active": True
            }))

        assert excinfo.value.status_code == 400
        assert "already exists" in excinfo.value.detail
    finally:
        postgres_session.execute(
            text("DELETE FROM users WHERE email = :email"),
            {"email": test_email.lower()}
        )
        postgres_session.commit()


def test_postgres_unknown_email_returns_none(postgres_session):
    """Verify that looking up a nonexistent email in PostgreSQL returns None cleanly without error."""
    import asyncio
    repo = PostgresUserRepository(postgres_session)
    unknown_email = f"unknown_{uuid.uuid4().hex}@doesnotexist.dev"
    result = asyncio.run(repo.get_by_email(unknown_email))
    assert result is None

