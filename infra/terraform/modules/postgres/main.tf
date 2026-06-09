variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "tags" { type = map(string) }
variable "admin_user" { type = string }
variable "admin_password" {
  type      = string
  sensitive = true
}
variable "db_name" { type = string }
variable "sku_name" { type = string }
variable "storage_mb" { type = number }
variable "pg_version" { type = string }
variable "log_analytics_workspace_id" { type = string }

resource "azurerm_postgresql_flexible_server" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location

  version  = var.pg_version
  sku_name = var.sku_name

  administrator_login    = var.admin_user
  administrator_password = var.admin_password

  storage_mb                   = var.storage_mb
  backup_retention_days        = 7
  geo_redundant_backup_enabled = false

  # Public access; firewall rules narrow it down. No VNet (cost optimization).
  public_network_access_enabled = true

  # No HA on Burstable B1ms — keeps cost low for pilot.
  tags = var.tags

  lifecycle {
    ignore_changes = [
      # password is also rotated in Key Vault; allow drift management out-of-band
      zone,
    ]
  }
}

# Enable pgvector + uuid-ossp via server parameter (extension allow-list).
resource "azurerm_postgresql_flexible_server_configuration" "extensions" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.this.id
  value     = "VECTOR,UUID-OSSP"
}

# Enforce TLS
resource "azurerm_postgresql_flexible_server_configuration" "require_secure" {
  name      = "require_secure_transport"
  server_id = azurerm_postgresql_flexible_server.this.id
  value     = "on"
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  name      = var.db_name
  server_id = azurerm_postgresql_flexible_server.this.id
  collation = "en_US.utf8"
  charset   = "UTF8"
}

resource "azurerm_monitor_diagnostic_setting" "pg" {
  name                       = "to-law"
  target_resource_id         = azurerm_postgresql_flexible_server.this.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log { category = "PostgreSQLLogs" }
  enabled_metric { category = "AllMetrics" }
}

output "id" { value = azurerm_postgresql_flexible_server.this.id }
output "name" { value = azurerm_postgresql_flexible_server.this.name }
output "fqdn" { value = azurerm_postgresql_flexible_server.this.fqdn }
