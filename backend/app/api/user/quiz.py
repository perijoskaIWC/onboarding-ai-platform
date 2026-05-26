import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from ...core.database import get_session
from ...core.security import require_learner
from ...models.project_assignment import ProjectAssignment
from ...models.question import Question
from ...models.quiz_attempt import QuizAttempt
from ...services.scoring import refresh_learner_progress

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


@router.get("/user/projects/{project_id}/quiz")
async def get_quiz(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)
    questions = session.exec(select(Question).where(Question.project_id == project_id)).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions available yet")

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
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)

    questions = session.exec(select(Question).where(Question.project_id == project_id)).all()
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
    for q in questions:
        given = body.answers.get(q.id, "")
        results.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "given_answer": given,
            "correct_answer": q.correct_answer,
            "is_correct": given.upper() == q.correct_answer.upper(),
            "explanation": q.explanation,
        })

    return {"score": score, "correct": correct, "total": total, "results": results}
