from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func
from ...core.database import get_session
from ...core.security import require_learner
from ...models.project import Project
from ...models.project_assignment import ProjectAssignment
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...models.module_completion import ModuleCompletion

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
    seen_project_ids = set()
    result = []
    for a in assignments:
        if a.project_id in seen_project_ids:
            continue
        seen_project_ids.add(a.project_id)
        project = session.get(Project, a.project_id)
        if not project:
            continue

        # Get published learning path for this project
        path = session.exec(
            select(LearningPath).where(
                LearningPath.project_id == project.id,
                LearningPath.is_published == True,
            )
        ).first()

        modules_total = 0
        modules_completed = 0
        if path:
            modules_total = session.exec(
                select(func.count()).where(LearningModule.learning_path_id == path.id)
            ).one()
            modules_completed = session.exec(
                select(func.count()).where(
                    ModuleCompletion.learner_id == learner.id,
                    ModuleCompletion.module_id.in_(
                        select(LearningModule.id).where(LearningModule.learning_path_id == path.id)
                    ),
                )
            ).one()

        completion_rate = round(modules_completed / modules_total * 100) if modules_total > 0 else 0

        result.append({
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "module_count": modules_total,
            "modules_completed": modules_completed,
            "modules_total": modules_total,
            "completion_rate": completion_rate,
            "has_published_path": path is not None,
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
