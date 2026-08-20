import { state } from "./core.js";

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

export function safeUrl(url) {
  try {
    const u = new URL(String(url), window.location.origin);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
  } catch (e) {}
  return "#";
}

export function fmtDate(d) {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function daysAgo(d) {
  if (!state.entries.length) return 0;
  const then = new Date(d + "T00:00:00").getTime();
  const now = new Date(state.entries.reduce((m, e) => e.date > m ? e.date : m, state.entries[0].date) + "T00:00:00").getTime();
  return Math.round((now - then) / 86400000);
}

export const clientColor = (name) => {
  const map = {
    "Cambridge Linguaskill": "var(--series-blue)",
    "GMAT": "var(--series-orange)",
    "General Test Security": "var(--series-aqua)"
  };
  return map[name] || "var(--series-violet)";
};
