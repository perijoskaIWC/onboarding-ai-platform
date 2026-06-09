data "azurerm_client_config" "current" {}

# ---------- Resource Group ----------
resource "azurerm_resource_group" "rg" {
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.tags
}

# ---------- Observability ----------
module "log_analytics" {
  source              = "./modules/log_analytics"
  name                = "${local.name_prefix}-law"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  tags                = local.tags
}

# ---------- Container Registry ----------
module "acr" {
  source              = "./modules/acr"
  name                = "${local.project_alnum}${var.environment}acr${local.suffix}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  tags                = local.tags
}

# ---------- Random secrets ----------
resource "random_password" "jwt" {
  length  = 64
  special = true
  # exclude characters that cause shell/url issues
  override_special = "!@#%^*()-_=+[]{}<>?"
}

resource "random_password" "pg_admin" {
  length  = 32
  special = false # keep simple for psql client compatibility
}

# ---------- Key Vault ----------
module "keyvault" {
  source              = "./modules/keyvault"
  name                = "${substr(local.project_alnum, 0, 12)}kv${local.suffix}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  tenant_id           = data.azurerm_client_config.current.tenant_id
  tags                = local.tags

  # Caller (developer running terraform) gets admin role for bootstrap
  caller_object_id = data.azurerm_client_config.current.object_id

  log_analytics_workspace_id = module.log_analytics.id

  jwt_secret_value        = random_password.jwt.result
  postgres_password_value = random_password.pg_admin.result
  aoai_api_key_value      = var.aoai_api_key
}

# ---------- PostgreSQL Flexible Server (with pgvector) ----------
module "postgres" {
  source              = "./modules/postgres"
  name                = "${local.name_prefix}-pg-ne-${local.suffix}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.postgres_location
  tags                = local.tags

  admin_user     = var.postgres_admin_user
  admin_password = random_password.pg_admin.result
  db_name        = var.postgres_db_name
  sku_name       = var.postgres_sku_name
  storage_mb     = var.postgres_storage_mb
  pg_version     = var.postgres_version

  log_analytics_workspace_id = module.log_analytics.id
}

# ---------- Container Apps Environment + backend app ----------
module "container_app" {
  source              = "./modules/container_app"
  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.container_app_location
  tags                = local.tags

  log_analytics_workspace_id          = module.log_analytics.id
  log_analytics_workspace_customer_id = module.log_analytics.customer_id
  log_analytics_primary_shared_key    = module.log_analytics.primary_shared_key

  acr_login_server = module.acr.login_server
  acr_id           = module.acr.id

  key_vault_id  = module.keyvault.id
  key_vault_uri = module.keyvault.uri

  image        = var.backend_image
  min_replicas = var.backend_min_replicas
  max_replicas = var.backend_max_replicas
  cpu          = var.backend_cpu
  memory       = var.backend_memory

  # Secret references (KV secret URIs)
  jwt_secret_uri   = module.keyvault.secret_uris["jwt-secret-key"]
  pg_password_uri  = module.keyvault.secret_uris["postgres-password"]
  aoai_api_key_uri = module.keyvault.secret_uris["aoai-api-key"]

  # Non-secret env
  database_url_template = "postgresql://${var.postgres_admin_user}:__PG_PASSWORD__@${module.postgres.fqdn}:5432/${var.postgres_db_name}?sslmode=require"
  postgres_admin_user   = var.postgres_admin_user
  postgres_host         = module.postgres.fqdn
  postgres_db_name      = var.postgres_db_name

  aoai_endpoint             = var.aoai_endpoint
  aoai_api_version          = var.aoai_api_version
  aoai_chat_deployment      = var.aoai_chat_deployment
  aoai_embedding_deployment = var.aoai_embedding_deployment
}

# Grant the Container App's managed identity access to Key Vault
resource "azurerm_role_assignment" "ca_kv_reader" {
  scope                = module.keyvault.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = module.container_app.principal_id
}

# Grant the Container App's managed identity AcrPull
resource "azurerm_role_assignment" "ca_acr_pull" {
  scope                = module.acr.id
  role_definition_name = "AcrPull"
  principal_id         = module.container_app.principal_id
}

# ---------- Postgres firewall: allow Azure-internal services (for ACA egress) ----------
# Azure Container Apps Consumption uses dynamic outbound IPs from the Azure backbone.
# AllowAllAzureServicesAndResourcesWithinAzureIps covers this case while staying cheap (no VNet).
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  name             = "AllowAzureServices"
  server_id        = module.postgres.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# ---------- Static Web App (frontend-v2) ----------
module "static_web_app" {
  source              = "./modules/static_web_app"
  name                = "${local.name_prefix}-swa"
  resource_group_name = azurerm_resource_group.rg.name
  location            = var.swa_location
  sku                 = var.swa_sku
  tags                = local.tags

  # Used by the SPA to know the API base. Injected as a build-time env var via CI.
  backend_api_url = "https://${module.container_app.fqdn}"
}
