# ICT Made Easy Installation Guide (Windows 10 / 11)

## 1. Software Prerequisites

1. **Windows 10 or Windows 11** with **Windows PowerShell 5.1** (pre-installed) or PowerShell 7+.
2. **Node.js LTS (v20 or v22)** and **npm** — verify in PowerShell:
   ```powershell
   node -v
   npm -v
   ```
3. **Visual Studio Code** (recommended for inspecting or extending source code).

## 2. Automated PowerShell Installation

Open PowerShell in the `ICT Made Easy` project root directory and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup.ps1
```

What `setup.ps1` performs:
1. Verifies PowerShell, Node.js, and npm versions.
2. Creates `.env` from `.env.example` if missing.
3. Ensures all required project directories exist (`create-project.ps1`).
4. Installs npm dependencies (`install-dependencies.ps1`).
5. Generates Prisma Client and applies SQLite migrations (`configure-database.ps1`).
6. Seeds schools, roles, 11 curriculum modules, and practical exercises (`seed-database.ps1`).

## 3. Running and Stopping ICT Made Easy

- Start the development server (`http://localhost:3000`):
  ```powershell
  .\scripts\start-development.ps1
  ```
- Run automated TypeScript & Vitest checks:
  ```powershell
  .\scripts\run-tests.ps1
  ```
- Stop background processes safely:
  ```powershell
  .\scripts\stop-development.ps1
  ```
