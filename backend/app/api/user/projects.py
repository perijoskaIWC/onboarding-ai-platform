from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from ...core.database import get_session
from ...core.security import require_learner
from ...models.project import Project
from ...models.project_assignment import ProjectAssignment

router = APIRouter(prefix="/projects", tags=["user-projects"])


def _check_assigned(project_id: str, learner_id: str, session: Session):
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner_id,
        )
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this project")


@router.get("")
async def list_assigned_projects(
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    assignments = session.exec(
        select(ProjectAssignment).where(ProjectAssignment.learner_id == learner.id)
    ).all()
    result = []
    for a in assignments:
        project = session.get(Project, a.project_id)
        if project:
            result.append({
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "readiness_score": 0.0,
                "modules_completed": 0,
                "modules_total": 0,
            })
    return result


@router.get("/{project_id}")
async def get_assigned_project(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"id": project.id, "name": project.name, "description": project.description}


@router.get("/{project_id}/documents")
async def list_project_documents(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)
    from ...models.document import Document
    docs = session.exec(select(Document).where(Document.project_id == project_id)).all()
    return [{"id": d.id, "filename": d.filename} for d in docs]
