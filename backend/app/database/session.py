from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


def _connect_args() -> dict:
    return {"check_same_thread": False} if get_settings().database_url.startswith("sqlite") else {}


engine = create_engine(get_settings().database_url, pool_pre_ping=True, connect_args=_connect_args())
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
