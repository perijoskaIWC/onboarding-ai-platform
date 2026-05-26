from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Query
from typing import Optional
from sqlmodel import Session, select

from ...core.database import get_session, engine
from ...core.security import require_admin
from ...core.config import settings
from ...models.project import Project
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...services.ai import generate_learning_path

router = APIRouter(tags=["admin-learning-path"])


def _get_project_or_404(project_id: str, admin_id: str, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.admin_id != admin_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def _run_generate(project_id: str, learner_id: str, openai_client, chat_model: str, path_name: str = "Standard"):
    try:
        with Session(engine) as session:
            await generate_learning_path(project_id, learner_id, session, openai_client, chat_model, path_name)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Learning path generation failed: %s", e, exc_info=True)


@router.post("/admin/projects/{project_id}/learning-path", status_code=202)
async def trigger_learning_path(
    project_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    path_name: str = Query(default="Standard"),
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    project = _get_project_or_404(project_id, admin.id, session)
    openai_client = request.app.state.openai_client

    background_tasks.add_task(
        _run_generate,
        project_id,
        admin.id,
        openai_client,
        settings.azure_openai_chat_deployment,
        path_name,
    )
    return {"detail": "Learning path generation started", "path_name": path_name}


@router.get("/admin/projects/{project_id}/learning-path")
async def get_learning_path(
    project_id: str,
    path_name: Optional[str] = Query(default=None),
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)

    query = select(LearningPath).where(LearningPath.project_id == project_id)
    if path_name:
        query = query.where(LearningPath.path_name == path_name)
    path = session.exec(query.order_by(LearningPath.generated_at.desc())).first()

    if not path:
        raise HTTPException(status_code=404, detail="No learning path generated yet")

    modules = session.exec(
        select(LearningModule)
        .where(LearningModule.learning_path_id == path.id)
        .order_by(LearningModule.order_index)
    ).all()

    return {
        **path.model_dump(),
        "modules": [m.model_dump() for m in modules],
    }


@router.get("/admin/projects/{project_id}/learning-path/names")
async def list_path_names(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    paths = session.exec(
        select(LearningPath).where(LearningPath.project_id == project_id)
    ).all()
    seen = {}
    for p in sorted(paths, key=lambda x: x.generated_at, reverse=True):
        if p.path_name not in seen:
            seen[p.path_name] = p.generated_at.isoformat()
    return [{"path_name": k, "generated_at": v} for k, v in seen.items()]
