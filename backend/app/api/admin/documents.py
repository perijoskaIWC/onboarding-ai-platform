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
from ...models.module_chunk import ModuleChunk
from ...models.question import Question
from ...services.ingestion import ingest_document

router = APIRouter(tags=["admin-documents"])


def _clean_text(text: str) -> str:
    import unicodedata
    # Normalize unicode (e.g. fancy quotes, dashes, ellipsis)
    text = unicodedata.normalize("NFKC", text)
    # Replace common Windows-1252 bullet/dash variants with clean ASCII
    replacements = {
        "•": "-",   # bullet •
        "‣": "-",   # triangular bullet
        "●": "-",   # black circle ●
        "–": "-",   # en-dash –
        "—": "-",   # em-dash —
        "‘": "'",   # left single quote '
        "’": "'",   # right single quote '
        "“": '"',   # left double quote "
        "”": '"',   # right double quote "
        "…": "...", # ellipsis …
        " ": " ",   # non-breaking space
        "\r\n": "\n",
        "\r": "\n",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text

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
    try:
        raw_text = content.decode("utf-8")
    except UnicodeDecodeError:
        raw_text = content.decode("latin-1")  # covers Windows-1252
    raw_text = _clean_text(raw_text)
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


@router.post("/admin/projects/{project_id}/documents/{doc_id}/reprocess", status_code=202)
async def reprocess_document(
    project_id: str,
    doc_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    admin=Depends(require_admin),
    session: Session = Depends(get_session),
):
    _get_project_or_403(project_id, admin.id, session)
    doc = session.get(Document, doc_id)
    if not doc or doc.project_id != project_id:
        raise HTTPException(status_code=404, detail="Document not found")
    # clear old chunks and reset status
    session.exec(delete(DocumentChunk).where(DocumentChunk.document_id == doc_id))
    doc.ingestion_status = "pending"
    doc.ingestion_error = None
    session.add(doc)
    session.commit()
    openai_client = request.app.state.openai_client
    background_tasks.add_task(
        ingest_document, doc.id, engine, openai_client, settings.azure_openai_embedding_deployment
    )
    return {"id": doc.id, "ingestion_status": "pending"}


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
                lm_ids = select(LearningModule.id).where(LearningModule.learning_path_id == path.id)
                session.exec(delete(ModuleChunk).where(ModuleChunk.module_id.in_(lm_ids)))
                session.exec(delete(LearningModule).where(LearningModule.learning_path_id == path.id))
            session.exec(delete(LearningPath).where(LearningPath.project_id == project_id))
            session.exec(delete(Question).where(Question.project_id == project_id))
            session.commit()
    except Exception:
        import traceback
        print(f"Exception deleting document {doc_id}:")
        print(traceback.format_exc())
        raise
