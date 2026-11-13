<#
.SYNOPSIS
    Checks Windows prerequisites and initializes the VIRTUOLAB environment.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "=== VIRTUOLAB Phase 1: Environment & Project Setup ===" -ForegroundColor Cyan
Write-Host "Project directory: $ProjectRoot"

# Check PowerShell version
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)"
if ($PSVersionTable.PSVersion.Major -lt 5) {
    Write-Error "Windows PowerShell 5.1 or newer is required."
    exit 1
}

# Check Node.js
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Error "Node.js is not installed or not in PATH. Install Node.js LTS (v20+) from https://nodejs.org."
    exit 1
}
$nodeVersion = & node -v
Write-Host "Node.js detected: $nodeVersion" -ForegroundColor Green

# Check npm
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) {
    Write-Error "npm is not installed or not in PATH."
    exit 1
}
$npmVersion = & npm -v
Write-Host "npm detected: v$npmVersion" -ForegroundColor Green

# Ensure .env exists from .env.example
$envExamplePath = Join-Path $ProjectRoot ".env.example"
$envPath = Join-Path $ProjectRoot ".env"
if (-not (Test-Path $envPath)) {
    if (Test-Path $envExamplePath) {
        Copy-Item -Path $envExamplePath -Destination $envPath
        Write-Host "Created .env from .env.example" -ForegroundColor Green
    } else {
        Write-Error ".env.example is missing."
        exit 1
    }
} else {
    Write-Host ".env already exists. Keeping existing configuration." -ForegroundColor Yellow
}

# Run directory verification, dependency installation, DB config, and seed
& (Join-Path $PSScriptRoot "create-project.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& (Join-Path $PSScriptRoot "install-dependencies.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& (Join-Path $PSScriptRoot "configure-database.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& (Join-Path $PSScriptRoot "seed-database.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "=== VIRTUOLAB setup completed successfully ===" -ForegroundColor Green
