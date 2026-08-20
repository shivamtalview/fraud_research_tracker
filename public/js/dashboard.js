// The two small "top of page" widgets: the stat tiles and the severity bar.
import { state } from "./core.js";
import { fmtDate, daysAgo } from "./utils.js";
import { findingStatus, statusColor, statusIcon, statusLabel, SEVERITY_ORDER } from "./findingSeverity.js";
import { allClients } from "./entries.js";
import { buildRegistry } from "./registry.js";

export function renderStats() {
  const total = state.entries.length;
  const critical = state.entries.filter(e => (e.findings || []).some(f => findingStatus(f) === "critical")).length;
  const clientsCount = allClients().length;
  const sitesCount = buildRegistry().length;
  const lastDate = state.entries.reduce((max, e) => e.date > max ? e.date : max, state.entries[0]?.date || "");
  const ago = daysAgo(lastDate);
  const stats = [
    { val: total, lbl: "Total entries", icon: "📄", accent: "var(--text-muted)" },
    { val: clientsCount, lbl: "Clients tracked", icon: "🏢", accent: "var(--series-blue)" },
    { val: sitesCount, lbl: "Sites &amp; services tracked", icon: "🔗", accent: "var(--series-orange)" },
    { val: critical, lbl: "Reports with critical findings", icon: "⛔", accent: "var(--status-critical)" },
    { val: ago === 0 ? "Today" : (ago + "d ago"), lbl: "Last report — " + fmtDate(lastDate), icon: "🕒", accent: "var(--series-aqua)" }
  ];
  document.getElementById("statsRow").innerHTML = stats.map(s =>
    `<div class="stat-tile"><div class="accent" style="background:${s.accent}"></div><div class="icon">${s.icon}</div><div class="val">${s.val}</div><div class="lbl">${s.lbl}</div></div>`
  ).join("");
  document.getElementById("lastUpdatedMeta").textContent = `${total} entries logged · last report ${fmtDate(lastDate)} · Talview test security monitoring`;
}

export function renderSeverity() {
  const counts = { critical: 0, serious: 0, warning: 0, good: 0 };
  state.entries.forEach(e => (e.findings || []).forEach(f => {
    const s = findingStatus(f);
    if (s && counts[s] !== undefined) counts[s]++;
  }));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const section = document.getElementById("sevSection");
  if (!total) { section.style.display = "none"; return; }
  section.style.display = "";
  const order = SEVERITY_ORDER;
  document.getElementById("sevBar").innerHTML = order.filter(k => counts[k] > 0).map(k =>
    `<div class="sev-seg" style="width:${(counts[k] / total * 100)}%;background:${statusColor(k)}" title="${statusLabel(k)}: ${counts[k]}"></div>`
  ).join("");
  document.getElementById("sevLegend").innerHTML = order.filter(k => counts[k] > 0).map(k =>
    `<div class="sev-legend-item"><span class="sw" style="background:${statusColor(k)}"></span>${statusIcon(k)} ${statusLabel(k)} — <b>${counts[k]}</b></div>`
  ).join("");
}
