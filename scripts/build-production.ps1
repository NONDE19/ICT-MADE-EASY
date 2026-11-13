<#
.SYNOPSIS
    Builds VIRTUOLAB frontend assets for production deployment.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $ProjectRoot
try {
    Write-Host "Running TypeScript verification..." -ForegroundColor Cyan
    & npm run lint
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    Write-Host "Building VIRTUOLAB production bundle..." -ForegroundColor Cyan
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Production build failed."
        exit $LASTEXITCODE
    }

    Write-Host "Production build complete. Start with 'npm start'." -ForegroundColor Green
} finally {
    Pop-Location
}
