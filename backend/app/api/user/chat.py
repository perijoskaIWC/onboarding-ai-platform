from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from ...core.database import get_session
from ...core.security import require_learner
from ...core.config import settings
from ...models.project import Project
from ...models.project_assignment import ProjectAssignment
from ...services.ai import rag_chat

router = APIRouter(tags=["user-chat"])


class ChatRequest(BaseModel):
    question: str


def _check_assigned(project_id: str, learner_id: str, session: Session):
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner_id,
        )
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this project")


@router.post("/user/projects/{project_id}/chat")
async def chat(
    project_id: str,
    body: ChatRequest,
    request: Request,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)

    if not body.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty")

    project = session.get(Project, project_id)
    top_k = project.rag_top_k if project else 5

    openai_client = request.app.state.openai_client
    result = await rag_chat(
        question=body.question,
        project_id=project_id,
        learner_id=learner.id,
        top_k=top_k,
        session=session,
        openai_client=openai_client,
        embedding_model=settings.azure_openai_embedding_deployment,
        chat_model=settings.azure_openai_chat_deployment,
    )
    return result
