# Research: Quiz Question Validation

## Decision 1: Schema Migration Without Alembic

**Decision**: Add `is_published: bool = Field(default=False, sa_column_kwargs={"server_default": "false"})` to the `Question` SQLModel. For the running container, apply a one-liner `ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;` via `podman exec` before restarting the backend.

**Rationale**: The constitution forbids Alembic as a standalone dependency. SQLModel's `create_all` only creates missing tables — it does not add missing columns to existing ones. The `server_default="false"` ensures new deployments work without extra SQL, and the one-time `ALTER TABLE` handles the existing dev container. This is the simplest path that satisfies the constitution.

**Alternatives considered**:
- Alembic migration — rejected, constitution forbids it as a standalone dependency
- Drop and recreate table — rejected, destroys existing question data
- `metadata.create_all(checkfirst=True)` with column introspection — over-engineered for a single boolean column

---

## Decision 2: Publish Toggle vs. Publish-Only

**Decision**: Admins can both publish and unpublish questions (full toggle). A question can move from unpublished → published → unpublished freely.

**Rationale**: The spec requires FR-005 (unpublish a published question). Reversibility is important — an admin may publish a question and later discover an error.

**Alternatives considered**:
- Publish-only, no unpublish — rejected, violates FR-005 and makes errors unrecoverable without deletion

---

## Decision 3: Inline Edit vs. Modal

**Decision**: Inline edit within the question card — clicking Edit expands the card to show editable text fields for question text, all four options, and a radio group for the correct answer. Save/Cancel buttons appear inline.

**Rationale**: Keeps all context visible. A modal would hide the other questions, making it harder to compare. Inline editing is simpler to implement with React local state. Consistent with the existing admin UI pattern (assign learner form is inline).

**Alternatives considered**:
- Modal/drawer for editing — considered but adds DOM complexity and obscures surrounding questions
- Separate edit page — rejected, overkill for a simple form

---

## Decision 4: Regeneration Warning

**Decision**: Before the "Regenerate" API call fires, check if any published questions exist. If yes, show a `window.confirm()` dialog: "This will replace all questions, including published ones. Continue?" Cancel aborts the call.

**Rationale**: Meets FR-010 with zero additional UI components. The existing Regenerate button already fires an async handler — inserting a confirm check is a one-line addition.

**Alternatives considered**:
- Custom modal confirmation — considered but `window.confirm()` is sufficient for an admin-only action and avoids new components
- Warning badge instead of blocking dialog — rejected, a badge can be ignored; the spec requires a warning that actually blocks the action

---

## Decision 5: Publish All Endpoint

**Decision**: Add `POST /api/admin/projects/{project_id}/questions/publish-all` which sets `is_published = true` on all questions for the project in a single DB UPDATE.

**Rationale**: A bulk update is more efficient than N individual PATCH calls. The frontend calls this once; the backend updates atomically.

**Alternatives considered**:
- Frontend fires N individual publish requests — rejected, wasteful and error-prone on slow connections
- No bulk endpoint, only individual publish — rejected, FR-004 requires a single "Publish All" action
