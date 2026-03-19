"""Database engine and session management (synchronous)."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from config import settings

# Convert async URL to sync if needed
db_url = settings.database_url.replace("sqlite+aiosqlite", "sqlite")

engine = create_engine(db_url, echo=False, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def init_db():
    """Create all database tables."""
    from models import Article, StoryCluster, Publisher, FetchLog  # noqa: F401
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
