from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
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


async def _run_generate(project_id: str, learner_id: str, openai_client, chat_model: str):
    try:
        with Session(engine) as session:
            await generate_learning_path(project_id, learner_id, session, openai_client, chat_model)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Learning path generation failed: %s", e, exc_info=True)


@router.post("/admin/projects/{project_id}/learning-path", status_code=202)
async def trigger_learning_path(
    project_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
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
    )
    return {"detail": "Learning path generation started"}


@router.get("/admin/projects/{project_id}/learning-path")
async def get_learning_path(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)

    path = session.exec(
        select(LearningPath)
        .where(LearningPath.project_id == project_id)
        .order_by(LearningPath.generated_at.desc())
    ).first()

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
