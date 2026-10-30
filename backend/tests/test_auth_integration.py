import pytest

from datetime import datetime, timedelta, timezone

import jwt

from fastapi.testclient import TestClient

from sqlalchemy import create_engine

from sqlalchemy.orm import sessionmaker



from app.main import app

from app.config import settings

from app.database.base import Base

from app.models.user import User

from app.repositories.postgres.users import PostgresUserRepository

from app.security.passwords import hash_password, verify_password

from app.security.sessions import create_access_token





@pytest.fixture

def clean_client():

    """Unauthenticated client with no pre-attached credentials."""

    from app.dependencies import get_user_repo, get_account_repo
    from app.repositories.memory.users import MemoryUserRepository
    from app.repositories.memory.accounts import MemoryAccountRepository

    test_user_repo = MemoryUserRepository()
    test_account_repo = MemoryAccountRepository()
    app.dependency_overrides[get_user_repo] = lambda: test_user_repo
    app.dependency_overrides[get_account_repo] = lambda: test_account_repo
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()





def test_password_hashing():

    """Test password hashing complexity, rounds, and verification."""

    plain = "SuperSecretPassword123!"

    hashed = hash_password(plain)

    

    # Hash is non-empty, bcrypt prefixed, and not plaintext

    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")

    assert hashed != plain

    

    # Verify correctly

    assert verify_password(plain, hashed) is True

    assert verify_password("WrongPassword123!", hashed) is False

    assert verify_password("", hashed) is False

    assert verify_password(plain, None) is False





def test_successful_email_registration(clean_client):

    """Test registering a brand new user account."""

    payload = {

        "name": "Jane Developer",

        "email": "jane.developer@example.com",

        "password": "SecurePassword2026!"

    }

    resp = clean_client.post("/api/v1/auth/register", json=payload)

    assert resp.status_code == 201

    data = resp.json()

    assert data["success"] is True

    assert "user" in data

    assert data["user"]["email"] == "jane.developer@example.com"

    assert data["user"]["name"] == "Jane Developer"

    # Never expose password hash in response

    assert "hashed_password" not in data["user"]

    assert "access_token" in data

    

    # Check that HttpOnly cookie was set

    cookies = resp.cookies

    assert "codeatlas_session" in cookies





def test_duplicate_email_registration(clean_client):

    """Test registering with an email that is already registered."""

    payload = {

        "name": "Alex Mercer",

        "email": "alex.duplicate@example.com",

        "password": "FirstPassword123!"

    }

    resp1 = clean_client.post("/api/v1/auth/register", json=payload)

    assert resp1.status_code == 201



    # Second registration attempt with identical normalized email

    payload_dup = {

        "name": "Alex Mercer Two",

        "email": "ALEX.DUPLICATE@EXAMPLE.COM",

        "password": "AnotherPassword456!"

    }

    resp2 = clean_client.post("/api/v1/auth/register", json=payload_dup)

    assert resp2.status_code == 400

    data2 = resp2.json()

    assert "already exists" in data2["detail"]





def test_successful_email_login(clean_client):

    """Test logging in with valid email and password."""

    # Register user first

    reg_payload = {

        "name": "Login User",

        "email": "login.test@example.com",

        "password": "MyLoginPassword2026!"

    }

    reg_resp = clean_client.post("/api/v1/auth/register", json=reg_payload)

    assert reg_resp.status_code == 201



    # Log in

    login_payload = {

        "email": "LOGIN.TEST@EXAMPLE.COM",

        "password": "MyLoginPassword2026!"

    }

    login_resp = clean_client.post("/api/v1/auth/login", json=login_payload)

    assert login_resp.status_code == 200

    data = login_resp.json()

    assert data["success"] is True

    assert data["user"]["email"] == "login.test@example.com"

    assert "codeatlas_session" in login_resp.cookies





def test_incorrect_password_rejected(clean_client):

    """Test rejection when submitting an incorrect password."""

    reg_payload = {

        "name": "Auth User",

        "email": "auth.user@example.com",

        "password": "CorrectPassword123!"

    }

    clean_client.post("/api/v1/auth/register", json=reg_payload)



    login_resp = clean_client.post("/api/v1/auth/login", json={

        "email": "auth.user@example.com",

        "password": "WrongPassword999!"

    })

    assert login_resp.status_code == 401

    assert "Incorrect email or password" in login_resp.json()["detail"]





def test_protected_endpoint_without_session(clean_client):

    """Test that protected endpoints strictly return 401 Unauthorized without credentials."""

    resp = clean_client.get("/api/v1/auth/me")

    assert resp.status_code == 401

    assert "Authentication required" in resp.json()["detail"]





def test_protected_endpoint_with_valid_bearer_token(clean_client):

    """Test accessing protected endpoint using Bearer token header."""

    reg_payload = {

        "name": "Bearer User",

        "email": "bearer.user@example.com",

        "password": "BearerPassword123!"

    }

    reg_resp = clean_client.post("/api/v1/auth/register", json=reg_payload)

    token = reg_resp.json()["access_token"]



    resp = clean_client.get(

        "/api/v1/auth/me",

        headers={"Authorization": f"Bearer {token}"}

    )

    assert resp.status_code == 200

    assert resp.json()["email"] == "bearer.user@example.com"





def test_protected_endpoint_with_valid_cookie(clean_client):

    """Test accessing protected endpoint using HttpOnly cookie."""

    login_payload = {

        "name": "Cookie User",

        "email": "cookie.user@example.com",

        "password": "CookiePassword123!"

    }

    reg_resp = clean_client.post("/api/v1/auth/register", json=login_payload)

    # TestClient automatically retains cookies returned by register

    resp = clean_client.get("/api/v1/auth/me")

    assert resp.status_code == 200

    assert resp.json()["email"] == "cookie.user@example.com"





def test_expired_or_invalid_session_rejected(clean_client):

    """Test that expired or tamper-forged tokens return 401."""

    # 1. Invalid signature token

    invalid_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature"

    resp = clean_client.get(

        "/api/v1/auth/me",

        headers={"Authorization": f"Bearer {invalid_token}"}

    )

    assert resp.status_code == 401



    # 2. Expired token

    expired_payload = {

        "sub": "user-expired",

        "email": "expired@example.com",

        "exp": datetime.now(timezone.utc) - timedelta(hours=2)

    }

    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    resp_exp = clean_client.get(

        "/api/v1/auth/me",

        headers={"Authorization": f"Bearer {expired_token}"}

    )

    assert resp_exp.status_code == 401





def test_session_status_endpoint(clean_client):

    """Test GET /api/v1/auth/session provides clear unauthenticated and authenticated states."""

    # When unauthenticated

    resp_unauth = clean_client.get("/api/v1/auth/session")

    assert resp_unauth.status_code == 200

    data_unauth = resp_unauth.json()

    assert data_unauth["success"] is True

    assert data_unauth["isAuthenticated"] is False

    assert data_unauth["user"] is None



    # When authenticated

    clean_client.post("/api/v1/auth/register", json={

        "name": "Session Tester",

        "email": "session.tester@example.com",

        "password": "SessionPassword123!"

    })

    resp_auth = clean_client.get("/api/v1/auth/session")

    assert resp_auth.status_code == 200

    data_auth = resp_auth.json()

    assert data_auth["success"] is True

    assert data_auth["isAuthenticated"] is True

    assert data_auth["user"]["email"] == "session.tester@example.com"





def test_logout_clears_session_cookies(clean_client):

    """Test logout removes HttpOnly session cookie."""

    clean_client.post("/api/v1/auth/register", json={

        "name": "Logout Tester",

        "email": "logout.tester@example.com",

        "password": "LogoutPassword123!"

    })

    assert clean_client.get("/api/v1/auth/session").json()["isAuthenticated"] is True



    # Logout

    logout_resp = clean_client.post("/api/v1/auth/logout")

    assert logout_resp.status_code == 200



    # Verify session is gone

    after_resp = clean_client.get("/api/v1/auth/session")

    assert after_resp.json()["isAuthenticated"] is False





def test_postgres_user_repository_crud():

    """Test PostgresUserRepository with SQLAlchemy SQLite engine in-memory."""

    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

    Base.metadata.create_all(bind=engine)

    TestingSession = sessionmaker(bind=engine)

    db = TestingSession()



    try:

        repo = PostgresUserRepository(db)

        # Create

        user_data = {

            "email": "postgres.test@example.com",

            "name": "Postgres User",

            "hashed_password": hash_password("PostgresPass123!"),

            "is_active": True

        }

        import asyncio

        created = asyncio.run(repo.create(user_data))

        assert created["id"] is not None

        assert created["email"] == "postgres.test@example.com"

        assert created["hashed_password"] is not None



        # Lookup by email

        fetched = asyncio.run(repo.get_by_email("postgres.test@example.com"))

        assert fetched is not None

        assert fetched["id"] == created["id"]



        # Lookup by ID

        fetched_id = asyncio.run(repo.get_by_id(created["id"]))

        assert fetched_id is not None

        assert fetched_id["email"] == "postgres.test@example.com"



        # Update

        updated = asyncio.run(repo.update(created["id"], {"name": "Updated Name"}))

        assert updated["name"] == "Updated Name"

    finally:

        db.close()


def test_nextjs_github_session_cookie_compatibility(clean_client):
    """Test that Next.js issued GitHub user ID session cookie is recognized by backend /session and /me."""
    clean_client.cookies.set("codeatlas_session", "usr_gh_98765432")

    session_resp = clean_client.get("/api/v1/auth/session")
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    assert session_data["success"] is True
    assert session_data["isAuthenticated"] is True
    import uuid
    expected_ids = {"usr_gh_98765432", str(uuid.uuid5(uuid.NAMESPACE_DNS, "usr_gh_98765432"))}
    assert session_data["user"]["id"] in expected_ids
    assert session_data["user"]["is_active"] is True

    # Check protected /me endpoint
    me_resp = clean_client.get("/api/v1/auth/me")
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["id"] in expected_ids
    assert me_data["is_active"] is True


def test_github_login_initiation(clean_client):
    """Test that /api/v1/auth/github/login returns valid authorization URL with client ID and CSRF state."""
    resp = clean_client.get("/api/v1/auth/github/login")
    assert resp.status_code == 200
    data = resp.json()
    assert "authorization_url" in data
    assert "github.com/login/oauth/authorize" in data["authorization_url"]
    assert "state" in data





def test_cors_preflight_headers(clean_client):

    """Test CORS preflight response headers for frontend origins."""

    headers = {

        "Origin": "http://localhost:3000",

        "Access-Control-Request-Method": "POST",

        "Access-Control-Request-Headers": "content-type,x-request-id",

    }

    resp = clean_client.options("/api/v1/auth/login", headers=headers)

    assert resp.status_code == 200

    assert resp.headers.get("access-control-allow-origin") == "http://localhost:3000"

    assert resp.headers.get("access-control-allow-credentials") == "true"





def test_unknown_email_rejected(clean_client):

    """Test login rejection when submitting an unknown email address."""

    login_resp = clean_client.post("/api/v1/auth/login", json={

        "email": "completely.unknown@example.com",

        "password": "AnyPassword123!"

    })

    assert login_resp.status_code == 401

    assert "Incorrect email or password" in login_resp.json()["detail"]





def test_database_error_handling(monkeypatch):

    """Test that a database connection error safely returns 503 without leaking credentials or internal stack traces."""

    from app.dependencies import get_user_repo

    from fastapi import HTTPException
    monkeypatch.setattr(settings, "DATABASE_TYPE", "postgres")

    

    with pytest.raises(HTTPException) as excinfo:

        get_user_repo(db=None)

    assert excinfo.value.status_code == 503

    assert "Database service is unavailable" in excinfo.value.detail





def test_current_user_profile_returns_full_user_data(clean_client):

    """Test current user profile endpoint returns user ID, name, email without password hash."""

    reg_payload = {

        "name": "Arun Kumar",

        "email": "arun.kumar@example.com",

        "password": "ArunPassword2026!"

    }

    reg_resp = clean_client.post("/api/v1/auth/register", json=reg_payload)

    assert reg_resp.status_code == 201

    user_id = reg_resp.json()["user"]["id"]

    token = reg_resp.json()["access_token"]



    me_resp = clean_client.get(

        "/api/v1/auth/me",

        headers={"Authorization": f"Bearer {token}"}

    )

    assert me_resp.status_code == 200

    me_data = me_resp.json()

    assert me_data["id"] == user_id

    assert me_data["name"] == "Arun Kumar"

    assert me_data["email"] == "arun.kumar@example.com"

    assert "hashed_password" not in me_data

    assert "password" not in me_data





def test_duplicate_email_postgres_repository(monkeypatch):

    """Test that PostgresUserRepository raises HTTP 400 on duplicate email insertion."""

    import asyncio

    from fastapi import HTTPException
    monkeypatch.setattr(settings, "DATABASE_TYPE", "postgres")

    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

    Base.metadata.create_all(bind=engine)

    TestingSession = sessionmaker(bind=engine)

    db = TestingSession()



    try:

        repo = PostgresUserRepository(db)

        user_data1 = {

            "email": "dup.test@example.com",

            "name": "User One",

            "hashed_password": hash_password("Password123!"),

            "is_active": True

        }

        asyncio.run(repo.create(user_data1))



        # Attempt to insert same email

        user_data2 = {

            "email": "DUP.TEST@EXAMPLE.COM",

            "name": "User Two",

            "hashed_password": hash_password("Password456!"),

            "is_active": True

        }

        with pytest.raises(HTTPException) as excinfo:

            asyncio.run(repo.create(user_data2))

        assert excinfo.value.status_code == 400

        assert "already exists" in excinfo.value.detail

    finally:

        db.close()


def test_nextjs_github_session_cookie_compatibility(clean_client):
    """Test that Next.js issued GitHub user ID session cookie is recognized by backend /session and /me."""
    clean_client.cookies.set("codeatlas_session", "usr_gh_98765432")

    session_resp = clean_client.get("/api/v1/auth/session")
    assert session_resp.status_code == 200
    session_data = session_resp.json()
    assert session_data["success"] is True
    assert session_data["isAuthenticated"] is True
    import uuid
    expected_ids = {"usr_gh_98765432", str(uuid.uuid5(uuid.NAMESPACE_DNS, "usr_gh_98765432"))}
    assert session_data["user"]["id"] in expected_ids
    assert session_data["user"]["is_active"] is True

    # Check protected /me endpoint
    me_resp = clean_client.get("/api/v1/auth/me")
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["id"] in expected_ids
    assert me_data["is_active"] is True


def test_github_login_initiation(clean_client):
    """Test that /api/v1/auth/github/login returns valid authorization URL with client ID and CSRF state."""
    resp = clean_client.get("/api/v1/auth/github/login")
    assert resp.status_code == 200
    data = resp.json()
    assert "authorization_url" in data
    assert "github.com/login/oauth/authorize" in data["authorization_url"]
    assert "state" in data

