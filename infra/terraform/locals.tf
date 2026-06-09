locals {
  # alphanumeric-only variant for resources that disallow hyphens (ACR, storage, KV)
  project_alnum = replace(var.project, "-", "")

  name_prefix = "${var.project}-${var.environment}"

  # Globally-unique-ish suffix for names that need it
  suffix = substr(sha1("${var.subscription_id}-${var.project}-${var.environment}"), 0, 6)

  tags = merge(var.tags, {
    environment = var.environment
  })
}
