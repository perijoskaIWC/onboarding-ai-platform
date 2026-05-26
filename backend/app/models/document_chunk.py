import uuid
from sqlmodel import Field, SQLModel, Column
from pgvector.sqlalchemy import Vector
from sqlalchemy import Integer


class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunks"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    document_id: str = Field(foreign_key="documents.id")
    project_id: str = Field(foreign_key="projects.id", index=True)
    chunk_index: int
    content: str
    token_count: int
    embedding: list[float] = Field(sa_column=Column(Vector(1536), nullable=False))
