<#
.SYNOPSIS
    Generates Prisma Client and applies SQLite database migrations.
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Configuring SQLite database and Prisma Client..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
    & npx prisma generate --schema="server/prisma/schema.prisma"
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Prisma generate failed with exit code $LASTEXITCODE"
        exit $LASTEXITCODE
    }

    & npx prisma migrate deploy --schema="server/prisma/schema.prisma"
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Migrate deploy failed, attempting db push..."
        & npx prisma db push --schema="server/prisma/schema.prisma"
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Database configuration failed."
            exit $LASTEXITCODE
        }
    }
    Write-Host "Database configured successfully." -ForegroundColor Green
} finally {
    Pop-Location
}
