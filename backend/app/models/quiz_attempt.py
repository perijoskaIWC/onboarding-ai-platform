import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class QuizAttempt(SQLModel, table=True):
    __tablename__ = "quiz_attempts"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    learner_id: str = Field(foreign_key="users.id", index=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    score: float = Field(default=0.0)
    total_questions: int = Field(default=0)
    answers_json: Optional[str] = Field(default=None)  # JSON string of {question_id: answer}
    attempted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
