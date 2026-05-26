import json
import random
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlmodel import Session, select

from ...core.database import get_session, engine
from ...core.security import require_learner
from ...core.config import settings
from ...models.project_assignment import ProjectAssignment
from ...models.question import Question
from ...models.quiz_attempt import QuizAttempt
from ...models.adaptive_question import AdaptiveQuestion
from ...services.scoring import refresh_learner_progress
from ...services.ai import generate_adaptive_questions

router = APIRouter(tags=["user-quiz"])


class QuizSubmission(BaseModel):
    answers: dict[str, str]  # {question_id: "A"|"B"|"C"|"D"}


def _check_assigned(project_id: str, learner_id: str, session: Session):
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner_id,
        )
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this project")


async def _run_adaptive(project_id: str, learner_id: str, score: float, wrong_topics: list[str], openai_client, chat_model: str):
    try:
        with Session(engine) as session:
            items = await generate_adaptive_questions(project_id, score, wrong_topics, session, openai_client, chat_model)
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


@router.get("/user/projects/{project_id}/quiz")
async def get_quiz(
    project_id: str,
    count: Optional[int] = Query(default=None, ge=1),
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)
    questions = session.exec(
        select(Question).where(Question.project_id == project_id, Question.is_published == True)
    ).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions available yet")

    if count and count < len(questions):
        questions = random.sample(list(questions), count)

    return [
        {
            "id": q.id,
            "question_text": q.question_text,
            "options": [q.option_a, q.option_b, q.option_c, q.option_d],
        }
        for q in questions
    ]


@router.post("/user/projects/{project_id}/quiz/submit")
async def submit_quiz(
    project_id: str,
    body: QuizSubmission,
    request: Request,
    background_tasks: BackgroundTasks,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)

    questions = session.exec(
        select(Question).where(Question.project_id == project_id, Question.is_published == True)
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

    # Trigger adaptive question generation in background
    background_tasks.add_task(
        _run_adaptive,
        project_id,
        learner.id,
        score,
        wrong_topics,
        request.app.state.openai_client,
        settings.azure_openai_chat_deployment,
    )

    return {"score": score, "correct": correct, "total": total, "results": results, "adaptive_ready": False}


@router.get("/user/projects/{project_id}/quiz/adaptive")
async def get_adaptive_questions(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)
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
