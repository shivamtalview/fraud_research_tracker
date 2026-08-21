// The per-site notes thread: a slide-over opened by clicking a registry
// card. Viewing notes is public; adding one requires being logged in (any
// role — same tier as adding a finding).
import { state } from "./core.js";
import { escapeHtml, fmtDate, clientColor } from "./utils.js";
import { buildRegistry } from "./registry.js";
import * as api from "./api.js";
import { registerPanel, openPanel, closeAllPanels } from "./panel.js";

registerPanel("siteDetailPanel");

let currentHost = null;
let currentNotes = [];

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

function siteMetaHtml(host) {
  const it = buildRegistry().find(i => i.host === host);
  if (!it) return `<div class="empty">Site not found.</div>`;
  const statusClass = it.status === "new" ? "st-new" : it.status === "contacted" ? "st-contacted" : "st-monitoring";
  const statusText = it.status === "new" ? "NEW" : it.status === "contacted" ? "CONTACTED" : "MONITORING";
  const seenRange = it.firstSeen === it.lastSeen ? fmtDate(it.firstSeen) : `${fmtDate(it.firstSeen)} → ${fmtDate(it.lastSeen)}`;
  const clientChips = Array.from(it.clients).map(c => `<span class="badge" style="background:${clientColor(c)};font-size:9.5px;padding:2px 7px;">${escapeHtml(c)}</span>`).join("");
  return `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span class="reg-status ${statusClass}">${statusText}</span>
      <span class="reg-cat">${escapeHtml(it.category)}</span>
    </div>
    <div class="reg-meta" style="margin-top:6px;">Seen: ${seenRange}</div>
    <div class="reg-clients" style="margin-top:8px;">${clientChips}</div>
  `;
}

function renderNotesList() {
  document.getElementById("siteNotesList").innerHTML = currentNotes.length
    ? currentNotes.map(n => `
      <div class="restore-row note-row">
        <div>
          <div class="r-title">${escapeHtml(n.note)}</div>
          <div class="r-meta">${fmtDateTime(n.createdAt)} · logged in as ${escapeHtml(n.authorRole)}</div>
        </div>
      </div>`).join("")
    : `<div class="empty">No notes yet.</div>`;
}

function renderComposer() {
  const el = document.getElementById("siteNoteComposer");
  if (!state.currentRole) {
    el.innerHTML = `<p class="form-hint">Log in from the sidebar to add a note.</p>`;
    return;
  }
  el.innerHTML = `
    <textarea id="siteNoteInput" rows="3" placeholder="Add a note about this site..."></textarea>
    <button class="primary" id="siteNoteSaveBtn">Add note</button>
  `;
  document.getElementById("siteNoteSaveBtn").addEventListener("click", async () => {
    const input = document.getElementById("siteNoteInput");
    const note = input.value.trim();
    if (!note) return;
    const btn = document.getElementById("siteNoteSaveBtn");
    btn.disabled = true;
    try {
      const res = await api.addSiteNote(currentHost, note);
      if (!res.ok) { alert("Could not save this note."); return; }
      const created = await res.json();
      currentNotes.unshift(created);
      renderNotesList();
      input.value = "";
    } catch (e) {
      alert("Could not reach the server.");
    } finally {
      btn.disabled = false;
    }
  });
}

export async function openSiteDetail(host) {
  currentHost = host;
  document.getElementById("siteDetailTitle").textContent = host;
  document.getElementById("siteDetailMeta").innerHTML = siteMetaHtml(host);
  currentNotes = [];
  document.getElementById("siteNotesList").innerHTML = `<div class="empty">Loading…</div>`;
  renderComposer();
  openPanel("siteDetailPanel");
  try {
    currentNotes = await api.getSiteNotes(host);
    renderNotesList();
  } catch (e) {
    document.getElementById("siteNotesList").innerHTML = `<div class="empty">Could not load notes.</div>`;
  }
}

document.getElementById("closeSiteDetailBtn").addEventListener("click", closeAllPanels);
