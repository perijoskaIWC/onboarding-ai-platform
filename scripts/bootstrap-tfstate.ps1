<#
.SYNOPSIS
    Bootstraps the Azure Storage Account that holds Terraform remote state.

.DESCRIPTION
    Run ONCE before the first `terraform init`. Creates:
      - Resource group  : <project>-tfstate-rg
      - Storage account : <project>tfstate<suffix>
      - Blob container  : tfstate

    Then uncomment the `backend "azurerm"` block in versions.tf with the printed
    storage account name and run:
        terraform init -migrate-state

.PARAMETER SubscriptionId
    Azure subscription ID.

.PARAMETER Location
    Azure region (default westeurope).

.PARAMETER Project
    Project prefix (default onboarding-atlas).
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string] $SubscriptionId,
    [string] $Location = 'westeurope',
    [string] $Project  = 'onboarding-atlas'
)

$ErrorActionPreference = 'Stop'

$rg = "$Project-tfstate-rg"
$projectAlnum = $Project -replace '-', ''
# 4-char deterministic suffix to keep SA name globally unique
$suffix = (Get-FileHash -InputStream ([IO.MemoryStream]::new([Text.Encoding]::UTF8.GetBytes("$SubscriptionId-$Project"))) -Algorithm SHA1).Hash.Substring(0,4).ToLower()
$sa = "${projectAlnum}tfstate${suffix}"
if ($sa.Length -gt 24) { $sa = $sa.Substring(0,24) }

az account set --subscription $SubscriptionId

Write-Host "Creating RG $rg in $Location..."
az group create --name $rg --location $Location --output none

Write-Host "Creating storage account $sa..."
az storage account create `
    --name $sa `
    --resource-group $rg `
    --location $Location `
    --sku Standard_LRS `
    --kind StorageV2 `
    --allow-blob-public-access false `
    --min-tls-version TLS1_2 `
    --output none

Write-Host "Creating tfstate container..."
az storage container create `
    --name tfstate `
    --account-name $sa `
    --auth-mode login `
    --output none

Write-Host ""
Write-Host "Done. Update versions.tf backend block with:" -ForegroundColor Green
Write-Host "  resource_group_name  = ""$rg"""
Write-Host "  storage_account_name = ""$sa"""
Write-Host "  container_name       = ""tfstate"""
Write-Host "  key                  = ""$Project.tfstate"""
Write-Host ""
Write-Host "Then run: terraform init -migrate-state"
