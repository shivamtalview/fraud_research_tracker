# Fraud & Test Security Research Tracker

An internal web app for logging and reviewing fraud/test-security research findings. Entries are stored in Postgres and protected by a shared password, with a separate admin password that unlocks soft-delete/restore controls.

## Stack

- **Runtime:** Node.js 22
- **Backend:** Express + express-session
- **Database:** Replit PostgreSQL (via `pg`, `DATABASE_URL` injected automatically)
- **Frontend:** Vanilla HTML/CSS/JS in `public/`

## How to run

The workflow **"Start application"** runs `node server.js` on port 5000. Start it from the Replit UI or restart it after any server-side change.

## Required secrets

| Secret | Purpose |
|---|---|
| `APP_PASSWORD` | Shared password for regular (read/add) access |
| `ADMIN_PASSWORD` | Shared password for admin access (adds delete/restore) |
| `SESSION_SECRET` | Signs the session cookie |

All three are set as Replit Secrets. Rotate either password via the Secrets panel at any time.

## Roles

- **user** (`APP_PASSWORD`): view entries, add new findings.
- **admin** (`ADMIN_PASSWORD`): everything a user can do, plus soft-delete a whole report entry or hide a tracked site from the registry, and restore either from the admin-only "Recently deleted" panel. Deletes are soft — rows stay in Postgres with `is_deleted = true` (entries) or an entry in `hidden_sites` (sites); nothing is ever hard-deleted. `GET /api/entries` and `GET /api/hidden-sites` already filter these out for every session, admin or not.

## API

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/login` | — | password → session, sets role |
| `GET /api/me` | — | `{ authed, role }` |
| `GET /api/entries` | user | non-deleted entries |
| `POST /api/entries` | user | add a finding |
| `GET /api/entries/deleted` | admin | soft-deleted entries |
| `DELETE /api/entries/:id` | admin | soft-delete an entry |
| `POST /api/entries/:id/restore` | admin | restore an entry |
| `GET /api/hidden-sites` | user | hidden hostnames |
| `DELETE /api/sites/:host` | admin | hide a tracked site |
| `POST /api/sites/:host/restore` | admin | un-hide a tracked site |

## Project structure

```
server.js          Express server (auth, API routes)
db.js              PostgreSQL setup, seed data, query helpers
public/index.html  Single-page frontend
```

## User preferences

- Keep the existing project structure and stack — do not migrate or restructure without being asked.
- Always ask before making changes; confirm the approach first.
