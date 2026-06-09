<#
.SYNOPSIS
    Builds the backend image, pushes to ACR, and rolls out a new Container App revision.
#>

[CmdletBinding()]
param(
    [string] $TerraformDir,
    [string] $Tag          = (Get-Date -Format 'yyyyMMddHHmm')
)

$ErrorActionPreference = 'Stop'

$scriptRoot = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $TerraformDir) {
    $TerraformDir = Join-Path $scriptRoot '..\infra\terraform'
}

Push-Location $TerraformDir
try {
    $out = terraform output -json | ConvertFrom-Json
    $acr      = $out.acr_name.value
    $loginSrv = $out.acr_login_server.value
    $rg       = $out.resource_group_name.value
    $appName  = $out.container_app_name.value
}
finally { Pop-Location }

$image = "$loginSrv/backend:$Tag"

Write-Host "Logging into ACR $acr..."
az acr update --name $acr --admin-enabled true --output none
if ($LASTEXITCODE -ne 0) { throw "failed to temporarily enable ACR admin credentials" }

try {
    $acrCreds = az acr credential show --name $acr | ConvertFrom-Json
    $acrCreds.passwords[0].value | podman login $loginSrv --username $acrCreds.username --password-stdin --tls-verify=false
    if ($LASTEXITCODE -ne 0) { throw "podman login failed" }

    Write-Host "Building $image..."
    $root = Resolve-Path (Join-Path $scriptRoot '..')
    podman build --format docker -f (Join-Path $root 'backend\Dockerfile.prod') -t $image (Join-Path $root 'backend')
    if ($LASTEXITCODE -ne 0) { throw "podman build failed" }

    Write-Host "Pushing $image..."
    podman push $image --tls-verify=false --format docker
    if ($LASTEXITCODE -ne 0) { throw "podman push failed" }
}
finally {
    az acr update --name $acr --admin-enabled false --output none
}

Write-Host "Updating Container App $appName to image $image..."
az containerapp update `
    --name $appName `
    --resource-group $rg `
    --image $image `
    --output none

Write-Host "Done. Image: $image" -ForegroundColor Green
Write-Host "FQDN: https://$($out.container_app_fqdn.value)"
