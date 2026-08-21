// The per-site notes thread: a slide-over opened by clicking a registry
// card. Viewing notes is public; adding/editing one requires being logged in
// (any role); deleting (soft) is admin-only.
import { state } from "./core.js";
import { escapeHtml, fmtDate, clientColor } from "./utils.js";
import { buildRegistry } from "./registry.js";
import * as api from "./api.js";
import { registerPanel, openPanel, closeAllPanels } from "./panel.js";
import { icon } from "./icons.js";

registerPanel("siteDetailPanel");

let currentHost = null;
let currentNotes = [];
let editingNoteId = null;

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
  const clientChips = Array.from(it.clients).map(c => `<span class="tag"><span class="dot" style="background:${clientColor(c)}"></span>${escapeHtml(c)}</span>`).join("");
  return `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span class="reg-status ${statusClass}">${statusText}</span>
      <span class="reg-cat">${escapeHtml(it.category)}</span>
    </div>
    <div class="reg-meta" style="margin-top:6px;">Seen: ${seenRange}</div>
    <div class="reg-clients" style="margin-top:8px;">${clientChips}</div>
  `;
}

function noteRowHtml(n) {
  if (editingNoteId === n.id) {
    return `
      <div class="note-edit-row" data-note-id="${n.id}">
        <textarea rows="2">${escapeHtml(n.note)}</textarea>
        <div class="note-edit-actions">
          <button class="ghost note-cancel-btn" data-id="${n.id}">Cancel</button>
          <button class="primary note-save-btn" data-id="${n.id}">Save</button>
        </div>
      </div>`;
  }
  const canEdit = !!state.currentRole;
  const canDelete = state.currentRole === "admin";
  const actions = (canEdit || canDelete)
    ? `<div class="note-actions">
        ${canEdit ? `<button class="icon-btn note-edit-btn" data-id="${n.id}" title="Edit note">${icon("pencil", 13)}</button>` : ""}
        ${canDelete ? `<button class="icon-btn note-delete-btn" data-id="${n.id}" title="Delete note">${icon("trash", 13)}</button>` : ""}
      </div>`
    : "";
  return `
    <div class="restore-row" data-note-id="${n.id}">
      <div>
        <div class="r-title">${escapeHtml(n.note)}</div>
        <div class="r-meta">${fmtDateTime(n.createdAt)} · logged in as ${escapeHtml(n.authorRole)}</div>
      </div>
      ${actions}
    </div>`;
}

function renderNotesList() {
  document.getElementById("siteNotesList").innerHTML = currentNotes.length
    ? currentNotes.map(noteRowHtml).join("")
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
  editingNoteId = null;
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

document.getElementById("siteNotesList").addEventListener("click", async (e) => {
  const editBtn = e.target.closest(".note-edit-btn");
  if (editBtn) {
    editingNoteId = parseInt(editBtn.dataset.id, 10);
    renderNotesList();
    return;
  }
  const cancelBtn = e.target.closest(".note-cancel-btn");
  if (cancelBtn) {
    editingNoteId = null;
    renderNotesList();
    return;
  }
  const saveBtn = e.target.closest(".note-save-btn");
  if (saveBtn) {
    const id = saveBtn.dataset.id;
    const textarea = saveBtn.closest(".note-edit-row").querySelector("textarea");
    const newText = textarea.value.trim();
    if (!newText) return;
    saveBtn.disabled = true;
    try {
      const res = await api.updateSiteNote(currentHost, id, newText);
      if (!res.ok) { alert("Could not save this note."); return; }
      const updated = await res.json();
      const i = currentNotes.findIndex(n => String(n.id) === String(id));
      if (i !== -1) currentNotes[i] = updated;
      editingNoteId = null;
      renderNotesList();
    } catch (err) {
      alert("Could not reach the server.");
    } finally {
      saveBtn.disabled = false;
    }
    return;
  }
  const deleteBtn = e.target.closest(".note-delete-btn");
  if (deleteBtn) {
    if (!confirm("Delete this note? It will stay in the database and can be restored from \"Recently deleted.\"")) return;
    const id = deleteBtn.dataset.id;
    try {
      const res = await api.deleteSiteNote(currentHost, id);
      if (!res.ok) { alert("Could not delete this note."); return; }
      currentNotes = currentNotes.filter(n => String(n.id) !== String(id));
      renderNotesList();
    } catch (err) {
      alert("Could not reach the server.");
    }
  }
});
