<#
.SYNOPSIS
    Creates and verifies the VIRTUOLAB directory structure safely without overwriting existing files.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

$RequiredDirs = @(
    "src",
    "src/assets",
    "src/components",
    "src/layouts",
    "src/pages",
    "src/modules",
    "src/simulations",
    "src/simulations/apps",
    "src/dashboards",
    "src/hooks",
    "src/services",
    "src/contexts",
    "src/types",
    "public",
    "server/src/config",
    "server/src/controllers",
    "server/src/middleware",
    "server/src/routes",
    "server/src/services",
    "server/src/validators",
    "server/src/simulation",
    "server/src/assessments",
    "server/prisma",
    "backups",
    "scripts",
    "tests",
    "documentation"
)

Write-Host "Verifying VIRTUOLAB directory structure..." -ForegroundColor Cyan
foreach ($rel in $RequiredDirs) {
    $full = Join-Path $ProjectRoot $rel
    if (-not (Test-Path $full)) {
        New-Item -ItemType Directory -Path $full -Force | Out-Null
        Write-Host "  Created: $rel" -ForegroundColor Green
    }
}

Write-Host "Project directory structure verified." -ForegroundColor Green
exit 0
