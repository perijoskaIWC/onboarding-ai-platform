import json
import random
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from ...core.database import get_session, engine
from ...core.security import require_learner
from ...core.config import settings
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...models.module_completion import ModuleCompletion
from ...models.module_chunk import ModuleChunk
from ...models.document_chunk import DocumentChunk
from ...models.project_assignment import ProjectAssignment
from ...models.question import Question
from ...models.quiz_attempt import QuizAttempt
from ...models.adaptive_question import AdaptiveQuestion
from ...services.scoring import refresh_learner_progress
from ...services.ai import generate_adaptive_questions

router = APIRouter(tags=["user-paths"])


class QuizSubmission(BaseModel):
    answers: dict[str, str]


def _check_path_assigned(project_id: str, path_id: str, learner_id: str, session: Session):
    """Passes if learner is assigned to this specific path OR to the project with no path."""
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner_id,
            ProjectAssignment.learning_path_id == path_id,
        )
    ).first()
    if not assignment:
        # Backward compat: project-only assignment (no path set)
        fallback = session.exec(
            select(ProjectAssignment).where(
                ProjectAssignment.project_id == project_id,
                ProjectAssignment.learner_id == learner_id,
                ProjectAssignment.learning_path_id == None,  # noqa: E711
            )
        ).first()
        if not fallback:
            raise HTTPException(status_code=403, detail="Not assigned to this path")


def _attach_chunks(modules, session: Session):
    result = []
    for m in modules:
        chunks = session.exec(
            select(DocumentChunk)
            .join(ModuleChunk, ModuleChunk.chunk_id == DocumentChunk.id)
            .where(ModuleChunk.module_id == m.id)
            .order_by(ModuleChunk.order_index)
        ).all()
        result.append({
            **m.model_dump(),
            "chunks": [{"id": c.id, "chunk_index": c.chunk_index, "content": c.content} for c in chunks],
        })
    return result


async def _run_adaptive(project_id: str, learner_id: str, score: float, wrong_topics: list[str], openai_client, chat_model: str, embedding_model: str):
    try:
        with Session(engine) as session:
            items = await generate_adaptive_questions(project_id, score, wrong_topics, session, openai_client, chat_model, embedding_model)
            old = session.exec(
                select(AdaptiveQuestion).where(
                    AdaptiveQuestion.project_id == project_id,
                    AdaptiveQuestion.learner_id == learner_id,
                )
            ).all()
            for q in old:
                session.delete(q)
            for item, difficulty in items:
                options = item.get("options", ["", "", "", ""])
                session.add(AdaptiveQuestion(
                    learner_id=learner_id,
                    project_id=project_id,
                    question_text=item.get("question", ""),
                    option_a=options[0] if len(options) > 0 else "",
                    option_b=options[1] if len(options) > 1 else "",
                    option_c=options[2] if len(options) > 2 else "",
                    option_d=options[3] if len(options) > 3 else "",
                    correct_answer=item.get("answer", "A"),
                    explanation=item.get("explanation"),
                    difficulty=difficulty,
                ))
            session.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Adaptive question generation failed: %s", e, exc_info=True)


@router.get("/user/projects/{project_id}/paths")
async def list_my_paths(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    """List all published paths the learner is assigned to in this project."""
    assignments = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner.id,
        )
    ).all()
    if not assignments:
        raise HTTPException(status_code=403, detail="Not assigned to this project")

    path_ids = {a.learning_path_id for a in assignments if a.learning_path_id}

    result = []
    if path_ids:
        paths = session.exec(
            select(LearningPath).where(
                LearningPath.id.in_(path_ids),
                LearningPath.is_published == True,
            )
        ).all()
    else:
        # Backward compat: learner assigned to project only — return any published path
        paths = session.exec(
            select(LearningPath).where(
                LearningPath.project_id == project_id,
                LearningPath.is_published == True,
            )
        ).all()

    completed_module_ids = set(
        session.exec(
            select(ModuleCompletion.module_id).where(ModuleCompletion.learner_id == learner.id)
        ).all()
    )

    for path in paths:
        modules = session.exec(
            select(LearningModule).where(LearningModule.learning_path_id == path.id)
        ).all()
        total_modules = len(modules)
        completed = sum(1 for m in modules if m.id in completed_module_ids)
        result.append({
            **path.model_dump(),
            "total_modules": total_modules,
            "completed_modules": completed,
        })

    return result


@router.get("/user/projects/{project_id}/paths/{path_id}")
async def get_path(
    project_id: str,
    path_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_path_assigned(project_id, path_id, learner.id, session)

    path = session.get(LearningPath, path_id)
    if not path or path.project_id != project_id or not path.is_published:
        raise HTTPException(status_code=404, detail="Path not found or not published")

    modules = session.exec(
        select(LearningModule)
        .where(LearningModule.learning_path_id == path.id)
        .order_by(LearningModule.week_number, LearningModule.order_index)
    ).all()

    completed_ids = set(
        session.exec(
            select(ModuleCompletion.module_id).where(ModuleCompletion.learner_id == learner.id)
        ).all()
    )

    modules_with_chunks = _attach_chunks(modules, session)
    return {
        **path.model_dump(),
        "status": "ready",
        "modules": [
            {**m, "completed": m["id"] in completed_ids}
            for m in modules_with_chunks
        ],
    }


@router.post("/user/projects/{project_id}/paths/{path_id}/modules/{module_id}/complete", status_code=200)
async def complete_module(
    project_id: str,
    path_id: str,
    module_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_path_assigned(project_id, path_id, learner.id, session)

    module = session.get(LearningModule, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    existing = session.exec(
        select(ModuleCompletion).where(
            ModuleCompletion.module_id == module_id,
            ModuleCompletion.learner_id == learner.id,
        )
    ).first()

    if not existing:
        session.add(ModuleCompletion(module_id=module_id, learner_id=learner.id))
        session.commit()

    return {"detail": "Module marked complete"}


@router.get("/user/projects/{project_id}/paths/{path_id}/quiz")
async def get_path_quiz(
    project_id: str,
    path_id: str,
    count: Optional[int] = Query(default=None, ge=1),
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    from ...models.project import Project
    _check_path_assigned(project_id, path_id, learner.id, session)

    questions = session.exec(
        select(Question).where(
            Question.learning_path_id == path_id,
            Question.is_published == True,
        )
    ).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions available for this path")

    project = session.get(Project, project_id)
    cap = count or (project.quiz_attempt_size if project else None)
    if cap and cap < len(questions):
        questions = random.sample(list(questions), cap)

    return [
        {
            "id": q.id,
            "question_text": q.question_text,
            "options": [q.option_a, q.option_b, q.option_c, q.option_d],
        }
        for q in questions
    ]


@router.post("/user/projects/{project_id}/paths/{path_id}/quiz/submit")
async def submit_path_quiz(
    project_id: str,
    path_id: str,
    body: QuizSubmission,
    request: Request,
    background_tasks: BackgroundTasks,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_path_assigned(project_id, path_id, learner.id, session)

    questions = session.exec(
        select(Question).where(
            Question.learning_path_id == path_id,
            Question.is_published == True,
        )
    ).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions available")

    q_map = {q.id: q for q in questions}
    correct = sum(
        1 for qid, ans in body.answers.items()
        if qid in q_map and q_map[qid].correct_answer.upper() == ans.upper()
    )
    total = len(questions)
    score = round(correct / total, 4) if total else 0.0

    attempt = QuizAttempt(
        learner_id=learner.id,
        project_id=project_id,
        score=score,
        total_questions=total,
        answers_json=json.dumps(body.answers),
    )
    session.add(attempt)
    session.commit()

    refresh_learner_progress(learner.id, project_id, session)

    results = []
    wrong_topics = []
    for q in questions:
        given = body.answers.get(q.id, "")
        is_correct = given.upper() == q.correct_answer.upper() if given else False
        results.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "given_answer": given,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })
        if not is_correct:
            wrong_topics.append(q.question_text[:80])

    background_tasks.add_task(
        _run_adaptive,
        project_id,
        learner.id,
        score,
        wrong_topics,
        request.app.state.openai_client,
        settings.azure_openai_chat_deployment,
        settings.azure_openai_embedding_deployment,
    )

    return {"score": score, "correct": correct, "total": total, "results": results, "adaptive_ready": False}


@router.get("/user/projects/{project_id}/paths/{path_id}/quiz/adaptive")
async def get_path_adaptive_questions(
    project_id: str,
    path_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_path_assigned(project_id, path_id, learner.id, session)
    questions = session.exec(
        select(AdaptiveQuestion).where(
            AdaptiveQuestion.project_id == project_id,
            AdaptiveQuestion.learner_id == learner.id,
        ).order_by(AdaptiveQuestion.created_at.desc())
    ).all()
    return [
        {
            "id": q.id,
            "question_text": q.question_text,
            "options": [q.option_a, q.option_b, q.option_c, q.option_d],
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
        }
        for q in questions
    ]
