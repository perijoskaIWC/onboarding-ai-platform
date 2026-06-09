# Deploying onboarding-atlas to Azure

End-to-end deployment guide for this app. Total infra cost: **~$28–48/month**.

## What gets deployed

| Component | Azure service | SKU |
|---|---|---|
| Backend (FastAPI) | Azure Container Apps | Consumption, scale-to-zero |
| Database | PostgreSQL Flexible Server | Burstable B1ms + `pgvector` |
| Frontend-v2 SPA | Static Web Apps | Free |
| Container images | Azure Container Registry | Basic |
| Secrets | Key Vault | Standard |
| Logs/metrics | Log Analytics workspace | PerGB2018, 30d |

Best practices applied: managed identity for ACR pull + Key Vault read, no admin credentials in IaC, TLS-only Postgres (`require_secure_transport=on`), HTTPS-only ingress, diagnostic logs to Log Analytics, Terraform remote state, random secrets generated at apply time.

---

## One-time setup

### 1. Prerequisites
```powershell
# Verify CLIs (install if missing)
az version
terraform version
podman version

az login
az account set --subscription "f340c55c-ac6a-485c-949d-cce0e1dd123a"
```

### 2. Bootstrap Terraform remote state (one-time, one-shot)
```powershell
pwsh ./scripts/bootstrap-tfstate.ps1 -SubscriptionId "f340c55c-ac6a-485c-949d-cce0e1dd123a"
```
Then uncomment the `backend "azurerm"` block in [infra/terraform/versions.tf](infra/terraform/versions.tf) using the printed values.

### 3. Prepare tfvars
```powershell
cd infra/terraform/envs
Copy-Item dev.tfvars.example dev.tfvars
# dev.tfvars is gitignored — safe to put values here
```

### 4. Supply the Azure OpenAI key via environment (preferred — never on disk)
```powershell
$env:TF_VAR_aoai_api_key = "<your AOAI key>"
```

---

## Deploy

```powershell
cd infra/terraform
terraform init
terraform plan  -var-file=envs/dev.tfvars
terraform apply -var-file=envs/dev.tfvars
```

First apply takes ~8–12 min (Postgres provisioning is the slow part).

### After first apply: build & push the backend image
The Container App is created with a placeholder image (`backend:bootstrap`). Push the real one:
```powershell
pwsh ./scripts/deploy-backend.ps1
```

### Migrate your local DB to Azure (with pgvector embeddings intact)
```powershell
# Make sure local DB is up
podman compose up -d db

# Streamed, secure, manual, read-only on local
pwsh ./scripts/migrate-db-to-azure.ps1
```

This script:
- Reads connection info from Terraform outputs
- Pulls the admin password from Key Vault
- Adds a temporary firewall rule only for your public IP
- Pipes `pg_dump | pg_restore` over TLS through ephemeral `postgres:15` Podman containers (no local install, no `.dump` file on disk)
- Verifies row counts on both sides
- Removes the firewall rule (always — even on failure)

### Deploy the frontend
```powershell
# From repo root
$tfDir = "infra/terraform"
$swaToken = terraform -chdir=$tfDir output -raw static_web_app_deployment_token
$apiUrl   = "https://" + (terraform -chdir=$tfDir output -raw container_app_fqdn)

cd frontend-v2
npm ci
$env:VITE_API_BASE_URL = "$apiUrl/api"
npm run build

# Install SWA CLI (one-time)
npm install -g @azure/static-web-apps-cli

swa deploy ./dist --deployment-token $swaToken --env production
```

---

## Post-deploy

```powershell
# URLs
terraform -chdir=infra/terraform output container_app_fqdn
terraform -chdir=infra/terraform output static_web_app_default_hostname
```

Tighten CORS once the SWA hostname is known:
```powershell
$swa = terraform -chdir=infra/terraform output -raw static_web_app_default_hostname
az containerapp update `
  --name (terraform -chdir=infra/terraform output -raw container_app_name) `
  --resource-group (terraform -chdir=infra/terraform output -raw resource_group_name) `
  --set-env-vars "CORS_ORIGINS=https://$swa"
```

---

## Cost monitoring

```powershell
az consumption usage list --top 20
# Or set a budget alert in the portal at ≤ $80/mo to get notified before $100 cap
```

## Destroy (cleanup)

```powershell
terraform -chdir=infra/terraform destroy -var-file=envs/dev.tfvars
```

> ⚠️ This deletes everything in the resource group including the database. Remote state storage account is in a **separate** RG (`onboarding-atlas-tfstate-rg`) and must be deleted manually if you want a fully clean teardown.
