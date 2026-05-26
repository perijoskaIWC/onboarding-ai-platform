from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlmodel import Session, select

from ...core.database import get_session
from ...core.security import require_admin
from ...models.project import Project
from ...models.weekly_plan import WeeklyPlan

router = APIRouter(tags=["admin-weekly-plan"])


def _get_project_or_404(project_id: str, admin_id: str, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.admin_id != admin_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


class WeeklyPlanBody(BaseModel):
    week_number: int
    title: str
    description: str = ""

    @field_validator("title")
    @classmethod
    def must_be_non_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("title must not be empty")
        return v

    @field_validator("week_number")
    @classmethod
    def must_be_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("week_number must be >= 1")
        return v


@router.get("/admin/projects/{project_id}/weekly-plans")
async def list_weekly_plans(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    plans = session.exec(
        select(WeeklyPlan)
        .where(WeeklyPlan.project_id == project_id)
        .order_by(WeeklyPlan.week_number)
    ).all()
    return [p.model_dump() for p in plans]


@router.post("/admin/projects/{project_id}/weekly-plans", status_code=201)
async def create_weekly_plan(
    project_id: str,
    body: WeeklyPlanBody,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    plan = WeeklyPlan(
        project_id=project_id,
        week_number=body.week_number,
        title=body.title,
        description=body.description,
    )
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return plan.model_dump()


@router.put("/admin/projects/{project_id}/weekly-plans/{plan_id}")
async def update_weekly_plan(
    project_id: str,
    plan_id: str,
    body: WeeklyPlanBody,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    plan = session.get(WeeklyPlan, plan_id)
    if not plan or plan.project_id != project_id:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    plan.week_number = body.week_number
    plan.title = body.title
    plan.description = body.description
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return plan.model_dump()


@router.delete("/admin/projects/{project_id}/weekly-plans/{plan_id}", status_code=204)
async def delete_weekly_plan(
    project_id: str,
    plan_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    plan = session.get(WeeklyPlan, plan_id)
    if not plan or plan.project_id != project_id:
        raise HTTPException(status_code=404, detail="Weekly plan not found")
    session.delete(plan)
    session.commit()
