import asyncio
import json
import random
from fastapi import Request
from openai import AsyncOpenAI
from sqlmodel import Session, select

from ..models.document_chunk import DocumentChunk
from ..models.learning_path import LearningPath
from ..models.learning_module import LearningModule


def _parse_questions(raw: str) -> list[dict]:
    data = json.loads(raw)
    if isinstance(data, dict):
        # Find the first list value, not just the first value
        for v in data.values():
            if isinstance(v, list):
                return v
        raise ValueError(f"No question list found in response keys: {list(data.keys())}")
    if isinstance(data, list):
        return data
    raise ValueError("Unexpected response shape from model")


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


async def compose_module_content(
    title: str,
    summary: str,
    key_concepts: str,
    source_texts: list[str],
    openai_client: AsyncOpenAI,
    chat_model: str,
) -> str:
    """Rewrite a module's raw source excerpts into clean, learner-facing Markdown.
    Used at generation time and by the on-demand 'draft content' endpoint."""
    if not source_texts:
        return ""
    corpus = "\n\n---\n\n".join(t.strip() for t in source_texts if t and t.strip())
    if not corpus:
        return ""

    system_prompt = (
        "You are an onboarding curriculum writer. Rewrite the raw source excerpts "
        "into a clean, well-structured Markdown lesson for ONE module. "
        "Use ## and ### headings, short paragraphs, bullet lists, and Markdown tables "
        "where the source implies tabular data. Preserve every concrete fact, name, "
        "number, and tool from the sources — do NOT invent information that isn't there. "
        "Do not include a top-level # title (the module title is shown separately). "
        "Write in clear, professional prose suitable for a new hire."
    )
    user_prompt = (
        f"Module title: {title}\n"
        f"Summary: {summary}\n"
        f"Key concepts: {key_concepts}\n\n"
        f"Raw source excerpts:\n\n{corpus}"
    )
    resp = await openai_client.chat.completions.create(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
    )
    return (resp.choices[0].message.content or "").strip()


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
    document_ids: list[str] | None = None,
) -> LearningPath:
    from ..models.module_chunk import ModuleChunk

    doc_filter = document_ids if document_ids else None

    # RAG retrieval: instruction query for focused coverage, or multi-seed for broad coverage
    if custom_instruction.strip():
        sample = list(await _retrieve_chunks(custom_instruction, project_id, 40, session, openai_client, embedding_model, doc_filter))
    else:
        seen_ids: set = set()
        sample = []
        for q in SEED_QUERIES:
            for c in await _retrieve_chunks(q, project_id, 8, session, openai_client, embedding_model, doc_filter):
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

    created: list[tuple[LearningModule, list[str]]] = []
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

        source_texts: list[str] = []
        for order, ci in enumerate(mod.get("chunk_indices", [])):
            if isinstance(ci, int) and 0 <= ci < len(sample):
                session.add(ModuleChunk(
                    module_id=lm.id,
                    chunk_id=sample[ci].id,
                    order_index=order,
                ))
                source_texts.append(sample[ci].content)
        created.append((lm, source_texts))

    # Compose clean Markdown content for each module concurrently.
    import asyncio
    contents = await asyncio.gather(*[
        compose_module_content(lm.title, lm.summary, lm.key_concepts, texts, openai_client, chat_model)
        for lm, texts in created
    ], return_exceptions=True)
    for (lm, _), c in zip(created, contents):
        if isinstance(c, str) and c:
            lm.content = c
            session.add(lm)

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


async def _retrieve_chunks_multi(
    query: str,
    project_ids: list[str],
    top_k: int,
    session: Session,
    openai_client: AsyncOpenAI,
    embedding_model: str,
) -> list[DocumentChunk]:
    """Vector search across several projects at once (global tutor)."""
    from sqlalchemy import text
    if not project_ids:
        return []
    emb_response = await openai_client.embeddings.create(
        input=[query], model=embedding_model, dimensions=1536
    )
    vec = emb_response.data[0].embedding
    return session.exec(
        select(DocumentChunk)
        .where(DocumentChunk.project_id.in_(project_ids))
        .order_by(text("embedding <=> CAST(:vec AS vector)").bindparams(vec=str(vec)))
        .limit(top_k)
    ).all()


async def rag_chat_global(
    question: str,
    project_ids: list[str],
    session: Session,
    openai_client: AsyncOpenAI,
    embedding_model: str,
    chat_model: str,
    top_k: int = 8,
) -> dict:
    """RAG answer grounded in ALL documents across the projects the learner is
    assigned to. Citations reference document filenames."""
    from ..models.document import Document
    from ..models.project import Project

    if not project_ids:
        return {"answer": "You don't have any assigned materials yet, so there's nothing for me to search. Ask your manager to assign you a learning path.", "sources": []}

    chunks = await _retrieve_chunks_multi(question, project_ids, top_k, session, openai_client, embedding_model)
    if not chunks:
        return {"answer": "I couldn't find anything relevant in your onboarding materials for that question.", "sources": []}

    # Map chunk -> document filename / project name for labelled context + citations.
    doc_ids = {c.document_id for c in chunks}
    docs = {d.id: d for d in session.exec(select(Document).where(Document.id.in_(doc_ids))).all()}
    proj_ids = {c.project_id for c in chunks}
    projects = {p.id: p for p in session.exec(select(Project).where(Project.id.in_(proj_ids))).all()}

    def label(c):
        d = docs.get(c.document_id)
        return d.filename if d else "document"

    context = "\n\n---\n\n".join(
        f"[{i+1}] (from \"{label(c)}\")\n{c.content}" for i, c in enumerate(chunks)
    )

    system_prompt = (
        "You are Atlas, a helpful onboarding tutor. Answer the learner's question using ONLY "
        "the provided document excerpts, which may come from several different documents. "
        "Cite the source filename(s) you used. Be clear and concise. "
        "If the answer is not in the excerpts, say: 'I cannot answer this based on your current onboarding materials.'"
    )

    response = await openai_client.chat.completions.create(
        model=chat_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Document excerpts:\n{context}\n\nQuestion: {question}"},
        ],
        temperature=0.2,
    )

    # De-duplicated source list keyed by document.
    seen = set()
    sources = []
    for c in chunks:
        if c.document_id in seen:
            continue
        seen.add(c.document_id)
        d = docs.get(c.document_id)
        sources.append({
            "document_id": c.document_id,
            "filename": d.filename if d else "document",
            "project_id": c.project_id,
            "project_name": projects[c.project_id].name if c.project_id in projects else "",
        })

    return {"answer": response.choices[0].message.content, "sources": sources}


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
        temperature=round(random.uniform(0.4, 0.7), 2),
        response_format={"type": "json_object"},
    )

    return _parse_questions(response.choices[0].message.content)[:quiz_length]


async def generate_questions_for_path(
    path_id: str,
    project_id: str,
    quiz_length: int,
    session: Session,
    openai_client: AsyncOpenAI,
    chat_model: str,
    embedding_model: str,
) -> list[tuple[dict, str, str]]:
    """Generate questions per module using that module's assigned chunks.
    Returns list of (question_dict, module_id, path_id) triples."""
    from ..models.module_chunk import ModuleChunk
    from ..models.document_chunk import DocumentChunk as DC

    modules = session.exec(
        select(LearningModule)
        .where(LearningModule.learning_path_id == path_id)
        .order_by(LearningModule.order_index)
    ).all()

    if not modules:
        return []

    # Distribute quiz_length across modules, spreading the remainder across early modules
    base = quiz_length // len(modules)
    remainder = quiz_length % len(modules)
    counts = [base + (1 if i < remainder else 0) for i in range(len(modules))]

    # Fetch all module chunks upfront (sync, no parallelism needed)
    module_corpora = []
    for module in modules:
        chunks = session.exec(
            select(DC)
            .join(ModuleChunk, ModuleChunk.chunk_id == DC.id)
            .where(ModuleChunk.module_id == module.id)
            .order_by(ModuleChunk.order_index)
        ).all()
        module_corpora.append(chunks)

    # Build all GPT calls and fire them in parallel
    async def _call(module, corpus_chunks, n):
        if not corpus_chunks or n == 0:
            return []
        corpus = "\n\n---\n\n".join(c.content for c in corpus_chunks)
        system_prompt = (
            f"You are a quiz designer. Generate exactly {n} multiple-choice questions "
            f"testing knowledge of: {module.title}. Use ONLY the provided learning material. "
            "Do NOT repeat questions that test the same concept. "
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
            temperature=round(random.uniform(0.4, 0.7), 2),
            response_format={"type": "json_object"},
        )
        return _parse_questions(response.choices[0].message.content)[:n]

    responses = await asyncio.gather(*[
        _call(mod, chunks, n)
        for mod, chunks, n in zip(modules, module_corpora, counts)
    ])

    # Deduplicate across modules by question text
    seen_questions: set[str] = set()
    results = []
    for module, items in zip(modules, responses):
        for item in items:
            key = item.get("question", "").strip().lower()
            if key and key not in seen_questions:
                seen_questions.add(key)
                results.append((item, module.id, path_id))

    return results


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
