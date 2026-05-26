# API Contract: AI-Powered Employee Onboarding Platform

**Phase**: 1 — Design
**Branch**: `001-onboarding-ai-platform`
**Date**: 2026-05-26

All endpoints use JSON request/response bodies unless noted. Authentication is via
`Authorization: Bearer <access_token>` header. All timestamps are ISO 8601 UTC.

---

## Auth Conventions

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public — no auth required |
| 🛡️ Admin | Requires valid JWT with `role = "admin"` |
| 👤 Learner | Requires valid JWT with `role = "learner"` |

---

## 1. Authentication

### POST /api/auth/login 🔓

Login with email and password.

**Request**
```json
{
  "email": "user@example.com",
  "password": "plaintext-password"
}
```

**Response 200**
```json
{
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 900
}
```
Sets `refresh_token` as an `httpOnly` cookie.

**Errors**: `401` invalid credentials, `422` validation error

---

### POST /api/auth/refresh 🔓

Exchange a valid refresh token cookie for a new access token.

**Request**: No body. Reads `refresh_token` cookie.

**Response 200**
```json
{
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 900
}
```

**Errors**: `401` refresh token expired/revoked

---

### POST /api/auth/logout 👤 or 🛡️

Revoke current refresh token.

**Request**: No body.

**Response 204**: No content.

---

## 2. Admin — Project Management

### GET /api/admin/projects 🛡️ Admin

List all projects owned by the requesting admin.

**Response 200**
```json
[
  {
    "id": "<uuid>",
    "name": "Q3 Engineering Onboarding",
    "description": "...",
    "learner_count": 12,
    "document_count": 5,
    "created_at": "2026-05-01T10:00:00Z"
  }
]
```

---

### POST /api/admin/projects 🛡️ Admin

Create a new project.

**Request**
```json
{
  "name": "Q3 Engineering Onboarding",
  "description": "Optional description",
  "chunk_size": 500,
  "chunk_overlap": 50,
  "rag_top_k": 5,
  "quiz_length": 10
}
```

**Response 201**
```json
{ "id": "<uuid>", "name": "...", "created_at": "..." }
```

---

### GET /api/admin/projects/{project_id} 🛡️ Admin

Get full project detail including document list and assigned learners.

**Response 200**
```json
{
  "id": "<uuid>",
  "name": "...",
  "description": "...",
  "chunk_size": 500,
  "chunk_overlap": 50,
  "rag_top_k": 5,
  "quiz_length": 10,
  "documents": [...],
  "learners": [{ "id": "<uuid>", "email": "..." }],
  "has_learning_path": true,
  "question_count": 42,
  "created_at": "..."
}
```

**Errors**: `404` project not found or not owned by admin

---

### PATCH /api/admin/projects/{project_id} 🛡️ Admin

Update project fields. All fields optional.

**Request** (partial update)
```json
{ "name": "New Name", "quiz_length": 15 }
```

**Response 200**: Updated project object.

---

### DELETE /api/admin/projects/{project_id} 🛡️ Admin

Delete project and all associated data (documents, embeddings, questions, progress).

**Response 204**: No content.

---

### POST /api/admin/projects/{project_id}/learners 🛡️ Admin

Assign a learner to the project.

**Request**
```json
{ "learner_id": "<uuid>" }
```

**Response 201**
```json
{ "project_id": "<uuid>", "learner_id": "<uuid>", "assigned_at": "..." }
```

**Errors**: `404` learner not found, `409` already assigned

---

### DELETE /api/admin/projects/{project_id}/learners/{learner_id} 🛡️ Admin

Remove a learner from the project.

**Response 204**: No content.

---

## 3. Admin — Document Management

### POST /api/admin/projects/{project_id}/documents 🛡️ Admin

Upload a document. `multipart/form-data`.

**Request**: Form field `file` (TXT or MD only).

**Response 202**
```json
{
  "id": "<uuid>",
  "filename": "employee-handbook.md",
  "ingestion_status": "pending",
  "uploaded_at": "..."
}
```

Background ingestion starts immediately.

**Errors**: `415` unsupported file type

---

### GET /api/admin/projects/{project_id}/documents 🛡️ Admin

List all documents for a project with ingestion status.

**Response 200**
```json
[
  {
    "id": "<uuid>",
    "filename": "employee-handbook.md",
    "file_type": "md",
    "ingestion_status": "ready",
    "ingestion_error": null,
    "chunk_count": 24,
    "uploaded_at": "..."
  }
]
```

---

### DELETE /api/admin/projects/{project_id}/documents/{document_id} 🛡️ Admin

Delete a document and its chunks/embeddings.

**Response 204**: No content.

---

## 4. Admin — Learning Path

### POST /api/admin/projects/{project_id}/learning-path/generate 🛡️ Admin

Trigger AI learning path generation. Replaces existing path if one exists.

**Response 202**
```json
{ "message": "Learning path generation started" }
```

**Errors**: `409` no ingested documents available

---

### GET /api/admin/projects/{project_id}/learning-path 🛡️ Admin

Get the generated learning path.

**Response 200**
```json
{
  "id": "<uuid>",
  "generated_at": "...",
  "modules": [
    {
      "id": "<uuid>",
      "week_number": 1,
      "title": "Company Culture & Values",
      "description": "Overview of..."
    }
  ]
}
```

**Errors**: `404` no learning path generated yet

---

## 5. Admin — Questions

### POST /api/admin/projects/{project_id}/questions/generate 🛡️ Admin

Trigger AI question generation from document chunks.

**Response 202**
```json
{ "message": "Question generation started" }
```

**Errors**: `409` no ingested documents available

---

### GET /api/admin/projects/{project_id}/questions 🛡️ Admin

List all generated questions for a project.

**Response 200**
```json
[
  {
    "id": "<uuid>",
    "question_text": "What is...?",
    "correct_answer": "...",
    "distractors": ["...", "...", "..."],
    "source_document": "employee-handbook.md",
    "source_excerpt": "..."
  }
]
```

---

## 6. Admin — Analytics

### GET /api/admin/projects/{project_id}/analytics 🛡️ Admin

Aggregate stats for the project.

**Response 200**
```json
{
  "project_id": "<uuid>",
  "learner_count": 12,
  "avg_readiness_score": 0.72,
  "avg_quiz_score": 0.78,
  "avg_module_completion_pct": 0.63,
  "learners": [
    {
      "learner_id": "<uuid>",
      "email": "...",
      "readiness_score": 0.85,
      "modules_completed": 6,
      "modules_total": 8,
      "quiz_attempts": 3,
      "last_quiz_score": 0.9
    }
  ]
}
```

---

### GET /api/admin/projects/{project_id}/analytics/learners/{learner_id} 🛡️ Admin

Per-learner drill-down.

**Response 200**
```json
{
  "learner_id": "<uuid>",
  "email": "...",
  "readiness_score": 0.85,
  "modules": [
    { "module_id": "<uuid>", "title": "...", "week_number": 1, "completed": true, "completed_at": "..." }
  ],
  "quiz_attempts": [
    { "attempt_id": "<uuid>", "score": 0.9, "completed_at": "..." }
  ]
}
```

---

## 7. Learner — Project

### GET /api/user/projects 👤 Learner

List projects assigned to the requesting learner.

**Response 200**
```json
[
  {
    "id": "<uuid>",
    "name": "Q3 Engineering Onboarding",
    "description": "...",
    "readiness_score": 0.45,
    "modules_completed": 3,
    "modules_total": 8
  }
]
```

---

### GET /api/user/projects/{project_id} 👤 Learner

Get project detail for the learner (no admin-only fields).

**Errors**: `403` not assigned to this project

---

### GET /api/user/projects/{project_id}/documents 👤 Learner

List document names for the assigned project (names only, no raw content).

**Response 200**
```json
[
  { "id": "<uuid>", "filename": "employee-handbook.md" }
]
```

---

## 8. Learner — Learning Path

### GET /api/user/projects/{project_id}/learning-path 👤 Learner

Get the learning path with completion status per module.

**Response 200**
```json
{
  "id": "<uuid>",
  "modules": [
    {
      "id": "<uuid>",
      "week_number": 1,
      "title": "...",
      "description": "...",
      "completed": true,
      "completed_at": "2026-05-15T09:30:00Z"
    }
  ]
}
```

**Errors**: `404` no learning path generated yet, `403` not assigned

---

### POST /api/user/projects/{project_id}/learning-path/modules/{module_id}/complete 👤 Learner

Mark a module as complete.

**Response 200**
```json
{
  "module_id": "<uuid>",
  "completed_at": "...",
  "new_readiness_score": 0.52
}
```

**Errors**: `409` already completed

---

## 9. Learner — AI Tutor Chat

### POST /api/user/projects/{project_id}/chat 👤 Learner

Submit a question to the AI tutor.

**Request**
```json
{ "question": "What is the company's leave policy?" }
```

**Response 200**
```json
{
  "id": "<uuid>",
  "question": "What is the company's leave policy?",
  "answer": "Employees are entitled to 20 days of annual leave...",
  "no_context_found": false,
  "citations": [
    {
      "document_name": "employee-handbook.md",
      "excerpt": "Annual leave entitlement: All full-time employees receive 20 days..."
    }
  ],
  "created_at": "..."
}
```

When `no_context_found = true`, `answer = "no information available"` and `citations = []`.

---

### GET /api/user/projects/{project_id}/chat 👤 Learner

Get the learner's chat history for the project.

**Response 200**: Array of chat message objects (same shape as POST response).

---

## 10. Learner — Quiz

### POST /api/user/projects/{project_id}/quiz/start 👤 Learner

Start a new quiz attempt. Returns a randomized set of questions (no correct answers in response).

**Response 201**
```json
{
  "attempt_id": "<uuid>",
  "questions": [
    {
      "question_id": "<uuid>",
      "question_text": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    }
  ]
}
```

**Errors**: `404` no questions generated for this project

---

### POST /api/user/projects/{project_id}/quiz/{attempt_id}/submit 👤 Learner

Submit answers for a quiz attempt.

**Request**
```json
{
  "answers": [
    { "question_id": "<uuid>", "selected_answer": "Option B" }
  ]
}
```

**Response 200**
```json
{
  "attempt_id": "<uuid>",
  "score": 0.8,
  "new_readiness_score": 0.74,
  "results": [
    {
      "question_id": "<uuid>",
      "question_text": "...",
      "selected_answer": "Option B",
      "correct_answer": "Option B",
      "is_correct": true,
      "source_document": "employee-handbook.md",
      "source_excerpt": "..."
    }
  ]
}
```

**Errors**: `404` attempt not found, `409` attempt already submitted

---

### GET /api/user/projects/{project_id}/quiz/history 👤 Learner

Get all quiz attempt summaries for the learner in this project.

**Response 200**
```json
[
  {
    "attempt_id": "<uuid>",
    "score": 0.8,
    "question_count": 10,
    "completed_at": "..."
  }
]
```

---

## 11. Learner — Progress

### GET /api/user/projects/{project_id}/progress 👤 Learner

Get the learner's full progress summary for the project.

**Response 200**
```json
{
  "project_id": "<uuid>",
  "readiness_score": 0.74,
  "modules_completed": 5,
  "modules_total": 8,
  "module_completion_pct": 0.625,
  "quiz_weighted_avg": 0.82,
  "quiz_attempts": 3,
  "last_updated": "..."
}
```
