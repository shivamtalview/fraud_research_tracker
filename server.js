const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const {
  init,
  getAllEntries,
  getDeletedEntries,
  insertEntry,
  updateEntry,
  softDeleteEntry,
  restoreEntry,
  getHiddenSites,
  hideSite,
  restoreSite,
  getSiteNotes,
  addSiteNote,
  getDeletedSiteNotes,
  updateSiteNote,
  softDeleteSiteNote,
  restoreSiteNote
} = require("./db");

const APP_PASSWORD = process.env.APP_PASSWORD;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!APP_PASSWORD || !ADMIN_PASSWORD || !SESSION_SECRET) {
  console.error(
    "Missing APP_PASSWORD, ADMIN_PASSWORD, or SESSION_SECRET environment variables.\n" +
    "Set them as Replit Secrets (or in a local .env loaded into the environment) before starting the server."
  );
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 30
  }
}));

function passwordMatches(candidate, expected) {
  const a = Buffer.from(String(candidate));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

app.post("/api/login", (req, res) => {
  const { password } = req.body || {};
  if (typeof password === "string") {
    if (passwordMatches(password, ADMIN_PASSWORD)) {
      req.session.authed = true;
      req.session.role = "admin";
      return res.json({ ok: true, role: "admin" });
    }
    if (passwordMatches(password, APP_PASSWORD)) {
      req.session.authed = true;
      req.session.role = "user";
      return res.json({ ok: true, role: "user" });
    }
  }
  return res.status(401).json({ ok: false, error: "Incorrect password." });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  res.json({
    authed: !!(req.session && req.session.authed),
    role: (req.session && req.session.role) || null
  });
});

function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  return res.status(401).json({ error: "Not authenticated." });
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.role === "admin") return next();
  return res.status(403).json({ error: "Admin access required." });
}

app.get("/api/entries", async (req, res) => {
  try {
    res.json(await getAllEntries());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch entries." });
  }
});

app.post("/api/entries", requireAuth, async (req, res) => {
  const body = req.body || {};
  const { date, title } = body;
  if (!date || !title) {
    return res.status(400).json({ error: "date and title are required." });
  }
  const entry = {
    date: String(date),
    mode: body.mode === 2 ? 2 : 1,
    clients: Array.isArray(body.clients) && body.clients.length ? body.clients.map(String) : ["Unspecified"],
    title: String(title),
    findings: Array.isArray(body.findings) ? body.findings : [],
    summary: Array.isArray(body.summary) ? body.summary : [],
    references: Array.isArray(body.references) ? body.references : []
  };
  try {
    const created = await insertEntry(entry);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save entry." });
  }
});

app.patch("/api/entries/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid entry id." });

  const body = req.body || {};
  const fields = {};
  if (body.date !== undefined) {
    const date = String(body.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "date must be in YYYY-MM-DD format." });
    }
    fields.date = date;
  }
  if (body.mode !== undefined) fields.mode = body.mode === 2 ? 2 : 1;
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return res.status(400).json({ error: "title cannot be empty." });
    fields.title = title;
  }
  if (body.clients !== undefined) {
    fields.clients = Array.isArray(body.clients) && body.clients.length
      ? body.clients.map(String)
      : ["Unspecified"];
  }
  if (body.findings !== undefined) fields.findings = Array.isArray(body.findings) ? body.findings : [];
  if (body.summary !== undefined) fields.summary = Array.isArray(body.summary) ? body.summary : [];
  if (body.references !== undefined) fields.references = Array.isArray(body.references) ? body.references : [];

  if (!Object.keys(fields).length) {
    return res.status(400).json({ error: "No updatable fields provided." });
  }

  try {
    const updated = await updateEntry(id, fields);
    if (!updated) return res.status(404).json({ error: "Entry not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update entry." });
  }
});

app.get("/api/entries/deleted", requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await getDeletedEntries());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch deleted entries." });
  }
});

app.delete("/api/entries/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid entry id." });
  try {
    const updated = await softDeleteEntry(id);
    if (!updated) return res.status(404).json({ error: "Entry not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete entry." });
  }
});

app.post("/api/entries/:id/restore", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid entry id." });
  try {
    const updated = await restoreEntry(id);
    if (!updated) return res.status(404).json({ error: "Entry not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to restore entry." });
  }
});

app.get("/api/hidden-sites", async (req, res) => {
  try {
    res.json(await getHiddenSites());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch hidden sites." });
  }
});

app.delete("/api/sites/:host", requireAuth, requireAdmin, async (req, res) => {
  const host = decodeURIComponent(req.params.host || "");
  if (!host) return res.status(400).json({ error: "Invalid host." });
  try {
    await hideSite(host);
    res.json({ ok: true, host });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to hide site." });
  }
});

app.post("/api/sites/:host/restore", requireAuth, requireAdmin, async (req, res) => {
  const host = decodeURIComponent(req.params.host || "");
  if (!host) return res.status(400).json({ error: "Invalid host." });
  try {
    await restoreSite(host);
    res.json({ ok: true, host });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to restore site." });
  }
});

app.get("/api/sites/:host/notes", async (req, res) => {
  const host = decodeURIComponent(req.params.host || "");
  if (!host) return res.status(400).json({ error: "Invalid host." });
  try {
    res.json(await getSiteNotes(host));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes." });
  }
});

app.post("/api/sites/:host/notes", requireAuth, async (req, res) => {
  const host = decodeURIComponent(req.params.host || "");
  if (!host) return res.status(400).json({ error: "Invalid host." });
  const note = String((req.body || {}).note || "").trim();
  if (!note) return res.status(400).json({ error: "note cannot be empty." });
  try {
    const created = await addSiteNote(host, note, req.session.role);
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save note." });
  }
});

app.patch("/api/sites/:host/notes/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid note id." });
  const note = String((req.body || {}).note || "").trim();
  if (!note) return res.status(400).json({ error: "note cannot be empty." });
  try {
    const updated = await updateSiteNote(id, note);
    if (!updated) return res.status(404).json({ error: "Note not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update note." });
  }
});

app.delete("/api/sites/:host/notes/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid note id." });
  try {
    const updated = await softDeleteSiteNote(id);
    if (!updated) return res.status(404).json({ error: "Note not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete note." });
  }
});

app.post("/api/sites/:host/notes/:id/restore", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "Invalid note id." });
  try {
    const updated = await restoreSiteNote(id);
    if (!updated) return res.status(404).json({ error: "Note not found." });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to restore note." });
  }
});

app.get("/api/notes/deleted", requireAuth, requireAdmin, async (req, res) => {
  try {
    res.json(await getDeletedSiteNotes());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch deleted notes." });
  }
});

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Fraud research tracker listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialise database:", err);
    process.exit(1);
  });
