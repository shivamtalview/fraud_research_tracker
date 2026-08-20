// A finding is stored either as a plain string, or as { text, status } where
// status is one of critical | serious | warning | good. The entry form lets an
// analyst set the status by ending the line with a marker, e.g.
//   "Provider confirmed Linguaskill capability. ⛔ Critical"
//   "Two new proxy providers identified. [serious]"
export const SEVERITY_WORDS = {
  critical: "critical", crit: "critical",
  serious: "serious", major: "serious",
  monitoring: "warning", monitor: "warning", warning: "warning", watch: "warning",
  good: "good", ok: "good", clear: "good", "no findings": "good"
};
export const SEVERITY_ICONS = { "⛔": "critical", "▲": "serious", "◐": "warning", "✓": "good" };
export const SEVERITY_ORDER = ["critical", "serious", "warning", "good"];

export const statusColor = (s) => ({
  good: "var(--status-good)", warning: "var(--status-warning)",
  serious: "var(--status-serious)", critical: "var(--status-critical)"
}[s] || "var(--status-warning)");
export const statusIcon = (s) => ({ good: "✓", warning: "◐", serious: "▲", critical: "⛔" }[s] || "◐");
export const statusLabel = (s) => ({ good: "No findings", warning: "Monitoring", serious: "Serious", critical: "Critical" }[s] || s);

// "text ⛔ Critical" / "text ⛔" / "text [critical]" / "text — Critical" -> { text, status }
export function parseFinding(line) {
  const raw = String(line).trim();
  if (!raw) return raw;

  const attempts = [
    // bracketed tag: [critical] or (critical)
    { re: /[\s ]*[[(]\s*([A-Za-z ]+?)\s*[\])]\s*$/, word: 1, icon: null },
    // icon, optionally followed by its label
    { re: /[\s ]*([⛔▲◐✓])\s*([A-Za-z ]*)$/, word: 2, icon: 1 },
    // trailing dash + label
    { re: /[\s ]*[—–-]\s*(critical|serious|monitoring|warning|good)\s*$/i, word: 1, icon: null }
  ];

  for (const a of attempts) {
    const m = raw.match(a.re);
    if (!m) continue;
    const word = (m[a.word] || "").trim().toLowerCase();
    const status = SEVERITY_WORDS[word] || (a.icon ? SEVERITY_ICONS[m[a.icon]] : null);
    if (!status) continue;
    const text = raw.slice(0, m.index).trim();
    if (!text) continue; // a line that is only a marker isn't a finding
    return { text, status };
  }
  return raw;
}

// Inverse of parseFinding, for pre-filling the edit form.
export function serialiseFinding(f) {
  if (!f || typeof f !== "object") return String(f || "");
  if (!f.status) return String(f.text || "");
  return `${f.text} ${statusIcon(f.status)} ${statusLabel(f.status)}`;
}

export const findingText = (f) => (f && typeof f === "object" ? String(f.text || "") : String(f || ""));
export const findingStatus = (f) => (f && typeof f === "object" ? f.status : null);
