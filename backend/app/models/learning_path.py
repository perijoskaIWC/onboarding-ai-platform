import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class LearningPath(SQLModel, table=True):
    __tablename__ = "learning_paths"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    learner_id: str = Field(foreign_key="users.id", index=True)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    overview: str = Field(default="")
