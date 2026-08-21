import { state, renderAll } from "./core.js";
import { escapeHtml, fmtDate } from "./utils.js";
import * as api from "./api.js";

export function renderAdminUI() {
  const section = document.getElementById("restoreSection");
  section.style.display = state.currentRole === "admin" ? "" : "none";
}

export async function refreshRestorePanel() {
  if (state.currentRole !== "admin") return;
  const deletedList = document.getElementById("deletedEntriesList");
  const hiddenList = document.getElementById("hiddenSitesList");
  const deletedNotesList = document.getElementById("deletedNotesList");
  try {
    const [deletedEntries, hiddenRes, deletedNotes] = await Promise.all([
      api.getDeletedEntries(),
      api.getHiddenSites(),
      api.getDeletedNotes()
    ]);
    const hidden = await hiddenRes.json();
    deletedList.innerHTML = deletedEntries.length
      ? deletedEntries.map(e => `
        <div class="restore-row">
          <div><div class="r-title">${escapeHtml(e.title)}</div><div class="r-meta">${fmtDate(e.date)}</div></div>
          <button class="ghost restore-entry-btn" data-id="${e.id}">Restore</button>
        </div>`).join("")
      : `<div class="empty">Nothing deleted.</div>`;
    hiddenList.innerHTML = hidden.length
      ? hidden.map(host => `
        <div class="restore-row">
          <div class="r-title">${escapeHtml(host)}</div>
          <button class="ghost restore-site-btn" data-host="${escapeHtml(host)}">Restore</button>
        </div>`).join("")
      : `<div class="empty">No hidden sites.</div>`;
    deletedNotesList.innerHTML = deletedNotes.length
      ? deletedNotes.map(n => `
        <div class="restore-row">
          <div><div class="r-title">${escapeHtml(n.note)}</div><div class="r-meta">${escapeHtml(n.host)}</div></div>
          <button class="ghost restore-note-btn" data-host="${escapeHtml(n.host)}" data-id="${n.id}">Restore</button>
        </div>`).join("")
      : `<div class="empty">No deleted notes.</div>`;
  } catch (e) {
    deletedList.innerHTML = `<div class="empty">Could not load.</div>`;
    hiddenList.innerHTML = `<div class="empty">Could not load.</div>`;
    deletedNotesList.innerHTML = `<div class="empty">Could not load.</div>`;
  }
}

document.getElementById("restoreBody").addEventListener("click", async (e) => {
  const entryBtn = e.target.closest(".restore-entry-btn");
  const siteBtn = e.target.closest(".restore-site-btn");
  const noteBtn = e.target.closest(".restore-note-btn");
  if (entryBtn) {
    try {
      const res = await api.restoreEntry(entryBtn.dataset.id);
      if (!res.ok) { alert("Could not restore this finding."); return; }
      const restored = await res.json();
      state.entries.push(restored);
      renderAll();
      refreshRestorePanel();
    } catch (err) {
      alert("Could not reach the server.");
    }
  } else if (siteBtn) {
    try {
      const res = await api.restoreSite(siteBtn.dataset.host);
      if (!res.ok) { alert("Could not restore this site."); return; }
      state.hiddenSites.delete(siteBtn.dataset.host);
      renderAll();
      refreshRestorePanel();
    } catch (err) {
      alert("Could not reach the server.");
    }
  } else if (noteBtn) {
    try {
      const res = await api.restoreSiteNote(noteBtn.dataset.host, noteBtn.dataset.id);
      if (!res.ok) { alert("Could not restore this note."); return; }
      refreshRestorePanel();
    } catch (err) {
      alert("Could not reach the server.");
    }
  }
});
