# API Contract: Learner Self-Registration

**Feature**: 002-learner-registration
**Date**: 2026-05-26

## New Endpoint

### POST /api/auth/register

Registers a new learner account and returns auth tokens (same shape as login).

**Request Body**

```json
{
  "email": "learner@example.com",
  "password": "mypassword123"
}
```

| Field    | Type   | Required | Validation                  |
|----------|--------|----------|-----------------------------|
| email    | string | yes      | Valid email format           |
| password | string | yes      | Minimum 8 characters         |

**Success Response — 201 Created**

```json
{
  "access_token": "<jwt>",
  "token_type": "bearer"
}
```

Sets `refresh_token` as an `httpOnly` cookie (same as `/api/auth/login`).

**Error Responses**

| Status | Condition                        | Body                                          |
|--------|----------------------------------|-----------------------------------------------|
| 409    | Email already registered         | `{"detail": "Email already registered"}`      |
| 422    | Invalid email format             | FastAPI validation error                      |
| 422    | Password shorter than 8 chars    | FastAPI validation error                      |

---

## Unchanged Endpoints

All existing auth endpoints (`POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`) are unchanged.

## Frontend Changes (not API)

- `Login.jsx` gains a toggle between "Sign in" and "Sign up" modes.
- `frontend/src/services/auth.js` gains a `register(email, password)` function calling `POST /api/auth/register`.
- On success, the token is stored and the user is redirected to `/learner`.
