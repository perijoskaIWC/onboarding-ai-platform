from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Request
from sqlmodel import Session, select, func, delete
from ...core.database import get_session, engine
from ...core.security import require_admin
from ...core.config import settings
from ...models.document import Document
from ...models.document_chunk import DocumentChunk
from ...models.project import Project
from ...models.learning_path import LearningPath
from ...models.learning_module import LearningModule
from ...models.question import Question
from ...services.ingestion import ingest_document

router = APIRouter(tags=["admin-documents"])

ALLOWED_TYPES = {"text/plain", "text/markdown", "text/x-markdown"}
ALLOWED_EXTS = {".txt", ".md"}


def _get_project_or_403(project_id: str, admin_id: str, session: Session) -> Project:
    project = session.get(Project, project_id)
    if not project or project.admin_id != admin_id:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("/admin/projects/{project_id}/documents", status_code=202)
async def upload_document(
    project_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_403(project_id, admin.id, session)

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=415, detail="Only .txt and .md files are supported")

    content = await file.read()
    raw_text = content.decode("utf-8", errors="replace")
    file_type = "md" if ext == ".md" else "txt"

    document = Document(
        project_id=project_id,
        filename=file.filename,
        file_type=file_type,
        raw_content=raw_text,
    )
    session.add(document)
    session.commit()
    session.refresh(document)

    openai_client = request.app.state.openai_client
    background_tasks.add_task(
        ingest_document,
        document.id,
        engine,
        openai_client,
        settings.azure_openai_embedding_deployment,
    )

    return {
        "id": document.id,
        "filename": document.filename,
        "ingestion_status": document.ingestion_status,
        "uploaded_at": document.uploaded_at,
    }


@router.get("/admin/projects/{project_id}/documents")
async def list_documents(
    project_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_403(project_id, admin.id, session)
    docs = session.exec(select(Document).where(Document.project_id == project_id)).all()
    result = []
    for d in docs:
        chunk_count = session.exec(
            select(func.count()).where(DocumentChunk.document_id == d.id)
        ).one()
        result.append({**d.model_dump(), "chunk_count": chunk_count})
    return result


@router.delete("/admin/projects/{project_id}/documents/{doc_id}", status_code=204)
async def delete_document(
    project_id: str,
    doc_id: str,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_403(project_id, admin.id, session)
    doc = session.get(Document, doc_id)
    if not doc or doc.project_id != project_id:
        raise HTTPException(status_code=404, detail="Document not found")
    # delete chunks first, then the document
    try:
        session.exec(delete(DocumentChunk).where(DocumentChunk.document_id == doc_id))
        session.exec(delete(Document).where(Document.id == doc_id))
        session.commit()

        remaining = session.exec(select(Document).where(Document.project_id == project_id)).first()
        if remaining is None:
            paths = session.exec(select(LearningPath).where(LearningPath.project_id == project_id)).all()
            for path in paths:
                session.exec(delete(LearningModule).where(LearningModule.learning_path_id == path.id))
            session.exec(delete(LearningPath).where(LearningPath.project_id == project_id))
            session.exec(delete(Question).where(Question.project_id == project_id))
            session.commit()
    except Exception:
        import traceback
        print(f"Exception deleting document {doc_id}:")
        print(traceback.format_exc())
        raise
