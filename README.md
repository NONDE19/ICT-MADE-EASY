# ICT Made Easy — Virtual ICT Learning & Computer Simulation System

> **Design and Development of a Web-Based Virtual ICT Learning and Computer Simulation System to Enhance Practical Computer Skills in Schools with Limited ICT Infrastructure in Zambia.**

**ICT Made Easy** is an offline-ready, full-stack educational web platform designed to help secondary and primary school learners practise real computer skills—from hardware assembly and operating systems to file management, office productivity, networking, and digital safety—even where physical computer laboratories or continuous internet access are limited.

---

## Core Design Principles

- **Educational Simulation Honesty:** ICT Made Easy safely recreates desktop workflows, file systems, office productivity tools, and command-line concepts inside the browser. It never accesses host device files or executes real OS shell commands.
- **Offline-First & Low-Bandwidth Ready:** Supports Progressive Web App (PWA) installation, IndexedDB offline lesson bundles with queued sync, and zero-internet school local Wi-Fi (LAN) hosting.
- **School-Level Data Isolation (RBAC):** Supports **Administrators**, **Teachers**, and **Pupils** with JWT authentication and strict school-scoped access control.

---

## Key Features

### 1. Role-Based Dashboards (SQLite-Backed)
- **Pupil Dashboard:** Tracks module & lesson progress, average assessment scores, unlocked achievements, assigned practical exercises, class notifications, and quick-launch links into every lab.
- **Teacher Dashboard:** Monitors assigned classes, individual pupil performance, pupils requiring attention, and enables creating custom practical exercises (Levels 1–3) with automated rule criteria and deadlines.
- **Administrator Dashboard:** Manages schools, classes, teacher/pupil accounts, module visibility, system settings, and security audit logs.

### 2. 11 Structured ICT Learning Modules

| # | Module | Interactive Activities & Simulators |
| :- | :--- | :--- |
| 1 | **Understanding ICT & Computer Evolution** | Interactive Abacus, Babbage Analytical Engine walkthrough, 5 Computer Generations explorer (with historical date-overlap context) |
| 2 | **Computer Hardware Laboratory** | 15 hardware components, clickable SVG schematic with data/power signal flows, Virtual PC Assembly bench, Component Matching, Troubleshooting |
| 3 | **Computer Software** | System vs. Application vs. Utility software classification laboratory |
| 4 | **Operating Systems** | Round-Robin CPU scheduler, RAM block allocator, and safe educational CLI sandbox |
| 5 | **Virtual Computer Desktop** | Draggable/resizable windows, Start Menu, Taskbar & clock, nested File Manager (create/rename/copy/move/delete/restore/search), Recycle Bin, persisted settings |
| 6 | **Word Processing Simulator** | `WordWriterApp` rich-text formatting, alignment, lists, and virtual file persistence |
| 7 | **Spreadsheet Simulator** | `CalcSheetApp` with cell references, arithmetic, `SUM`, `AVERAGE`, `MIN`, `MAX`, cycle detection (`#CYCLE!`), and live bar charting |
| 8 | **Presentation Simulator** | `SlideDeckApp` with slide creation/reordering, layouts, themes, and fullscreen slideshow playback |
| 9 | **Internet & Networking** | Packet-flow simulator, URL anatomy explorer, and `EduBrowserApp` offline educational intranet |
| 10 | **Cybersecurity & Digital Safety** | Password strength tester, phishing spotter, malware & cyberbullying response scenarios |
| 11 | **Practical Assessment Centre** | Three-tier practical evaluation (**Level 1 Guided**, **Level 2 Independent**, **Level 3 Unassisted Assessment**) graded by a rule-driven criteria engine |

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite 8
- **Offline & PWA:** `vite-plugin-pwa` (Workbox service worker), IndexedDB (`idb`)
- **Backend:** Express.js, TypeScript (`tsx`), Zod validation, Helmet, CORS, Express Rate Limit
- **Database & Auth:** Prisma ORM v6, SQLite (`server/prisma/dev.db`), JWT access/refresh tokens, `bcryptjs`
- **Testing:** Vitest, Supertest, React Testing Library

---

## Quick Start

### Prerequisites
- **Node.js LTS** (v20 or v22+) and **npm**
- **Windows 10/11** (for PowerShell 5.1 automation scripts) or **macOS / Linux**

### Option A: Windows (PowerShell 5.1+ Automation)

Open PowerShell in the **ICT Made Easy** project root folder (the folder containing `package.json`) and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\scripts\setup.ps1
.\scripts\start-development.ps1
```

Open `http://localhost:3000` in your browser.

### Option B: Cross-Platform Manual Setup (Windows / macOS / Linux)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment configuration
cp .env.example .env

# 3. Generate Prisma Client, apply SQLite migrations, and seed demo data
npx prisma generate --schema=server/prisma/schema.prisma
npx prisma migrate deploy --schema=server/prisma/schema.prisma
npm run db:seed

# 4. Start the development server (API + Frontend on port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Environment Variables

Configure these values in `.env` (copied from `.env.example`):

| Variable | Default (Local Dev) | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path relative to `server/prisma/` |
| `JWT_SECRET` | *(change in production)* | Secret key used to sign JWT access tokens |
| `JWT_REFRESH_SECRET` | *(change in production)* | Secret key used to sign JWT refresh tokens |
| `PORT` | `3000` | HTTP server port (`0.0.0.0:3000`) |
| `NODE_ENV` | `development` | `development` or `production` |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin(s) for API requests |

> **Security Note:** Before deploying in a school or production environment, generate strong random strings for `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## Development-Mode Demonstration Accounts

The seed script creates sample Zambian schools (`LCSS-01` Lusaka Central Secondary School and `NTHS-02` Ndola Technical High School) along with development demonstration accounts:

| Role | Email | Username | Password |
| :--- | :--- | :--- | :--- |
| Administrator | `admin@virtuolab.edu.zm` | `admin` | `Admin@2026!` |
| Teacher (Lusaka Central) | `teacher@virtuolab.edu.zm` | `teacher.mwamba` | `Teacher@2026!` |
| Pupil (Grade 8A) | `pupil@virtuolab.edu.zm` | `pupil.kabwe` | `Pupil@2026!` |

> **Academic & Deployment Notice:** These accounts are strictly for **development and evaluation**. Change all default passwords or disable demonstration accounts via the Administrator panel before live school deployment.

---

## Available Scripts & Automation

### npm Scripts

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Start Express API + Vite dev middleware on port 3000 |
| `npm run build` | Build production frontend bundle to `dist/` |
| `npm start` | Start production Express server serving `dist/` and `/api/*` |
| `npm run lint` | Run TypeScript type checks (`tsc --noEmit`) |
| `npm test` | Run automated Vitest unit, API, and UI component tests |
| `npm run db:migrate` | Run Prisma migrations (`server/prisma/schema.prisma`) |
| `npm run db:seed` | Populate/verify initial schools, curriculum, and demo users |

### Windows PowerShell Scripts (`scripts/`)

| Script | Purpose |
| :--- | :--- |
| `.\scripts\setup.ps1` | Full initial setup (prereqs, `.env`, folders, npm install, DB migrate, seed) |
| `.\scripts\start-development.ps1` | Start the local server on port 3000 |
| `.\scripts\stop-development.ps1` | Stop running local server processes |
| `.\scripts\run-tests.ps1` | Run TypeScript checks and Vitest test suite |
| `.\scripts\build-production.ps1` | Build production bundle (`dist/`) |
| `.\scripts\backup-database.ps1` | Create a timestamped SQLite backup in `backups/` |
| `.\scripts\reset-database.ps1` | Back up and safely reset database to seeded state |

---

## Project Structure

```text
├── server.ts                  # Unified Express + Vite/static entry point (port 3000)
├── server/
│   ├── prisma/
│   │   ├── schema.prisma      # Relational database schema (SQLite)
│   │   ├── migrations/        # Prisma SQL migrations
│   │   └── seed.ts            # Idempotent curriculum & demo school seed
│   └── src/
│       ├── app.ts             # Express app, security middleware & API routes
│       ├── assessments/       # Rule-driven practical task evaluator
│       ├── controllers/       # Auth, Admin, Teacher, Learning, Desktop, Assessment
│       ├── middleware/        # JWT auth, RBAC guards, error handling
│       ├── routes/            # REST API routers
│       ├── services/          # Audit logging
│       ├── simulation/        # Initial virtual desktop & file system setup
│       └── validators/        # Zod request schemas
├── src/
│   ├── components/            # Shared UI controls (e.g., PWA install prompt)
│   ├── contexts/              # AuthContext & ThemeContext (Light/Dark)
│   ├── dashboards/            # Pupil, Teacher, and Admin dashboards
│   ├── hooks/                 # Online/offline sync & PWA install hooks
│   ├── layouts/               # AppShell (grouped sidebar, breadcrumbs, top bar)
│   ├── modules/               # Modules 1–4, 9–11 & Offline Architecture guide
│   ├── pages/                 # Sign-in page
│   ├── services/              # API client & IndexedDB offline store
│   └── simulations/           # Virtual Desktop OS & WordWriter, CalcSheet, SlideDeck, FileManager, EduBrowser
├── scripts/                   # Windows PowerShell 5.1 automation scripts
├── tests/                     # Engine unit tests, REST API integration tests, UI tests
└── documentation/             # Installation, User Guide, Deployment & Backup manuals
```

---

## Documentation Index

- `documentation/INSTALLATION.md` — Windows 10/11 prerequisites and setup walkthrough
- `documentation/USER_GUIDE.md` — Step-by-step guide for Administrators, Teachers, and Pupils
- `documentation/LOCAL_DEPLOYMENT.md` — Individual PWA offline mode, School LAN Wi-Fi server mode, and Cloud deployment
- `documentation/DATABASE_BACKUP.md` — SQLite backup, restore, and reset procedures

---

## License

This project is intended for educational and academic distribution. You may adapt and deploy it for schools and ICT learning initiatives while preserving attribution.
