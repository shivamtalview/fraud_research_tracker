const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const { init, getAllEntries, insertEntry } = require("./db");

const APP_PASSWORD = process.env.APP_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!APP_PASSWORD || !SESSION_SECRET) {
  console.error(
    "Missing APP_PASSWORD or SESSION_SECRET environment variables.\n" +
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

function passwordMatches(candidate) {
  const a = Buffer.from(String(candidate));
  const b = Buffer.from(String(APP_PASSWORD));
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

app.post("/api/login", (req, res) => {
  const { password } = req.body || {};
  if (typeof password === "string" && passwordMatches(password)) {
    req.session.authed = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: "Incorrect password." });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  res.json({ authed: !!(req.session && req.session.authed) });
});

function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  return res.status(401).json({ error: "Not authenticated." });
}

app.get("/api/entries", requireAuth, async (req, res) => {
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
