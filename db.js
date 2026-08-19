const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Run a one-time schema creation and seed on first boot.
// Using IF NOT EXISTS / ON CONFLICT DO NOTHING makes this idempotent.
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      mode INTEGER NOT NULL,
      clients JSONB NOT NULL,
      title TEXT NOT NULL,
      findings JSONB NOT NULL,
      summary JSONB NOT NULL,
      references_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE entries ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hidden_sites (
      host TEXT PRIMARY KEY,
      hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Seed initial entries only when the table is empty.
  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM entries");
  if (rows[0].n > 0) return;

  const seedEntries = [
    {
      date: "2026-08-05", mode: 1, clients: ["Cambridge Linguaskill"],
      title: "Daily Research Report — August 05, 2026",
      findings: [
        "No verified Linguaskill exam dumps, leaked question papers, or answer keys identified across Google, Reddit, Telegram, Facebook, or public file-sharing platforms.",
        "Public discussions were mostly official prep resources, candidate experiences, and technical guidance.",
        "TestHelper identified advertising a service claiming to provide a test taker for the Cambridge Linguaskill exam.",
        "ExamSharks publishes proctoring guides, including content claiming compatibility with or methods to circumvent Talview Proview.",
        "No publicly accessible screenshots of live Linguaskill exam content found."
      ],
      summary: [
        "No confirmed leaked Linguaskill exam content or answer repositories identified.",
        "Primary findings were websites advertising academic fraud services and proctoring-circumvention claims.",
        "Recommend continued monitoring of exam-taking and proctoring-related services for Linguaskill / Talview Proview references."
      ],
      references: [
        { label: "TestHelper — Hire a Linguaskill test taker", url: "https://www.testhelper.org/hire-a-linguaskill-test-taker-to-take-the-exam-for-you.html" },
        { label: "ExamSharks — Proctoring guides", url: "https://examsharks.com/proctoring-guides" }
      ]
    },
    {
      date: "2026-08-06", mode: 1, clients: ["Cambridge Linguaskill"],
      title: "Daily Research Report — August 06, 2026",
      findings: [
        "No verified Linguaskill exam dumps, leaked papers, answer keys, or unauthorized content identified across Google, Reddit, Telegram, Facebook, YouTube, or file-sharing platforms.",
        "Results continued to consist primarily of official documentation and candidate experiences.",
        "Examinator.cc reviewed as part of ongoing monitoring — no new Linguaskill-specific content or changes observed."
      ],
      summary: [
        "No new findings identified during today's monitoring.",
        "Examinator.cc remains on the monitoring list with no new developments this period."
      ],
      references: [
        { label: "Examinator.cc (previously reported)", url: "https://examinator.cc/" }
      ]
    },
    {
      date: "2026-08-07", mode: 1, clients: ["Cambridge Linguaskill"],
      title: "Daily Research Report — August 07, 2026",
      findings: [
        "Searched selected Cambridge Linguaskill institution codes (CA225, FR610, SG201, DE010, IT297, HK261, JP500, MX201, TW043) for institution-specific references to unauthorized content.",
        "No relevant results, leaked materials, or suspicious activity identified using the searched institution codes.",
        "Results primarily consisted of official Linguaskill resources and general exam discussions."
      ],
      summary: [
        "No new findings during today's monitoring.",
        "Institution-code searches did not surface indicators of leaked content or unauthorized distribution."
      ],
      references: []
    },
    {
      date: "2026-08-10", mode: 1, clients: ["Cambridge Linguaskill", "GMAT"],
      title: "Daily Research Report — August 10, 2026",
      findings: [
        "[Linguaskill] Targeted monitoring across DuckDuckGo, Brave Search, Chrome, and Reddit for cheating / third-party test-taking / proctoring-evasion services.",
        "[Linguaskill] Examinator, TestHelper, and ExamSharks confirmed as the primary relevant sources for Linguaskill-related cheating or proctoring activity.",
        "[Linguaskill] No verified exam dumps, leaked papers, or answer keys identified.",
        "[GMAT] Reddit thread (r/testsdump) advertising remote assistance for proctored exams, explicitly including GMAT.",
        "[GMAT] ExamHeroes identified — promotes remote support for online proctored exams, GMAT listed among supported categories.",
        "[GMAT] Multiple Reddit threads reference HDMI splitters and kernel-level drivers as components of remote-access proxy testing setups used by organized cheating operators."
      ],
      summary: [
        "Linguaskill: Examinator, TestHelper, ExamSharks remain the key sources to keep monitoring.",
        "GMAT: Reddit ad, ExamHeroes, and HDMI-splitter / kernel-driver discussions are useful indicators of organized cheating methods targeting live-proctored exams."
      ],
      references: [
        { label: "Reddit — r/testsdump remote assistance thread", url: "https://www.reddit.com/r/testsdump/comments/1vhcxue/a_guaranteed_success_on_any_proctored_exam_we/" },
        { label: "ExamHeroes", url: "https://examheroes.cc/" }
      ]
    },
    {
      date: "2026-08-11", mode: 1, clients: ["Cambridge Linguaskill", "General Test Security"],
      title: "Daily Research Report — August 11, 2026 (outreach + new sites)",
      findings: [
        "Attempted contact with HireExamHelp to understand process and pricing.",
        "Attempted contact with ExamSharks — communication was limited to the website chatbot; direct WhatsApp contact could not be established.",
        "Easy Code Interview identified as a new assessment-assistance website — advertises real-time AI assistance for online exams and technical interviews (HackerRank, CodeSignal, LeetCode), claims to remain undetected.",
        "HireExamHelp advertises assistance with online and proctored examinations; outreach initiated for more detail on supported exams/platforms.",
        "LinkJob.ai identified — AI-powered interview assistant offering real-time responses, coding assistance, screenshot analysis; claims a 'Stealth Mode' undetectable across meeting/coding-assessment platforms."
      ],
      summary: [
        "Easy Code Interview is the main new finding today.",
        "HireExamHelp and ExamSharks were contacted; ExamSharks required WhatsApp access for further direct communication, so only chatbot communication was possible."
      ],
      references: [
        { label: "Easy Code Interview", url: "https://easy-code-interview.com/" },
        { label: "HireExamHelp", url: "https://hireexamhelp.com/" },
        { label: "ExamSharks", url: "https://examsharks.com/" },
        { label: "LinkJob.ai", url: "https://linkjob.ai/" }
      ]
    },
    {
      date: "2026-08-11", mode: 2, clients: ["General Test Security"],
      title: "Update on Suspicious Exam Session Patterns — Proctoring Data Analysis (Internal Telemetry)",
      findings: [
        { text: "Bot-like session flood from a single IP — one IP generated 8,000+ sessions (~7% of the entire dataset); 3 candidate IDs on this IP each had 700–1,000+ sessions, mostly overlapping in time with their own other sessions. Not possible for a real test-taker; points to automated/scripted traffic.", status: "critical" },
        { text: "Same device used across many different candidates ('exam mill' pattern) — 300+ cases of the same IP, OS, browser, and browser version reused across 5+ completely different candidates, in some cases 100+ candidates on one device over several months. Consistent with a shared test-taking location/device sitting exams on behalf of multiple people.", status: "critical" },
        { text: "Rotating-IP 'burst' sessions — separate candidate IDs generated 30–190 sessions within a few hours, each from a new/different IP (near 1-for-1 session-to-IP ratio). Consistent with VPN/proxy rotation to avoid IP-based detection.", status: "serious" },
        { text: "Confirmed cross-border identity mismatch — ties to a manually-flagged IP/device match: proctor comments confirm candidates claiming different nationalities (Bangladeshi/Pakistani ID cards) sitting the exam from the same device/location in Malaysia. Only a fraction of sessions on that device have been reviewed; rest outstanding.", status: "critical" },
        { text: "Impossible time overlaps on individual candidate accounts — several hundred candidate IDs show sessions overlapping their own other sessions by more than 10 minutes, suggesting the same account active in more than one session at once.", status: "serious" },
        { text: "Multiple countries on a single candidate ID — 100+ candidate IDs logged in from more than one country; a handful show 5–10 different countries within a two-week span.", status: "warning" }
      ],
      summary: [
        "Additional sessions found where IP address and environment settings matched across different candidates with the same device/peripherals — under further investigation.",
        "Next step: restore video recordings for further investigation, as the patterns concentrate mainly in Jan–April sessions."
      ],
      references: []
    }
  ];

  for (const e of seedEntries) {
    await pool.query(
      `INSERT INTO entries (date, mode, clients, title, findings, summary, references_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [e.date, e.mode, JSON.stringify(e.clients), e.title,
       JSON.stringify(e.findings), JSON.stringify(e.summary), JSON.stringify(e.references)]
    );
  }
}

function rowToEntry(row) {
  return {
    id: row.id,
    date: row.date,
    mode: row.mode,
    clients: row.clients,
    title: row.title,
    findings: row.findings,
    summary: row.summary,
    references: row.references_json,
    isDeleted: row.is_deleted
  };
}

async function getAllEntries() {
  const { rows } = await pool.query(
    "SELECT * FROM entries WHERE is_deleted = FALSE ORDER BY date DESC, id DESC"
  );
  return rows.map(rowToEntry);
}

async function getDeletedEntries() {
  const { rows } = await pool.query(
    "SELECT * FROM entries WHERE is_deleted = TRUE ORDER BY date DESC, id DESC"
  );
  return rows.map(rowToEntry);
}

async function insertEntry(e) {
  const { rows } = await pool.query(
    `INSERT INTO entries (date, mode, clients, title, findings, summary, references_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [e.date, e.mode, JSON.stringify(e.clients), e.title,
     JSON.stringify(e.findings), JSON.stringify(e.summary), JSON.stringify(e.references)]
  );
  return rowToEntry(rows[0]);
}

async function softDeleteEntry(id) {
  const { rows } = await pool.query(
    "UPDATE entries SET is_deleted = TRUE WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0] ? rowToEntry(rows[0]) : null;
}

async function restoreEntry(id) {
  const { rows } = await pool.query(
    "UPDATE entries SET is_deleted = FALSE WHERE id = $1 RETURNING *",
    [id]
  );
  return rows[0] ? rowToEntry(rows[0]) : null;
}

async function getHiddenSites() {
  const { rows } = await pool.query(
    "SELECT host FROM hidden_sites ORDER BY hidden_at DESC"
  );
  return rows.map(r => r.host);
}

async function hideSite(host) {
  await pool.query(
    "INSERT INTO hidden_sites (host) VALUES ($1) ON CONFLICT (host) DO NOTHING",
    [host]
  );
}

async function restoreSite(host) {
  await pool.query("DELETE FROM hidden_sites WHERE host = $1", [host]);
}

module.exports = {
  init,
  getAllEntries,
  getDeletedEntries,
  insertEntry,
  softDeleteEntry,
  restoreEntry,
  getHiddenSites,
  hideSite,
  restoreSite
};
