# Research: Learner Self-Registration

**Feature**: 002-learner-registration
**Date**: 2026-05-26

## Decisions

### 1. Registration Endpoint Placement

**Decision**: Add `POST /api/auth/register` to the existing `auth.py` router.

**Rationale**: Registration is an auth concern — it belongs next to `/api/auth/login` and `/api/auth/refresh`. No new router file needed.

**Alternatives considered**: Separate `/api/users/` router — rejected, over-engineering for a single endpoint.

---

### 2. Role Assignment

**Decision**: Role is hardcoded to `"learner"` in the backend — it is never accepted from the request body.

**Rationale**: FR-007 requires no role selection is presented to the user. Accepting role from the client would be a privilege escalation vulnerability.

**Alternatives considered**: Role whitelist on client — rejected, server must be authoritative.

---

### 3. Password Validation

**Decision**: Minimum 8 characters validated server-side. Client-side validation mirrors this for UX but server-side is authoritative.

**Rationale**: Matches FR-004. Consistent with existing `hash_password` usage in `security.py`. No complexity rules required per spec.

**Alternatives considered**: Pydantic validator in the request schema — chosen approach, cleanest integration with FastAPI.

---

### 4. Duplicate Email Handling

**Decision**: Query `users` table for existing email before insert. Return HTTP 409 Conflict with `{"detail": "Email already registered"}` if found.

**Rationale**: FR-006 requires a clear error. 409 is the correct semantic status for a uniqueness conflict. The existing `IntegrityError` handler in `main.py` already returns 409, but explicit pre-check gives a cleaner message.

**Alternatives considered**: Rely solely on DB unique constraint + IntegrityError handler — possible, but the generic message "Resource already exists" is less clear than "Email already registered".

---

### 5. Post-Registration Response

**Decision**: Return the same token response as `/api/auth/login` — `access_token` in body + `refresh_token` as httpOnly cookie. The frontend stores the token and redirects to `/learner`.

**Rationale**: FR-008 requires automatic login after registration. Reusing the token-issue logic from login avoids duplication and gives the user a seamless experience.

**Alternatives considered**: Return 201 with user info only, require separate login — rejected, adds friction.

---

### 6. Frontend Approach

**Decision**: Extend the existing `Login.jsx` page with a toggle to switch between login and register modes (single page, two forms). No separate `/register` route.

**Rationale**: Spec assumption allows "in-page form toggle". Simpler than a new route — no new routing, no new page file. The login page already handles auth state.

**Alternatives considered**: Separate `/register` route — acceptable but unnecessary complexity for a two-form toggle.

---

### 7. Empty Dashboard State

**Decision**: The existing learner dashboard already shows "No projects assigned yet" when the learner has no project assignments. No new UI work needed for FR-010.

**Rationale**: This behaviour is already implemented — `listLearnerProjects` returns an empty array and `Dashboard.jsx` handles it.
