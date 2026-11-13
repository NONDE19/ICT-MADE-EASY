<#
.SYNOPSIS
    Runs TypeScript checks and automated Vitest unit, API, and UI tests.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $ProjectRoot
try {
    Write-Host "Running TypeScript typecheck..." -ForegroundColor Cyan
    & npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Error "TypeScript check failed."
        exit $LASTEXITCODE
    }

    Write-Host "Running automated Vitest suite..." -ForegroundColor Cyan
    & npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Automated tests failed."
        exit $LASTEXITCODE
    }

    Write-Host "All automated checks and tests passed!" -ForegroundColor Green
} finally {
    Pop-Location
}
