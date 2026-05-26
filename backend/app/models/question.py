import uuid
from typing import Optional
from sqlmodel import Field, SQLModel


class Question(SQLModel, table=True):
    __tablename__ = "questions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="projects.id", index=True)
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str  # "A" | "B" | "C" | "D"
    explanation: Optional[str] = Field(default=None)
    is_published: bool = Field(default=False, sa_column_kwargs={"server_default": "false"})
