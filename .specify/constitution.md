# Onboarding AI Platform — Project Constitution

This file is the single source of truth for the AI coding agent. Read it before every command.
All decisions about architecture, technology, and code structure must conform to this document.

---

## What We're Building

A web platform for AI-powered employee onboarding. Admins create onboarding projects, upload
learning documents, and configure AI workflows. Learners are assigned to projects and follow
AI-generated learning paths, interact with an AI tutor, take quizzes, and track their readiness.

---

## Roles

**Admin**
- Full access to the platform
- Manages users, projects, documents, AI configuration, and analytics
- Can create/edit/delete any resource

**User (Learner)**
- Scoped access only — no visibility into other projects or users
- Can view their assigned project, follow their learning path, use the AI tutor chat, take
  quizzes, and track their own progress and readiness score

Admin and User logic MUST be separated at the route and component level. Never mix them.

---

## Tech Stack

This stack is strict. Do not introduce alternatives or replacements.

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL with pgvector extension |
| ORM | SQLModel (handles both relational schema and queries) |
| Auth | python-jose + passlib (JWT-based, no sessions) |
| AI | OpenAI Python SDK (direct calls only) |
| Background Jobs | FastAPI BackgroundTasks |
| Frontend | React + Vite + Tailwind CSS + Axios + Recharts |
| Infrastructure | Docker Compose |

One database handles both relational data and vector embeddings (pgvector). No separate vector
database.

---

## Architecture Principles

**I. Strict Role Separation**
Admin routes live under `/api/admin/`. User routes live under `/api/user/`. Frontend components
for each role are in separate directories. No shared route handlers or page components between
roles.

**II. Document-Grounded AI Only**
Every AI response MUST cite the source document chunk it was generated from. The system MUST
NOT generate answers, learning content, or quiz questions from outside the uploaded documents.
Any AI function that cannot retrieve a relevant document chunk MUST return a clear "no
information available" response rather than hallucinate.

**III. Plain Async Python for AI**
All AI logic is implemented as plain `async def` Python functions using the OpenAI SDK directly.
No agent frameworks (LangChain, LlamaIndex, CrewAI, etc.) are permitted. No abstraction layers
over the OpenAI client.

**IV. Single Database for All Persistence**
PostgreSQL with pgvector serves both relational data (users, projects, progress) and vector
embeddings (document chunks). All schema definitions use SQLModel. No separate migration tool
— SQLModel handles table creation.

**V. Minimal Background Processing**
Long-running tasks (document ingestion, embedding generation) use FastAPI BackgroundTasks.
No external task queues, brokers, or workers. No Celery. No Redis.

**VI. No Unauthorized Dependencies**
The tech stack is fixed. Do not add dependencies that duplicate or replace existing stack
choices. Any new package must be a utility (e.g., `python-multipart` for file uploads) — not
a framework replacement.

---

## Module List

1. **Authentication & RBAC** — JWT login, role assignment, token refresh, route guards
2. **Project Management** — Admin creates/manages onboarding projects; assigns learners
3. **Document Upload & Ingestion** — TXT/MD upload → text chunking → OpenAI embeddings →
   stored in pgvector
4. **AI Learning Path Generation** — Weekly modules generated from document content using
   OpenAI; structured as a sequence of topics
5. **AI Tutor / RAG Chat** — Learner asks questions; system retrieves relevant chunks via
   pgvector similarity search → sends to OpenAI → returns cited answer
6. **Questions & Quizzes** — AI generates questions from document chunks; quiz engine
   randomizes, presents, scores, and records attempts
7. **Progress Tracking & Readiness Score** — Tracks module completion and quiz scores;
   readiness score = weighted quiz average + module completion percentage
8. **Reporting & Analytics** — Admin dashboard showing per-learner and per-project progress,
   quiz performance, and readiness scores using Recharts

---

## AI Design

**RAG Pipeline (used for chat and quiz generation)**

```
Upload → Chunk (fixed-size with overlap) → Embed (OpenAI text-embedding-3-small)
→ Store in pgvector → Query: embed user input → cosine similarity search
→ Retrieve top-k chunks → Construct prompt with chunks → OpenAI chat completion
→ Return answer with chunk citations
```

**Rules:**
- All embeddings use `text-embedding-3-large` unless a specific model is configured
- Chat completions use `gpt-4o` unless configured otherwise
- Every prompt sent to OpenAI for chat MUST include retrieved document chunks as context
- Every generated quiz question MUST reference the document chunk it was derived from
- Readiness score formula: `(quiz_weighted_avg * 0.7) + (module_completion_pct * 0.3)`
- Chunk size: 500 tokens, overlap: 50 tokens (defaults, must be configurable per project)

---

## What to Avoid

- **No LangChain, LlamaIndex, or any AI framework** — use the OpenAI SDK directly
- **No ChromaDB or separate vector store** — pgvector is the only vector database
- **No Celery or Redis** — use FastAPI BackgroundTasks only
- **No SQLAlchemy or Alembic as standalone dependencies** — SQLModel covers both
- **No UI component libraries beyond Tailwind** — no shadcn, MUI, Chakra, Ant Design, etc.
- **No mixing Admin and User routes or components** — always keep them in separate modules
- **No unsourced AI answers** — every AI response must cite document chunks or say it cannot answer
- **No synchronous AI calls in request handlers** — all OpenAI calls MUST be `await`ed
- **No hardcoded API keys** — all secrets loaded from environment variables via `.env`
