<#
.SYNOPSIS
    Safely stops running VIRTUOLAB development processes.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PidFile = Join-Path $ProjectRoot ".virtuolab-dev.pid"

if (Test-Path $PidFile) {
    $pidValue = Get-Content -Path $PidFile -ErrorAction SilentlyContinue
    if ($pidValue) {
        $proc = Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $proc.Id -Force
            Write-Host "Stopped VIRTUOLAB process (PID: $($proc.Id))." -ForegroundColor Green
        }
    }
    Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
}

# Also check for any node process listening on port 3000 via Get-NetTCPConnection
try {
    $conns = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped listener on port 3000 (PID: $($c.OwningProcess))." -ForegroundColor Yellow
    }
} catch {
    Write-Host "No active port 3000 listeners found."
}

Write-Host "Development processes stopped safely." -ForegroundColor Green
