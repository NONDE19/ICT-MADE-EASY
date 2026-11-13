<#
.SYNOPSIS
    Safely resets the VIRTUOLAB database and re-seeds demonstration data after confirmation.
#>
[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

if (-not $Force) {
    $confirm = Read-Host "WARNING: This will erase all local database changes and re-seed demo data. Type YES to continue"
    if ($confirm -ne "YES") {
        Write-Host "Database reset cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Backup existing DB before reset
$DbPath = Join-Path $ProjectRoot "server\prisma\dev.db"
if (Test-Path $DbPath) {
    & (Join-Path $PSScriptRoot "backup-database.ps1")
}

Push-Location $ProjectRoot
try {
    & npx prisma migrate reset --force --schema="server/prisma/schema.prisma"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Prisma reset failed."
        exit $LASTEXITCODE
    }

    & npx tsx "server/prisma/seed.ts"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Database re-seed failed."
        exit $LASTEXITCODE
    }

    Write-Host "Database reset and seeded successfully." -ForegroundColor Green
} finally {
    Pop-Location
}
