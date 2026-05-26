# Tasks: Learner Self-Registration

**Input**: Design documents from `specs/002-learner-registration/`

**Branch**: `002-learner-registration`

**Organization**: Tasks grouped by user story — each story independently testable.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: Understand the existing auth extension points before adding to them.

- [x] T001 Read `backend/app/api/auth.py` to understand existing login/refresh/logout structure and the `_issue_tokens` helper (or equivalent) to reuse for registration response
- [x] T002 Read `frontend/src/pages/Login.jsx` to understand current form state and submission flow
- [x] T003 [P] Read `frontend/src/services/auth.js` to understand existing auth service functions

**Checkpoint**: Extension points understood — ready to implement.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No new infrastructure needed. The existing `User` model, `hash_password()`, JWT issuance, and Axios auth service are the foundation. This phase is satisfied by completing Phase 1.

**⚠️ CRITICAL**: Phase 1 must complete before user story implementation begins.

---

## Phase 3: User Story 1 — Learner Signs Up and Accesses Dashboard (Priority: P1) 🎯 MVP

**Goal**: A new visitor can register with email + password and land on the learner dashboard automatically logged in — no admin action required.

**Independent Test**: Open `http://localhost:5173`, click "Sign up", enter a new email and password (≥8 chars), submit — verify you are redirected to `/learner` and the dashboard shows "No projects assigned yet."

### Implementation

- [x] T004 [US1] Add `RegisterRequest` Pydantic schema (fields: `email: EmailStr`, `password: str` with `min_length=8`) to `backend/app/api/auth.py`
- [x] T005 [US1] Add `POST /api/auth/register` endpoint to `backend/app/api/auth.py`: check for duplicate email (return 409 if found), hash password, create `User(role="learner")`, commit, issue access token + refresh cookie, return 201 with `{"access_token": ..., "token_type": "bearer"}`
- [x] T006 [US1] Copy `backend/app/api/auth.py` into the running container: `podman cp backend/app/api/auth.py onboarding-ai-platform_backend_1:/app/app/api/auth.py`
- [x] T007 [US1] Add `register` function to `frontend/src/services/auth.js`: `export const register = (email, password) => api.post('/auth/register', { email, password })`
- [x] T008 [US1] Add `mode` state (`'login' | 'register'`) to `frontend/src/pages/Login.jsx` and render the sign-up form when `mode === 'register'` — fields: email, password (no confirm-password yet); on success store `access_token` and navigate to `/learner`
- [x] T009 [US1] Add toggle link to `frontend/src/pages/Login.jsx`: "Don't have an account? Sign up" (switches to register mode) and "Already have an account? Sign in" (switches back)

**Checkpoint**: Full happy-path registration works. New learner can sign up and reach their dashboard without any admin action.

---

## Phase 4: User Story 2 — Registration Input Validation (Priority: P2)

**Goal**: The sign-up form validates all inputs and shows specific, helpful error messages before or after submission.

**Independent Test**: On the sign-up form submit with: (a) blank email → "Email is required", (b) invalid email format → "Please enter a valid email address", (c) password < 8 chars → "Password must be at least 8 characters", (d) mismatched passwords → "Passwords do not match", (e) already-used email → "Email already registered".

### Implementation

- [x] T010 [US2] Add `confirmPassword` field to the register form in `frontend/src/pages/Login.jsx`
- [x] T011 [US2] Add client-side validation to the register submit handler in `frontend/src/pages/Login.jsx`: check email not blank, check password ≥ 8 chars, check `password === confirmPassword` — show inline error message for each failure without calling the API
- [x] T012 [US2] Display API error responses in the register form in `frontend/src/pages/Login.jsx`: catch `err.response?.data?.detail` and show it below the form (covers duplicate email 409 and any server-side validation errors)
- [x] T013 [US2] Verify `backend/app/api/auth.py` register endpoint returns `{"detail": "Email already registered"}` on 409 (not the generic IntegrityError message) — update if needed

**Checkpoint**: All 5 validation error cases show specific, readable messages. Happy path still works.

---

## Phase 5: User Story 3 — Admin Role Stays Manually Provisioned (Priority: P3)

**Goal**: Self-registered accounts are always `role="learner"`. Admin routes remain inaccessible to self-registered users.

**Independent Test**: Register a new account via the UI → check DB: `SELECT role FROM users WHERE email = '...'` → must be `learner`. Then try navigating to `/admin` → must redirect away.

### Implementation

- [x] T014 [US3] Verify `POST /api/auth/register` in `backend/app/api/auth.py` never reads a `role` field from the request body — confirm `role="learner"` is hardcoded in the `User(...)` constructor
- [x] T015 [US3] Verify `frontend/src/App.jsx` `PrivateRoute` already blocks `role=learner` users from `/admin` routes — no code change needed if it does; add the guard if missing

**Checkpoint**: Role boundary confirmed. Admin routes inaccessible to self-registered learners.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T016 [P] Clear the register form fields and reset to login mode after a successful registration in `frontend/src/pages/Login.jsx` (handles browser back-button edge case)
- [x] T017 [P] Add `disabled` state to the register submit button while the API call is in flight in `frontend/src/pages/Login.jsx` to prevent double-submission
- [ ] T018 Manual end-to-end test: register new learner → verify dashboard → log out → log back in → verify session works

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Satisfied by Phase 1
- **US1 (Phase 3)**: Depends on Phase 1 — BLOCKS Phases 4 and 5
- **US2 (Phase 4)**: Depends on Phase 3 (extends the register form)
- **US3 (Phase 5)**: Can run after Phase 3 in parallel with Phase 4
- **Polish (Phase 6)**: Depends on Phases 3–5

### User Story Dependencies

- **US1 (P1)**: Must complete first — builds the core register flow
- **US2 (P2)**: Extends US1 form — depends on US1
- **US3 (P3)**: Verification only — can run in parallel with US2 after US1

### Parallel Opportunities

- T002 and T003 (Phase 1) can run in parallel
- T004 and T007 (backend schema + frontend service) can run in parallel
- T014 and T015 (US3 verifications) can run in parallel
- T016 and T017 (Polish) can run in parallel

---

## Implementation Strategy

### MVP (User Story 1 Only)

1. Complete Phase 1: Read existing files
2. Implement T004–T009 (backend endpoint + frontend happy path)
3. **STOP and VALIDATE**: New learner registers and reaches dashboard
4. Ship if sufficient — validation (US2) and role guard (US3) are polish

### Full Delivery

1. Phase 1 → Phase 3 (MVP) → validate
2. Phase 4 (validation UX) → validate
3. Phase 5 (role guard verification) → validate
4. Phase 6 (polish) → final e2e test

---

## Notes

- No new Python packages required — `EmailStr` is already available via `pydantic[email]` (FastAPI installs it)
- No database migration needed — `users` table already has the required schema
- The container needs `podman cp` after each backend file change (uvicorn reloads automatically)
- Frontend changes are picked up by Vite HMR instantly — no restart needed
