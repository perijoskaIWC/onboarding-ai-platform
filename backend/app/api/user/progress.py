from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ...core.database import get_session
from ...core.security import require_learner
from ...models.project_assignment import ProjectAssignment
from ...models.learner_progress import LearnerProgress
from ...models.quiz_attempt import QuizAttempt
from ...services.scoring import refresh_learner_progress

router = APIRouter(tags=["user-progress"])


def _check_assigned(project_id: str, learner_id: str, session: Session):
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner_id,
        )
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this project")


@router.get("/user/projects/{project_id}/progress")
async def get_progress(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)

    progress = session.exec(
        select(LearnerProgress).where(
            LearnerProgress.learner_id == learner.id,
            LearnerProgress.project_id == project_id,
        )
    ).first()

    if not progress:
        progress = refresh_learner_progress(learner.id, project_id, session)

    attempts = session.exec(
        select(QuizAttempt)
        .where(QuizAttempt.learner_id == learner.id, QuizAttempt.project_id == project_id)
        .order_by(QuizAttempt.attempted_at.desc())
        .limit(10)
    ).all()

    return {
        **progress.model_dump(),
        "quiz_history": [
            {"score": a.score, "total": a.total_questions, "attempted_at": a.attempted_at}
            for a in attempts
        ],
    }
