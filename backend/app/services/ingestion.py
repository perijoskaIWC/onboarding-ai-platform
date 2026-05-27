import asyncio
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
        chunks.append(enc.decode(tokens[start:end]))
        if end == len(tokens):
            break
        start += chunk_size - overlap
    return chunks


async def embed_chunks(chunks: list[str], openai_client: AsyncAzureOpenAI, model: str) -> list[list[float]]:
    batch_size = 16
    batches = [chunks[i:i + batch_size] for i in range(0, len(chunks), batch_size)]
    sem = asyncio.Semaphore(3)

    async def _embed_batch(batch):
        async with sem:
            response = await openai_client.embeddings.create(input=batch, model=model, dimensions=1536)
            return [item.embedding for item in response.data]

    results = await asyncio.gather(*[_embed_batch(b) for b in batches])
    return [emb for batch_result in results for emb in batch_result]


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
                if i % 50 == 49:
                    session.flush()

            document.ingestion_status = "ready"
            document.ingestion_error = None
            session.add(document)
            session.commit()

        except Exception as exc:
            document.ingestion_status = "failed"
            document.ingestion_error = str(exc)
            session.add(document)
            session.commit()
