# Feature Specification: AI-Powered Employee Onboarding Platform

**Feature Branch**: `001-onboarding-ai-platform`

**Created**: 2026-05-26

**Status**: Draft

**Input**: User description: "Build an AI-powered employee onboarding platform."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Login and Role Access (Priority: P1)

An employee or administrator visits the platform and logs in with their email and password.
The system identifies their role and redirects them to the appropriate dashboard. Admins see
the full management interface; Learners see only their personal onboarding workspace.

**Why this priority**: Nothing else on the platform works without verified identity and
correct role assignment. This is the foundation for all other features.

**Independent Test**: Can be fully tested by creating one Admin account and one Learner
account, logging in as each, and confirming each sees only their correct dashboard.

**Acceptance Scenarios**:

1. **Given** a registered Admin user, **When** they log in with valid credentials,
   **Then** they are directed to the Admin dashboard with access to all management features.
2. **Given** a registered Learner, **When** they log in, **Then** they are directed to
   their personal learning dashboard with no access to admin features.
3. **Given** an expired or invalid session, **When** a user attempts to access a protected
   page, **Then** they are redirected to the login screen.
4. **Given** incorrect credentials, **When** a user attempts to log in, **Then** the system
   rejects the attempt with a clear error message and does not reveal which field was wrong.

---

### User Story 2 - Admin Creates an Onboarding Project and Assigns Learners (Priority: P2)

An Admin creates a named onboarding project (e.g., "Q3 Engineering Onboarding"), optionally
adds a description, and assigns one or more registered Learners to it. Assigned Learners can
then access the project from their dashboard.

**Why this priority**: Projects are the container for all content and progress. Without a
project, no documents can be uploaded, no learning paths generated, and no learners tracked.

**Independent Test**: Admin creates a project and assigns a learner. Learner logs in and sees
the project listed on their dashboard. Delivers a usable multi-tenant project structure.

**Acceptance Scenarios**:

1. **Given** a logged-in Admin, **When** they create a project with a name and assign a
   Learner, **Then** the project appears in the Admin's project list and the Learner's dashboard.
2. **Given** a project with assigned learners, **When** the Admin removes a learner from the
   project, **Then** that learner no longer sees the project on their dashboard.
3. **Given** a Learner not assigned to a project, **When** they attempt to access that
   project directly, **Then** they receive an access-denied response.

---

### User Story 3 - Admin Uploads and Ingests Learning Documents (Priority: P3)

An Admin uploads one or more TXT or Markdown files to a project. The platform processes each
document in the background: splitting the text into chunks, generating embeddings for each
chunk, and storing them so the AI can search over them later. The Admin sees a status
indicator showing when ingestion is complete.

**Why this priority**: Documents are the sole source of truth for all AI-generated content.
No learning paths, chat answers, or quiz questions can be created without ingested documents.

**Independent Test**: Admin uploads a document and waits for the status to show "complete."
Delivers a fully functional document pipeline ready for AI use.

**Acceptance Scenarios**:

1. **Given** a project, **When** an Admin uploads a TXT or MD file, **Then** the document
   appears in the project's document list with a status of "processing."
2. **Given** a document in "processing" status, **When** ingestion completes successfully,
   **Then** the status updates to "ready" without requiring a page refresh.
3. **Given** a Learner assigned to the project, **When** they view the project, **Then**
   they can see the list of uploaded document names (but cannot delete them).
4. **Given** an unsupported file format is uploaded, **When** the Admin submits it, **Then**
   the system rejects the upload with a clear error message.

---

### User Story 4 - Admin Generates AI Learning Path (Priority: P4)

After documents are ingested, the Admin triggers AI learning path generation for the project.
The system produces a structured sequence of weekly topics and descriptions drawn from the
document content. The Admin can review the generated path before learners access it.

**Why this priority**: The learning path is the primary navigation structure for Learners.
It organizes document content into a guided sequence that makes onboarding coherent.

**Independent Test**: Admin generates a learning path for a project with at least one ingested
document. The path displays with multiple titled weekly modules.

**Acceptance Scenarios**:

1. **Given** a project with ingested documents, **When** the Admin triggers learning path
   generation, **Then** the system produces an ordered list of weekly modules with titles
   and descriptions drawn from document content.
2. **Given** a Learner with an assigned project, **When** a learning path has been generated,
   **Then** they can view their weekly modules on their dashboard.
3. **Given** a project with no ingested documents, **When** the Admin attempts to generate a
   learning path, **Then** the system returns an error indicating no content is available.

---

### User Story 5 - Learner Chats with AI Tutor (Priority: P5)

A Learner submits a question about their onboarding material through a chat interface. The
system searches the project's documents for relevant passages, uses those passages to compose
an answer, and returns the response with a citation identifying which document and section
was used. If the system finds no relevant information, it says so clearly.

**Why this priority**: The AI tutor is the platform's primary differentiator. It gives
Learners immediate, grounded answers without requiring human support.

**Independent Test**: Learner asks a question that is directly answered in an uploaded
document. The response contains the correct answer and a citation to the source chunk.

**Acceptance Scenarios**:

1. **Given** a Learner with an assigned project that has ingested documents, **When** they
   ask a question relevant to those documents, **Then** they receive an answer with a citation
   identifying the source document and passage.
2. **Given** a question with no relevant match in any ingested document, **When** the Learner
   submits it, **Then** the system returns "no information available" and does not fabricate
   an answer.
3. **Given** a Learner's chat history, **When** they return to the chat, **Then** previous
   messages and AI responses are visible in the conversation thread.

---

### User Story 6 - Learner Takes a Quiz (Priority: P6)

A Learner accesses the quiz for their assigned project. The system presents a randomized set
of questions generated from the project's documents. After submitting, the Learner sees their
score and per-question feedback including which answer was correct and which document passage
the question was based on.

**Why this priority**: Quizzes are the primary assessment mechanism and provide data for the
readiness score. They also reinforce learning through active recall.

**Independent Test**: Admin triggers question generation. Learner takes the quiz, submits, and
sees their score with per-question feedback citing source passages.

**Acceptance Scenarios**:

1. **Given** an Admin has triggered question generation for a project, **When** the Learner
   accesses the quiz, **Then** they are presented with a randomized selection of questions.
2. **Given** a Learner completes a quiz, **When** they submit, **Then** they see their total
   score, correct/incorrect indicators per question, the correct answer, and the source passage.
3. **Given** a Learner has already completed a quiz, **When** they retake it, **Then** the
   questions are re-randomized and the new attempt is recorded separately.
4. **Given** a project with no generated questions, **When** a Learner accesses the quiz
   section, **Then** they see a message indicating the quiz is not yet available.

---

### User Story 7 - Learner Tracks Personal Progress and Readiness Score (Priority: P7)

A Learner views a personal dashboard showing which modules they have completed, their quiz
attempt history and scores, and an overall readiness score. The readiness score is a composite
of their quiz performance and module completion progress.

**Why this priority**: The readiness score is the platform's core outcome metric — it gives
Learners a clear signal of their onboarding status and motivates continued engagement.

**Independent Test**: Learner marks a module complete and takes a quiz. Dashboard updates to
reflect the new readiness score.

**Acceptance Scenarios**:

1. **Given** a Learner who has completed some modules and taken a quiz, **When** they view
   their dashboard, **Then** they see the correct readiness score, module completion count,
   and quiz history.
2. **Given** a Learner marks a module as complete, **When** the page updates, **Then** the
   readiness score increases to reflect the new completion percentage.
3. **Given** a Learner retakes a quiz and scores higher, **When** they view their dashboard,
   **Then** the readiness score reflects the updated weighted quiz average.

---

### User Story 8 - Admin Views Reporting and Analytics (Priority: P8)

An Admin views a reporting dashboard for a project showing all assigned Learners' progress:
readiness scores, module completion rates, and quiz performance. Charts display aggregate and
per-learner trends. The Admin can drill into any individual Learner's results.

**Why this priority**: Reporting closes the loop for Admins — they can identify learners who
need support and assess overall onboarding effectiveness.

**Independent Test**: Multiple learners have varying quiz scores and module completions. Admin
views the project dashboard and sees accurate aggregated metrics and charts.

**Acceptance Scenarios**:

1. **Given** a project with multiple Learners at different stages, **When** the Admin views
   the analytics dashboard, **Then** they see average readiness, completion rate, and quiz
   scores per project.
2. **Given** an Admin selects a specific Learner, **When** they view that learner's detail,
   **Then** they see that learner's module completions, individual quiz attempts, and readiness
   score history.
3. **Given** no Learners have started the project, **When** the Admin views the dashboard,
   **Then** the charts display empty/zero states with clear messaging.

---

### Edge Cases

- What happens when a document upload fails midway through ingestion (e.g., service timeout)?
- How does the chat respond if the top-k retrieved chunks are too short to form a meaningful answer?
- What happens if a Learner is removed from a project while a quiz attempt is in progress?
- How does the readiness score behave if a Learner has completed modules but never taken a quiz?
- What happens when an Admin triggers learning path regeneration on a project that already has one?
- How does the system handle duplicate file uploads (same filename, same or different content)?

---

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & RBAC**

- **FR-001**: The system MUST allow users to log in with email and password and receive a
  session token valid for a configurable duration.
- **FR-002**: The system MUST assign each user exactly one role: Admin or Learner.
- **FR-003**: Admin routes MUST be inaccessible to Learner-role accounts; any attempt MUST
  return an authorization error.
- **FR-004**: The system MUST allow session tokens to be refreshed without re-entering credentials.
- **FR-005**: Passwords MUST be stored as secure one-way hashes; plaintext passwords MUST
  never be persisted or logged.

**Project Management**

- **FR-006**: Admins MUST be able to create, edit, and delete onboarding projects.
- **FR-007**: Admins MUST be able to assign and unassign registered Learners to/from projects.
- **FR-008**: Learners MUST only be able to view projects they are explicitly assigned to.
- **FR-009**: Deleting a project MUST remove all associated documents, embeddings, learning
  paths, questions, and progress records.

**Document Upload & Ingestion**

- **FR-010**: Admins MUST be able to upload TXT and Markdown files per project.
- **FR-011**: Uploaded documents MUST be processed in the background: split into chunks,
  embedded, and stored without blocking the upload response.
- **FR-012**: Each document MUST have a visible ingestion status: pending, processing, ready,
  or failed.
- **FR-013**: Chunk size and overlap MUST be configurable per project with defaults of
  500 tokens and 50 tokens respectively.
- **FR-014**: Learners MUST be able to view the list of document names for their assigned
  project but MUST NOT be able to upload or delete documents.

**AI Learning Path Generation**

- **FR-015**: Admins MUST be able to trigger learning path generation for a project that has
  at least one document in "ready" status.
- **FR-016**: The generated learning path MUST consist of an ordered sequence of weekly
  modules, each with a title and description derived from document content.
- **FR-017**: Learners MUST be able to view their project's learning path as an ordered list
  of modules.
- **FR-018**: Learners MUST be able to mark individual modules as complete.
- **FR-019**: Triggering regeneration on a project that already has a learning path MUST
  replace the existing path.

**AI Tutor / RAG Chat**

- **FR-020**: Learners MUST be able to submit text questions about their assigned project's
  content through a chat interface.
- **FR-021**: Each AI answer MUST include a citation identifying the source document and chunk
  that grounded the response.
- **FR-022**: If no relevant document chunk is found for a question, the system MUST return
  a "no information available" message and MUST NOT generate an unsourced answer.
- **FR-023**: Chat history for each Learner MUST be persisted and visible on return visits.

**Questions & Quizzes**

- **FR-024**: Admins MUST be able to trigger AI question generation for a project; questions
  are generated from document chunks.
- **FR-025**: Each generated question MUST reference the document chunk it was derived from.
- **FR-026**: Learners MUST be presented with a randomized subset of questions when taking
  a quiz; the default quiz length MUST be configurable per project.
- **FR-027**: The system MUST score each quiz attempt immediately upon submission.
- **FR-028**: Quiz results MUST show the Learner's score, correct/incorrect status per
  question, the correct answer, and the source passage.
- **FR-029**: All quiz attempts MUST be persisted; Learners MAY retake quizzes.

**Progress Tracking & Readiness Score**

- **FR-030**: The system MUST track each Learner's module completion and quiz attempt history
  per project.
- **FR-031**: The readiness score MUST be calculated as:
  `(weighted_quiz_average × 0.7) + (module_completion_percentage × 0.3)`.
- **FR-032**: The readiness score MUST update in real time when a module is marked complete
  or a new quiz attempt is submitted.
- **FR-033**: Learners MUST be able to view their readiness score, module completion status,
  and quiz attempt history from their personal dashboard.

**Reporting & Analytics**

- **FR-034**: Admins MUST be able to view per-project aggregate statistics: average readiness
  score, average quiz scores, and module completion rate across all assigned Learners.
- **FR-035**: Admins MUST be able to drill into any individual Learner's progress within a
  project.
- **FR-036**: Analytics dashboards MUST display data using charts (bar, line, progress).
- **FR-037**: All analytics data MUST reflect the current state of the database in real time
  (no stale cached aggregates visible to users).

---

### Key Entities

- **User**: A platform participant with a role (Admin or Learner), email, and hashed password.
- **Project**: An onboarding program with a name, description, an owning Admin, and a set of
  assigned Learners.
- **Document**: A file uploaded to a project with a name, type, ingestion status, and original
  content.
- **DocumentChunk**: A text segment from a Document with its position, token count, and a
  semantic embedding used for similarity search.
- **LearningPath**: An ordered collection of weekly modules generated for a project.
- **LearningModule**: A single week's topic within a LearningPath, with a title and description
  sourced from document content.
- **ModuleCompletion**: A record that a specific Learner completed a specific module, with a
  timestamp.
- **Question**: An AI-generated question tied to a DocumentChunk, with the question text,
  correct answer, and distractor options.
- **QuizAttempt**: A single quiz session for a Learner on a project, recording start time,
  end time, and final score.
- **QuizAnswer**: One answered question within a QuizAttempt, recording the selected choice
  and whether it was correct.
- **ChatMessage**: A single Q&A exchange in the AI tutor chat, storing the question, answer,
  and the source chunks cited.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new Admin can create a project, upload documents, and have the learning path
  ready for Learners within 10 minutes of first login.
- **SC-002**: Learners receive an AI tutor answer with a citation within 5 seconds of
  submitting a question under normal load.
- **SC-003**: 100% of AI tutor responses either include a citation to a source document
  chunk or explicitly state "no information available" — zero unsourced answers.
- **SC-004**: Quiz scoring and readiness score recalculation complete within 2 seconds of
  a quiz submission.
- **SC-005**: The platform supports at least 50 concurrent Learner sessions without
  degradation in response time.
- **SC-006**: Learners can identify their current readiness score and the next incomplete
  module from their dashboard without navigating away from the main view.
- **SC-007**: Admin analytics dashboards correctly reflect the current state of all Learner
  progress with no more than 5-second staleness under normal conditions.

---

## Assumptions

- Learners are registered by Admins; self-registration is out of scope for v1.
- The platform supports English-language documents only in v1.
- Documents are stored on the host filesystem (or Docker volume); cloud blob storage
  integration is out of scope for v1.
- A single deployment instance (Docker Compose) is sufficient; horizontal scaling is out of
  scope for v1.
- Email notifications (e.g., assignment alerts) are out of scope for v1.
- Admin accounts are created manually (via seed script or direct DB entry); an Admin
  self-registration UI is out of scope for v1.
- The number of questions presented in a quiz defaults to 10 unless configured otherwise.
- Learning path generation produces a minimum of 4 and maximum of 12 weekly modules
  depending on document volume.
