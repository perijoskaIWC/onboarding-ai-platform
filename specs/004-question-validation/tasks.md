# Tasks: Quiz Question Validation

**Input**: Design documents from `specs/004-question-validation/`

**Branch**: `004-question-validation`

**Organization**: Tasks grouped by user story — each story independently testable.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: Read existing files to understand current state before making changes.

- [X] T001 Read `backend/app/models/question.py` to confirm current Question model fields
- [X] T002 [P] Read `backend/app/api/admin/quiz.py` to understand existing admin quiz endpoints
- [X] T003 [P] Read `backend/app/api/user/quiz.py` to understand existing learner quiz endpoints
- [X] T004 [P] Read `frontend/src/services/quiz.js` to understand existing frontend quiz API calls
- [X] T005 [P] Read `frontend/src/pages/admin/ProjectDetail.jsx` Quiz tab section to understand current UI

**Checkpoint**: Existing code understood — ready to implement.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The `is_published` schema change is required by every user story. All three stories depend on this field existing.

**⚠️ CRITICAL**: Phase 2 must complete before Phases 3–5.

- [X] T006 Add `is_published: bool = Field(default=False, sa_column_kwargs={"server_default": "false"})` to the `Question` class in `backend/app/models/question.py`
- [X] T007 Apply schema migration to the running container: run `podman exec -it db psql -U postgres -d onboarding -c "ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;"` — then `podman restart backend` to reload the model
- [X] T008 Update `GET /admin/projects/{project_id}/questions` response in `backend/app/api/admin/quiz.py` — change `q.model_dump()` to include `is_published` (already included via model_dump, but verify the field appears in the response)

**Checkpoint**: `is_published` column exists in DB; admin list endpoint returns `is_published` on each question (all `false`).

---

## Phase 3: User Story 1 — Review and Publish Questions (Priority: P1) 🎯 MVP

**Goal**: Admin sees published/unpublished status on each question and can publish or unpublish individually or all at once. Learners see only published questions.

**Independent Test**: Generate questions → verify all appear as unpublished in admin Quiz tab → publish two questions → log in as learner → verify only those two questions appear in the quiz.

- [X] T009 [US1] Add `PATCH /api/admin/projects/{project_id}/questions/{question_id}/publish` endpoint to `backend/app/api/admin/quiz.py` — accepts `{"is_published": bool}` body (Pydantic model), updates the question's `is_published` field, returns `{"id": question_id, "is_published": bool}`; raise 404 if question not found or not in project
- [X] T010 [US1] Add `POST /api/admin/projects/{project_id}/questions/publish-all` endpoint to `backend/app/api/admin/quiz.py` — runs `UPDATE questions SET is_published = true WHERE project_id = ?` using SQLModel `update` statement, returns `{"published_count": n}`; **place this route before the `/{question_id}` routes to avoid path conflicts**
- [X] T011 [US1] Update `GET /api/user/projects/{project_id}/quiz` in `backend/app/api/user/quiz.py` — add `.where(Question.is_published == True)` filter to the questions query; if no published questions exist return 404 "No questions available yet"
- [X] T012 [US1] Add `adminPublishQuestion(projectId, questionId, isPublished)` function to `frontend/src/services/quiz.js` — calls `PATCH /api/admin/projects/{projectId}/questions/{questionId}/publish` with `{"is_published": isPublished}`
- [X] T013 [US1] Add `adminPublishAll(projectId)` function to `frontend/src/services/quiz.js` — calls `POST /api/admin/projects/{projectId}/questions/publish-all`
- [X] T014 [US1] Update the Quiz tab in `frontend/src/pages/admin/ProjectDetail.jsx` — add a published count header ("X of Y published") above the question list; add a "Publish All" button next to the Regenerate button; add a published/unpublished badge (`bg-green-100 text-green-700` for published, `bg-yellow-100 text-yellow-700` for unpublished) on each question card; add a Publish/Unpublish toggle button per question that calls `adminPublishQuestion` and refreshes the question list
- [X] T015 [US1] Copy backend files to container: `podman cp backend/app/models/question.py backend:/app/app/models/question.py` and `podman cp backend/app/api/admin/quiz.py backend:/app/app/api/admin/quiz.py` and `podman cp backend/app/api/user/quiz.py backend:/app/app/api/user/quiz.py` then `podman restart backend`

**Checkpoint**: Admin can publish/unpublish questions; learner quiz shows only published questions; "Publish All" works.

---

## Phase 4: User Story 2 — Edit Question Content (Priority: P2)

**Goal**: Admin can edit the text, options, and correct answer of any question inline.

**Independent Test**: Edit a question's text and correct answer → save → log in as learner → verify updated question text appears and correct answer is scored correctly.

- [X] T016 [US2] Add `PUT /api/admin/projects/{project_id}/questions/{question_id}` endpoint to `backend/app/api/admin/quiz.py` — accepts Pydantic model with `question_text: str`, `option_a: str`, `option_b: str`, `option_c: str`, `option_d: str`, `correct_answer: str`, `explanation: Optional[str]`; validate `question_text` non-empty and `correct_answer` in `{"A","B","C","D"}`; update and return full question object including `is_published`
- [X] T017 [US2] Add `adminUpdateQuestion(projectId, questionId, data)` function to `frontend/src/services/quiz.js` — calls `PUT /api/admin/projects/{projectId}/questions/{questionId}` with the question data object
- [X] T018 [US2] Update the Quiz tab in `frontend/src/pages/admin/ProjectDetail.jsx` — add `editingId` and `editForm` state; clicking "Edit" on a question card sets `editingId` to that question's id and populates `editForm` with current values; the card renders an inline form with: textarea for `question_text`, four text inputs for `option_a`–`option_d`, radio group for `correct_answer` (A/B/C/D), optional textarea for `explanation`, Save and Cancel buttons; Save calls `adminUpdateQuestion`, updates the local questions state, and clears `editingId`; Cancel just clears `editingId`; Save is disabled if `question_text` is empty or no correct answer is selected
- [X] T019 [US2] Copy updated files to container: `podman cp backend/app/api/admin/quiz.py backend:/app/app/api/admin/quiz.py` then `podman restart backend`

**Checkpoint**: Admin can edit any question inline; validation blocks empty text; edits appear immediately for learners.

---

## Phase 5: User Story 3 — Delete Questions (Priority: P3)

**Goal**: Admin can permanently delete a question after confirming.

**Independent Test**: Delete one question → verify it disappears from the admin Quiz tab → verify learner quiz no longer includes it.

- [X] T020 [US3] Add `DELETE /api/admin/projects/{project_id}/questions/{question_id}` endpoint to `backend/app/api/admin/quiz.py` — verify question belongs to project, delete it, return 204 No Content; raise 404 if not found
- [X] T021 [US3] Add `adminDeleteQuestion(projectId, questionId)` function to `frontend/src/services/quiz.js` — calls `DELETE /api/admin/projects/{projectId}/questions/{questionId}`
- [X] T022 [US3] Update the Quiz tab in `frontend/src/pages/admin/ProjectDetail.jsx` — add a "Delete" button on each question card; on click show `window.confirm("Delete this question? This cannot be undone.")` — if confirmed, call `adminDeleteQuestion`, remove the question from local state
- [X] T023 [US3] Copy updated backend file to container: `podman cp backend/app/api/admin/quiz.py backend:/app/app/api/admin/quiz.py` then `podman restart backend`

**Checkpoint**: Admin can delete questions with confirmation; deleted questions are gone from both admin and learner views.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T024 Update the Regenerate button handler in `frontend/src/pages/admin/ProjectDetail.jsx` Quiz tab — before calling `adminGenerateQuestions`, check if any questions have `is_published === true`; if yes, show `window.confirm("This will replace all questions, including published ones. Continue?")` and abort if cancelled
- [X] T025 Update `POST /api/user/projects/{project_id}/quiz/submit` in `backend/app/api/user/quiz.py` — add `Question.is_published == True` filter to the questions query used for scoring, so answers to unpublished question IDs (if submitted) are ignored in the score calculation
- [X] T026 Copy final backend files to container and restart: `podman cp backend/app/api/user/quiz.py backend:/app/app/api/user/quiz.py` then `podman restart backend`
- [ ] T027 Manual end-to-end test: run all 8 scenarios from `specs/004-question-validation/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS Phases 3–5
- **US1 (Phase 3)**: Depends on Phase 2
- **US2 (Phase 4)**: Depends on Phase 2 — independent of US1 (different endpoints/UI section)
- **US3 (Phase 5)**: Depends on Phase 2 — independent of US1 and US2
- **Polish (Phase 6)**: Depends on Phases 3–5 complete

### User Story Dependencies

- **US1 (P1)**: Foundational complete → start. No dependency on US2 or US3.
- **US2 (P2)**: Foundational complete → start. Independent of US1.
- **US3 (P3)**: Foundational complete → start. Independent of US1 and US2.

### Parallel Opportunities

- T001–T005 (Phase 1 reads) can all run in parallel
- T009–T011 (backend endpoints for US1) must be sequential — same file `admin/quiz.py`
- T016 (US2 backend) and T020 (US3 backend) can run in parallel — but both touch `admin/quiz.py`, so write sequentially
- T012–T013 (US1 frontend service) can run in parallel with T017 (US2 service) and T021 (US3 service)
- T014 (US1 UI), T018 (US2 UI), T022 (US3 UI) must run sequentially — all in same file `ProjectDetail.jsx`

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Phase 1: Read existing files
2. Phase 2: Add `is_published` field + apply migration
3. Phase 3: Publish/unpublish endpoints + learner filter + frontend badges
4. **STOP and VALIDATE**: Publish controls work, learner sees only published questions

### Full Delivery

1. MVP → validate
2. Phase 4 (edit) → validate inline edit works
3. Phase 5 (delete) → validate deletion with confirmation
4. Phase 6 (polish) → regeneration warning + submit filter + e2e test

---

## Notes

- All backend changes require `podman cp` + `podman restart backend` to take effect (Uvicorn does not auto-reload from copied files)
- The `publish-all` route (`/questions/publish-all`) MUST be registered before `/questions/{question_id}` routes in the router to avoid FastAPI treating "publish-all" as a `question_id` path parameter
- `is_published` is never returned to learners — the learner quiz endpoint returns only `id`, `question_text`, and `options`
- Existing quiz attempts are not affected by publish/unpublish changes — historical scores remain unchanged
