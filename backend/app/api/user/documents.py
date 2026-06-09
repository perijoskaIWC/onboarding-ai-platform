from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ...core.database import get_session
from ...core.security import require_learner
from ...models.document import Document
from ...models.project import Project
from ...models.project_assignment import ProjectAssignment

router = APIRouter(prefix="/documents", tags=["user-documents"])


def _assigned_project_ids(learner_id: str, session: Session) -> set[str]:
    return set(session.exec(
        select(ProjectAssignment.project_id).where(ProjectAssignment.learner_id == learner_id)
    ).all())


@router.get("")
async def list_documents(
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    """All documents across every project the learner is assigned to."""
    project_ids = _assigned_project_ids(learner.id, session)
    if not project_ids:
        return []

    projects = {p.id: p for p in session.exec(select(Project).where(Project.id.in_(project_ids))).all()}
    docs = session.exec(
        select(Document).where(Document.project_id.in_(project_ids))
    ).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "ingestion_status": d.ingestion_status,
            "project_id": d.project_id,
            "project_name": projects[d.project_id].name if d.project_id in projects else "",
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
        }
        for d in docs
    ]


@router.get("/{document_id}")
async def read_document(
    document_id: str,
    learner=Depends(require_learner),
    session: Session = Depends(get_session),
):
    """Full text of one document — only if it belongs to a project the learner is assigned to."""
    doc = session.get(Document, document_id)
    if not doc or doc.project_id not in _assigned_project_ids(learner.id, session):
        raise HTTPException(status_code=404, detail="Document not found")
    project = session.get(Project, doc.project_id)
    return {
        "id": doc.id,
        "filename": doc.filename,
        "file_type": doc.file_type,
        "project_id": doc.project_id,
        "project_name": project.name if project else "",
        "content": doc.raw_content,
    }
