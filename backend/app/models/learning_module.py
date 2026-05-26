import uuid
from sqlmodel import Field, SQLModel


class LearningModule(SQLModel, table=True):
    __tablename__ = "learning_modules"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    learning_path_id: str = Field(foreign_key="learning_paths.id", index=True)
    order_index: int
    title: str
    summary: str
    key_concepts: str = Field(default="")
