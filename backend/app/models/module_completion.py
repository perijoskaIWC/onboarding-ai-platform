import uuid
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


class ModuleCompletion(SQLModel, table=True):
    __tablename__ = "module_completions"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    module_id: str = Field(foreign_key="learning_modules.id", index=True)
    learner_id: str = Field(foreign_key="users.id", index=True)
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
