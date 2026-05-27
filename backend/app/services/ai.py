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
    document_ids: list[str] | None = None,
) -> list[DocumentChunk]:
    from sqlalchemy import text
    emb_response = await openai_client.embeddings.create(
        input=[query], model=embedding_model, dimensions=1536
    )
    vec = emb_response.data[0].embedding
    q = select(DocumentChunk).where(DocumentChunk.project_id == project_id)
    if document_ids:
        q = q.where(DocumentChunk.document_id.in_(document_ids))
    return session.exec(
        q.order_by(text("embedding <=> CAST(:vec AS vector)").bindparams(vec=str(vec)))
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

    # Parse explicit module count from instruction (e.g. "6 modules")
    import re as _re
    explicit_modules = None
    if custom_instruction:
        m_match = _re.search(r'\b(\d+)\s+module', custom_instruction, _re.IGNORECASE)
        if m_match:
            explicit_modules = int(m_match.group(1))
        # Also honour "X weeks" in the instruction as a belt-and-suspenders override
        w_match = _re.search(r'\b(\d+)\s+week', custom_instruction, _re.IGNORECASE)
        if w_match:
            duration_weeks = int(w_match.group(1))

    if explicit_modules:
        module_constraint = f"You MUST create EXACTLY {explicit_modules} modules — no more, no fewer."
    else:
        min_modules = max(3, duration_weeks)
        max_modules = max(4, duration_weeks * 2)
        module_constraint = f"Create between {min_modules} and {max_modules} modules total."

    if custom_instruction.strip():
        style_hint = custom_instruction.strip()
    else:
        style_hint = "Balance breadth and depth, ordered from foundational to advanced."

    system_prompt = (
        "You are an expert onboarding curriculum designer. "
        f"Given the numbered document chunks below, create a structured learning path spread across EXACTLY {duration_weeks} weeks. "
        f"{module_constraint} "
        f"Distribute modules evenly across weeks 1 to {duration_weeks}. "
        "Multiple modules may share the same week. "
        f"Additional instruction: {style_hint} "
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


async def path_designer_chat(
    message: str,
    history: list[dict],
    path_context: dict,
    project_name: str,
    project_id: str,
    duration_weeks: int,
    openai_client: AsyncOpenAI,
    chat_model: str,
    embedding_model: str,
    session,
    document_ids: list[str] | None = None,
) -> dict:
    """Conversational path designer with RAG. Returns reply + optional regenerate action."""
    import re

    modules = path_context.get("modules", [])
    if modules:
        modules_summary = "\n".join(
            f"  - Week {m.get('week_number', i + 1)}: {m.get('title', '')} — {(m.get('summary') or '')[:80]}"
            for i, m in enumerate(modules)
        )
    else:
        modules_summary = "  No learning path generated yet."

    # RAG: retrieve chunks relevant to the user's message
    rag_context = ""
    try:
        chunks = await _retrieve_chunks(message, project_id, 6, session, openai_client, embedding_model, document_ids or None)
        if chunks:
            rag_context = "\n\nRelevant source material from uploaded documents:\n" + "\n---\n".join(
                f"[Chunk {i+1}]: {c.content[:300]}" for i, c in enumerate(chunks)
            )
    except Exception:
        pass

    system_prompt = (
        f"You are Atlas, an expert AI learning path designer.\n\n"
        f"Project: {project_name}\n"
        f"Duration: {duration_weeks} weeks\n"
        f"Current path ({len(modules)} modules):\n{modules_summary}\n"
        f"{rag_context}\n\n"
        "Your job is to help the admin refine the learning path through natural conversation.\n"
        "- For questions about document content or what topics are covered: answer using the source material above.\n"
        "- For questions about the path structure: answer using the current path summary.\n"
        "- For any change request (duration, topics, difficulty, structure, content focus): "
        "explain what you will do in 1-2 sentences, then append EXACTLY this JSON block at the end "
        "(no text after it):\n"
        '<action>{"type":"regenerate","instruction":"<full precise instruction including EXACT week count and EXACT module count if specified>","duration_weeks":<integer, required — use current duration if not changed>}</action>\n'
        "IMPORTANT: always set duration_weeks to an integer (never null). "
        "If the user specifies a module count, include it verbatim in the instruction field (e.g. 'Create exactly 6 modules for 3 weeks'). "
        "Never include the action block for questions or commentary."
    )

    messages = [{"role": "system", "content": system_prompt}]
    for h in (history or [])[-10:]:
        role = h.get("role") or ("assistant" if h.get("from") == "ai" else "user")
        messages.append({"role": role, "content": h.get("content") or h.get("text", "")})
    messages.append({"role": "user", "content": message})

    response = await openai_client.chat.completions.create(
        model=chat_model,
        messages=messages,
        temperature=0.4,
    )

    full_reply = response.choices[0].message.content.strip()

    action = None
    instruction = None
    duration_override = None
    m = re.search(r"<action>(.*?)</action>", full_reply, re.DOTALL)
    if m:
        reply_text = full_reply[: m.start()].strip()
        try:
            action_data = json.loads(m.group(1))
            action = action_data.get("type")
            instruction = action_data.get("instruction", "")
            raw_weeks = action_data.get("duration_weeks")
            duration_override = int(raw_weeks) if raw_weeks and str(raw_weeks).isdigit() else None
        except Exception:
            pass
    else:
        reply_text = full_reply

    return {
        "reply": reply_text,
        "action": action,
        "instruction": instruction,
        "duration_weeks": duration_override,
    }


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
