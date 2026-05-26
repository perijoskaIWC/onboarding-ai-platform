from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text
from .config import settings

engine = create_engine(settings.database_url, echo=False)


def get_session():
    with Session(engine) as session:
        yield session


def create_db_and_tables() -> None:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    SQLModel.metadata.create_all(engine)
    _create_vector_index()


def _create_vector_index() -> None:
    ddl = """
    CREATE INDEX IF NOT EXISTS idx_chunks_embedding
    ON document_chunks
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
    """
    with engine.connect() as conn:
        try:
            conn.execute(text(ddl))
            conn.commit()
        except Exception:
            conn.rollback()
