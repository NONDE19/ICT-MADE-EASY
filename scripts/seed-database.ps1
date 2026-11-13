<#
.SYNOPSIS
    Seeds initial schools, demonstration roles, 11 modules, and practical exercises.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Seeding VIRTUOLAB database..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
    & npx tsx "server/prisma/seed.ts"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Database seeding failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    Write-Host "Database seeded successfully." -ForegroundColor Green
} finally {
    Pop-Location
}
