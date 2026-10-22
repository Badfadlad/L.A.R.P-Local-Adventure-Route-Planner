# ======================================================================
# OWNER:  Person 1 (Anay) + Person 4
# PART:   Part 6 - Testing
# STATUS: Test DB fixture DONE by Person 1 / API test setup DONE by Person 4
# ======================================================================

"""Shared pytest fixtures.

`db`           a fresh, empty in-memory SQLite database for each test
`client`       a TestClient for calling the API; it uses `db`
`user`         a saved user (username "nutsa", password "password123")
`auth_headers` an `Authorization: Bearer <token>` header for `user`
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers all tables)
from app.core.auth import create_access_token, hash_password
from app.core.database import Base, get_db
from app.main import app
from app.models import User


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


# --- API test setup (Person 4) ------------------------------------------


@pytest.fixture()
def client(db):
    """A TestClient whose requests use the test `db` instead of the real larp.db."""
    app.dependency_overrides[get_db] = lambda: db
    # Not used as `with TestClient(...)`, so the startup event (init_db on the
    # real database file) doesn't run - the test db already has its tables.
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def user(db):
    """A saved user whose password is `password123`."""
    user = User(username="nutsa", email="nutsa@example.com", hashed_password=hash_password("password123"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def auth_headers(user):
    """Headers that make a request look like it comes from `user`."""
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}
