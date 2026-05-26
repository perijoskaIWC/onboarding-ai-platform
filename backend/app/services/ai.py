import json
from fastapi import Request
from openai import AsyncOpenAI
from sqlmodel import Session, select

from ..models.document_chunk import DocumentChunk
from ..models.learning_path import LearningPath
from ..models.learning_module import LearningModule


def get_openai_client(request: Request) -> AsyncOpenAI:
    return request.app.state.openai_client


async def generate_learning_path(
    project_id: str,
    learner_id: str,
    session: Session,
    openai_client: AsyncOpenAI,
    chat_model: str,
) -> LearningPath:
    chunks = session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.project_id == project_id)
        .order_by(DocumentChunk.document_id, DocumentChunk.chunk_index)
    ).all()

    if not chunks:
        raise ValueError("No document chunks available for this project")

    corpus = "\n\n---\n\n".join(c.content for c in chunks[:80])

    system_prompt = (
        "You are an expert onboarding curriculum designer. "
        "Given the provided learning material, create a structured learning path. "
        "Respond ONLY with valid JSON matching this schema exactly:\n"
        '{"overview": "<string>", "modules": [{"title": "<string>", "summary": "<string>", "key_concepts": "<comma-separated string>"}]}\n'
        "Include 3-7 modules ordered from foundational to advanced. No markdown fences."
    )

    response = await openai_client.chat.completions.create(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Learning material:\n\n{corpus}"},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)

    path = LearningPath(
        project_id=project_id,
        learner_id=learner_id,
        overview=data.get("overview", ""),
    )
    session.add(path)
    session.flush()

    for i, mod in enumerate(data.get("modules", [])):
        session.add(
            LearningModule(
                learning_path_id=path.id,
                order_index=i,
                title=mod.get("title", ""),
                summary=mod.get("summary", ""),
                key_concepts=mod.get("key_concepts", ""),
            )
        )

    session.commit()
    session.refresh(path)
    return path


async def rag_chat(
    question: str,
    project_id: str,
    learner_id: str,
    top_k: int,
    session: Session,
    openai_client: AsyncOpenAI,
    embedding_model: str,
    chat_model: str,
) -> dict:
    emb_response = await openai_client.embeddings.create(
        input=[question], model=embedding_model, dimensions=1536
    )
    question_embedding = emb_response.data[0].embedding

    from sqlalchemy import text
    chunks = session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.project_id == project_id)
        .order_by(
            text("embedding <=> CAST(:vec AS vector)").bindparams(
                vec=str(question_embedding)
            )
        )
        .limit(top_k)
    ).all()

    if not chunks:
        return {
            "answer": "I cannot answer this question because no relevant documents were found for this project.",
            "sources": [],
        }

    context = "\n\n---\n\n".join(
        f"[Chunk {i+1}] {c.content}" for i, c in enumerate(chunks)
    )

    system_prompt = (
        "You are a helpful onboarding assistant. Answer the learner's question using ONLY "
        "the provided document chunks. Always cite the chunk number(s) you used (e.g. [Chunk 1]). "
        "If the answer is not in the chunks, say: 'I cannot answer this question based on the available documents.'"
    )

    response = await openai_client.chat.completions.create(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Document chunks:\n{context}\n\nQuestion: {question}"},
        ],
        temperature=0.2,
    )

    return {
        "answer": response.choices[0].message.content,
        "sources": [
            {"chunk_id": c.id, "document_id": c.document_id, "chunk_index": c.chunk_index}
            for c in chunks
        ],
    }


async def generate_questions(
    project_id: str,
    quiz_length: int,
    session: Session,
    openai_client: AsyncOpenAI,
    chat_model: str,
) -> list[dict]:
    chunks = session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.project_id == project_id)
        .order_by(DocumentChunk.document_id, DocumentChunk.chunk_index)
    ).all()

    if not chunks:
        raise ValueError("No document chunks available for this project")

    import random
    sample = random.sample(chunks, min(quiz_length * 3, len(chunks)))
    corpus = "\n\n---\n\n".join(c.content for c in sample)

    system_prompt = (
        f"You are a quiz designer. Generate exactly {quiz_length} multiple-choice questions from the learning material. "
        'Respond ONLY with a valid JSON object in this exact format: '
        '{"questions": [{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "..."}]} '
        "No markdown fences."
    )

    response = await openai_client.chat.completions.create(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Learning material:\n\n{corpus}"},
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)
    if isinstance(data, dict):
        data = next(iter(data.values()))
    return data[:quiz_length]
