# Running the Onboarding AI Platform locally

This file contains exact commands, ports and endpoints to run the project locally using Docker Compose, Podman (podman-compose) or Podman manual commands. Share these with a teammate to reproduce the same environment.

Prerequisites
- Git
- Either Docker (with `docker compose`) or Podman (and optionally `podman-compose`).
- Node/npm if you want to run the frontend locally outside a container.

Common ports / endpoints
- Frontend (Vite dev server): http://localhost:5173/
- Backend API base: http://localhost:8000/api
- Backend OpenAPI docs (FastAPI): http://localhost:8000/docs
- Backend health: http://localhost:8000/health
- Postgres (pgvector) port: 5432 (postgres://localhost:5432)

Setup
1. Clone the repo and create a local env file:

```bash
git clone <REPO_URL>
cd onboarding-ai-platform
cp .env.example .env
# Edit .env to set JWT_SECRET_KEY and any Azure keys you need
```

Option A — Docker Compose (recommended if Docker available)

```bash
# From repository root
docker compose up -d --build

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

Option B — Podman + podman-compose

Install podman-compose (if needed):

```powershell
# Windows PowerShell
pip install --user podman-compose
# then from repo root
podman-compose up -d --build
```

Option C — Podman manual (no compose)

These are the exact commands used when running with Podman manually. They create a network, start Postgres (pgvector), build images, and run backend/frontend.

```bash
# create network
podman network create onboarding_net

# start DB (use named volume so data persists)
podman run -d --name db --network onboarding_net \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=onboarding \
  -v onboarding-ai-platform_postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 docker.io/pgvector/pgvector:pg15

# build & run backend
podman build -t onboarding-ai-platform_backend ./backend
podman run -d --name backend --network onboarding_net \
  -e DATABASE_URL='postgresql://postgres:postgres@db:5432/onboarding' \
  -e JWT_SECRET_KEY='devsecret' \
  -e CORS_ORIGINS='http://localhost:5173' \
  -p 8000:8000 onboarding-ai-platform_backend:latest

# build & run frontend (Vite dev server)
podman build -t onboarding-ai-platform_frontend ./frontend
podman run -d --name frontend --network onboarding_net -p 5173:5173 onboarding-ai-platform_frontend:latest
```

Seeding users / creating an admin

Either run the seed script (if available) or register + promote a user:

Register (creates a learner account):

```bash
curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"adminpass123"}'
```

Promote to admin (run in the host that can access the DB container):

Podman:
```bash
podman exec db psql -U postgres -d onboarding -c "UPDATE users SET role='admin' WHERE email='admin@example.com';"
```
Docker Compose:
```bash
docker compose exec db psql -U postgres -d onboarding -c "UPDATE users SET role='admin' WHERE email='admin@example.com';"
```

Once promoted, sign in at the frontend with:

- Email: `admin@example.com`
- Password: `adminpass123`

Useful debug and admin commands

- Check container status:
```bash
podman ps -a
# or
docker compose ps
```
- Follow logs:
```bash
podman logs -f backend
podman logs -f frontend
# or
docker compose logs -f backend
```
- Inspect DB tables:
```bash
podman exec db psql -U postgres -d onboarding -c "\dt"
podman exec db psql -U postgres -d onboarding -c "SELECT COUNT(*) FROM users;"
```

Backing up the Postgres data volume

Create a tarball snapshot of the `onboarding-ai-platform_postgres_data` volume (safe to store outside the container):

```bash
# from repo root — will write backup tar to current working directory
podman run --rm -v onboarding-ai-platform_postgres_data:/data -v "$(pwd)":/backup alpine \
  sh -c "cd /data && tar czf /backup/onboarding-ai-platform_postgres_data-backup.tgz ."
```

Notes & troubleshooting
- If the app shows a fresh/empty DB, check which volume the `db` container is using. The compose setup creates a project-scoped volume named `onboarding-ai-platform_postgres_data`; accidental recreation of a fresh `postgres_data` volume can result in missing data.
- If login redirects to `/login` after signing in, open DevTools → Network: verify `/api/auth/login` returns an `access_token`, and check `localStorage.access_token` contains a payload with the expected `role` (decode with `JSON.parse(atob(token.split('.')[1]))`). Also verify `/api/auth/refresh` requests succeed (cookies required).
- Ensure `.env` DATABASE_URL host matches the DB container name (`db`) or set `DATABASE_URL` in the backend container run command.

If you want, I can prepare a single paste-ready PowerShell script that Trajche can run to start everything via Podman on Windows. Reply with `powershell script` and I will add it.