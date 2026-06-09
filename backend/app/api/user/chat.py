from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from sqlalchemy import desc
from ...core.database import get_session
from ...core.security import require_learner
from ...core.config import settings
from ...models.project import Project
from ...models.project_assignment import ProjectAssignment
from ...models.quiz_attempt import QuizAttempt
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...models.module_completion import ModuleCompletion
from ...services.ai import rag_chat, orchestrate, rag_chat_global

router = APIRouter(tags=["user-chat"])


class ChatRequest(BaseModel):
    question: str


def _assigned_project_ids(learner_id: str, session: Session) -> list[str]:
    rows = session.exec(
        select(ProjectAssignment.project_id).where(ProjectAssignment.learner_id == learner_id)
    ).all()
    # De-dup while preserving order.
    seen, out = set(), []
    for pid in rows:
        if pid not in seen:
            seen.add(pid)
            out.append(pid)
    return out


@router.post("/user/chat")
async def global_chat(
    body: ChatRequest,
    request: Request,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    """Global tutor: answers across ALL of the learner's assigned projects/documents."""
    if not body.question.strip():
        raise HTTPException(status_code=422, detail="Question cannot be empty")

    project_ids = _assigned_project_ids(learner.id, session)
    result = await rag_chat_global(
        question=body.question,
        project_ids=project_ids,
        session=session,
        openai_client=request.app.state.openai_client,
        embedding_model=settings.azure_openai_embedding_deployment,
        chat_model=settings.azure_openai_chat_deployment,
    )
    return result


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


@router.post("/user/projects/{project_id}/orchestrate")
async def orchestrate_chat(
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

    # Build learner context for advisor agents
    last_attempt = session.exec(
        select(QuizAttempt)
        .where(QuizAttempt.project_id == project_id, QuizAttempt.learner_id == learner.id)
        .order_by(desc(QuizAttempt.attempted_at))
    ).first()

    lp = session.exec(
        select(LearningPath)
        .where(LearningPath.project_id == project_id, LearningPath.learner_id == learner.id)
        .order_by(desc(LearningPath.generated_at))
    ).first()

    modules_total = 0
    modules_completed = 0
    if lp:
        all_mods = session.exec(
            select(LearningModule).where(LearningModule.learning_path_id == lp.id)
        ).all()
        modules_total = len(all_mods)
        completed_ids = set(
            session.exec(
                select(ModuleCompletion.module_id).where(ModuleCompletion.learner_id == learner.id)
            ).all()
        )
        modules_completed = sum(1 for m in all_mods if m.id in completed_ids)

    learner_context = {
        "quiz_score": last_attempt.score if last_attempt else None,
        "quiz_correct": round((last_attempt.score or 0) * (last_attempt.total_questions or 0)) if last_attempt else None,
        "quiz_total": last_attempt.total_questions if last_attempt else None,
        "modules_completed": modules_completed,
        "modules_total": modules_total,
    }

    openai_client = request.app.state.openai_client
    result = await orchestrate(
        message=body.question,
        project_id=project_id,
        learner_id=learner.id,
        learner_context=learner_context,
        top_k=top_k,
        session=session,
        openai_client=openai_client,
        embedding_model=settings.azure_openai_embedding_deployment,
        chat_model=settings.azure_openai_chat_deployment,
    )
    return result
