variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "tenant_id" { type = string }
variable "tags" { type = map(string) }
variable "caller_object_id" { type = string }
variable "log_analytics_workspace_id" { type = string }

variable "jwt_secret_value" {
  type      = string
  sensitive = true
}
variable "postgres_password_value" {
  type      = string
  sensitive = true
}
variable "aoai_api_key_value" {
  type      = string
  sensitive = true
}

resource "azurerm_key_vault" "this" {
  name                          = var.name
  location                      = var.location
  resource_group_name           = var.resource_group_name
  tenant_id                     = var.tenant_id
  sku_name                      = "standard"
  rbac_authorization_enabled    = true
  purge_protection_enabled      = false
  soft_delete_retention_days    = 7
  public_network_access_enabled = true
  tags                          = var.tags
}

resource "azurerm_role_assignment" "caller_kv_admin" {
  scope                = azurerm_key_vault.this.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = var.caller_object_id
}

resource "azurerm_key_vault_secret" "jwt" {
  name         = "jwt-secret-key"
  value        = var.jwt_secret_value
  key_vault_id = azurerm_key_vault.this.id
  depends_on   = [azurerm_role_assignment.caller_kv_admin]
}

resource "azurerm_key_vault_secret" "pg" {
  name         = "postgres-password"
  value        = var.postgres_password_value
  key_vault_id = azurerm_key_vault.this.id
  depends_on   = [azurerm_role_assignment.caller_kv_admin]
}

resource "azurerm_key_vault_secret" "aoai" {
  name         = "aoai-api-key"
  value        = var.aoai_api_key_value
  key_vault_id = azurerm_key_vault.this.id
  depends_on   = [azurerm_role_assignment.caller_kv_admin]
}

resource "azurerm_monitor_diagnostic_setting" "kv" {
  name                       = "to-law"
  target_resource_id         = azurerm_key_vault.this.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log { category = "AuditEvent" }
  enabled_log { category = "AzurePolicyEvaluationDetails" }
  enabled_metric { category = "AllMetrics" }
}

output "id" { value = azurerm_key_vault.this.id }
output "name" { value = azurerm_key_vault.this.name }
output "uri" { value = azurerm_key_vault.this.vault_uri }

output "secret_uris" {
  value = {
    "jwt-secret-key"    = azurerm_key_vault_secret.jwt.versionless_id
    "postgres-password" = azurerm_key_vault_secret.pg.versionless_id
    "aoai-api-key"      = azurerm_key_vault_secret.aoai.versionless_id
  }
}
