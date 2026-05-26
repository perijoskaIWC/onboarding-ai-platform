import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class AdaptiveQuestion(SQLModel, table=True):
    __tablename__ = "adaptive_questions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    learner_id: str = Field(foreign_key="users.id", index=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: Optional[str] = Field(default=None)
    difficulty: str = Field(default="standard")  # "easier" | "standard" | "harder"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
