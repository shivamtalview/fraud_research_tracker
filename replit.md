# Fraud & Test Security Research Tracker

An internal web app for logging and reviewing fraud/test-security research findings. Entries are stored in a local SQLite database and protected by a shared password.

## Stack

- **Runtime:** Node.js 22
- **Backend:** Express + express-session
- **Database:** better-sqlite3 (SQLite, file: `data.sqlite`)
- **Frontend:** Vanilla HTML/CSS/JS in `public/`

## How to run

The workflow **"Start application"** runs `node server.js` on port 5000. Start it from the Replit UI or restart it after any server-side change.

## Required secrets

| Secret | Purpose |
|---|---|
| `APP_PASSWORD` | Shared password used to log into the tracker |
| `SESSION_SECRET` | Signs the session cookie |

Both are set as Replit Secrets. Change `APP_PASSWORD` via the Secrets panel whenever you want to rotate the login password.

## Project structure

```
server.js          Express server (auth, API routes)
db.js              SQLite setup, seed data, query helpers
public/index.html  Single-page frontend
data.sqlite        SQLite database (auto-created on first run)
```

## User preferences

- Keep the existing project structure and stack — do not migrate or restructure without being asked.
