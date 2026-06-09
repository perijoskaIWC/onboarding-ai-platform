variable "subscription_id" {
  description = "Azure subscription ID."
  type        = string
}

variable "location" {
  description = "Azure region for all resources."
  type        = string
  default     = "westeurope"
}

variable "project" {
  description = "Project name prefix (lowercase letters/numbers/hyphens, 3-20 chars)."
  type        = string
  default     = "onboarding-atlas"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,19}$", var.project))
    error_message = "project must be 3-20 chars, lowercase letters/numbers/hyphens, start with a letter."
  }
}

variable "environment" {
  description = "Environment short name (dev/test/prod)."
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Common resource tags."
  type        = map(string)
  default = {
    application = "onboarding-atlas"
    managed-by  = "terraform"
  }
}

# ---- Backend (Container App) ----
variable "backend_image" {
  description = "Full image reference. Bootstrap: public placeholder. After first push: '<acr_server>/backend:<tag>'."
  type        = string
  default     = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}

variable "backend_min_replicas" {
  description = "Minimum replicas (0 = scale to zero)."
  type        = number
  default     = 0
}

variable "backend_max_replicas" {
  description = "Maximum replicas."
  type        = number
  default     = 3
}

variable "backend_cpu" {
  description = "vCPU per replica."
  type        = number
  default     = 0.5
}

variable "backend_memory" {
  description = "Memory per replica (e.g. '1Gi')."
  type        = string
  default     = "1Gi"
}

# ---- Postgres ----
variable "postgres_admin_user" {
  description = "Postgres administrator username (non-secret)."
  type        = string
  default     = "pgadmin"
}

variable "postgres_db_name" {
  description = "Application database name."
  type        = string
  default     = "onboarding"
}

variable "postgres_sku_name" {
  description = "Flexible Server SKU name. B_Standard_B1ms is the cheapest tier supporting pgvector."
  type        = string
  default     = "B_Standard_B1ms"
}

variable "postgres_storage_mb" {
  description = "Storage in MB. 32 GB minimum on Burstable."
  type        = number
  default     = 32768
}

variable "postgres_version" {
  description = "PostgreSQL major version."
  type        = string
  default     = "15"
}

variable "postgres_location" {
  description = "Region for PostgreSQL Flexible Server. May differ from var.location if the subscription has regional restrictions."
  type        = string
  default     = "northeurope"
}

variable "container_app_location" {
  description = "Region for Container Apps. May differ from var.location if capacity is constrained."
  type        = string
  default     = "northeurope"
}

# ---- Azure OpenAI (existing) ----
variable "aoai_endpoint" {
  description = "Existing Azure OpenAI endpoint, e.g. https://<name>.openai.azure.com"
  type        = string
}

variable "aoai_api_version" {
  description = "Azure OpenAI API version."
  type        = string
  default     = "2024-08-01-preview"
}

variable "aoai_chat_deployment" {
  description = "Chat model deployment name."
  type        = string
  default     = "gpt-4o"
}

variable "aoai_embedding_deployment" {
  description = "Embedding model deployment name."
  type        = string
  default     = "text-embedding-3-large"
}

variable "aoai_api_key" {
  description = "Azure OpenAI API key. Provide via TF_VAR_aoai_api_key env var (DO NOT commit). Stored in Key Vault."
  type        = string
  sensitive   = true
}

# ---- Static Web App ----
variable "swa_sku" {
  description = "Static Web Apps SKU. Free is sufficient for pilot."
  type        = string
  default     = "Free"
}

variable "swa_location" {
  description = "Static Web Apps supported region (NOT every Azure region is supported)."
  type        = string
  default     = "westeurope"
}
