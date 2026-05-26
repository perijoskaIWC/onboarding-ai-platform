# Quickstart: AI-Powered Employee Onboarding Platform

**Branch**: `001-onboarding-ai-platform`
**Date**: 2026-05-26

---

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- An OpenAI API key

---

## 1. Clone and configure environment

```bash
git clone <repo-url>
cd onboarding-ai-platform
cp .env.example .env
```

Edit `.env` and fill in:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/onboarding

# Auth
JWT_SECRET_KEY=change-me-to-a-long-random-string
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o

# CORS (frontend origin)
CORS_ORIGINS=http://localhost:5173
```

---

## 2. Start the platform

```bash
docker compose up --build
```

This starts three services:
- `db` — PostgreSQL 15 with pgvector
- `backend` — FastAPI on port 8000
- `frontend` — React/Vite dev server on port 5173

On first boot, the backend automatically creates all database tables.

---

## 3. Create the first Admin user

The platform has no self-registration for Admins. Run the seed script once:

```bash
docker compose exec backend python -m app.scripts.seed_admin \
  --email admin@example.com \
  --password your-password
```

---

## 4. Access the platform

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Web UI (React SPA) |
| `http://localhost:8000/docs` | FastAPI interactive API docs (Swagger UI) |
| `http://localhost:8000/redoc` | FastAPI API docs (ReDoc) |

---

## 5. Basic workflow

1. Log in as Admin at `http://localhost:5173`
2. Create a project (Projects → New Project)
3. Upload TXT or MD documents (Project Detail → Documents → Upload)
4. Wait for all documents to show status **ready**
5. Generate learning path (Project Detail → Learning Path → Generate)
6. Generate quiz questions (Project Detail → Questions → Generate)
7. Create a Learner account via API (`POST /api/admin/users`) and assign them to the project
8. Log in as the Learner — the learning path, AI tutor, and quiz will be available

---

## 6. Running tests

```bash
# Backend tests
docker compose exec backend pytest

# Frontend tests
docker compose exec frontend npm run test
```

---

## 7. Stopping and resetting

```bash
# Stop containers
docker compose down

# Stop and remove all data (database volume)
docker compose down -v
```
