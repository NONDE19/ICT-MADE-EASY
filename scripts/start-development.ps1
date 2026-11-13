<#
.SYNOPSIS
    Starts the VIRTUOLAB full-stack server (Express API + Vite frontend) on port 3000.
#>
[CmdletBinding()]
param(
    [switch]$Background
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $ProjectRoot ".virtuolab-dev.pid"

Write-Host "Starting VIRTUOLAB development server on http://localhost:3000 ..." -ForegroundColor Cyan

if ($Background) {
    $proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev" -WorkingDirectory $ProjectRoot -PassThru -WindowStyle Hidden
    Set-Content -Path $PidFile -Value $proc.Id -Encoding UTF8
    Write-Host "Started VIRTUOLAB in background (PID: $($proc.Id)). Run .\scripts\stop-development.ps1 to stop." -ForegroundColor Green
} else {
    Push-Location $ProjectRoot
    try {
        & npm run dev
        exit $LASTEXITCODE
    } finally {
        Pop-Location
    }
}
