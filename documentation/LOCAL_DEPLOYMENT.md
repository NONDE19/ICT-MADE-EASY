# ICT Made Easy Deployment & Offline Architecture Guide

ICT Made Easy is engineered for Zambian schools facing intermittent or limited internet connectivity. Below are the three deployment models supported by the architecture:

## 1. Offline Access on an Individual Device (PWA + IndexedDB)

- **How it works:** When a pupil opens ICT Made Easy on a laptop, tablet, or smartphone while online, the PWA Service Worker caches the application shell and static assets. Clicking **Cache Lessons Offline** stores all 11 curriculum modules and quiz questions inside browser **IndexedDB**.
- **When disconnected:** Pupils can open cached lessons, read content, and complete practice activities. Pending progress and quiz submissions are queued in IndexedDB and synchronized automatically once connectivity returns.
- **Requirement:** Requires a client device (smartphone, tablet, or computer) with a modern web browser.

## 2. School-Hosted Local Server (LAN / Wi-Fi Without External Internet)

- **How it works:** A single teacher laptop or school desktop hosts the ICT Made Easy Express + SQLite server on the school's local network (`0.0.0.0:3000`).
- **Steps for School ICT Coordinator:**
  1. Run `.\scripts\build-production.ps1`.
  2. Configure `.env` with strong random `JWT_SECRET` and `JWT_REFRESH_SECRET` values and `NODE_ENV="production"`.
  3. Start the server via `npm start`.
  4. Find the host computer's local IP address (`ipconfig` in PowerShell, e.g. `192.168.1.10`).
  5. Pupils on shared school laptops or smartphones connected to the local Wi-Fi router navigate to `http://192.168.1.10:3000` with **zero external internet bandwidth needed**.

## 3. Cloud-Hosted Online Access

- Multiple schools connect over HTTPS to a centralized server instance, with strict school-level data isolation ensuring teachers and pupils only access records belonging to their own school.
