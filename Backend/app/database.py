"""SQLAlchemy database engine, session factory, and base model."""

from typing import Generator

from sqlalchemy import create_engine, text
# pyrefly: ignore[missing-import]
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """Yield a database session per request and ensure it is closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Verify PostgreSQL connectivity by executing a lightweight query."""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True
