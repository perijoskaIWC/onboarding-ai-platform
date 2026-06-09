variable "name_prefix" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }

variable "log_analytics_workspace_id" { type = string }
variable "log_analytics_workspace_customer_id" { type = string }
variable "log_analytics_primary_shared_key" {
  type      = string
  sensitive = true
}

variable "acr_login_server" { type = string }
variable "acr_id" { type = string }

variable "key_vault_id" { type = string }
variable "key_vault_uri" { type = string }

variable "image" { type = string }
variable "min_replicas" { type = number }
variable "max_replicas" { type = number }
variable "cpu" { type = number }
variable "memory" { type = string }

variable "jwt_secret_uri" { type = string }
variable "pg_password_uri" { type = string }
variable "aoai_api_key_uri" { type = string }

variable "database_url_template" { type = string }
variable "postgres_admin_user" { type = string }
variable "postgres_host" { type = string }
variable "postgres_db_name" { type = string }

variable "aoai_endpoint" { type = string }
variable "aoai_api_version" { type = string }
variable "aoai_chat_deployment" { type = string }
variable "aoai_embedding_deployment" { type = string }

resource "azurerm_container_app_environment" "env" {
  name                       = "${var.name_prefix}-cae"
  resource_group_name        = var.resource_group_name
  location                   = var.location
  log_analytics_workspace_id = var.log_analytics_workspace_id
  tags                       = var.tags
}

resource "azurerm_user_assigned_identity" "backend" {
  name                = "${var.name_prefix}-backend-id"
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.tags
}

resource "azurerm_container_app" "backend" {
  name                         = "${var.name_prefix}-backend"
  container_app_environment_id = azurerm_container_app_environment.env.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"
  tags                         = var.tags

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.backend.id]
  }

  registry {
    server   = var.acr_login_server
    identity = azurerm_user_assigned_identity.backend.id
  }

  # Secrets sourced from Key Vault via managed identity
  secret {
    name                = "jwt-secret-key"
    identity            = azurerm_user_assigned_identity.backend.id
    key_vault_secret_id = var.jwt_secret_uri
  }
  secret {
    name                = "postgres-password"
    identity            = azurerm_user_assigned_identity.backend.id
    key_vault_secret_id = var.pg_password_uri
  }
  secret {
    name                = "aoai-api-key"
    identity            = azurerm_user_assigned_identity.backend.id
    key_vault_secret_id = var.aoai_api_key_uri
  }

  ingress {
    external_enabled           = true
    target_port                = 8000
    transport                  = "auto"
    allow_insecure_connections = false

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    container {
      name   = "backend"
      image  = var.image
      cpu    = var.cpu
      memory = var.memory

      # Non-secret env
      env {
        name  = "POSTGRES_HOST"
        value = var.postgres_host
      }
      env {
        name  = "POSTGRES_USER"
        value = var.postgres_admin_user
      }
      env {
        name  = "POSTGRES_DB"
        value = var.postgres_db_name
      }
      env {
        name  = "AZURE_OPENAI_ENDPOINT"
        value = var.aoai_endpoint
      }
      env {
        name  = "AZURE_OPENAI_API_VERSION"
        value = var.aoai_api_version
      }
      env {
        name  = "AZURE_OPENAI_CHAT_DEPLOYMENT"
        value = var.aoai_chat_deployment
      }
      env {
        name  = "AZURE_OPENAI_EMBEDDING_DEPLOYMENT"
        value = var.aoai_embedding_deployment
      }
      env {
        name  = "ACCESS_TOKEN_EXPIRE_MINUTES"
        value = "15"
      }
      env {
        name  = "REFRESH_TOKEN_EXPIRE_DAYS"
        value = "7"
      }

      # Secret env (reference container secrets above)
      env {
        name        = "JWT_SECRET_KEY"
        secret_name = "jwt-secret-key"
      }
      env {
        name        = "AZURE_OPENAI_API_KEY"
        secret_name = "aoai-api-key"
      }
      env {
        name        = "POSTGRES_PASSWORD"
        secret_name = "postgres-password"
      }

      # Composed DATABASE_URL (password injected at runtime by start script;
      # for simplicity we also expose a ready-to-use URL with placeholder)
      env {
        name  = "DATABASE_URL_TEMPLATE"
        value = var.database_url_template
      }

      # CORS — frontend SWA hostname is injected after first apply (update via tfvars or revision)
      env {
        name  = "CORS_ORIGINS"
        value = "*"
      }

      liveness_probe {
        transport               = "HTTP"
        port                    = 8000
        path                    = "/health"
        initial_delay           = 30
        interval_seconds        = 30
        timeout                 = 5
        failure_count_threshold = 3
      }

      readiness_probe {
        transport               = "HTTP"
        port                    = 8000
        path                    = "/health"
        interval_seconds        = 10
        timeout                 = 5
        failure_count_threshold = 3
        success_count_threshold = 1
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image, # rolled out by deploy-backend.ps1
    ]
  }
}

output "name" { value = azurerm_container_app.backend.name }
output "fqdn" { value = azurerm_container_app.backend.ingress[0].fqdn }
output "principal_id" { value = azurerm_user_assigned_identity.backend.principal_id }
output "identity_id" { value = azurerm_user_assigned_identity.backend.id }
