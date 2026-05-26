# Research: AI-Powered Employee Onboarding Platform

**Phase**: 0 — Implementation Decisions
**Branch**: `001-onboarding-ai-platform`
**Date**: 2026-05-26

No NEEDS CLARIFICATION markers were present in the spec. All technology choices are
mandated by the constitution. This document records the key implementation decisions
made during planning to guide Phase 1 design and downstream task generation.

---

## Decision 1: Token Counting and Chunking Strategy

**Decision**: Use `tiktoken` with the `cl100k_base` encoding (compatible with
`text-embedding-3-small` and `gpt-4o`) for token counting. Split documents by
token count with a sliding window: chunk_size=500, overlap=50 (configurable per
project in the `projects` table). Respect sentence boundaries where possible by
splitting on newlines before hitting the token limit.

**Rationale**: Fixed-token chunks with overlap give consistent retrieval behavior.
The overlap ensures context is not lost at chunk boundaries. `tiktoken` is the
official OpenAI tokenizer, ensuring token counts match what the API actually charges
and limits.

**Alternatives considered**:
- Character-based splitting: rejected — inconsistent with token limits, may truncate
  mid-word when sent to the API.
- Recursive text splitter (LangChain): rejected — the constitution prohibits LangChain.
  Implementing a simple recursive splitter in plain Python is straightforward.

---

## Decision 2: pgvector Index Type

**Decision**: Use the `hnsw` index type for the `document_chunks.embedding` column
with `m=16` and `ef_construction=64`. Index using `vector_cosine_ops`.

**Rationale**: HNSW (Hierarchical Navigable Small World) provides better recall at
query time compared to IVFFlat, with no need for a separate training step. For a
project at this scale (~50 users, thousands of chunks per project), HNSW is the
correct default. Cosine similarity is standard for embedding comparisons.

**Alternatives considered**:
- IVFFlat: requires specifying `lists` count at index creation time and needs a
  training step (inserting data before the index is useful). Less suitable for an
  incrementally-loaded dataset.
- Exact KNN (no index): acceptable for very small datasets but degrades at scale.
  HNSW is the safe default.

---

## Decision 3: JWT Token Strategy

**Decision**: Issue two tokens on login — a short-lived access token (15 minutes)
and a longer-lived refresh token (7 days). Store refresh tokens in the database
(hashed) to allow revocation. Access token carries `user_id` and `role` claims.

**Rationale**: Short-lived access tokens reduce the window of exposure if a token
is intercepted. Refresh tokens stored server-side allow forced logout (e.g., when a
Learner is removed from a project). The `role` claim in the access token enables
stateless role checking in FastAPI dependency functions without a DB lookup on every
request.

**Alternatives considered**:
- Single long-lived token: simpler but cannot be revoked without a denylist.
- Storing access tokens server-side: defeats the purpose of stateless JWT; adds
  unnecessary DB load.

---

## Decision 4: OpenAI Async Client

**Decision**: Use `openai.AsyncOpenAI()` client instantiated once at application
startup (as a FastAPI lifespan resource). Pass it to service functions via
dependency injection. All calls use `await`.

**Rationale**: `AsyncOpenAI` is the async variant of the OpenAI Python SDK client.
Creating it once avoids repeated initialization overhead. FastAPI's lifespan context
manager (replacing deprecated `startup`/`shutdown` events in FastAPI 0.93+) is the
correct place to manage shared resources.

**Alternatives considered**:
- `openai.OpenAI()` (sync): prohibited by the constitution — all AI calls must be async.
- Creating a new client per request: wasteful, re-reads environment variables and
  initializes HTTP transport on every request.

---

## Decision 5: SQLModel Table Creation vs. Migrations

**Decision**: Use `SQLModel.metadata.create_all(engine)` at application startup to
create tables if they do not exist. No separate migration tool. Schema changes during
development are handled by dropping and recreating tables (development) or by writing
raw `ALTER TABLE` SQL executed at startup (production patches).

**Rationale**: The constitution prohibits SQLAlchemy and Alembic as standalone
dependencies. SQLModel's `create_all` is sufficient for the initial build. The
platform is a new application with no existing data to preserve.

**Alternatives considered**:
- Alembic: prohibited by constitution.
- Yoyo migrations or raw SQL scripts: viable for future patches but adds a dependency.
  Out of scope for v1.

---

## Decision 6: Background Task Error Handling

**Decision**: Document ingestion runs as a FastAPI `BackgroundTask`. If ingestion
fails, the document's `ingestion_status` is updated to `"failed"` with an error
message stored in a `ingestion_error` column. The Admin can view the error and retry
by re-uploading. No automatic retry mechanism in v1.

**Rationale**: FastAPI `BackgroundTasks` do not have built-in retry logic. Storing
the error in the database gives the Admin visibility without requiring a separate
logging service. Manual re-upload is the simplest recovery path for v1.

**Alternatives considered**:
- Celery/Redis with retry queues: prohibited by constitution.
- In-memory retry loop: hides errors from the user and can cause request handler
  resource leaks if the background task hangs.

---

## Decision 7: Top-K Retrieval for RAG

**Decision**: Retrieve the top 5 most similar document chunks by cosine distance for
each RAG query (tunable per project). Include the full chunk text and the source
document name in the prompt context. Cap total context at 3000 tokens to stay within
`gpt-4o`'s context safely.

**Rationale**: Top-5 gives sufficient context for most onboarding questions without
overloading the prompt. The 3000-token context cap leaves room for the system prompt
and the generated answer within a safe margin. Both values are configurable in the
project settings table for admins who need to tune for document density.

**Alternatives considered**:
- Top-3: may miss relevant chunks for multi-part questions.
- Top-10: risks exceeding context limits with large chunks; increases latency and cost.

---

## Decision 8: Readiness Score Update Timing

**Decision**: Recalculate the readiness score on every quiz submission and every
module completion event. Store the calculated score in a `learner_progress` table
(one row per learner per project) for fast dashboard reads. Do not recompute on
every dashboard load.

**Rationale**: Storing the score avoids recomputing aggregates across potentially
many quiz attempts on every page load. Updating on write (quiz submit, module
complete) keeps the stored value current with at most one write lag.

**Alternatives considered**:
- Compute on every dashboard load: correct but expensive as quiz history grows.
- Scheduled recomputation: introduces staleness and requires a background scheduler
  beyond BackgroundTasks scope.

---

## Decision 9: Frontend Auth State Management

**Decision**: Store the JWT access token in `localStorage` and the refresh token in
an `httpOnly` cookie set by the backend. Use an Axios request interceptor to attach
the `Authorization: Bearer <token>` header. On 401 responses, attempt a token
refresh automatically before retrying the original request.

**Rationale**: `localStorage` for the access token is acceptable given the short
15-minute TTL. `httpOnly` cookies for the refresh token prevent JavaScript access,
reducing XSS exposure for the higher-value long-lived token. This is standard
practice for React SPAs with JWT.

**Alternatives considered**:
- Both tokens in localStorage: simpler but exposes the refresh token to XSS.
- Both tokens in httpOnly cookies: requires CSRF protection, adds complexity for v1.

---

## Decision 10: Learning Path Generation Prompt Strategy

**Decision**: Retrieve all document chunk texts for the project (sampling if
> 20 chunks), concatenate them as a structured context block, and send a single
`gpt-4o` call with a system prompt instructing the model to produce a JSON array
of weekly modules. Parse the JSON response and store each module as a `LearningModule`
row linked to the `LearningPath`.

**Rationale**: A single structured call is simpler than an iterative approach and
sufficient for the document volumes expected (a typical onboarding project has
5–30 documents). Requesting JSON output from `gpt-4o` with `response_format` mode
eliminates manual parsing of unstructured text.

**Alternatives considered**:
- Streaming: unnecessary for a background generation task where the result is stored
  before being shown to the user.
- One LLM call per document: expensive and produces disconnected modules without
  cross-document coherence.
