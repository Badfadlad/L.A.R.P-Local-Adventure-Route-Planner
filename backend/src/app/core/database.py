# ======================================================================
# OWNER:  Person 1 (Anay)
# PART:   Part 1 - Project Setup
# STATUS: DONE
# ======================================================================

"""Database engine, session factory, declarative Base, and the `get_db` dependency.

Every SQLAlchemy model inherits from `Base`. Routes get a session with:

    from fastapi import Depends
    from sqlalchemy.orm import Session
    from app.core.database import get_db

    @router.get("/places")
    def list_places(db: Session = Depends(get_db)):
        ...
"""

from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.settings import settings

# SQLite needs check_same_thread=False because FastAPI may use the
# session from a different thread than the one that created it.
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


@event.listens_for(Engine, "connect")
def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    """SQLite ignores foreign keys (and ON DELETE CASCADE) unless this is turned on."""
    if dbapi_connection.__class__.__module__.startswith("sqlite3"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a DB session and always closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Importing `app.models` registers every model on `Base`."""
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
