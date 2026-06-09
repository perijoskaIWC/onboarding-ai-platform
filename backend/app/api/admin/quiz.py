from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Request
from pydantic import BaseModel, field_validator
from sqlmodel import Session, select, update

from ...core.database import get_session, engine
from ...core.security import require_admin
from ...core.config import settings
from ...models.project import Project
from ...models.question import Question
from ...services.ai import generate_questions

router = APIRouter(tags=["admin-quiz"])


def _get_project_or_404(project_id: str, admin_id: str, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.admin_id != admin_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _get_question_or_404(project_id: str, question_id: str, session: Session) -> Question:
    q = session.get(Question, question_id)
    if not q or q.project_id != project_id:
        raise HTTPException(status_code=404, detail="Question not found")
    return q


async def _run_generate(project_id: str, quiz_length: int, openai_client, chat_model: str, embedding_model: str):
    try:
        with Session(engine) as session:
            items = await generate_questions(project_id, quiz_length, session, openai_client, chat_model, embedding_model)
            old = session.exec(
                select(Question).where(
                    Question.project_id == project_id,
                    Question.is_published == False,  # noqa: E712
                )
            ).all()
            for q in old:
                session.delete(q)
            for item in items:
                options = item.get("options", ["", "", "", ""])
                session.add(Question(
                    project_id=project_id,
                    question_text=item.get("question", ""),
                    option_a=options[0] if len(options) > 0 else "",
                    option_b=options[1] if len(options) > 1 else "",
                    option_c=options[2] if len(options) > 2 else "",
                    option_d=options[3] if len(options) > 3 else "",
                    correct_answer=item.get("answer", "A"),
                    explanation=item.get("explanation"),
                    is_published=False,
                ))
            session.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Question generation failed: %s", e, exc_info=True)


class PublishBody(BaseModel):
    is_published: bool


class QuestionUpdate(BaseModel):
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: Optional[str] = None

    @field_validator("question_text", "option_a", "option_b", "option_c", "option_d")
    @classmethod
    def must_be_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Field must not be empty")
        return v

    @field_validator("correct_answer")
    @classmethod
    def must_be_valid_letter(cls, v: str) -> str:
        if v.upper() not in {"A", "B", "C", "D"}:
            raise ValueError("correct_answer must be A, B, C, or D")
        return v.upper()


@router.post("/admin/projects/{project_id}/questions", status_code=202)
async def generate_project_questions(
    project_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    project = _get_project_or_404(project_id, admin.id, session)
    background_tasks.add_task(
        _run_generate,
        project_id,
        project.quiz_length,
        request.app.state.openai_client,
        settings.azure_openai_chat_deployment,
        settings.azure_openai_embedding_deployment,
    )
    return {"detail": "Question generation started"}


@router.get("/admin/projects/{project_id}/questions")
async def list_questions(
    project_id: str,
    learning_path_id: Optional[str] = Query(default=None),
    module_id: Optional[str] = Query(default=None),
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    q = select(Question).where(Question.project_id == project_id)
    if learning_path_id:
        q = q.where(Question.learning_path_id == learning_path_id)
    if module_id:
        q = q.where(Question.module_id == module_id)
    questions = session.exec(q).all()
    return [q.model_dump() for q in questions]


# publish-all MUST be registered before /{question_id} routes to avoid path conflict
@router.post("/admin/projects/{project_id}/questions/publish-all")
async def publish_all_questions(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    result = session.exec(
        update(Question)
        .where(Question.project_id == project_id)
        .values(is_published=True)
    )
    session.commit()
    count = session.exec(
        select(Question).where(Question.project_id == project_id, Question.is_published == True)
    ).all()
    return {"published_count": len(count)}


@router.patch("/admin/projects/{project_id}/questions/{question_id}/publish")
async def publish_question(
    project_id: str,
    question_id: str,
    body: PublishBody,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    q = _get_question_or_404(project_id, question_id, session)
    q.is_published = body.is_published
    session.add(q)
    session.commit()
    session.refresh(q)
    return {"id": q.id, "is_published": q.is_published}


@router.put("/admin/projects/{project_id}/questions/{question_id}")
async def update_question(
    project_id: str,
    question_id: str,
    body: QuestionUpdate,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    q = _get_question_or_404(project_id, question_id, session)
    q.question_text = body.question_text
    q.option_a = body.option_a
    q.option_b = body.option_b
    q.option_c = body.option_c
    q.option_d = body.option_d
    q.correct_answer = body.correct_answer
    q.explanation = body.explanation
    session.add(q)
    session.commit()
    session.refresh(q)
    return q.model_dump()


@router.delete("/admin/projects/{project_id}/questions/{question_id}", status_code=204)
async def delete_question(
    project_id: str,
    question_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    q = _get_question_or_404(project_id, question_id, session)
    session.delete(q)
    session.commit()
