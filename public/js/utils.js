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
  const then = new Date(d + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today.getTime() - then) / 86400000);
}

export const clientColor = (name) => {
  const map = {
    "Cambridge Linguaskill": "var(--series-blue)",
    "GMAT": "var(--series-orange)",
    "General Test Security": "var(--series-aqua)"
  };
  return map[name] || "var(--series-violet)";
};
