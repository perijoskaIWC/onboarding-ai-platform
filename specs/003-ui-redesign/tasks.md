# Tasks: UI Redesign

**Input**: Design documents from `specs/003-ui-redesign/`

**Branch**: `003-ui-redesign`

**Organization**: Tasks grouped by user story — each story independently testable.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

**Purpose**: Read existing files to understand what's already built before making changes.

- [X] T001 Read `frontend/src/components/Sidebar.jsx` to understand current nav structure and the hardcoded learner project links
- [X] T002 [P] Read `frontend/src/pages/admin/ProjectDetail.jsx` to understand the current sections and existing `STATUS_COLORS` map
- [X] T003 [P] Read `frontend/src/pages/learner/Dashboard.jsx` to understand current project card link targets
- [X] T004 [P] Read `frontend/src/App.jsx` to understand current routes and layout wrappers

**Checkpoint**: Existing structure understood — ready to implement.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The sidebar learner link fix is a hard blocker — all learner navigation depends on it being correct before the tab page is added.

**⚠️ CRITICAL**: Phase 2 must complete before Phase 5 (US3 learner tabs).

- [X] T005 In `frontend/src/components/Sidebar.jsx` remove all hardcoded `/learner/projects/1/...` learner links from the `learnerLinks` array — keep only `{ to: '/learner', label: 'Home', icon: '...' }` with the home SVG icon

**Checkpoint**: Learner sidebar shows only "Home". Admin sidebar unchanged.

---

## Phase 3: User Story 1 — Consistent Navigation Shell (Priority: P1) 🎯 MVP

**Goal**: Every authenticated page has a working persistent sidebar with role-appropriate links and correct active-state highlighting.

**Independent Test**: Log in as admin → verify sidebar shows "Overview" and "Projects" with active highlight → log in as learner → verify sidebar shows only "Home" → verify top bar shows email + Logout on all pages.

- [X] T006 [US1] Verify `frontend/src/components/Layout.jsx` top bar shows platform name, user email, and Logout button — confirm no changes needed (already implemented per plan)
- [X] T007 [US1] Verify `frontend/src/App.jsx` `AdminLayout` and `LearnerLayout` wrappers correctly apply `<Layout role="...">` to every route — confirm no changes needed

**Checkpoint**: Navigation shell confirmed working. Sidebar shows correct links per role with active states.

---

## Phase 4: User Story 2 — Admin Project Detail Tabs (Priority: P2)

**Goal**: Admin project detail page shows four tabs (Documents, Learning Path, Quiz, Learners) — only one section visible at a time.

**Independent Test**: Open any project → verify four tabs render → click each tab → verify only that tab's content is shown → verify all existing actions (upload, regenerate LP, regenerate quiz, assign learner) still work.

- [X] T008 [US2] Add `const [tab, setTab] = useState('documents')` state to `frontend/src/pages/admin/ProjectDetail.jsx` and add the tab bar UI — four buttons with active/inactive styles using `border-b-2 border-brand-600 text-brand-600` for active and `text-gray-500 hover:text-gray-700` for inactive
- [X] T009 [US2] Wrap the Documents section in `{tab === 'documents' && ...}` conditional in `frontend/src/pages/admin/ProjectDetail.jsx` — remove the outer `{documents.length > 0 && ...}` guards added earlier (LP/Quiz visibility is now controlled by tabs, not by document count)
- [X] T010 [US2] Wrap the Learning Path section in `{tab === 'learning-path' && ...}` conditional in `frontend/src/pages/admin/ProjectDetail.jsx` — keep all existing LP logic and polling unchanged
- [X] T011 [US2] Wrap the Quiz section in `{tab === 'quiz' && ...}` conditional in `frontend/src/pages/admin/ProjectDetail.jsx` — keep all existing quiz logic and polling unchanged
- [X] T012 [US2] Wrap the Learners section in `{tab === 'learners' && ...}` conditional in `frontend/src/pages/admin/ProjectDetail.jsx` — keep all existing assign/remove logic unchanged
- [X] T013 [US2] Wrap the Analytics link section in `{tab === 'learners' && ...}` or add as a standalone footer outside tabs in `frontend/src/pages/admin/ProjectDetail.jsx`

**Checkpoint**: Admin project detail fully tabbed. All four tabs functional. All existing actions (upload, regenerate, assign) still work.

---

## Phase 5: User Story 3 — Learner Project View Tabs (Priority: P3)

**Goal**: Learners navigate to a single project page (`/learner/projects/:projectId`) with four tabs instead of separate sub-routes.

**Independent Test**: Log in as learner → click a project card → verify URL is `/learner/projects/:id` → verify four tabs render (Learning Path, AI Tutor, Quiz, Progress) → click each tab → verify content loads correctly for each.

- [X] T014 [US3] Create `frontend/src/pages/learner/LearnerProject.jsx` — new page with `const [tab, setTab] = useState('learning-path')` state, a 4-tab bar (Learning Path, AI Tutor, Quiz, Progress), and inline rendering of each tab's content imported from the existing page components (`LearningPath`, `Chat`, `Quiz`, `Progress`)
- [X] T015 [US3] Add route `<Route path="/learner/projects/:projectId" element={<LearnerLayout><LearnerProject /></LearnerLayout>} />` to `frontend/src/App.jsx` — place before the existing learner sub-routes
- [X] T016 [US3] Update `frontend/src/pages/learner/Dashboard.jsx` project card links — change the four separate `<Link>` items (Learning Path / AI Tutor / Quiz / Progress) to a single `<Link to={'/learner/projects/' + p.id}>` "Open Project" button on each card

**Checkpoint**: Learner project tab page works. Dashboard "Open Project" link navigates correctly. All four tabs load their content.

---

## Phase 6: User Story 4 — Visual Polish (Priority: P4)

**Goal**: All loading states use skeletons; all empty states use structured blocks with icon + heading + helper text + CTA; status badges are colour-coded.

**Independent Test**: Create a new project with no content → open each tab → verify structured empty states → upload a document → observe badge colours (pending/processing/ready) → observe skeleton during load → delete all documents → verify empty states return.

### Skeleton Loaders

- [X] T017 [P] [US4] Replace "Loading…" text in `frontend/src/pages/admin/Projects.jsx` with `animate-pulse` skeleton blocks; add structured empty state (icon + "No projects yet" + "Create Project" CTA) for empty projects list
- [X] T018 [P] [US4] Add `animate-pulse` skeleton to `frontend/src/pages/admin/Dashboard.jsx` for the projects card grid during loading (N/A — no loading state, static nav)
- [X] T019 [P] [US4] Replace "Loading documents…" text in the Documents tab of `frontend/src/pages/admin/ProjectDetail.jsx` with an `animate-pulse` skeleton list; add structured empty state with "No documents yet" heading, helper text, and Upload CTA when documents list is empty
- [X] T020 [P] [US4] Add structured empty state to the Learning Path tab in `frontend/src/pages/admin/ProjectDetail.jsx`: icon + "No learning path yet" heading + "Generate a learning path from your uploaded documents." helper + Generate button CTA (replacing the plain "No learning path yet." div)
- [X] T021 [P] [US4] Add structured empty state to the Quiz tab in `frontend/src/pages/admin/ProjectDetail.jsx`: icon + "No quiz questions yet" heading + helper text + Regenerate CTA (replacing the plain "No questions yet." text)
- [X] T022 [P] [US4] Replace loading text in `frontend/src/pages/learner/LearnerProject.jsx` with `animate-pulse` skeletons per tab; add empty state for Learning Path tab when no path exists (handled by each child component)
- [X] T023 [P] [US4] Polish `frontend/src/pages/learner/Dashboard.jsx` — add `animate-pulse` skeleton card grid during load; add structured empty state ("No projects assigned yet. Ask your admin to assign you to a project.") when projects list is empty

### Quiz & Progress Polish

- [X] T024 [P] [US4] Update `frontend/src/pages/learner/Quiz.jsx` — style answer option buttons as full-width cards with `border border-gray-200 rounded-lg p-3 text-left hover:border-brand-500 hover:bg-brand-50 transition-colors` and selected state `border-brand-600 bg-brand-50`
- [X] T025 [P] [US4] Add `animate-pulse` skeleton to `frontend/src/pages/learner/Progress.jsx` during loading; style the readiness score as a prominent display (large number + label)

**Checkpoint**: All loading/empty states are structured. No bare "Loading…" or "No X yet." text remains. Badge colours confirmed working.

---

## Phase 7: User Story 5 — Colour Palette Consistency (Priority: P5)

**Goal**: All interactive elements use the `brand-*` colour scale. No `blue-600` remnants.

**Independent Test**: Visit every page — all buttons, active nav links, and focus rings use indigo/brand colour. No bright-blue elements remain.

- [X] T026 [P] [US5] Replace all `blue-600`, `blue-700`, `blue-500` class references in `frontend/src/pages/admin/ProjectDetail.jsx` with `brand-600`, `brand-700`, `brand-500`
- [X] T027 [P] [US5] Replace all `blue-*` references in `frontend/src/pages/admin/Projects.jsx` with `brand-*`
- [X] T028 [P] [US5] Replace all `blue-*` references in `frontend/src/pages/learner/Chat.jsx` with `brand-*`
- [X] T029 [P] [US5] Replace all `blue-*` references in `frontend/src/pages/learner/Quiz.jsx` with `brand-*` (coordinate with T024)
- [X] T030 [P] [US5] Replace all `blue-*` references in `frontend/src/pages/learner/Progress.jsx` with `brand-*` (coordinate with T025)

**Checkpoint**: Colour consistency confirmed. All interactive elements use brand indigo.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T031 Update `frontend/src/pages/Login.jsx` — change input focus ring to `focus:ring-brand-500`, submit button to `bg-brand-600 hover:bg-brand-700`, card to `shadow-lg` (was `shadow-md`)
- [ ] T032 Manual end-to-end test: run all 6 scenarios from `specs/003-ui-redesign/quickstart.md` — admin navigation, admin tabs, learner tabs, empty states, skeletons, colour consistency

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS Phase 5 (learner tabs)
- **US1 (Phase 3)**: Verification only — can run after Phase 1
- **US2 (Phase 4)**: Depends on Phase 1 — independent of US1 and US3
- **US3 (Phase 5)**: Depends on Phase 2 (sidebar fix must be done first)
- **US4 (Phase 6)**: Depends on Phase 4 (tabs must exist before polishing tab content)
- **US5 (Phase 7)**: Independent — can run in parallel with Phase 6
- **Polish (Phase 8)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Verify-only — no code change expected
- **US2 (P2)**: Independent — only touches `ProjectDetail.jsx`
- **US3 (P3)**: Depends on Phase 2 sidebar fix
- **US4 (P4)**: Depends on US2/US3 tabs existing to polish their empty states
- **US5 (P5)**: Independent of all others — pure class name replacement

### Parallel Opportunities

- T001–T004 (Phase 1 reads) can all run in parallel
- T008–T013 (US2 tab sections) must run sequentially — all in same file
- T014–T016 (US3) must run sequentially — T015 and T016 depend on T014
- T017–T025 (US4 polish) all touch different files — can run in parallel
- T026–T030 (US5 colour) all touch different files — can run in parallel

---

## Implementation Strategy

### MVP (User Stories 1–3 Only)

1. Phase 1: Read existing files
2. Phase 2: Fix sidebar (T005)
3. Phase 3: Confirm navigation shell (T006–T007)
4. Phase 4: Admin tabs (T008–T013)
5. Phase 5: Learner project tab page (T014–T016)
6. **STOP and VALIDATE**: All navigation works, tabs work for both roles

### Full Delivery

1. MVP → validate
2. Phase 6 (visual polish) → validate
3. Phase 7 (colour consistency) → validate
4. Phase 8 (login polish + e2e test)

---

## Notes

- All tasks are frontend-only — no `podman cp` needed; Vite HMR picks up changes instantly
- No new npm packages — all styling via existing Tailwind classes
- `brand-*` colour scale already defined in `tailwind.config.js` (indigo)
- Existing `STATUS_COLORS` map in `ProjectDetail.jsx` already handles badge colours — no change needed
- `Layout.jsx` and `Sidebar.jsx` are already correct for the admin shell — minimal changes expected there
