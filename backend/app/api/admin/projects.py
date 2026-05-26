from datetime import datetime, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from pydantic import BaseModel
from ...core.database import get_session
from ...core.security import require_admin
from ...models.project import Project
from ...models.project_assignment import ProjectAssignment
from ...models.user import User
from ...models.document import Document
from ...models.document_chunk import DocumentChunk
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...models.question import Question
from ...models.quiz_attempt import QuizAttempt
from ...models.learner_progress import LearnerProgress
from ...models.module_completion import ModuleCompletion
from sqlmodel import delete

router = APIRouter(prefix="/projects", tags=["admin-projects"])


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    chunk_size: int = 500
    chunk_overlap: int = 50
    rag_top_k: int = 5
    quiz_length: int = 10


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None
    rag_top_k: Optional[int] = None
    quiz_length: Optional[int] = None


class AssignLearnerRequest(BaseModel):
    learner_id: str


def _get_project_or_404(project_id: str, admin_id: str, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.admin_id != admin_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("")
async def list_projects(
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    projects = session.exec(select(Project).where(Project.admin_id == admin.id)).all()
    result = []
    for p in projects:
        learner_count = session.exec(
            select(func.count()).where(ProjectAssignment.project_id == p.id)
        ).one()
        result.append({**p.model_dump(), "learner_count": learner_count})
    return result


@router.post("", status_code=201)
async def create_project(
    body: ProjectCreate,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    project = Project(**body.model_dump(), admin_id=admin.id)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.get("/{project_id}")
async def get_project(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    project = _get_project_or_404(project_id, admin.id, session)
    assignments = session.exec(
        select(ProjectAssignment).where(ProjectAssignment.project_id == project_id)
    ).all()
    learners = []
    for a in assignments:
        user = session.get(User, a.learner_id)
        if user:
            learners.append({"id": user.id, "email": user.email})
    return {**project.model_dump(), "learners": learners}


@router.patch("/{project_id}")
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    project = _get_project_or_404(project_id, admin.id, session)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    project.updated_at = datetime.now(timezone.utc)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    project = _get_project_or_404(project_id, admin.id, session)
    # remove dependent rows to avoid FK constraint IntegrityError
    # order matters: children first, then project
    session.exec(delete(ProjectAssignment).where(ProjectAssignment.project_id == project_id))
    session.exec(delete(QuizAttempt).where(QuizAttempt.project_id == project_id))
    session.exec(delete(Question).where(Question.project_id == project_id))
    session.exec(delete(LearnerProgress).where(LearnerProgress.project_id == project_id))
    # module_completions → learning_modules → learning_paths
    lp_ids = select(LearningPath.id).where(LearningPath.project_id == project_id)
    lm_ids = select(LearningModule.id).where(LearningModule.learning_path_id.in_(lp_ids))
    session.exec(delete(ModuleCompletion).where(ModuleCompletion.module_id.in_(lm_ids)))
    session.exec(delete(LearningModule).where(LearningModule.learning_path_id.in_(lp_ids)))
    session.exec(delete(LearningPath).where(LearningPath.project_id == project_id))
    # documents and chunks
    session.exec(delete(DocumentChunk).where(DocumentChunk.project_id == project_id))
    session.exec(delete(Document).where(Document.project_id == project_id))
    # finally delete the project
    session.delete(project)
    session.commit()


@router.post("/{project_id}/learners", status_code=201)
async def assign_learner(
    project_id: str,
    body: AssignLearnerRequest,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    learner = session.get(User, body.learner_id)
    if not learner or learner.role != "learner":
        raise HTTPException(status_code=404, detail="Learner not found")
    existing = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == body.learner_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Already assigned")
    assignment = ProjectAssignment(project_id=project_id, learner_id=body.learner_id)
    session.add(assignment)
    session.commit()
    session.refresh(assignment)
    return assignment


@router.delete("/{project_id}/learners/{learner_id}", status_code=204)
async def remove_learner(
    project_id: str,
    learner_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_404(project_id, admin.id, session)
    assignment = session.exec(
        select(ProjectAssignment).where(
            ProjectAssignment.project_id == project_id,
            ProjectAssignment.learner_id == learner_id,
        )
    ).first()
    if assignment:
        session.delete(assignment)
        session.commit()
