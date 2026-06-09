from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request, Query
from typing import Optional
from pydantic import BaseModel
from sqlmodel import Session, select, func

from ...core.database import get_session, engine
from ...core.security import require_admin
from ...core.config import settings
from ...models.project import Project
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...models.module_chunk import ModuleChunk
from ...models.document_chunk import DocumentChunk
from ...models.question import Question
from ...models.project_assignment import ProjectAssignment
from ...services.ai import generate_learning_path, path_designer_chat, generate_questions_for_path, compose_module_content

router = APIRouter(tags=["admin-learning-path"])


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


def _get_project_or_404(project_id: str, admin_id: str, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.admin_id != admin_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def _run_generate(project_id: str, learner_id: str, openai_client, chat_model: str, embedding_model: str, path_name: str, duration_weeks: int, custom_instruction: str = "", document_ids: list[str] | None = None):
    try:
        with Session(engine) as session:
            path = await generate_learning_path(project_id, learner_id, session, openai_client, chat_model, embedding_model, path_name, duration_weeks, custom_instruction, document_ids)

            project = session.get(Project, project_id)
            quiz_length = project.quiz_length if project else 10

            # Remove only unpublished questions for this path (preserve reviewed ones)
            old_qs = session.exec(
                select(Question).where(
                    Question.learning_path_id == path.id,
                    Question.is_published == False,  # noqa: E712
                )
            ).all()
            for q in old_qs:
                session.delete(q)
            session.flush()

            items = await generate_questions_for_path(
                path_id=path.id,
                project_id=project_id,
                quiz_length=quiz_length,
                session=session,
                openai_client=openai_client,
                chat_model=chat_model,
                embedding_model=embedding_model,
            )

            for item, module_id, path_id_ref in items:
                options = item.get("options", ["", "", "", ""])
                session.add(Question(
                    project_id=project_id,
                    module_id=module_id,
                    learning_path_id=path_id_ref,
                    question_text=item.get("question", ""),
                    option_a=options[0] if len(options) > 0 else "",
                    option_b=options[1] if len(options) > 1 else "",
                    option_c=options[2] if len(options) > 2 else "",
                    option_d=options[3] if len(options) > 3 else "",
                    correct_answer=item.get("answer", "A"),
                    explanation=item.get("explanation"),
                    is_published=False,
                ))
            session.commit()

    except Exception as e:
        import logging
        logging.getLogger(__name__).error("Learning path generation failed: %s", e, exc_info=True)


class GeneratePathBody(BaseModel):
    document_ids: list[str] = []


@router.post("/admin/projects/{project_id}/learning-path", status_code=202)
async def trigger_learning_path(
    project_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    body: GeneratePathBody = GeneratePathBody(),
    path_name: str = Query(default=""),
    instruction: str = Query(default=""),
    duration_weeks: Optional[int] = Query(default=None),
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    project = _get_project_or_404(project_id, admin.id, session)
    openai_client = request.app.state.openai_client
    # Use explicit path_name if provided, else fall back to instruction excerpt
    name = path_name.strip() or instruction[:40].strip() or "Standard"
    weeks = duration_weeks if duration_weeks and 1 <= duration_weeks <= 52 else project.duration_weeks
    doc_ids = body.document_ids if body.document_ids else None

    background_tasks.add_task(
        _run_generate,
        project_id,
        admin.id,
        openai_client,
        settings.azure_openai_chat_deployment,
        settings.azure_openai_embedding_deployment,
        name,
        weeks,
        instruction,
        doc_ids,
    )
    return {"detail": "Learning path generation started", "path_name": name, "duration_weeks": weeks}


# Must be registered before /{path_id} routes
@router.get("/admin/projects/{project_id}/learning-paths")
async def list_learning_paths(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    """List all learning paths for a project with summary stats."""
    _get_project_or_404(project_id, admin.id, session)
    paths = session.exec(
        select(LearningPath)
        .where(LearningPath.project_id == project_id)
        .order_by(LearningPath.generated_at.desc())
    ).all()

    result = []
    seen_names: dict[str, bool] = {}
    for p in paths:
        # Only return the latest version per path_name
        if p.path_name in seen_names:
            continue
        seen_names[p.path_name] = True

        module_count = session.exec(
            select(func.count()).where(LearningModule.learning_path_id == p.id)
        ).one()
        question_count = session.exec(
            select(func.count()).where(Question.learning_path_id == p.id)
        ).one()
        published_q_count = session.exec(
            select(func.count()).where(
                Question.learning_path_id == p.id,
                Question.is_published == True,
            )
        ).one()
        learner_count = session.exec(
            select(func.count()).where(ProjectAssignment.learning_path_id == p.id)
        ).one()

        result.append({
            **p.model_dump(),
            "module_count": module_count,
            "question_count": question_count,
            "published_question_count": published_q_count,
            "assigned_learner_count": learner_count,
        })
    return result


@router.get("/admin/projects/{project_id}/learning-path")
async def get_learning_path(
    project_id: str,
    path_name: Optional[str] = Query(default=None),
    path_id: Optional[str] = Query(default=None),
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)

    if path_id:
        path = session.get(LearningPath, path_id)
        if not path or path.project_id != project_id:
            raise HTTPException(status_code=404, detail="Learning path not found")
    else:
        query = select(LearningPath).where(LearningPath.project_id == project_id)
        if path_name:
            query = query.where(LearningPath.path_name == path_name)
        path = session.exec(query.order_by(LearningPath.generated_at.desc())).first()

    if not path:
        raise HTTPException(status_code=404, detail="No learning path generated yet")

    modules = session.exec(
        select(LearningModule)
        .where(LearningModule.learning_path_id == path.id)
        .order_by(LearningModule.week_number, LearningModule.order_index)
    ).all()

    return {
        **path.model_dump(),
        "modules": _attach_chunks(modules, session),
    }


@router.patch("/admin/projects/{project_id}/learning-path/{path_id}/publish")
async def publish_learning_path(
    project_id: str,
    path_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    path = session.get(LearningPath, path_id)
    if not path or path.project_id != project_id:
        raise HTTPException(status_code=404, detail="Learning path not found")

    # Toggle: publish/unpublish path and all its questions together
    new_state = not path.is_published
    path.is_published = new_state
    session.add(path)
    for q in session.exec(select(Question).where(Question.learning_path_id == path_id)).all():
        q.is_published = new_state
        session.add(q)

    session.commit()
    session.refresh(path)
    return {"id": path.id, "is_published": path.is_published, "path_name": path.path_name}


def _get_module_or_404(project_id: str, module_id: str, admin_id: str, session: Session) -> LearningModule:
    _get_project_or_404(project_id, admin_id, session)
    module = session.get(LearningModule, module_id)
    path = session.get(LearningPath, module.learning_path_id) if module else None
    if not module or not path or path.project_id != project_id:
        raise HTTPException(status_code=404, detail="Module not found")
    return module


def _module_source_texts(module_id: str, session: Session) -> list[str]:
    chunks = session.exec(
        select(DocumentChunk)
        .join(ModuleChunk, ModuleChunk.chunk_id == DocumentChunk.id)
        .where(ModuleChunk.module_id == module_id)
        .order_by(ModuleChunk.order_index)
    ).all()
    return [c.content for c in chunks]


class ModuleUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    key_concepts: Optional[str] = None
    content: Optional[str] = None


@router.patch("/admin/projects/{project_id}/learning-path/modules/{module_id}")
async def update_module(
    project_id: str,
    module_id: str,
    body: ModuleUpdate,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Inline-edit a module's own fields (title / summary / key concepts / content)."""
    module = _get_module_or_404(project_id, module_id, admin.id, session)

    data = body.model_dump(exclude_unset=True)
    for field in ("title", "summary", "key_concepts", "content"):
        if field in data and data[field] is not None:
            setattr(module, field, data[field])
    session.add(module)
    session.commit()
    session.refresh(module)
    return module.model_dump()


@router.post("/admin/projects/{project_id}/learning-path/modules/{module_id}/draft-content")
async def draft_module_content(
    project_id: str,
    module_id: str,
    request: Request,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    """(Re)compose this module's learner-facing Markdown from its source chunks
    using AI. Used to backfill existing modules and to redraft on demand. The raw
    source chunks are never modified."""
    module = _get_module_or_404(project_id, module_id, admin.id, session)
    source_texts = _module_source_texts(module_id, session)
    if not source_texts:
        raise HTTPException(status_code=400, detail="This module has no source sections to draft from")

    content = await compose_module_content(
        title=module.title,
        summary=module.summary,
        key_concepts=module.key_concepts,
        source_texts=source_texts,
        openai_client=request.app.state.openai_client,
        chat_model=settings.azure_openai_chat_deployment,
    )
    if content:
        module.content = content
        session.add(module)
        session.commit()
        session.refresh(module)
    return {"id": module.id, "content": module.content}


class PathChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    document_ids: list[str] = []
    path_name: Optional[str] = None


@router.post("/admin/projects/{project_id}/path-chat")
async def path_chat(
    project_id: str,
    body: PathChatRequest,
    request: Request,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    project = _get_project_or_404(project_id, admin.id, session)

    query = select(LearningPath).where(LearningPath.project_id == project_id)
    if body.path_name:
        query = query.where(LearningPath.path_name == body.path_name)
    path = session.exec(query.order_by(LearningPath.generated_at.desc())).first()

    path_context: dict = {}
    if path:
        modules = session.exec(
            select(LearningModule)
            .where(LearningModule.learning_path_id == path.id)
            .order_by(LearningModule.week_number, LearningModule.order_index)
        ).all()
        path_context = {
            "modules": [
                {"title": m.title, "summary": m.summary, "week_number": m.week_number}
                for m in modules
            ]
        }

    result = await path_designer_chat(
        message=body.message,
        history=body.history,
        path_context=path_context,
        project_name=project.name,
        project_id=project_id,
        duration_weeks=project.duration_weeks,
        openai_client=request.app.state.openai_client,
        chat_model=settings.azure_openai_chat_deployment,
        embedding_model=settings.azure_openai_embedding_deployment,
        session=session,
        document_ids=body.document_ids,
    )
    return result


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
