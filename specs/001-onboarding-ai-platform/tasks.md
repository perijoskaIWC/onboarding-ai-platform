# Tasks: AI-Powered Employee Onboarding Platform

**Input**: Design documents from `/specs/001-onboarding-ai-platform/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story. Setup and Foundational phases are blocking prerequisites.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US8)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project directory structure, Docker configuration, and environment scaffolding.

- [x] T001 Create full directory structure per plan.md (backend/app/api/admin, backend/app/api/user, backend/app/models, backend/app/services, backend/app/core, backend/app/scripts, frontend/src/pages/admin, frontend/src/pages/learner, frontend/src/components, frontend/src/services)
- [x] T002 Create docker-compose.yml with three services: db (postgres:15 + pgvector), backend (FastAPI on port 8000), frontend (Vite dev server on port 5173)
- [x] T003 [P] Create backend/requirements.txt (fastapi, uvicorn, sqlmodel, psycopg2-binary, pgvector, python-jose[cryptography], passlib[bcrypt], openai, python-multipart, tiktoken) and backend/Dockerfile
- [x] T004 [P] Create frontend/package.json (react, react-dom, react-router-dom, axios, recharts), vite.config.js, tailwind.config.js, postcss.config.js, and frontend/Dockerfile
- [x] T005 [P] Create root .env.example documenting all required variables: DATABASE_URL, JWT_SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, OPENAI_API_KEY, OPENAI_EMBEDDING_MODEL, OPENAI_CHAT_MODEL, CORS_ORIGINS
- [x] T006 [P] Create .gitignore (Python + Node patterns: __pycache__, .venv, node_modules, dist, .env, *.pyc) and backend/.dockerignore, frontend/.dockerignore

**Checkpoint**: Docker Compose `up --build` starts all three containers without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure that MUST be complete before any user story work.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T007 Create backend/app/core/config.py — Pydantic BaseSettings class loading all variables from .env (database_url, jwt_secret_key, access_token_expire_minutes, refresh_token_expire_days, openai_api_key, openai_embedding_model, openai_chat_model, cors_origins); export a `settings` singleton
- [x] T008 Create backend/app/core/database.py — SQLModel engine from settings.database_url, `get_session` FastAPI dependency yielding a Session, `create_db_and_tables()` function calling SQLModel.metadata.create_all(engine); add pgvector extension creation via raw SQL before create_all
- [x] T009 Create backend/app/core/security.py — passlib CryptContext for bcrypt (hash_password, verify_password); python-jose JWT functions (create_access_token with user_id + role claims, create_refresh_token, decode_token); FastAPI dependencies: `get_current_user` (validates Bearer token, returns user from DB), `require_admin` (checks role="admin"), `require_learner` (checks role="learner")
- [x] T010 Create backend/app/services/ai.py — skeleton with `get_openai_client` FastAPI dependency (returns request.app.state.openai_client); placeholder stubs for generate_learning_path, rag_chat, generate_questions (all raise NotImplementedError)
- [x] T011 Create backend/app/main.py — FastAPI app with lifespan context manager (opens AsyncOpenAI client → stores in app.state.openai_client, calls create_db_and_tables on startup); CORS middleware using settings.cors_origins; stub router mounts at /api/auth, /api/admin, /api/user
- [x] T012 Create frontend/src/services/api.js — Axios instance with baseURL=/api, request interceptor attaching Authorization: Bearer from localStorage, response interceptor catching 401 → calling POST /auth/refresh → retrying original request → redirecting to /login if refresh fails
- [x] T013 [P] Create frontend/src/App.jsx — React Router v6 `<BrowserRouter>` with route placeholders: /login (Login), /admin/* (PrivateRoute role=admin), /learner/* (PrivateRoute role=learner); export default App
- [x] T014 [P] Create frontend/src/main.jsx (ReactDOM.createRoot mounting App) and frontend/index.html (root div, Vite script tag, Tailwind CDN link or src/index.css with @tailwind directives)

**Checkpoint**: Backend starts, tables attempted (no models imported yet but no crash), frontend dev server compiles.

---

## Phase 3: User Story 1 — Secure Login and Role Access (Priority: P1) 🎯 MVP

**Goal**: Any registered user can log in and reach the correct role-specific dashboard.
Admins see the admin shell; Learners see the learner shell. Wrong role is rejected.

**Independent Test**: Create one admin and one learner via seed script or direct DB insert.
Log in as each. Verify admin reaches `/admin` and learner reaches `/learner`. Verify a
learner token is rejected on any `/api/admin/` route with 403.

- [x] T015 [P] [US1] Create User SQLModel table in backend/app/models/user.py — fields: id (UUID PK default uuid4), email (str UNIQUE NOT NULL indexed), hashed_password (str NOT NULL), role (str NOT NULL, "admin" or "learner"), is_active (bool default True), created_at (datetime default utcnow)
- [x] T016 [P] [US1] Create RefreshToken SQLModel table in backend/app/models/refresh_token.py — fields: id (UUID PK), user_id (UUID FK→users.id NOT NULL), token_hash (str NOT NULL indexed), expires_at (datetime NOT NULL), revoked (bool default False), created_at (datetime default utcnow)
- [x] T017 [US1] Implement backend/app/services/auth.py — functions: authenticate_user(email, password, session) → User|None; issue_tokens(user, session) → {access_token, refresh_token}; refresh_access_token(raw_refresh_token, session) → new access_token; revoke_refresh_token(raw_refresh_token, session)
- [x] T018 [US1] Implement backend/app/api/auth.py — APIRouter with prefix /api/auth: POST /login (calls authenticate_user, returns access token JSON + sets httpOnly refresh_token cookie), POST /refresh (reads cookie, calls refresh_access_token), POST /logout (calls revoke_refresh_token, clears cookie)
- [x] T019 [US1] Update backend/app/main.py to import User and RefreshToken models (so create_all creates their tables) and mount the auth router from backend/app/api/auth.py
- [x] T020 [US1] Create frontend/src/pages/Login.jsx — email/password form, calls POST /api/auth/login via auth.js service, stores access_token in localStorage, reads role from JWT payload, redirects admin → /admin, learner → /learner; shows error on 401
- [x] T021 [US1] Create frontend/src/components/PrivateRoute.jsx — reads token from localStorage, decodes JWT payload (without verification), checks role matches required prop; redirects to /login if missing, shows 403 message if wrong role
- [x] T022 [US1] Create frontend/src/services/auth.js — login(email, password) calls POST /api/auth/login; logout() calls POST /api/auth/logout + clears localStorage; refreshToken() calls POST /api/auth/refresh; getRole() decodes stored JWT payload
- [x] T023 [US1] Create frontend/src/pages/admin/Dashboard.jsx — authenticated admin landing page with nav links (Projects placeholder); shows logged-in user email from JWT; Logout button calling auth.logout() + redirect to /login
- [x] T024 [US1] Create frontend/src/pages/learner/Dashboard.jsx — authenticated learner landing page with nav links (Learning Path, Chat, Quiz placeholders); shows user email; Logout button; assigned projects list placeholder (populated in US2)
- [x] T025 [US1] Update frontend/src/App.jsx with actual route tree: /login → Login, /admin → PrivateRoute(role=admin) wrapping admin/Dashboard and nested admin routes, /learner → PrivateRoute(role=learner) wrapping learner/Dashboard and nested learner routes

**Checkpoint**: Full login flow works end-to-end. Admin and learner land on correct dashboards. `/api/admin/*` rejects learner JWT with 403.

---

## Phase 4: User Story 2 — Admin Creates Projects and Assigns Learners (Priority: P2)

**Goal**: Admin can create/edit/delete onboarding projects and assign registered Learners.
Learners see only their assigned projects.

**Independent Test**: Admin creates a project named "Test Onboarding". Assigns a Learner.
Learner logs in and sees the project. Admin removes the Learner. Learner no longer sees it.
Direct URL access to an unassigned project returns 403.

- [x] T026 [P] [US2] Create Project SQLModel table in backend/app/models/project.py — fields: id (UUID PK), name (str NOT NULL), description (str nullable), admin_id (UUID FK→users.id NOT NULL), chunk_size (int default 500), chunk_overlap (int default 50), rag_top_k (int default 5), quiz_length (int default 10), created_at, updated_at (onupdate=utcnow)
- [x] T027 [P] [US2] Create ProjectAssignment SQLModel table in backend/app/models/project_assignment.py — fields: id (UUID PK), project_id (UUID FK→projects.id NOT NULL), learner_id (UUID FK→users.id NOT NULL), assigned_at (datetime default utcnow); UNIQUE constraint on (project_id, learner_id)
- [x] T028 [US2] Implement backend/app/api/admin/projects.py — APIRouter with prefix /api/admin/projects, all routes protected by require_admin: GET / (list projects owned by current admin with learner_count + document_count), POST / (create project), GET /{id} (full detail), PATCH /{id} (partial update), DELETE /{id} (cascade delete), POST /{id}/learners (assign learner by learner_id), DELETE /{id}/learners/{lid} (remove learner)
- [x] T029 [US2] Implement backend/app/api/user/projects.py — APIRouter with prefix /api/user/projects, all routes protected by require_learner: GET / (list assigned projects with readiness_score from LearnerProgress or 0), GET /{id} (project detail for assigned learner, 403 if not assigned)
- [x] T030 [US2] Update backend/app/main.py to import Project and ProjectAssignment models and mount admin projects router and user projects router
- [x] T031 [US2] Implement frontend/src/services/projects.js — functions: listAdminProjects, createProject, getProject, updateProject, deleteProject, assignLearner, removeLearner, listLearnerProjects, getLearnerProject (all using api.js Axios instance)
- [x] T032 [US2] Create frontend/src/pages/admin/Projects.jsx — project list with name, learner count; "New Project" button opening an inline form (name, description, chunk_size, quiz_length); delete button per row with confirmation
- [x] T033 [US2] Create frontend/src/pages/admin/ProjectDetail.jsx — shows project name/description, learner assignment section (list assigned learners with remove button, add learner by email input); placeholder sections for Documents, Learning Path, Questions, Analytics (filled in later phases)
- [x] T034 [US2] Update frontend/src/pages/learner/Dashboard.jsx to call listLearnerProjects and render assigned project cards with name and link to project detail

**Checkpoint**: Full project CRUD works. Learner dashboard shows their assigned project. Unassigned access returns 403.

---

## Phase 5: User Story 3 — Admin Uploads and Ingests Learning Documents (Priority: P3)

**Goal**: Admin uploads TXT/MD files. Background task chunks, embeds, and stores them in
pgvector. Ingestion status is visible. Learners see document names.

**Independent Test**: Admin uploads a .md file. Status changes from "pending" → "processing"
→ "ready". Document chunk count > 0. Learner can see filename in assigned project.
Upload of .pdf returns 415.

- [x] T035 [P] [US3] Create Document SQLModel table in backend/app/models/document.py — fields: id (UUID PK), project_id (UUID FK→projects.id NOT NULL), filename (str NOT NULL), file_type (str NOT NULL, "txt"|"md"), ingestion_status (str NOT NULL default "pending"), ingestion_error (str nullable), raw_content (str NOT NULL), uploaded_at (datetime default utcnow)
- [x] T036 [P] [US3] Create DocumentChunk SQLModel table in backend/app/models/document_chunk.py — fields: id (UUID PK), document_id (UUID FK→documents.id NOT NULL), project_id (UUID FK→projects.id NOT NULL), chunk_index (int NOT NULL), content (str NOT NULL), token_count (int NOT NULL), embedding (Vector(1536) NOT NULL); create HNSW index on embedding using vector_cosine_ops in database.py
- [x] T037 [US3] Implement backend/app/services/ingestion.py — chunk_text(text, chunk_size, overlap) → list[str] using tiktoken cl100k_base; embed_chunks(chunks, openai_client) → list[list[float]] via AsyncOpenAI embeddings (text-embedding-3-small); ingest_document(document_id, session, openai_client) — loads Document, sets status="processing", chunks raw_content, embeds, bulk-inserts DocumentChunks, sets status="ready"; on any exception sets status="failed" + ingestion_error
- [x] T038 [US3] Implement backend/app/api/admin/documents.py — APIRouter /api/admin/projects/{pid}/documents, require_admin: POST / (accept multipart file, validate .txt/.md, save Document with raw_content, schedule BackgroundTask calling ingest_document, return 202), GET / (list documents with chunk count), DELETE /{doc_id} (delete document + its chunks)
- [x] T039 [US3] Add GET /api/user/projects/{id}/documents route to backend/app/api/user/projects.py — returns list of {id, filename} for learner's assigned project only
- [x] T040 [US3] Update backend/app/main.py to import Document and DocumentChunk models and mount admin document router
- [x] T041 [US3] Implement frontend/src/services/documents.js — uploadDocument(projectId, file), listDocuments(projectId), deleteDocument(projectId, docId)
- [x] T042 [US3] Update frontend/src/pages/admin/ProjectDetail.jsx to render Documents section: file upload input (accept .txt,.md), upload button, table of documents with filename, status badge (pending=gray, processing=yellow, ready=green, failed=red), chunk count, delete button; poll status every 3s while any document is "processing"

**Checkpoint**: Upload → background ingestion → status "ready" works end-to-end. Learner sees document names.

---

## Phase 6: User Story 4 — Admin Generates AI Learning Path (Priority: P4)

**Goal**: Admin triggers learning path generation from ingested documents. Learners view
weekly modules and mark them complete. Readiness score updates on completion.

**Independent Test**: Project with at least one "ready" document. Admin triggers generation.
Learning path appears with ≥1 module. Learner marks a module complete. Readiness score
changes on their dashboard.

- [x] T043 [P] [US4] Create LearningPath and LearningModule SQLModel tables in backend/app/models/learning_path.py — LearningPath: id (UUID PK), project_id (UUID FK→projects.id UNIQUE NOT NULL), generated_at; LearningModule: id (UUID PK), learning_path_id (UUID FK→learning_paths.id NOT NULL), week_number (int NOT NULL), title (str NOT NULL), description (str NOT NULL); UNIQUE on (learning_path_id, week_number)
- [x] T044 [P] [US4] Create ModuleCompletion SQLModel table in backend/app/models/module_completion.py — fields: id (UUID PK), learner_id (UUID FK→users.id NOT NULL), module_id (UUID FK→learning_modules.id NOT NULL), completed_at (datetime default utcnow); UNIQUE on (learner_id, module_id)
- [x] T045 [P] [US4] Create LearnerProgress SQLModel table in backend/app/models/progress.py — fields: id (UUID PK), learner_id (UUID FK→users.id NOT NULL), project_id (UUID FK→projects.id NOT NULL), modules_completed (int default 0), modules_total (int default 0), quiz_weighted_avg (float default 0.0), readiness_score (float default 0.0), last_updated (datetime default utcnow); UNIQUE on (learner_id, project_id)
- [x] T046 [US4] Implement backend/app/services/scoring.py — get_or_create_progress(learner_id, project_id, session) → LearnerProgress; recalculate_readiness(progress) → float using formula (quiz_weighted_avg * 0.7) + (modules_completed / modules_total * 0.3); on_module_complete(learner_id, module_id, project_id, session) — creates ModuleCompletion, increments modules_completed, recalculates + saves readiness; on_quiz_submitted(learner_id, project_id, new_score, session) — updates quiz_weighted_avg as rolling average, recalculates + saves readiness
- [x] T047 [US4] Implement generate_learning_path(project_id, session, openai_client) in backend/app/services/ai.py — query up to 20 DocumentChunks for project (sample if more); build system prompt instructing gpt-4o to return JSON array [{week_number, title, description}]; call AsyncOpenAI chat.completions.create with response_format={type:"json_object"}; parse response; delete existing LearningPath for project if any; insert new LearningPath + LearningModule rows; update modules_total in all LearnerProgress rows for the project
- [x] T048 [US4] Implement backend/app/api/admin/learning_paths.py — APIRouter /api/admin/projects/{pid}/learning-path, require_admin: POST /generate (check ≥1 ready document, schedule BackgroundTask for generate_learning_path, return 202 or 409), GET / (return learning path with ordered modules or 404)
- [x] T049 [US4] Implement backend/app/api/user/learning_path.py — APIRouter /api/user/projects/{pid}/learning-path, require_learner: GET / (learning path with completion status per module from ModuleCompletion, 403 if not assigned, 404 if no path), POST /modules/{mid}/complete (calls on_module_complete, returns new_readiness_score, 409 if already complete)
- [x] T050 [US4] Update backend/app/main.py to import LearningPath, LearningModule, ModuleCompletion, LearnerProgress models and mount learning path routers
- [x] T051 [US4] Implement frontend/src/services/learningPath.js — getLearningPath(projectId), markModuleComplete(projectId, moduleId), triggerGenerate(projectId)
- [x] T052 [US4] Create frontend/src/pages/learner/LearningPath.jsx — ordered list of weekly modules with title, description, and "Mark Complete" button (hidden if already completed, shows green checkmark + completed_at); shows total completion count at top
- [x] T053 [US4] Update frontend/src/pages/admin/ProjectDetail.jsx to add Learning Path section: "Generate Learning Path" button (calls triggerGenerate, shows 409 message if no documents), module list display with week numbers and titles

**Checkpoint**: Admin generates learning path. Learner views modules and marks one complete. Readiness score on dashboard updates.

---

## Phase 7: User Story 5 — Learner Chats with AI Tutor (Priority: P5)

**Goal**: Learner asks questions and receives cited answers from document content. If no
relevant content found, the system says "no information available" — never fabricates.

**Independent Test**: Learner asks a question directly answered in an uploaded document.
Response contains the answer text and a citation with document_name and excerpt.
Learner asks a question on a topic not in any document. Response is "no information
available" with no citation.

- [x] T054 [US5] Create ChatMessage SQLModel table in backend/app/models/chat.py — fields: id (UUID PK), learner_id (UUID FK→users.id NOT NULL), project_id (UUID FK→projects.id NOT NULL), question (str NOT NULL), answer (str NOT NULL), cited_chunk_ids (JSON NOT NULL, list of UUIDs), cited_snippets (JSON NOT NULL, list of {document_name, excerpt}), no_context_found (bool default False), created_at (datetime default utcnow)
- [x] T055 [US5] Implement rag_chat(question, project_id, learner_id, session, openai_client) in backend/app/services/ai.py — embed question via AsyncOpenAI (text-embedding-3-small); pgvector cosine similarity search on document_chunks filtered by project_id, top-k from project.rag_top_k; if no chunks returned above similarity threshold (0.5): save ChatMessage with no_context_found=True + return "no information available"; else: build prompt with chunks as context; call gpt-4o; extract cited_chunk_ids and cited_snippets from used chunks; save and return ChatMessage
- [x] T056 [US5] Implement backend/app/api/user/chat.py — APIRouter /api/user/projects/{pid}/chat, require_learner: POST / (body: {question}, 403 if not assigned, calls rag_chat, returns ChatMessage response), GET / (list chat history for learner + project ordered by created_at)
- [x] T057 [US5] Update backend/app/main.py to import ChatMessage model and mount chat router
- [x] T058 [US5] Create frontend/src/components/CitationCard.jsx — takes {document_name, excerpt} prop, renders a collapsible card showing source document name and text excerpt
- [x] T059 [US5] Implement frontend/src/services/chat.js — sendMessage(projectId, question), getChatHistory(projectId)
- [x] T060 [US5] Create frontend/src/pages/learner/Chat.jsx — scrollable chat thread showing alternating user/AI bubbles; AI bubbles include CitationCard list for citations; "no information available" renders in grey with no citations; text input + send button at bottom; loads history on mount

**Checkpoint**: Full RAG chat works. Cited answers and "no information available" fallback both function correctly.

---

## Phase 8: User Story 6 — Learner Takes a Quiz (Priority: P6)

**Goal**: Admin generates questions from documents. Learner takes a randomized quiz and
receives per-question feedback with the source passage. Readiness score updates.

**Independent Test**: Admin triggers question generation for a project with ready documents.
At least 5 questions are created. Learner starts quiz, answers all questions, submits.
Results page shows score, per-question correct/incorrect, and source passage. Readiness
score updates.

- [x] T061 [US6] Create Question, QuizAttempt, QuizAnswer SQLModel tables in backend/app/models/quiz.py — Question: id, project_id FK, chunk_id FK→document_chunks.id, question_text, correct_answer, distractors (JSON list of 3 strings), created_at; QuizAttempt: id, learner_id FK, project_id FK, started_at (default utcnow), completed_at (nullable), score (float nullable); QuizAnswer: id, attempt_id FK→quiz_attempts.id, question_id FK, selected_answer, is_correct
- [x] T062 [US6] Implement generate_questions(project_id, session, openai_client) in backend/app/services/ai.py — for each DocumentChunk in project: call gpt-4o with chunk content asking for JSON {question_text, correct_answer, distractors: [str,str,str]}; save Question row referencing chunk_id; bulk insert all questions
- [x] T063 [US6] Implement backend/app/api/admin/questions.py — APIRouter /api/admin/projects/{pid}/questions, require_admin: POST /generate (check ≥1 ready document, schedule BackgroundTask for generate_questions, return 202), GET / (list all questions with source document name and excerpt)
- [x] T064 [US6] Implement backend/app/api/user/quiz.py — APIRouter /api/user/projects/{pid}/quiz, require_learner: POST /start (check assigned, sample project.quiz_length questions randomly, create QuizAttempt, return attempt_id + questions without correct_answer), POST /{attempt_id}/submit (validate attempt belongs to learner + not already submitted, score answers, create QuizAnswer rows, call on_quiz_submitted, set attempt.score + completed_at, return results with source passages), GET /history (list completed attempt summaries)
- [x] T065 [US6] Update backend/app/main.py to import Question, QuizAttempt, QuizAnswer models and mount admin questions router and user quiz router
- [x] T066 [US6] Implement frontend/src/services/quiz.js — startQuiz(projectId), submitQuiz(projectId, attemptId, answers), getQuizHistory(projectId)
- [x] T067 [US6] Create frontend/src/pages/learner/Quiz.jsx — fetches quiz via startQuiz, renders one question per card with 4 radio options (shuffled correct_answer + distractors); progress indicator (Q3/10); Submit button (disabled until all answered)
- [x] T068 [US6] Create frontend/src/pages/learner/Results.jsx — shows score as percentage; per-question breakdown with ✅/❌ icon, selected answer, correct answer, and collapsible source excerpt; "Retake Quiz" and "Back to Dashboard" buttons; quiz history list at bottom
- [x] T069 [US6] Update frontend/src/pages/admin/ProjectDetail.jsx to add Questions section: "Generate Questions" button (calls triggerGenerate, shows question count after generation), question list with previews

**Checkpoint**: Quiz generation, attempt flow, scoring, and readiness update all work end-to-end.

---

## Phase 9: User Story 7 — Learner Tracks Progress and Readiness Score (Priority: P7)

**Goal**: Learner has a single dashboard view of their readiness score, module completion
progress, and quiz history without navigating away.

**Independent Test**: Learner with 3/8 modules completed and one quiz attempt at 80%.
Readiness score = (0.80 × 0.7) + (3/8 × 0.3) = 0.56 + 0.1125 = 0.6725. Dashboard
shows ~67% readiness, 3/8 modules, and 1 quiz attempt in history.

- [x] T070 [US7] Implement backend/app/api/user/progress.py — APIRouter /api/user/projects/{pid}/progress, require_learner: GET / (return LearnerProgress row for learner + project, include modules_completed, modules_total, quiz_weighted_avg, readiness_score, quiz_attempts count; 403 if not assigned)
- [x] T071 [US7] Update backend/app/main.py to mount progress router
- [x] T072 [US7] Create frontend/src/components/ReadinessGauge.jsx — receives score (0.0–1.0) prop; renders a circular gauge or large percentage display with color coding (red <0.4, yellow 0.4–0.7, green ≥0.7)
- [x] T073 [US7] Create frontend/src/components/ProgressBar.jsx — receives value (0.0–1.0) and label prop; renders horizontal bar with percentage text
- [x] T074 [US7] Implement frontend/src/services/progress.js — getProgress(projectId)
- [x] T075 [US7] Update frontend/src/pages/learner/Dashboard.jsx to fetch progress for each assigned project and render: ReadinessGauge, ProgressBar for module completion, quiz attempt count with link to Results page

**Checkpoint**: Learner dashboard shows accurate readiness score, module progress, and quiz stats in one view.

---

## Phase 10: User Story 8 — Admin Views Reporting and Analytics (Priority: P8)

**Goal**: Admin sees aggregate onboarding stats per project and can drill into any learner's
individual progress.

**Independent Test**: Project with 3 learners at varying progress. Admin analytics dashboard
shows correct average readiness score and completion rate. Clicking a learner shows their
individual module completions and quiz attempt history.

- [x] T076 [US8] Implement backend/app/api/admin/analytics.py — APIRouter /api/admin/projects/{pid}/analytics, require_admin: GET / (aggregate: avg readiness_score, avg quiz score, avg module completion pct across all assigned learners; per-learner summary rows with learner_id, email, readiness_score, modules_completed, modules_total, quiz_attempts, last_quiz_score), GET /learners/{lid} (individual learner detail: module list with completion status, full quiz attempt history with per-attempt score)
- [x] T077 [US8] Update backend/app/main.py to mount analytics router
- [x] T078 [US8] Implement frontend/src/services/analytics.js — getProjectAnalytics(projectId), getLearnerAnalytics(projectId, learnerId)
- [x] T079 [US8] Update frontend/src/pages/admin/ProjectDetail.jsx Analytics section — Recharts BarChart of per-learner readiness scores, Recharts LineChart placeholder for readiness trend, completion rate ProgressBar; learner summary table with click-to-drill-down
- [x] T080 [US8] Create frontend/src/pages/admin/LearnerDetail.jsx — fetches getLearnerAnalytics; renders module completion table (week, title, completed ✅/⬜, completed_at); quiz attempt table (date, score, questions correct); readiness score with ReadinessGauge

**Checkpoint**: Admin analytics dashboard shows correct aggregates. Learner detail drill-down shows accurate individual data.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Production readiness, error handling, and validation of the full deployment.

- [x] T081 Create backend/app/scripts/seed_admin.py — CLI script using argparse (--email, --password) that creates an Admin user with hashed password using the same session/engine as the main app; callable via `python -m app.scripts.seed_admin`
- [x] T082 [P] Add global exception handler to backend/app/main.py — @app.exception_handler(Exception) returning JSON {detail: "Internal server error"} with 500; add specific handler for SQLAlchemy IntegrityError returning 409
- [x] T083 [P] Add HNSW index DDL to backend/app/core/database.py — after create_all, execute raw SQL: `CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64)`
- [x] T084 [P] Add loading spinner component frontend/src/components/LoadingSpinner.jsx and add loading/error states to all async API calls in admin and learner pages
- [x] T085 [P] Add empty state messages to all list pages: Projects (no projects yet), ProjectDetail documents section (no documents uploaded), learning path section (not generated yet), questions section (no questions generated), Learner Dashboard (no assigned projects), Chat (no messages yet), Results (no attempts yet)
- [x] T086 [P] Verify all admin API routes use require_admin dependency and all user routes use require_learner dependency; add missing guards in backend/app/api/admin/ and backend/app/api/user/
- [x] T087 [P] Update root .env.example to include any variables discovered during implementation that were not in the original template
- [x] T088 Validate full Docker Compose startup per quickstart.md: `docker compose up --build` → all services healthy → POST /api/auth/login with seeded admin → 200 response; fix any startup issues found

**Checkpoint**: Full platform starts cleanly via Docker Compose. All 8 user stories functional end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–10)**: All depend on Foundational completion
  - Can proceed sequentially in priority order: US1 → US2 → US3 → US4 → US5 → US6 → US7 → US8
  - US2–US8 can partially work in parallel once US1 (auth) is complete (auth guards are in place)
- **Polish (Phase 11)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Requires only Foundational — delivers working auth + role separation
- **US2 (P2)**: Requires US1 (needs authenticated admin and learner users)
- **US3 (P3)**: Requires US2 (documents belong to projects)
- **US4 (P4)**: Requires US3 (learning path generation needs ingested chunks)
- **US5 (P5)**: Requires US3 (RAG chat needs ingested chunks)
- **US6 (P6)**: Requires US3 (questions generated from chunks) and US4 (scoring uses LearnerProgress from US4)
- **US7 (P7)**: Requires US4 and US6 (both write to LearnerProgress)
- **US8 (P8)**: Requires all prior stories (analytics reads all progress data)

### Within Each User Story

- Models (marked [P]) → Services → Routes → Frontend services → Frontend pages
- Models within a phase can be created in parallel
- Services depend on models being complete
- Routes depend on services

### Parallel Opportunities

- All Phase 1 [P] tasks run in parallel
- All [P] model tasks within each phase run in parallel
- US5 (RAG chat) can be implemented alongside US4 (learning path) since both depend only on US3

---

## Parallel Example: User Story 3 (Document Ingestion)

```bash
# Create models in parallel (different files):
Task T035: Create Document model in backend/app/models/document.py
Task T036: Create DocumentChunk model in backend/app/models/document_chunk.py

# Then implement services and routes sequentially:
Task T037: Implement ingestion service (depends on T035, T036)
Task T038: Implement admin document routes (depends on T037)
Task T039: Add user document list route (depends on T035)
Task T041: Implement frontend documents service (depends on T038 being runnable)
Task T042: Update ProjectDetail with upload UI (depends on T041)
```

---

## Implementation Strategy

### MVP First (US1 Only — ~15 tasks)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T014)
3. Complete Phase 3: US1 Login & Role Access (T015–T025)
4. **STOP and VALIDATE**: Login works, admin/learner reach correct dashboards, roles enforced
5. Demo or deploy: working authenticated shell

### Incremental Delivery

- US1 → Auth shell ✓ demo
- US2 → Project management ✓ demo
- US3 → Document upload + ingestion ✓ demo
- US4 → AI learning path ✓ demo
- US5 → AI tutor chat ✓ demo
- US6 → Quiz system ✓ demo
- US7 → Readiness dashboard ✓ demo
- US8 → Analytics ✓ final release

Each story adds value and is independently testable before the next begins.

---

## Notes

- `[P]` tasks touch different files and have no incomplete dependencies — safe to run simultaneously
- `[Story]` labels map each task to a specific user story for traceability
- Backend models in the same SQLModel file (e.g., quiz.py has Question + QuizAttempt + QuizAnswer) are treated as one task
- Mark each task `[x]` in this file immediately after completion
- Commit after each phase or logical group of tasks
- The `ai.py` service grows across phases: skeleton in Phase 2, functions added in US4, US5, US6
- All OpenAI calls in `ai.py` MUST use `await` — verify before each phase checkpoint
