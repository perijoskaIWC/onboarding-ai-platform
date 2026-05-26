import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class LearnerProgress(SQLModel, table=True):
    __tablename__ = "learner_progress"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    learner_id: str = Field(foreign_key="users.id", index=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    readiness_score: float = Field(default=0.0)
    quiz_avg: float = Field(default=0.0)
    modules_completed: int = Field(default=0)
    modules_total: int = Field(default=0)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
