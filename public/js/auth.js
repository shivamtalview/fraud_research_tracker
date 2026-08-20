import { state, renderAll } from "./core.js";
import * as api from "./api.js";
import { refreshRestorePanel } from "./admin.js";

export function showLogin(message) {
  document.getElementById("loginOverlay").style.display = "flex";
  document.getElementById("appRoot").style.display = "none";
  document.getElementById("loginError").textContent = message || "";
}

export async function loadEntriesAndShowApp() {
  const [entriesRes, hiddenRes] = await Promise.all([
    api.getEntries(),
    api.getHiddenSites()
  ]);
  if (!entriesRes.ok || !hiddenRes.ok) { showLogin(); return; }
  state.entries = await entriesRes.json();
  state.hiddenSites = new Set(await hiddenRes.json());
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("appRoot").style.display = "";
  renderAll();
  if (state.currentRole === "admin") refreshRestorePanel();
}

export async function checkAuthAndLoad() {
  try {
    const me = await api.me();
    if (me.authed) {
      state.currentRole = me.role;
      await loadEntriesAndShowApp();
    } else {
      showLogin();
    }
  } catch (e) {
    showLogin("Could not reach the server. Try reloading the page.");
  }
}

export async function doLogin() {
  const password = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  try {
    const res = await api.login(password);
    if (res.ok) {
      const data = await res.json();
      state.currentRole = data.role;
      document.getElementById("loginPassword").value = "";
      await loadEntriesAndShowApp();
    } else {
      const data = await res.json().catch(() => ({}));
      errEl.textContent = data.error || "Incorrect password.";
    }
  } catch (e) {
    errEl.textContent = "Could not reach the server. Try again.";
  }
}

document.getElementById("loginBtn").addEventListener("click", doLogin);
document.getElementById("loginPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await api.logout();
  state.entries = [];
  state.hiddenSites = new Set();
  state.currentRole = null;
  showLogin();
});
