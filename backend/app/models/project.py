import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    description: Optional[str] = Field(default=None)
    admin_id: str = Field(foreign_key="users.id")
    chunk_size: int = Field(default=500)
    chunk_overlap: int = Field(default=50)
    rag_top_k: int = Field(default=5)
    quiz_length: int = Field(default=10)
    quiz_attempt_size: Optional[int] = Field(default=None)
    duration_weeks: int = Field(default=4)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
