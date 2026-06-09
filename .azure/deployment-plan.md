# Deployment Plan — Onboarding AI Platform

**Status:** Approved — Phase 2 in progress
**Recipe:** Terraform
**Budget target:** ≤ $100 USD / month
**Branch:** feature/atlas-ui-v2

## Confirmed parameters

| Key | Value |
|---|---|
| Subscription ID | `f340c55c-ac6a-485c-949d-cce0e1dd123a` |
| Region | `westeurope` |
| Project prefix | `onboarding-atlas` (alphanum variant: `onboardingatlas`) |
| Frontend | `frontend-v2` only (Atlas UI) |
| Backend min replicas | **0** (scale-to-zero, cheapest, ~3–5s cold start) |
| Azure OpenAI | **Existing** — `https://chat-app-elena-resource.openai.azure.com` |
| Chat deployment | `gpt-4o` |
| Embedding deployment | `text-embedding-3-large` |
| AOAI API version | `2024-08-01-preview` |

⚠️ **Action required from user:** rotate the AOAI key currently in `.env` once Key Vault is provisioned. The key will be stored in Key Vault and referenced by Container Apps — never committed to git.

## Updated cost estimate (with min=0)

| Resource | Est. $/mo |
|---|---|
| Container Apps (backend, min=0) | $5–12 |
| PostgreSQL Flex B1ms, 32 GB | $15–22 |
| Static Web Apps Free | $0 |
| ACR Basic | $5 |
| Key Vault | <$1 |
| Log Analytics (low ingest) | $3–8 |
| **Infra total** | **~$28–48 / month** |

Leaves $50+ headroom for Azure OpenAI tokens.

---

## 1. Workspace Analysis

- **Mode:** MODIFY (existing app, adding Azure deployment)
- **Repo layout:**
  - `backend/` — FastAPI (Python 3.11), Dockerfile present, port 8000
  - `frontend-v2/` — React + Vite static SPA (active UI per branch)
  - `frontend/` — legacy v1 SPA (NOT deployed)
  - `docker-compose.yml` — local dev (Postgres+pgvector, backend, both frontends)

## 2. Requirements

- **Classification:** Internal LOB / pilot — single region, no HA required
- **Scale:** Low (pilot / single tenant), bursty
- **Budget:** ≤ $100/month for Azure infra (excluding Azure OpenAI token usage)
- **Compliance:** none specified
- **Best-practice goals:** managed identity, Key Vault, HTTPS-only, least privilege, no secrets in env files, IaC-driven

## 3. Codebase Scan

| Component | Stack | Build artifact | Runtime needs |
|-----------|-------|----------------|---------------|
| backend | FastAPI + SQLModel + psycopg2 + pgvector + openai SDK + python-jose JWT | Docker image (`backend/Dockerfile`) | PostgreSQL w/ pgvector, Azure OpenAI endpoint, JWT secret |
| frontend-v2 | React 18 + Vite 5 (static SPA, axios) | `vite build` → static `dist/` | Reverse-proxy / CDN; calls backend at `/api` |

External deps:
- **Azure OpenAI** — embeddings deployment + chat deployment (already used by code: `app/core/config.py`)
- **PostgreSQL with `pgvector` extension** — required for embeddings table

## 4. Recipe Selection: **Terraform** (user-requested)

- IaC: Terraform (`./infra/terraform/`)
- Remote state: Azure Storage backend (recommended)
- Provider: `azurerm` + `azapi` (for pgvector extension allow-list)

## 5. Target Architecture (cost-optimized for ≤ $100/mo)

```
┌────────────────────────────────────────────────────────────┐
│                       Azure Subscription                    │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │  Static Web App  │ ──API──▶│  Azure Container Apps    │ │
│  │  (frontend-v2)   │         │  (backend, FastAPI)      │ │
│  │  Free tier ($0)  │         │  Consumption, min 0/1    │ │
│  └──────────────────┘         └─────────┬────────────────┘ │
│                                         │ Managed Identity  │
│                                         ▼                   │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │ Azure Container  │         │ Azure Database for       │ │
│  │ Registry (Basic) │         │ PostgreSQL Flexible      │ │
│  │                  │         │ Burstable B1ms + pgvector│ │
│  └──────────────────┘         └──────────────────────────┘ │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────────────┐ │
│  │  Key Vault       │         │  Log Analytics workspace │ │
│  │  (secrets)       │         │  (ACA + diagnostic logs) │ │
│  └──────────────────┘         └──────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Azure OpenAI (existing / to be provisioned)         │  │
│  │  gpt-4o-mini + text-embedding-3-small deployments    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Service-by-service cost estimate (East US / West Europe, PAYG)

| Resource | SKU / config | Est. monthly cost |
|---|---|---|
| Azure Container Apps (backend) | Consumption, 0.5 vCPU / 1 GiB, min 1 replica (always-on) | ~$25–35 |
| Azure Database for PostgreSQL Flex | Burstable **B1ms**, 32 GB storage, no HA, 7d backup | ~$15–22 |
| Static Web Apps (frontend-v2) | **Free tier** | $0 |
| Azure Container Registry | **Basic** | ~$5 |
| Key Vault | Standard, low ops | <$1 |
| Log Analytics workspace | Pay-as-you-go, 30d retention, low ingest | ~$3–8 |
| Azure OpenAI (model calls) | Pay-per-token (variable) | excluded from infra budget |
| **Total infra** | | **~$48–70 / month** |

Leaves headroom for OpenAI token usage within the $100 cap.

### Cost-saving levers applied
- Static Web Apps **Free** tier for SPA (vs. App Service / extra ACA replica).
- PostgreSQL **Burstable B1ms** (cheapest tier that supports `pgvector`).
- ACA **Consumption** plan (no dedicated workload profile, scale-to-zero option available — we use min=1 to avoid cold starts; can drop to 0 for further savings).
- ACR **Basic** (sufficient for a single small image).
- Single region, no zone redundancy, no read replicas, 7-day backup only.
- No Front Door / WAF (rely on ACA + SWA built-in TLS).

### Best-practice decisions
- **Managed Identity (system-assigned)** on Container App → pulls images from ACR (`AcrPull`) and reads Key Vault secrets (`Key Vault Secrets User`).
- **Key Vault** stores: `JWT_SECRET_KEY`, `AZURE_OPENAI_API_KEY`, `POSTGRES_PASSWORD`. Container App references them via secret references.
- **PostgreSQL**: Entra ID admin enabled, password auth kept for app user (managed-identity auth for Flex is limited; password stored in Key Vault). `pgvector` enabled via `azurerm_postgresql_flexible_server_configuration` (`azure.extensions = vector`).
- **Networking (minimum-cost):** public endpoints with **firewall rules** restricting Postgres to ACA outbound IPs + “Allow Azure services.” VNet integration deferred (would require NAT + private DNS — adds ~$30+/mo).
- **HTTPS-only**, ingress external on ACA, CORS restricted to SWA hostname.
- **Diagnostic settings** → Log Analytics for ACA, Postgres, Key Vault.
- **Terraform remote state** in a dedicated Storage Account (cheap, durable).

## 6. Decisions

All decisions resolved — see "Confirmed parameters" table at top.

## 7. Generation plan (Phase 2)

```
infra/
  terraform/
    main.tf                # providers, backend, locals, RG
    variables.tf
    outputs.tf
    versions.tf
    modules/
      network/             # (placeholder — public-endpoint design, no VNet for v1)
      postgres/            # Flex Server B1ms + pgvector + firewall
      acr/                 # Basic registry
      keyvault/            # secrets + RBAC
      log_analytics/
      container_app/       # env + app + managed identity + role assignments
      static_web_app/      # SWA Free + linked backend
      openai/              # (optional) AOAI account + 2 deployments
    envs/
      dev.tfvars
```

Files outside `infra/`:
- `backend/Dockerfile` — already exists, will add multi-stage prod build (no `--reload`, non-root user)
- `frontend-v2/` — add SWA `staticwebapp.config.json` for SPA routing + API rewrite
- `.github/workflows/` — (optional) CI builds & pushes image to ACR
- Update `backend/app/core/config.py` defaults? — no, env-driven already

## Status checklist

- [x] Phase 1.1 Analyze workspace
- [x] Phase 1.2 Gather requirements
- [x] Phase 1.3 Scan codebase
- [x] Phase 1.4 Select recipe (Terraform)
- [x] Phase 1.5 Plan architecture
- [x] Phase 1.6 Finalize plan with user answers
- [x] Phase 1.7 User approval
- [ ] Phase 2 Execution (in progress)

## Data migration (manual, dockerized, secure)

- Trigger: user runs `pwsh scripts/migrate-db-to-azure.ps1` when ready.
- Streams `pg_dump | pg_restore` over TLS between local container DB and Azure Postgres Flex.
- Uses ephemeral `postgres:15` Docker container for client tools (no host install, exact version match).
- Local DB is read-only during dump; container data is never modified.
- Admin password fetched from Key Vault via `az keyvault secret show`.
- Adds a narrow, time-limited firewall rule for caller's public IP; removes it in `finally`.
- `pgvector` extension enabled by Terraform before restore so vector columns load correctly.
