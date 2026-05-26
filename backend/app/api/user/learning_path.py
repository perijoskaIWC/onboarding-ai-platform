from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Query
from sqlmodel import Session, select

from ...core.database import get_session
from ...core.security import require_learner
from ...core.config import settings
from ...models.project_assignment import ProjectAssignment
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...models.module_completion import ModuleCompletion
from ...services.ai import generate_learning_path

router = APIRouter(tags=["user-learning-path"])


def _check_assigned(project_id: str, learner_id: str, session: Session):
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner_id,
        )
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this project")


async def _run_generate(project_id: str, learner_id: str, session: Session, openai_client, chat_model: str, path_name: str = "Standard"):
    try:
        await generate_learning_path(project_id, learner_id, session, openai_client, chat_model, path_name)
    except Exception:
        pass


@router.get("/user/projects/{project_id}/learning-path/names")
async def list_my_path_names(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)
    paths = session.exec(
        select(LearningPath).where(
            LearningPath.project_id == project_id,
            LearningPath.learner_id == learner.id,
        )
    ).all()
    seen = {}
    for p in sorted(paths, key=lambda x: x.generated_at, reverse=True):
        if p.path_name not in seen:
            seen[p.path_name] = p.generated_at.isoformat()
    return [{"path_name": k, "generated_at": v} for k, v in seen.items()]


@router.get("/user/projects/{project_id}/learning-path")
async def get_my_learning_path(
    project_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    path_name: str = Query(default="Standard"),
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)

    path = session.exec(
        select(LearningPath)
        .where(
            LearningPath.project_id == project_id,
            LearningPath.learner_id == learner.id,
            LearningPath.path_name == path_name,
        )
        .order_by(LearningPath.generated_at.desc())
    ).first()

    if not path:
        # Auto-generate on first request for this path_name
        openai_client = request.app.state.openai_client
        background_tasks.add_task(
            _run_generate,
            project_id,
            learner.id,
            session,
            openai_client,
            settings.azure_openai_chat_deployment,
            path_name,
        )
        return {"status": "generating", "path_name": path_name, "modules": []}

    modules = session.exec(
        select(LearningModule)
        .where(LearningModule.learning_path_id == path.id)
        .order_by(LearningModule.order_index)
    ).all()

    completed_ids = set(
        session.exec(
            select(ModuleCompletion.module_id).where(ModuleCompletion.learner_id == learner.id)
        ).all()
    )

    return {
        **path.model_dump(),
        "status": "ready",
        "modules": [
            {**m.model_dump(), "completed": m.id in completed_ids}
            for m in modules
        ],
    }


@router.post("/user/projects/{project_id}/learning-path/modules/{module_id}/complete", status_code=200)
async def complete_module(
    project_id: str,
    module_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)

    module = session.get(LearningModule, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    existing = session.exec(
        select(ModuleCompletion).where(
            ModuleCompletion.module_id == module_id,
            ModuleCompletion.learner_id == learner.id,
        )
    ).first()

    if not existing:
        session.add(ModuleCompletion(module_id=module_id, learner_id=learner.id))
        session.commit()

    return {"detail": "Module marked complete"}
