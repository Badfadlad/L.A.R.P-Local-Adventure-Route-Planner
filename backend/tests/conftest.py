# ======================================================================
# OWNER:  Person 1 (Anay) + Person 4
# PART:   Part 6 - Testing
# STATUS: Test DB fixture DONE by Person 1 / Person 4 adds API test setup
# ======================================================================

"""Shared pytest fixtures.

`db` gives each test a fresh, empty in-memory SQLite database.
Person 4: for API tests, override `get_db` on the app with this session,
e.g. `app.dependency_overrides[get_db] = lambda: db`.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers all tables)
from app.core.database import Base


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
