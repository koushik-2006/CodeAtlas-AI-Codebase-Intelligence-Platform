import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base import Base

from app.repositories.postgres.users import PostgresUserRepository
from app.repositories.postgres.accounts import PostgresAccountRepository
from app.repositories.postgres.projects import PostgresProjectRepository
from app.repositories.postgres.indexes import PostgresIndexRepository
from app.repositories.postgres.history import PostgresHistoryRepository


@pytest.fixture
def db():
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


@pytest.mark.asyncio
async def test_postgres_user_repository(db):
    user_repo = PostgresUserRepository(db)

    # 1. Create
    user = await user_repo.create({
        "email": "postgres_dev@codeatlas.local",
        "name": "Postgres Developer"
    })
    assert user["id"] is not None
    assert user["email"] == "postgres_dev@codeatlas.local"

    # 2. Get by email
    found = await user_repo.get_by_email("postgres_dev@codeatlas.local")
    assert found is not None
    assert found["id"] == user["id"]

    # 3. Update
    updated = await user_repo.update(user["id"], {"name": "Senior Postgres Dev"})
    assert updated["name"] == "Senior Postgres Dev"


@pytest.mark.asyncio
async def test_postgres_account_repository(db):
    user_repo = PostgresUserRepository(db)
    user = await user_repo.create({"email": "account_test@codeatlas.local", "name": "Account Tester"})

    account_repo = PostgresAccountRepository(db)
    account = await account_repo.save_account({
        "user_id": user["id"],
        "provider": "github",
        "provider_account_id": "999888",
        "username": "octocat",
        "access_token_encrypted": "encrypted_token_secret"
    })
    assert account["id"] is not None

    found = await account_repo.get_by_user_id(user["id"], "github")
    assert found is not None
    assert found["username"] == "octocat"


@pytest.mark.asyncio
async def test_postgres_project_and_history_repositories(db):
    user_repo = PostgresUserRepository(db)
    user = await user_repo.create({"email": "owner@codeatlas.local", "name": "Repo Owner"})

    proj_repo = PostgresProjectRepository(db)
    project = await proj_repo.save({
        "owner_id": user["id"],
        "name": "payment-api",
        "full_name": "owner/payment-api",
        "owner": "owner"
    })
    assert project["id"] is not None

    # Save file and content
    await proj_repo.save_files(project["id"], [{
        "path": "app/service.py",
        "content": "def charge(): return True",
        "size": 25
    }])

    files = await proj_repo.list_files(project["id"])
    assert len(files) == 1
    assert files[0]["path"] == "app/service.py"

    # Save analysis in history
    history_repo = PostgresHistoryRepository(db)
    analysis = await history_repo.save_analysis({
        "user_id": user["id"],
        "repository_id": project["id"],
        "title": "Payment Flow Analysis",
        "analysis_type": "workflow",
        "data": {"nodes": 3, "edges": 2}
    })
    assert analysis["id"] is not None

    user_history = await history_repo.list_by_user(user["id"])
    assert len(user_history) == 1
    assert user_history[0]["title"] == "Payment Flow Analysis"
