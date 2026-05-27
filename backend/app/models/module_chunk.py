import uuid
from sqlmodel import Field, SQLModel


class ModuleChunk(SQLModel, table=True):
    __tablename__ = "module_chunks"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    module_id: str = Field(foreign_key="learning_modules.id")
    chunk_id: str = Field(foreign_key="document_chunks.id")
    order_index: int = Field(default=0)
