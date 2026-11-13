<#
.SYNOPSIS
    Installs all Node.js dependencies for VIRTUOLAB.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Installing npm packages in `"$ProjectRoot`"..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }
    Write-Host "Dependencies installed successfully." -ForegroundColor Green
} finally {
    Pop-Location
}
