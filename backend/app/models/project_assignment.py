import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel, UniqueConstraint


class ProjectAssignment(SQLModel, table=True):
    __tablename__ = "project_assignments"
    __table_args__ = (UniqueConstraint("project_id", "learner_id"),)

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id")
    learner_id: str = Field(foreign_key="users.id")
    assigned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
