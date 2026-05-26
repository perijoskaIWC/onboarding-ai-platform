# Feature Specification: Quiz Question Validation

**Feature Branch**: `004-question-validation`

**Created**: 2026-05-26

**Status**: Draft

**Input**: Admin can review, edit, and delete individual quiz questions before learners see them. Each question shows its text, the four answer options, and the correct answer. Admin can edit any field inline or delete a question. A "Published" toggle controls whether the question is visible to learners — unpublished questions are generated but hidden until approved. This prevents bad AI-generated questions from reaching learners.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Review and Publish Questions (Priority: P1)

After the AI generates quiz questions for a project, the admin reviews each question and publishes the ones that are accurate. Unpublished questions are invisible to learners. The admin can publish all at once or individually.

**Why this priority**: Without this, bad AI-generated questions reach learners immediately. This is the core safety gate of the feature.

**Independent Test**: Generate questions for a project → verify all appear as unpublished → publish two of them → log in as learner → verify only the two published questions appear in the quiz.

**Acceptance Scenarios**:

1. **Given** questions were just generated, **When** the admin opens the Quiz tab, **Then** all questions show as unpublished and are not visible to learners.
2. **Given** some questions are unpublished, **When** the admin clicks Publish on a question, **Then** that question immediately becomes visible to learners.
3. **Given** a mix of published and unpublished questions, **When** the admin clicks "Publish All", **Then** all questions become published in one action.
4. **Given** no questions are published, **When** a learner opens the Quiz tab, **Then** they see the "no questions available" message.

---

### User Story 2 — Edit Question Content (Priority: P2)

The admin can edit the text of a question, its answer options, and which option is the correct answer — fixing errors introduced by the AI generator.

**Why this priority**: Publishing a question with a wrong answer or misleading wording is worse than not having it. Editing is the fix.

**Independent Test**: Open the Quiz tab → edit a question's text and correct answer → save → log in as learner → verify the quiz shows the updated question and the correct answer is scored accordingly.

**Acceptance Scenarios**:

1. **Given** a question exists, **When** the admin clicks Edit, **Then** the question text and all four options become editable fields.
2. **Given** the admin has edited a question, **When** they save, **Then** the updated content is immediately reflected in the quiz tab and for learners on their next attempt.
3. **Given** an admin is editing, **When** they click Cancel, **Then** the original content is restored with no changes saved.
4. **Given** the admin submits an edit with an empty question text or no correct answer selected, **When** they try to save, **Then** they see a validation error and the save is blocked.

---

### User Story 3 — Delete Questions (Priority: P3)

The admin can permanently delete a question that is entirely unsuitable — for example if it is off-topic, duplicated, or factually wrong beyond repair.

**Why this priority**: Sometimes editing is not enough; deletion removes the question entirely from the pool.

**Independent Test**: Delete one question → verify the quiz tab shows one fewer question → verify learner quiz no longer includes the deleted question.

**Acceptance Scenarios**:

1. **Given** a question exists, **When** the admin clicks Delete and confirms, **Then** the question is permanently removed.
2. **Given** the admin clicks Delete, **When** they cancel the confirmation, **Then** the question is not removed.
3. **Given** all questions are deleted, **When** admin views the Quiz tab, **Then** the empty state with "No quiz questions yet" is shown.

---

### Edge Cases

- What happens when the admin publishes a question and a learner is mid-quiz? The learner's current session is unaffected; the change takes effect for the next attempt.
- What happens if the AI regenerates questions while some are already published? Regeneration replaces all questions (published and unpublished) — admin must re-review. A warning is shown before regeneration.
- What if there is only one question and the admin deletes it? The quiz returns to empty state.
- What if two admins edit the same question simultaneously? Last write wins; no concurrent editing conflict handling required.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every AI-generated question MUST default to unpublished status immediately after generation.
- **FR-002**: Learners MUST only see questions that have been explicitly published by an admin.
- **FR-003**: Admins MUST be able to publish a single question individually from the Quiz tab.
- **FR-004**: Admins MUST be able to publish all questions in a project with a single "Publish All" action.
- **FR-005**: Admins MUST be able to unpublish a published question (reverse a publish decision).
- **FR-006**: Admins MUST be able to edit the question text, all four answer options, and the correct answer designation for any question.
- **FR-007**: The edit form MUST prevent saving if question text is empty or no correct answer is selected.
- **FR-008**: Admins MUST be able to permanently delete any question.
- **FR-009**: Deletion MUST require a confirmation step to prevent accidental removal.
- **FR-010**: When the admin triggers "Regenerate" questions, the system MUST warn that all existing questions (including published ones) will be replaced.
- **FR-011**: The Quiz tab MUST clearly distinguish published questions from unpublished ones (visual indicator).
- **FR-012**: The count of published vs. total questions MUST be visible on the Quiz tab (e.g., "3 of 7 published").

### Key Entities

- **QuizQuestion**: Represents a single quiz question. Key attributes: question text, four answer options (A–D), correct answer designation, published status (true/false), project association.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero unpublished questions are visible to learners — verified by checking the learner quiz API response excludes unpublished questions.
- **SC-002**: Admin can review, edit, and publish a full set of 10 questions in under 3 minutes.
- **SC-003**: All question edits are reflected in the learner quiz within one page load (no caching lag).
- **SC-004**: Regenerating questions while some are published shows a warning 100% of the time before proceeding.

## Assumptions

- Questions are always multiple-choice with exactly four options (A, B, C, D) — the existing data model is not changing.
- Only admin users can publish, edit, or delete questions — learners have no access to question management.
- The existing quiz scoring logic uses the correct answer stored on the question; editing the correct answer will affect scoring on future attempts but not retroactively change past attempt results.
- Learner quiz attempts already in progress when a question is unpublished are not interrupted; the change affects the next fresh load.
- No approval workflow is needed — any admin can publish any question. There is no multi-step review chain.
