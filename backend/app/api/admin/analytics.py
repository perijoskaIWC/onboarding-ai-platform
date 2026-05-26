from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func

from ...core.database import get_session
from ...core.security import require_admin
from ...models.project import Project
from ...models.project_assignment import ProjectAssignment
from ...models.learner_progress import LearnerProgress
from ...models.document import Document
from ...models.quiz_attempt import QuizAttempt

router = APIRouter(tags=["admin-analytics"])


def _get_project_or_404(project_id: str, admin_id: str, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.admin_id != admin_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/admin/projects/{project_id}/analytics")
async def get_analytics(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)

    learner_ids = session.exec(
        select(ProjectAssignment.learner_id).where(ProjectAssignment.project_id == project_id)
    ).all()
    total_learners = len(learner_ids)

    doc_count = session.exec(
        select(func.count()).where(Document.project_id == project_id)
    ).one()

    progress_records = session.exec(
        select(LearnerProgress).where(LearnerProgress.project_id == project_id)
    ).all()

    avg_readiness = (
        sum(p.readiness_score for p in progress_records) / len(progress_records)
        if progress_records else 0.0
    )

    ready_count = sum(1 for p in progress_records if p.readiness_score >= 0.8)

    # Per-learner summary
    learner_rows = []
    for lid in learner_ids:
        pr = next((p for p in progress_records if p.learner_id == lid), None)
        learner_rows.append({
            "learner_id": lid,
            "readiness_score": pr.readiness_score if pr else 0.0,
            "quiz_avg": pr.quiz_avg if pr else 0.0,
            "modules_completed": pr.modules_completed if pr else 0,
            "modules_total": pr.modules_total if pr else 0,
        })

    # Quiz attempt trend (last 20 attempts across all learners)
    recent_attempts = session.exec(
        select(QuizAttempt)
        .where(QuizAttempt.project_id == project_id)
        .order_by(QuizAttempt.attempted_at.desc())
        .limit(20)
    ).all()

    return {
        "total_learners": total_learners,
        "doc_count": doc_count,
        "avg_readiness": round(avg_readiness, 4),
        "ready_count": ready_count,
        "learners": learner_rows,
        "recent_attempts": [
            {
                "learner_id": a.learner_id,
                "score": a.score,
                "total_questions": a.total_questions,
                "attempted_at": a.attempted_at,
            }
            for a in recent_attempts
        ],
    }
