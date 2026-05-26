from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ...core.database import get_session
from ...core.security import require_learner
from ...models.project_assignment import ProjectAssignment
from ...models.weekly_plan import WeeklyPlan

router = APIRouter(tags=["user-weekly-plan"])


@router.get("/user/projects/{project_id}/weekly-plans")
async def get_weekly_plans(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner.id,
        )
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this project")

    plans = session.exec(
        select(WeeklyPlan)
        .where(WeeklyPlan.project_id == project_id)
        .order_by(WeeklyPlan.week_number)
    ).all()
    return [p.model_dump() for p in plans]
