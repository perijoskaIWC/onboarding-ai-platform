<#
.SYNOPSIS
    Securely migrates the local Docker-Compose PostgreSQL database (with pgvector
    embeddings) to the Azure PostgreSQL Flexible Server provisioned by Terraform.

.DESCRIPTION
    - Reads Azure connection info from `terraform output`.
    - Pulls the Postgres admin password from Key Vault via `az keyvault secret show`.
    - Adds a narrow, temporary firewall rule for the caller's public IP.
    - Streams `pg_dump | pg_restore` over TLS using an ephemeral `postgres:15`
      Docker container — no `.dump` file ever touches disk, no client install needed.
    - Local database is READ-ONLY during dump; container data is NEVER modified.
    - Removes the firewall rule in a `finally` block (even on failure).
    - Reports row counts on both sides for verification.

.PREREQUISITES
    - `az` CLI installed and signed in (`az login`)
    - Docker Desktop running, local DB up (`docker compose up -d db`)
    - You are signed in as the Entra user who ran `terraform apply`
      (so you have Key Vault Administrator role granted by Terraform)

.PARAMETER TerraformDir
    Path to the Terraform root. Defaults to ../infra/terraform relative to script.

.PARAMETER LocalComposeService
    Docker Compose service name for local Postgres. Default: 'db'.

.PARAMETER Force
    Skip the "are you sure" prompt.

.EXAMPLE
    pwsh ./scripts/migrate-db-to-azure.ps1

.EXAMPLE
    pwsh ./scripts/migrate-db-to-azure.ps1 -Force
#>

[CmdletBinding()]
param(
    [string] $TerraformDir       = (Join-Path $PSScriptRoot '..\infra\terraform'),
    [string] $LocalComposeService = 'db',
    [switch] $Force
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Invoke-CheckedCommand([string]$Cmd, [string[]]$Args) {
    & $Cmd @Args
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $Cmd $($Args -join ' ')"
    }
}

# ---- 0. Pre-flight ----
Write-Step "Pre-flight checks"

foreach ($t in @('az','podman','terraform')) {
    if (-not (Get-Command $t -ErrorAction SilentlyContinue)) {
        throw "Required tool not found on PATH: $t"
    }
}

Push-Location $TerraformDir
try {
    Write-Step "Reading Terraform outputs from $TerraformDir"

    $tfOut = terraform output -json | ConvertFrom-Json
    if (-not $tfOut.postgres_fqdn)               { throw "Missing TF output 'postgres_fqdn'. Did you run 'terraform apply'?" }
    if (-not $tfOut.postgres_admin_user)         { throw "Missing TF output 'postgres_admin_user'." }
    if (-not $tfOut.postgres_db_name)            { throw "Missing TF output 'postgres_db_name'." }
    if (-not $tfOut.postgres_server_name)        { throw "Missing TF output 'postgres_server_name'." }
    if (-not $tfOut.resource_group_name)         { throw "Missing TF output 'resource_group_name'." }
    if (-not $tfOut.key_vault_name)              { throw "Missing TF output 'key_vault_name'." }
    if (-not $tfOut.postgres_password_secret_name) { throw "Missing TF output 'postgres_password_secret_name'." }

    $pgHost     = $tfOut.postgres_fqdn.value
    $pgUser     = $tfOut.postgres_admin_user.value
    $pgDb       = $tfOut.postgres_db_name.value
    $pgServer   = $tfOut.postgres_server_name.value
    $rgName     = $tfOut.resource_group_name.value
    $kvName     = $tfOut.key_vault_name.value
    $secretName = $tfOut.postgres_password_secret_name.value
}
finally {
    Pop-Location
}

Write-Host "  Target server : $pgHost"
Write-Host "  Database      : $pgDb"
Write-Host "  Admin user    : $pgUser"
Write-Host "  Key Vault     : $kvName"
Write-Host "  Local source  : podman compose service '$LocalComposeService'"

if (-not $Force) {
    $confirm = Read-Host "`nProceed with migration? Local data is READ-ONLY and untouched. (y/N)"
    if ($confirm -notmatch '^[yY]') {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}

# ---- 1. Detect caller public IP ----
Write-Step "Detecting your public IP for temporary firewall rule"
$publicIp = (Invoke-RestMethod -Uri 'https://api.ipify.org?format=json').ip
if (-not $publicIp) { throw "Could not determine public IP." }
Write-Host "  Public IP : $publicIp"

$fwRuleName = "migration-$([int][double]::Parse((Get-Date -UFormat %s)))"

# ---- 2. Fetch admin password from Key Vault ----
Write-Step "Fetching Postgres admin password from Key Vault '$kvName'"
$pgPassword = az keyvault secret show `
    --vault-name $kvName `
    --name $secretName `
    --query value -o tsv
if (-not $pgPassword) { throw "Failed to read secret '$secretName' from Key Vault. Check your RBAC." }
Write-Host "  OK (password length: $($pgPassword.Length))"

# ---- 3. Verify local DB is running ----
Write-Step "Verifying local DB container is running"
$localContainerId = podman compose ps -q $LocalComposeService
if (-not $localContainerId) {
    throw "Local DB container '$LocalComposeService' is not running. Start it: podman compose up -d $LocalComposeService"
}
Write-Host "  Container : $localContainerId"

# ---- 4. Add temp firewall rule ----
Write-Step "Adding temporary firewall rule '$fwRuleName' for $publicIp"
az postgres flexible-server firewall-rule create `
    --resource-group $rgName `
    --name $pgServer `
    --rule-name $fwRuleName `
    --start-ip-address $publicIp `
    --end-ip-address $publicIp `
    --output none
if ($LASTEXITCODE -ne 0) { throw "Failed to create firewall rule." }

try {
    # ---- 5. Verify pgvector ----
    Write-Step "Verifying pgvector extension is available on Azure"
    $env:PGPASSWORD = $pgPassword
    try {
        $vectorCheck = podman run --rm -i `
            -e PGPASSWORD=$pgPassword `
            postgres:15 `
            psql "host=$pgHost port=5432 dbname=$pgDb user=$pgUser sslmode=require" `
                -t -c "SELECT 1 FROM pg_available_extensions WHERE name='vector';"
        if ($vectorCheck -notmatch '1') {
            throw "pgvector is not available on the Azure server. Re-run 'terraform apply' to enable it."
        }
    } finally {
        $env:PGPASSWORD = $null
    }
    Write-Host "  OK"

    # ---- 6. Snapshot local row counts ----
    Write-Step "Snapshotting local row counts (read-only)"
    $localCounts = podman compose exec -T $LocalComposeService `
        psql -U postgres -d onboarding -At -c @"
SELECT table_name || '=' || (xpath('/row/c/text()',
    query_to_xml('SELECT COUNT(*) AS c FROM '||quote_ident(table_name), true, true, '')))[1]::text
FROM information_schema.tables
WHERE table_schema='public'
ORDER BY table_name;
"@
    Write-Host $localCounts

    # ---- 7. Stream dump -> restore ----
    Write-Step "Streaming pg_dump (local) -> pg_restore (Azure) over TLS. This may take a few minutes."
    Write-Host "  Tip: large embedding tables dominate the time." -ForegroundColor DarkGray

    # podman compose exec uses stdout for the dump bytes.
    # We pipe into a second `podman run` with the pg client tools.
    # Using cmd /c to ensure pipe works correctly across podman invocations on Windows.

    $cmd = @"
podman compose exec -T $LocalComposeService pg_dump -U postgres -d onboarding -Fc --no-owner --no-privileges ^
| podman run --rm -i -e PGPASSWORD=$pgPassword postgres:15 ^
    pg_restore --no-owner --no-privileges --clean --if-exists --exit-on-error -v ^
    -h $pgHost -p 5432 -U $pgUser -d $pgDb
"@
    cmd /c $cmd
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump | pg_restore failed (exit $LASTEXITCODE). See output above."
    }

    # ---- 8. Verify Azure row counts ----
    Write-Step "Verifying row counts on Azure"
    $azureCounts = podman run --rm -i `
        -e PGPASSWORD=$pgPassword `
        postgres:15 `
        psql "host=$pgHost port=5432 dbname=$pgDb user=$pgUser sslmode=require" -At -c @"
SELECT table_name || '=' || (xpath('/row/c/text()',
    query_to_xml('SELECT COUNT(*) AS c FROM '||quote_ident(table_name), true, true, '')))[1]::text
FROM information_schema.tables
WHERE table_schema='public'
ORDER BY table_name;
"@
    Write-Host $azureCounts

    Write-Step "Comparing"
    if ($localCounts -eq $azureCounts) {
        Write-Host "  Row counts match. Migration verified." -ForegroundColor Green
    } else {
        Write-Host "  Row counts DIFFER. Inspect output above. (Some auxiliary tables created post-restore are OK.)" -ForegroundColor Yellow
    }
}
finally {
    Write-Step "Removing temporary firewall rule '$fwRuleName'"
    az postgres flexible-server firewall-rule delete `
        --resource-group $rgName `
        --name $pgServer `
        --rule-name $fwRuleName `
        --yes --output none
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to delete firewall rule '$fwRuleName'. Remove it manually in the Azure portal."
    } else {
        Write-Host "  OK"
    }

    # Clear any password env var residue
    $env:PGPASSWORD = $null
    Remove-Variable pgPassword -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
