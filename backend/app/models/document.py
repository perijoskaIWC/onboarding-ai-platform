import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id")
    filename: str
    file_type: str  # "txt" or "md"
    ingestion_status: str = Field(default="pending")  # pending, processing, ready, failed
    ingestion_error: Optional[str] = Field(default=None)
    raw_content: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
