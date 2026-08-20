import { state, renderAll } from "./core.js";
import { parseFinding, serialiseFinding } from "./findingSeverity.js";
import * as api from "./api.js";

const FORM_FIELD_IDS = ["f-date", "f-clients", "f-title", "f-findings", "f-summary", "f-refs"];

export function resetForm() {
  state.editingId = null;
  FORM_FIELD_IDS.forEach(id => { document.getElementById(id).value = ""; });
  document.getElementById("f-mode").value = "1";
  document.getElementById("formTitle").textContent = "Add a new finding";
  document.getElementById("saveEntryBtn").textContent = "Save finding";
  document.getElementById("editingNote").style.display = "none";
}

export function openAddForm() {
  resetForm();
  const body = document.getElementById("formBody");
  body.classList.remove("collapsed");
  body.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function openEditForm(id) {
  const entry = state.entries.find(e => String(e.id) === String(id));
  if (!entry) return;
  state.editingId = entry.id;

  document.getElementById("f-date").value = entry.date || "";
  document.getElementById("f-mode").value = String(entry.mode === 2 ? 2 : 1);
  document.getElementById("f-clients").value = (entry.clients || []).join(", ");
  document.getElementById("f-title").value = entry.title || "";
  document.getElementById("f-findings").value = (entry.findings || []).map(serialiseFinding).join("\n");
  document.getElementById("f-summary").value = (entry.summary || [])
    .map(s => (s && typeof s === "object" ? String(s.text || "") : String(s || ""))).join("\n");
  document.getElementById("f-refs").value = (entry.references || [])
    .map(r => `${r.label || r.url} | ${r.url}`).join("\n");

  document.getElementById("formTitle").textContent = "Edit finding";
  document.getElementById("saveEntryBtn").textContent = "Save changes";
  const note = document.getElementById("editingNote");
  note.textContent = `Editing entry #${entry.id} — ${entry.title}`;
  note.style.display = "";

  const body = document.getElementById("formBody");
  body.classList.remove("collapsed");
  body.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.getElementById("openFormBtn").addEventListener("click", openAddForm);
document.getElementById("cancelFormBtn").addEventListener("click", () => {
  resetForm();
  document.getElementById("formBody").classList.add("collapsed");
});

document.getElementById("saveEntryBtn").addEventListener("click", async () => {
  const date = document.getElementById("f-date").value;
  const mode = parseInt(document.getElementById("f-mode").value, 10);
  const clients = document.getElementById("f-clients").value.split(",").map(s => s.trim()).filter(Boolean);
  const title = document.getElementById("f-title").value.trim();
  const findings = document.getElementById("f-findings").value.split("\n").map(s => s.trim()).filter(Boolean).map(parseFinding);
  const summary = document.getElementById("f-summary").value.split("\n").map(s => s.trim()).filter(Boolean);
  const references = document.getElementById("f-refs").value.split("\n").map(s => s.trim()).filter(Boolean).map(line => {
    const [label, url] = line.split("|").map(s => s.trim());
    return { label: label || url, url: url || "#" };
  });

  if (!date || !title) {
    alert("Please fill in at least a date and a title.");
    return;
  }
  const payload = { date, mode, clients: clients.length ? clients : ["Unspecified"], title, findings, summary, references };
  const isEdit = state.editingId !== null;

  const btn = document.getElementById("saveEntryBtn");
  btn.disabled = true;
  try {
    const res = isEdit ? await api.updateEntry(state.editingId, payload) : await api.createEntry(payload);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || `Could not ${isEdit ? "update" : "save"} this finding. Please try again.`);
      return;
    }
    const saved = await res.json();
    if (isEdit) {
      const i = state.entries.findIndex(en => String(en.id) === String(saved.id));
      if (i !== -1) state.entries[i] = saved; else state.entries.push(saved);
    } else {
      state.entries.push(saved);
    }
    resetForm();
    document.getElementById("formBody").classList.add("collapsed");
    renderAll();
  } catch (e) {
    alert(`Could not reach the server. Your ${isEdit ? "changes were" : "finding was"} not saved.`);
  } finally {
    btn.disabled = false;
  }
});
