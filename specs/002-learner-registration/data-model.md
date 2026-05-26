# Data Model: Learner Self-Registration

**Feature**: 002-learner-registration
**Date**: 2026-05-26

## No New Entities

This feature does not introduce new database tables. It uses the existing `users` table exclusively.

## Existing Entity: User (extended usage)

**Table**: `users`

| Field             | Type     | Constraints                        | Notes                                    |
|-------------------|----------|------------------------------------|------------------------------------------|
| id                | UUID     | PK, auto-generated                 | No change                                |
| email             | string   | UNIQUE, NOT NULL, indexed          | Must be unique — validated before insert |
| hashed_password   | string   | NOT NULL                           | bcrypt hash of the provided password     |
| role              | string   | NOT NULL, default="learner"        | Hardcoded to "learner" on self-register  |
| created_at        | datetime | NOT NULL, default=utcnow           | No change                                |

## Validation Rules (enforced at API layer)

| Field    | Rule                                      | Error message                      |
|----------|-------------------------------------------|------------------------------------|
| email    | Valid email format (RFC 5322)             | "Invalid email address"            |
| email    | Not already present in `users` table      | "Email already registered"         |
| password | Minimum 8 characters                      | "Password must be at least 8 characters" |
| password | Matches confirm_password field            | Validated client-side only         |

## No Migrations Required

The `users` table already has the required schema. SQLModel's `create_all` will not change anything.
