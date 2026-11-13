<#
.SYNOPSIS
    Creates a timestamped backup of the SQLite database file.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DbPath = Join-Path $ProjectRoot "server\prisma\dev.db"
$BackupDir = Join-Path $ProjectRoot "backups"

if (-not (Test-Path $DbPath)) {
    Write-Error "SQLite database not found at `"$DbPath`"."
    exit 1
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFile = Join-Path $BackupDir "virtuolab-backup-$Timestamp.db"
Copy-Item -Path $DbPath -Destination $BackupFile -Force

Write-Host "Database backup created: `"$BackupFile`"" -ForegroundColor Green
exit 0
