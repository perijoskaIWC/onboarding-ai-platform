import json
from fastapi import Request
from openai import AsyncOpenAI
from sqlmodel import Session, select

from ..models.document_chunk import DocumentChunk
from ..models.learning_path import LearningPath
from ..models.learning_module import LearningModule


SEED_QUERIES = [
    "introduction and overview of key concepts",
    "procedures workflows and step-by-step processes",
    "rules requirements and compliance",
    "roles responsibilities and team structure",
    "practical application and examples",
]


def get_openai_client(request: Request) -> AsyncOpenAI:
    return request.app.state.openai_client


async def _retrieve_chunks(
    query: str,
    project_id: str,
    top_k: int,
    session: Session,
    openai_client: AsyncOpenAI,
    embedding_model: str,
) -> list[DocumentChunk]:
    from sqlalchemy import text
    emb_response = await openai_client.embeddings.create(
        input=[query], model=embedding_model, dimensions=1536
    )
    vec = emb_response.data[0].embedding
    return session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.project_id == project_id)
        .order_by(text("embedding <=> CAST(:vec AS vector)").bindparams(vec=str(vec)))
        .limit(top_k)
    ).all()


async def generate_learning_path(
    project_id: str,
    learner_id: str,
    session: Session,
    openai_client: AsyncOpenAI,
    chat_model: str,
    embedding_model: str,
    path_name: str = "Standard",
    duration_weeks: int = 4,
    custom_instruction: str = "",
) -> LearningPath:
    from ..models.module_chunk import ModuleChunk

    # RAG retrieval: instruction query for focused coverage, or multi-seed for broad coverage
    if custom_instruction.strip():
        sample = list(await _retrieve_chunks(custom_instruction, project_id, 40, session, openai_client, embedding_model))
    else:
        seen_ids: set = set()
        sample = []
        for q in SEED_QUERIES:
            for c in await _retrieve_chunks(q, project_id, 8, session, openai_client, embedding_model):
                if c.id not in seen_ids:
                    seen_ids.add(c.id)
                    sample.append(c)

    if not sample:
        raise ValueError("No document chunks available for this project")

    sample.sort(key=lambda c: (c.document_id, c.chunk_index))

    numbered_corpus = "\n\n---\n\n".join(
        f"[Chunk {i}]\n{c.content}" for i, c in enumerate(sample)
    )

    min_modules = max(3, duration_weeks)
    max_modules = max(4, duration_weeks * 2)

    if custom_instruction.strip():
        style_hint = custom_instruction.strip()
    else:
        style_hint = "Balance breadth and depth, ordered from foundational to advanced."

    style_hint += f" Create between {min_modules} and {max_modules} modules total, aiming for roughly 1-2 modules per week."

    system_prompt = (
        "You are an expert onboarding curriculum designer. "
        "Given the numbered document chunks below, create a structured learning path spread across "
        f"{duration_weeks} weeks. {style_hint} "
        f"Distribute modules across weeks 1 to {duration_weeks}. "
        "Multiple modules may share the same week. "
        "For each module, list the indices of ALL chunks that belong to that topic in 'chunk_indices'. "
        "Every chunk must be assigned to at least one module — do not leave any chunk unassigned. "
        "Respond ONLY with valid JSON matching this schema exactly:\n"
        '{"overview": "<string>", "modules": [{"title": "<string>", "summary": "<string>", '
        '"key_concepts": "<comma-separated string>", '
        f'"week_number": <integer 1 to {duration_weeks}>, '
        '"chunk_indices": [<integer>, ...]}]}\n'
        "No markdown fences."
    )

    response = await openai_client.chat.completions.create(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Learning material:\n\n{numbered_corpus}"},
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
        path_name=path_name,
    )
    session.add(path)
    session.flush()

    for i, mod in enumerate(data.get("modules", [])):
        lm = LearningModule(
            learning_path_id=path.id,
            order_index=i,
            title=mod.get("title", ""),
            summary=mod.get("summary", ""),
            key_concepts=mod.get("key_concepts", ""),
            week_number=max(1, min(int(mod.get("week_number", 1)), duration_weeks)),
        )
        session.add(lm)
        session.flush()

        for order, ci in enumerate(mod.get("chunk_indices", [])):
            if isinstance(ci, int) and 0 <= ci < len(sample):
                session.add(ModuleChunk(
                    module_id=lm.id,
                    chunk_id=sample[ci].id,
                    order_index=order,
                ))

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
    chunks = await _retrieve_chunks(question, project_id, top_k, session, openai_client, embedding_model)

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
    embedding_model: str,
    modules=None,
) -> list[dict]:
    # RAG retrieval: module-aware if LP exists, otherwise broad seed queries
    if modules:
        seen_ids: set = set()
        chunks_list = []
        per_module = max(3, quiz_length // len(modules))
        for mod in modules:
            query = f"{mod.title} {mod.key_concepts}".strip()
            for c in await _retrieve_chunks(query, project_id, per_module, session, openai_client, embedding_model):
                if c.id not in seen_ids:
                    seen_ids.add(c.id)
                    chunks_list.append(c)
    else:
        seen_ids = set()
        chunks_list = []
        for q in SEED_QUERIES:
            for c in await _retrieve_chunks(q, project_id, quiz_length, session, openai_client, embedding_model):
                if c.id not in seen_ids:
                    seen_ids.add(c.id)
                    chunks_list.append(c)

    if not chunks_list:
        raise ValueError("No document chunks available for this project")

    corpus = "\n\n---\n\n".join(c.content for c in chunks_list)

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


async def generate_adaptive_questions(
    project_id: str,
    score: float,
    wrong_topics: list[str],
    session: Session,
    openai_client: AsyncOpenAI,
    chat_model: str,
    embedding_model: str,
    count: int = 3,
) -> list[dict]:
    # RAG retrieval: retrieve chunks relevant to wrong topics, or broad seed if no wrong topics
    if wrong_topics:
        seen_ids: set = set()
        chunks_list = []
        for topic in wrong_topics[:3]:
            for c in await _retrieve_chunks(topic, project_id, 5, session, openai_client, embedding_model):
                if c.id not in seen_ids:
                    seen_ids.add(c.id)
                    chunks_list.append(c)
    else:
        seen_ids = set()
        chunks_list = []
        for q in SEED_QUERIES[:3]:
            for c in await _retrieve_chunks(q, project_id, count * 2, session, openai_client, embedding_model):
                if c.id not in seen_ids:
                    seen_ids.add(c.id)
                    chunks_list.append(c)

    if not chunks_list:
        return []

    corpus = "\n\n---\n\n".join(c.content for c in chunks_list)

    if score >= 0.8:
        difficulty = "harder"
        style = "challenging, requiring deeper analysis or application of concepts"
    elif score <= 0.4:
        difficulty = "easier"
        style = "straightforward, reinforcing fundamental concepts clearly"
    else:
        difficulty = "standard"
        style = "moderate difficulty, covering key concepts"

    topic_hint = ""
    if wrong_topics:
        topic_hint = f" Focus on these topics where the learner struggled: {', '.join(wrong_topics[:3])}."

    system_prompt = (
        f"You are a quiz designer. Generate exactly {count} {style} multiple-choice questions from the learning material.{topic_hint} "
        'Respond ONLY with a valid JSON object: '
        '{"questions": [{"question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "answer": "A", "explanation": "..."}]} '
        "No markdown fences."
    )

    response = await openai_client.chat.completions.create(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Learning material:\n\n{corpus}"},
        ],
        temperature=0.5,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)
    if isinstance(data, dict):
        data = next(iter(data.values()))

    return [(item, difficulty) for item in data[:count]]


async def orchestrate(
    message: str,
    project_id: str,
    learner_id: str,
    learner_context: dict,
    top_k: int,
    session: Session,
    openai_client: AsyncOpenAI,
    embedding_model: str,
    chat_model: str,
) -> dict:
    """Route message to the appropriate specialist agent and return a combined response."""

    route_response = await openai_client.chat.completions.create(
        model=chat_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a routing agent. Classify the learner's message into exactly one of these intents:\n"
                    "- tutor: questions about learning material, concepts, definitions, explanations\n"
                    "- quiz_advisor: questions about quiz performance, scores, mistakes, what to study\n"
                    "- path_advisor: questions about learning path, module order, what to do next, progress\n"
                    "Respond with ONLY the intent word. No other text."
                ),
            },
            {"role": "user", "content": message},
        ],
        temperature=0,
        max_tokens=10,
    )
    intent = route_response.choices[0].message.content.strip().lower()
    if intent not in ("tutor", "quiz_advisor", "path_advisor"):
        intent = "tutor"

    if intent == "tutor":
        result = await rag_chat(
            question=message,
            project_id=project_id,
            learner_id=learner_id,
            top_k=top_k,
            session=session,
            openai_client=openai_client,
            embedding_model=embedding_model,
            chat_model=chat_model,
        )
        return {"agent": "tutor", "agent_label": "AI Tutor", **result}

    elif intent == "quiz_advisor":
        score = learner_context.get("quiz_score")
        correct = learner_context.get("quiz_correct")
        total = learner_context.get("quiz_total")
        score_context = (
            f"The learner's latest quiz score: {correct}/{total} ({round((score or 0)*100)}%)."
            if score is not None else "No quiz attempts on record yet."
        )
        response = await openai_client.chat.completions.create(
            model=chat_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a quiz performance advisor. Help the learner understand their quiz results "
                        "and what to focus on. Be encouraging and specific. "
                        f"Context: {score_context}"
                    ),
                },
                {"role": "user", "content": message},
            ],
            temperature=0.3,
        )
        return {
            "agent": "quiz_advisor",
            "agent_label": "Quiz Advisor",
            "answer": response.choices[0].message.content,
            "sources": [],
        }

    else:  # path_advisor
        modules_done = learner_context.get("modules_completed", 0)
        modules_total = learner_context.get("modules_total", 0)
        path_context = (
            f"The learner has completed {modules_done} of {modules_total} modules."
            if modules_total else "No learning path generated yet."
        )
        response = await openai_client.chat.completions.create(
            model=chat_model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a learning path advisor. Help the learner understand their progress "
                        "and decide what to study next. Be motivating and practical. "
                        f"Context: {path_context}"
                    ),
                },
                {"role": "user", "content": message},
            ],
            temperature=0.3,
        )
        return {
            "agent": "path_advisor",
            "agent_label": "Path Advisor",
            "answer": response.choices[0].message.content,
            "sources": [],
        }
