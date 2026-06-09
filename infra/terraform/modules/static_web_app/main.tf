variable "name" { type = string }
variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "sku" { type = string }
variable "tags" { type = map(string) }
variable "backend_api_url" { type = string }

resource "azurerm_static_web_app" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = var.sku
  sku_size            = var.sku

  app_settings = {
    BACKEND_API_URL = var.backend_api_url
  }

  tags = var.tags
}

output "default_hostname" { value = azurerm_static_web_app.this.default_host_name }
output "deployment_token" {
  value     = azurerm_static_web_app.this.api_key
  sensitive = true
}
output "id" { value = azurerm_static_web_app.this.id }
output "name" { value = azurerm_static_web_app.this.name }
