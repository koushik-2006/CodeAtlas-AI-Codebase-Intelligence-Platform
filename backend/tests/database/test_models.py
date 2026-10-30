import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.base import Base
import app.models as m


@pytest.fixture
def db_session():
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_user_and_connected_account_models(db_session):
    user = m.User(
        email="developer@example.com",
        display_name="CodeAtlas Engineer",
        avatar_url="https://example.com/avatar.png"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    assert user.id is not None
    assert user.email == "developer@example.com"

    account = m.ConnectedAccount(
        user_id=user.id,
        provider="github",
        provider_user_id="12345678",
        access_token_encrypted="encrypted_gho_token"
    )
    db_session.add(account)
    db_session.commit()

    assert len(user.connected_accounts) == 1
    assert user.connected_accounts[0].provider == "github"


def test_repository_and_indexing_models(db_session):
    user = m.User(email="repo_owner@example.com")
    db_session.add(user)
    db_session.commit()

    repo = m.Repository(
        user_id=user.id,
        github_repository_id=987654,
        owner="test-owner",
        name="test-repo",
        full_name="test-owner/test-repo",
        is_private=False
    )
    db_session.add(repo)
    db_session.commit()

    index = m.RepositoryIndex(
        repository_id=repo.id,
        commit_sha="a1b2c3d4e5f6",
        status="completed"
    )
    db_session.add(index)
    db_session.commit()

    source = m.SourceFile(
        repository_index_id=index.id,
        path="app/payment.py",
        language="python",
        content="def pay(): pass",
        size_bytes=16
    )
    db_session.add(source)
    db_session.commit()

    symbol = m.CodeSymbol(
        source_file_id=source.id,
        name="pay",
        symbol_type="function",
        start_line=1,
        end_line=1
    )
    db_session.add(symbol)
    db_session.commit()

    assert len(repo.indexes) == 1
    assert len(index.source_files) == 1
    assert len(source.symbols) == 1
    assert source.symbols[0].name == "pay"
