from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ...core.database import get_session
from ...core.security import require_learner
from ...models.project_assignment import ProjectAssignment
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...models.module_completion import ModuleCompletion
from ...models.module_chunk import ModuleChunk
from ...models.document_chunk import DocumentChunk

router = APIRouter(tags=["user-learning-path"])


def _attach_chunks(modules, session: Session):
    result = []
    for m in modules:
        chunks = session.exec(
            select(DocumentChunk)
            .join(ModuleChunk, ModuleChunk.chunk_id == DocumentChunk.id)
            .where(ModuleChunk.module_id == m.id)
            .order_by(ModuleChunk.order_index)
        ).all()
        result.append({
            **m.model_dump(),
            "chunks": [{"id": c.id, "chunk_index": c.chunk_index, "content": c.content} for c in chunks],
        })
    return result


def _check_assigned(project_id: str, learner_id: str, session: Session):
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner_id,
        )
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="Not assigned to this project")


@router.get("/user/projects/{project_id}/learning-path/names")
async def list_my_path_names(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)
    # Return the published path's name (only one published path exists at a time)
    paths = session.exec(
        select(LearningPath).where(
            LearningPath.project_id == project_id,
            LearningPath.is_published == True,
        )
    ).all()
    return [{"path_name": p.path_name, "generated_at": p.generated_at.isoformat()} for p in paths]


@router.get("/user/projects/{project_id}/learning-path")
async def get_my_learning_path(
    project_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    _check_assigned(project_id, learner.id, session)

    path = session.exec(
        select(LearningPath).where(
            LearningPath.project_id == project_id,
            LearningPath.is_published == True,
        )
    ).first()

    if not path:
        return {"status": "not_published", "modules": []}

    modules = session.exec(
        select(LearningModule)
        .where(LearningModule.learning_path_id == path.id)
        .order_by(LearningModule.week_number, LearningModule.order_index)
    ).all()

    completed_ids = set(
        session.exec(
            select(ModuleCompletion.module_id).where(ModuleCompletion.learner_id == learner.id)
        ).all()
    )

    modules_with_chunks = _attach_chunks(modules, session)
    return {
        **path.model_dump(),
        "status": "ready",
        "modules": [
            {**m, "completed": m["id"] in completed_ids}
            for m in modules_with_chunks
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
