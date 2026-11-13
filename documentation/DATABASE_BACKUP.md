# Database Backup, Restoration, and Reset Guide

ICT Made Easy stores relational data in SQLite at `server/prisma/dev.db`.

## Creating a Backup

Run the PowerShell backup script from the project root:

```powershell
.\scripts\backup-database.ps1
```

This creates a timestamped copy inside `backups\virtuolab-backup-yyyyMMdd-HHmmss.db`.

## Restoring a Backup

1. Stop any running ICT Made Easy server processes:
   ```powershell
   .\scripts\stop-development.ps1
   ```
2. Copy the desired backup file back to `server\prisma\dev.db`:
   ```powershell
   Copy-Item ".\backups\virtuolab-backup-20261113-120000.db" ".\server\prisma\dev.db" -Force
   ```
3. Restart the server (`.\scripts\start-development.ps1`).

## Safely Resetting Demonstration Data

To reset the database back to the clean seeded demonstration state (automatically takes a backup first and asks for `YES` confirmation):

```powershell
.\scripts\reset-database.ps1
```
