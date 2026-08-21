import { state, renderAll } from "./core.js";
import { escapeHtml, safeUrl, fmtDate, daysAgo, clientColor } from "./utils.js";
import { findingText, findingStatus, statusColor, statusIcon, statusLabel } from "./findingSeverity.js";
import * as api from "./api.js";
import { refreshRestorePanel } from "./admin.js";
import { openEditForm } from "./form.js";
import { icon } from "./icons.js";

export function allClients() {
  const set = new Set();
  state.entries.forEach(e => e.clients.forEach(c => set.add(c)));
  return Array.from(set);
}

export function matchesFilters(e) {
  if (state.activeMode !== "all" && String(e.mode) !== state.activeMode) return false;
  if (state.activeClient !== "all" && !e.clients.includes(state.activeClient)) return false;
  if (state.searchTerm) {
    const hay = JSON.stringify(e).toLowerCase();
    if (!hay.includes(state.searchTerm.toLowerCase())) return false;
  }
  return true;
}

export function renderTabs() {
  document.getElementById("tabbar").querySelectorAll(".tab").forEach(t => {
    const mode = t.dataset.mode;
    const n = mode === "all" ? state.entries.length : state.entries.filter(e => String(e.mode) === mode).length;
    const base = t.textContent.split(" (")[0];
    t.innerHTML = `${base} <span class="count">(${n})</span>`;
  });
}

export function renderLegend() {
  const clients = allClients();
  document.getElementById("legend").innerHTML = clients.map(c =>
    `<span><span class="dot" style="background:${clientColor(c)}"></span>${escapeHtml(c)}</span>`
  ).join("");
}

export function renderClientFilter() {
  const sel = document.getElementById("clientFilter");
  const clients = allClients();
  const current = sel.value || "all";
  sel.innerHTML = `<option value="all">All clients</option>` +
    clients.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  sel.value = clients.includes(current) ? current : "all";
}

export function renderEntries() {
  const list = document.getElementById("entriesList");
  const filtered = state.entries.filter(matchesFilters).sort((a, b) => b.date.localeCompare(a.date) || 0);
  if (!filtered.length) {
    list.innerHTML = `<div class="empty">No entries match the current filters.</div>`;
    return;
  }
  list.innerHTML = filtered.map(e => {
    const idx = state.entries.indexOf(e);
    const modeColor = e.mode === 1 ? "var(--series-violet)" : "var(--series-magenta)";
    const modeLabel = e.mode === 1 ? "MODE 1 · RED TEAM" : "MODE 2 · INVESTIGATION";
    const clientTags = e.clients.map(c => `<span class="tag"><span class="dot" style="background:${clientColor(c)}"></span>${escapeHtml(c)}</span>`).join("");
    // Findings may mix flagged ({text, status}) and unflagged (plain string)
    // items, so decide the chip per item rather than from the first one.
    const anyFlagged = (e.findings || []).some(f => findingStatus(f));
    const listTag = anyFlagged ? "ol" : "ul";
    const findingsHtml = (e.findings || []).length
      ? `<${listTag}>${e.findings.map(f => {
          const s = findingStatus(f);
          const chip = s
            ? `<span class="status-chip" style="background:${statusColor(s)}">${statusIcon(s)} ${statusLabel(s)}</span>`
            : "";
          return `<li>${escapeHtml(findingText(f))}${chip}</li>`;
        }).join("")}</${listTag}>`
      : `<div class="form-hint">No findings recorded.</div>`;
    const summaryHtml = (e.summary || []).length
      ? `<ul>${e.summary.map(s => `<li>${escapeHtml(s && typeof s === "object" ? s.text : s)}</li>`).join("")}</ul>`
      : "";
    const refsHtml = (e.references || []).length
      ? `<h4 class="section-lbl">References</h4><div class="refs">${e.references.map(r => `<a href="${safeUrl(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.label)}</a>`).join("")}</div>`
      : "";
    const adminBtns = state.currentRole === "admin"
      ? `<button class="icon-btn entry-edit-btn" data-id="${e.id}" title="Edit this finding">${icon("pencil", 14)}</button>` +
        `<button class="icon-btn entry-delete-btn" data-id="${e.id}" title="Delete this finding">${icon("trash", 14)}</button>`
      : "";
    return `
      <div class="entry" id="entry-${idx}" style="border-left-color:${modeColor}">
        <div class="entry-head">
          <div>
            <div class="entry-title">${escapeHtml(e.title)}</div>
            <div class="entry-date">${fmtDate(e.date)} · ${daysAgo(e.date) === 0 ? "today" : daysAgo(e.date) + "d ago"}</div>
          </div>
          <div class="badges">
            <span class="badge" style="background:${modeColor}">${modeLabel}</span>
            ${clientTags}
            ${adminBtns}
          </div>
        </div>
        <h4 class="section-lbl">Findings</h4>
        ${findingsHtml}
        ${summaryHtml ? `<h4 class="section-lbl">Summary</h4>${summaryHtml}` : ""}
        ${refsHtml}
      </div>`;
  }).join("");
}

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    state.activeMode = t.dataset.mode;
    renderEntries();
  });
});
document.getElementById("clientFilter").addEventListener("change", (e) => {
  state.activeClient = e.target.value;
  renderEntries();
});
document.getElementById("searchBox").addEventListener("input", (e) => {
  state.searchTerm = e.target.value;
  renderEntries();
});

document.getElementById("entriesList").addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".entry-edit-btn");
  if (editBtn) {
    openEditForm(editBtn.dataset.id);
    return;
  }
  const btn = e.target.closest(".entry-delete-btn");
  if (!btn) return;
  if (!confirm("Delete this finding? It will be hidden from the tracker but kept in the database, and can be restored from \"Recently deleted.\"")) return;
  const id = btn.dataset.id;
  try {
    const res = await api.deleteEntry(id);
    if (!res.ok) { alert("Could not delete this finding."); return; }
    state.entries = state.entries.filter(en => String(en.id) !== String(id));
    renderAll();
    refreshRestorePanel();
  } catch (err) {
    alert("Could not reach the server.");
  }
});
