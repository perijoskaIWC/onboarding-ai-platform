# API Contract: Quiz Question Validation

**Branch**: `004-question-validation`
**Date**: 2026-05-26

Extends the existing API contract from `specs/001-onboarding-ai-platform/contracts/api.md`.
All endpoints use JSON. Auth via `Authorization: Bearer <token>`.

| Symbol | Meaning |
|--------|---------|
| 🛡️ Admin | Requires `role = "admin"` JWT |
| 👤 Learner | Requires `role = "learner"` JWT |

---

## Modified Endpoint: Admin List Questions

### GET /api/admin/projects/{project_id}/questions 🛡️ Admin

**Change**: Response now includes `is_published` field.

**Response 200**
```json
[
  {
    "id": "uuid",
    "project_id": "uuid",
    "question_text": "What is X?",
    "option_a": "Answer 1",
    "option_b": "Answer 2",
    "option_c": "Answer 3",
    "option_d": "Answer 4",
    "correct_answer": "A",
    "explanation": "Because...",
    "is_published": false
  }
]
```

---

## New Endpoints: Admin Question Management

### PATCH /api/admin/projects/{project_id}/questions/{question_id}/publish 🛡️ Admin

Toggle the published status of a single question.

**Request**
```json
{ "is_published": true }
```

**Response 200**
```json
{
  "id": "uuid",
  "is_published": true
}
```

**Errors**: `404` question not found or not in project

---

### POST /api/admin/projects/{project_id}/questions/publish-all 🛡️ Admin

Publish all questions for a project in one operation.

**Request**: no body

**Response 200**
```json
{ "published_count": 7 }
```

---

### PUT /api/admin/projects/{project_id}/questions/{question_id} 🛡️ Admin

Update the content of a question (text, options, correct answer, explanation).

**Request**
```json
{
  "question_text": "Updated question text?",
  "option_a": "New option A",
  "option_b": "New option B",
  "option_c": "New option C",
  "option_d": "New option D",
  "correct_answer": "B",
  "explanation": "Updated explanation"
}
```

All fields required except `explanation` (optional).

**Validation**:
- `question_text` must be non-empty
- `correct_answer` must be one of "A", "B", "C", "D"
- `option_a` through `option_d` must be non-empty

**Response 200**: Updated question object (same shape as list response)

**Errors**: `404` not found, `422` validation error

---

### DELETE /api/admin/projects/{project_id}/questions/{question_id} 🛡️ Admin

Permanently delete a question.

**Response 204**: No content

**Errors**: `404` question not found or not in project

---

## Modified Endpoint: Learner Get Quiz

### GET /api/user/projects/{project_id}/quiz 👤 Learner

**Change**: Returns only questions where `is_published = true`.
If no published questions exist, returns `404` with `"No questions available yet"`.

**Response 200** (unchanged shape — `is_published` not exposed to learner)
```json
[
  {
    "id": "uuid",
    "question_text": "What is X?",
    "options": ["Answer 1", "Answer 2", "Answer 3", "Answer 4"]
  }
]
```

---

## Modified Endpoint: Learner Submit Quiz

### POST /api/user/projects/{project_id}/quiz/submit 👤 Learner

**Change**: Scoring uses only published questions. Submitted answers for unpublished question IDs are ignored.

**Response 200** (unchanged shape)
```json
{
  "score": 0.75,
  "correct": 3,
  "total": 4,
  "results": [...]
}
```
