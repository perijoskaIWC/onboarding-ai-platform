import tiktoken
from openai import AsyncAzureOpenAI
from sqlalchemy.engine import Engine
from sqlmodel import Session

from ..models.document import Document
from ..models.document_chunk import DocumentChunk


def chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    enc = tiktoken.get_encoding("cl100k_base")
    tokens = enc.encode(text)
    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(enc.decode(chunk_tokens))
        if end == len(tokens):
            break
        start += chunk_size - overlap
    return chunks


async def embed_chunks(chunks: list[str], openai_client: AsyncAzureOpenAI, model: str) -> list[list[float]]:
    response = await openai_client.embeddings.create(input=chunks, model=model, dimensions=1536)
    return [item.embedding for item in response.data]


async def ingest_document(
    document_id: str,
    engine: Engine,
    openai_client: AsyncAzureOpenAI,
    embedding_model: str,
) -> None:
    with Session(engine) as session:
        document = session.get(Document, document_id)
        if not document:
            return

        document.ingestion_status = "processing"
        session.add(document)
        session.commit()

        try:
            from ..models.project import Project
            project = session.get(Project, document.project_id)
            chunk_size = project.chunk_size if project else 500
            chunk_overlap = project.chunk_overlap if project else 50

            chunks = chunk_text(document.raw_content, chunk_size, chunk_overlap)
            if not chunks:
                raise ValueError("Document produced no text chunks")

            embeddings = await embed_chunks(chunks, openai_client, embedding_model)

            enc = tiktoken.get_encoding("cl100k_base")
            for i, (text, emb) in enumerate(zip(chunks, embeddings)):
                session.add(
                    DocumentChunk(
                        document_id=document_id,
                        project_id=document.project_id,
                        chunk_index=i,
                        content=text,
                        token_count=len(enc.encode(text)),
                        embedding=emb,
                    )
                )

            document.ingestion_status = "ready"
            document.ingestion_error = None
            session.add(document)
            session.commit()

        except Exception as exc:
            document.ingestion_status = "failed"
            document.ingestion_error = str(exc)
            session.add(document)
            session.commit()
