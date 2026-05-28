import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class ProjectAssignment(SQLModel, table=True):
    __tablename__ = "project_assignments"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id")
    learner_id: str = Field(foreign_key="users.id")
    learning_path_id: Optional[str] = Field(default=None, foreign_key="learning_paths.id")
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
