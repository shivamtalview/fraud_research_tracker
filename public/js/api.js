// Thin wrappers around every backend endpoint. Nothing here holds state or
// touches the DOM — callers decide what to do with the result.

async function asJson(res) {
  return res.json().catch(() => ({}));
}

export function login(password) {
  return fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });
}

export function logout() {
  return fetch("/api/logout", { method: "POST" });
}

export function me() {
  return fetch("/api/me").then(asJson);
}

export function getEntries() {
  return fetch("/api/entries");
}

export function createEntry(payload) {
  return fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function updateEntry(id, payload) {
  return fetch(`/api/entries/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

export function deleteEntry(id) {
  return fetch(`/api/entries/${id}`, { method: "DELETE" });
}

export function restoreEntry(id) {
  return fetch(`/api/entries/${id}/restore`, { method: "POST" });
}

export function getDeletedEntries() {
  return fetch("/api/entries/deleted").then(asJson);
}

export function getHiddenSites() {
  return fetch("/api/hidden-sites");
}

export function hideSite(host) {
  return fetch(`/api/sites/${encodeURIComponent(host)}`, { method: "DELETE" });
}

export function restoreSite(host) {
  return fetch(`/api/sites/${encodeURIComponent(host)}/restore`, { method: "POST" });
}

export function getSiteNotes(host) {
  return fetch(`/api/sites/${encodeURIComponent(host)}/notes`).then(asJson);
}

export function addSiteNote(host, note) {
  return fetch(`/api/sites/${encodeURIComponent(host)}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note })
  });
}
