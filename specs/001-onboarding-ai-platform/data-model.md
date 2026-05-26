# Data Model: AI-Powered Employee Onboarding Platform

**Phase**: 1 — Design
**Branch**: `001-onboarding-ai-platform`
**Date**: 2026-05-26

All entities are SQLModel table definitions. All tables use PostgreSQL via a single
`DATABASE_URL` connection. Vector columns use the `pgvector` extension.

---

## Entity: User

**Table**: `users`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| email | str | UNIQUE, NOT NULL, indexed | |
| hashed_password | str | NOT NULL | bcrypt hash via passlib |
| role | str | NOT NULL | `"admin"` or `"learner"` |
| is_active | bool | NOT NULL, default True | Soft-disable without delete |
| created_at | datetime | NOT NULL, default utcnow | |

**Relationships**: One user → many ProjectAssignments (as learner), many RefreshTokens

---

## Entity: RefreshToken

**Table**: `refresh_tokens`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| user_id | UUID | FK → users.id, NOT NULL | |
| token_hash | str | NOT NULL, indexed | SHA-256 hash of the raw token |
| expires_at | datetime | NOT NULL | |
| revoked | bool | NOT NULL, default False | |
| created_at | datetime | NOT NULL, default utcnow | |

---

## Entity: Project

**Table**: `projects`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| name | str | NOT NULL | |
| description | str | nullable | |
| admin_id | UUID | FK → users.id, NOT NULL | Owning admin |
| chunk_size | int | NOT NULL, default 500 | Tokens per chunk |
| chunk_overlap | int | NOT NULL, default 50 | Token overlap between chunks |
| rag_top_k | int | NOT NULL, default 5 | Chunks retrieved per RAG query |
| quiz_length | int | NOT NULL, default 10 | Questions per quiz attempt |
| created_at | datetime | NOT NULL, default utcnow | |
| updated_at | datetime | NOT NULL, default utcnow | onupdate=utcnow |

**Relationships**: One project → many ProjectAssignments, Documents, LearningPaths, Questions

---

## Entity: ProjectAssignment

**Table**: `project_assignments`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| project_id | UUID | FK → projects.id, NOT NULL | |
| learner_id | UUID | FK → users.id, NOT NULL | Must have role="learner" |
| assigned_at | datetime | NOT NULL, default utcnow | |

**Constraints**: UNIQUE(project_id, learner_id)

---

## Entity: Document

**Table**: `documents`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| project_id | UUID | FK → projects.id, NOT NULL | |
| filename | str | NOT NULL | Original upload filename |
| file_type | str | NOT NULL | `"txt"` or `"md"` |
| ingestion_status | str | NOT NULL, default "pending" | `"pending"`, `"processing"`, `"ready"`, `"failed"` |
| ingestion_error | str | nullable | Error message if status="failed" |
| raw_content | str | NOT NULL | Full original text (stored for re-ingestion) |
| uploaded_at | datetime | NOT NULL, default utcnow | |

**Relationships**: One document → many DocumentChunks

---

## Entity: DocumentChunk

**Table**: `document_chunks`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| document_id | UUID | FK → documents.id, NOT NULL | |
| project_id | UUID | FK → projects.id, NOT NULL | Denormalized for faster vector search filtering |
| chunk_index | int | NOT NULL | Position in document (0-based) |
| content | str | NOT NULL | Raw text of the chunk |
| token_count | int | NOT NULL | Actual token count of content |
| embedding | vector(1536) | NOT NULL | OpenAI text-embedding-3-small output |

**Indexes**:
- HNSW index on `embedding` using `vector_cosine_ops` (m=16, ef_construction=64)
- Index on `project_id` for filtered similarity search

---

## Entity: LearningPath

**Table**: `learning_paths`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| project_id | UUID | FK → projects.id, UNIQUE, NOT NULL | One path per project at a time |
| generated_at | datetime | NOT NULL, default utcnow | |

**Relationships**: One learning path → many LearningModules

---

## Entity: LearningModule

**Table**: `learning_modules`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| learning_path_id | UUID | FK → learning_paths.id, NOT NULL | |
| week_number | int | NOT NULL | 1-based ordering |
| title | str | NOT NULL | AI-generated topic title |
| description | str | NOT NULL | AI-generated topic description |

**Constraints**: UNIQUE(learning_path_id, week_number)

---

## Entity: ModuleCompletion

**Table**: `module_completions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| learner_id | UUID | FK → users.id, NOT NULL | |
| module_id | UUID | FK → learning_modules.id, NOT NULL | |
| completed_at | datetime | NOT NULL, default utcnow | |

**Constraints**: UNIQUE(learner_id, module_id)

---

## Entity: Question

**Table**: `questions`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| project_id | UUID | FK → projects.id, NOT NULL | |
| chunk_id | UUID | FK → document_chunks.id, NOT NULL | Source chunk |
| question_text | str | NOT NULL | |
| correct_answer | str | NOT NULL | |
| distractors | JSON | NOT NULL | List of 3 wrong-answer strings |
| created_at | datetime | NOT NULL, default utcnow | |

---

## Entity: QuizAttempt

**Table**: `quiz_attempts`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| learner_id | UUID | FK → users.id, NOT NULL | |
| project_id | UUID | FK → projects.id, NOT NULL | |
| started_at | datetime | NOT NULL, default utcnow | |
| completed_at | datetime | nullable | Set when submitted |
| score | float | nullable | Percentage correct (0.0–1.0) |

---

## Entity: QuizAnswer

**Table**: `quiz_answers`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| attempt_id | UUID | FK → quiz_attempts.id, NOT NULL | |
| question_id | UUID | FK → questions.id, NOT NULL | |
| selected_answer | str | NOT NULL | The answer text the learner chose |
| is_correct | bool | NOT NULL | |

---

## Entity: ChatMessage

**Table**: `chat_messages`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| learner_id | UUID | FK → users.id, NOT NULL | |
| project_id | UUID | FK → projects.id, NOT NULL | |
| question | str | NOT NULL | Learner's input |
| answer | str | NOT NULL | AI-generated response |
| cited_chunk_ids | JSON | NOT NULL | List of DocumentChunk IDs cited |
| cited_snippets | JSON | NOT NULL | List of `{document_name, excerpt}` objects |
| no_context_found | bool | NOT NULL, default False | True when answer = "no information available" |
| created_at | datetime | NOT NULL, default utcnow | |

---

## Entity: LearnerProgress

**Table**: `learner_progress`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default uuid4 | |
| learner_id | UUID | FK → users.id, NOT NULL | |
| project_id | UUID | FK → projects.id, NOT NULL | |
| modules_completed | int | NOT NULL, default 0 | |
| modules_total | int | NOT NULL, default 0 | Set when learning path is generated |
| quiz_weighted_avg | float | NOT NULL, default 0.0 | Rolling weighted average of all attempts |
| readiness_score | float | NOT NULL, default 0.0 | `(quiz_weighted_avg * 0.7) + (module_completion_pct * 0.3)` |
| last_updated | datetime | NOT NULL, default utcnow | |

**Constraints**: UNIQUE(learner_id, project_id)

---

## Entity Relationship Summary

```
User (admin)
  └── manages → Project (1:N)
                  ├── assigned to → User (learner) via ProjectAssignment (M:N)
                  ├── contains → Document (1:N)
                  │               └── split into → DocumentChunk (1:N) [has embedding]
                  ├── has → LearningPath (1:1)
                  │           └── contains → LearningModule (1:N)
                  │                           └── completed by → User via ModuleCompletion (M:N)
                  ├── has → Question (1:N) [linked to DocumentChunk]
                  └── tracks → LearnerProgress per learner (1:N)

User (learner)
  ├── takes → QuizAttempt (1:N per project)
  │             └── answers → QuizAnswer (1:N per attempt)
  ├── sends → ChatMessage (1:N per project)
  └── has → LearnerProgress (1 per project)
```
