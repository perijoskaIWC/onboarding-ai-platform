import uuid
from sqlmodel import Field, SQLModel


class WeeklyPlan(SQLModel, table=True):
    __tablename__ = "weekly_plans"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    week_number: int
    title: str
    description: str = Field(default="")
