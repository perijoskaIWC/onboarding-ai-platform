output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "acr_login_server" {
  value = module.acr.login_server
}

output "acr_name" {
  value = module.acr.name
}

output "container_app_fqdn" {
  value       = module.container_app.fqdn
  description = "HTTPS endpoint of the FastAPI backend."
}

output "container_app_name" {
  value = module.container_app.name
}

output "static_web_app_default_hostname" {
  value       = module.static_web_app.default_hostname
  description = "Public URL of the frontend-v2 SPA."
}

output "static_web_app_deployment_token" {
  value       = module.static_web_app.deployment_token
  description = "Use to deploy with `swa deploy` or GitHub Action."
  sensitive   = true
}

output "key_vault_name" {
  value = module.keyvault.name
}

output "postgres_fqdn" {
  value = module.postgres.fqdn
}

output "postgres_admin_user" {
  value = var.postgres_admin_user
}

output "postgres_db_name" {
  value = var.postgres_db_name
}

output "postgres_server_name" {
  value = module.postgres.name
}

output "postgres_password_secret_name" {
  value       = "postgres-password"
  description = "Key Vault secret name holding the Postgres admin password."
}

output "log_analytics_workspace_id" {
  value = module.log_analytics.id
}
