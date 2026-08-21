// Viewing the dashboard is public. A session (role: "user" or "admin") is
// only needed to write anything, and is established from the "Account" card
// in the rail rather than a page-blocking login screen.
import { state, renderAll } from "./core.js";
import * as api from "./api.js";
import { refreshRestorePanel } from "./admin.js";

export function renderAccountUI() {
  const loggedOut = document.getElementById("accountLoggedOut");
  const loggedIn = document.getElementById("accountLoggedIn");
  if (state.currentRole) {
    loggedOut.style.display = "none";
    loggedIn.style.display = "";
    document.getElementById("accountRoleLabel").textContent = `Logged in as ${state.currentRole}.`;
  } else {
    loggedOut.style.display = "";
    loggedIn.style.display = "none";
  }
  document.getElementById("openFormBtn").style.display = state.currentRole ? "" : "none";
}

async function loadDashboard() {
  try {
    const [entriesRes, hiddenRes] = await Promise.all([
      api.getEntries(),
      api.getHiddenSites()
    ]);
    state.entries = entriesRes.ok ? await entriesRes.json() : [];
    state.hiddenSites = new Set(hiddenRes.ok ? await hiddenRes.json() : []);
  } catch (e) {
    state.entries = [];
    state.hiddenSites = new Set();
  }
}

export async function checkAuthAndLoad() {
  await loadDashboard();
  try {
    const me = await api.me();
    state.currentRole = me.authed ? me.role : null;
  } catch (e) {
    state.currentRole = null;
  }
  renderAll();
  if (state.currentRole === "admin") refreshRestorePanel();
}

export async function doLogin() {
  const password = document.getElementById("sidebarPassword").value;
  const errEl = document.getElementById("sidebarLoginError");
  errEl.textContent = "";
  try {
    const res = await api.login(password);
    if (res.ok) {
      const data = await res.json();
      state.currentRole = data.role;
      document.getElementById("sidebarPassword").value = "";
      renderAll();
      if (state.currentRole === "admin") refreshRestorePanel();
    } else {
      const data = await res.json().catch(() => ({}));
      errEl.textContent = data.error || "Incorrect password.";
    }
  } catch (e) {
    errEl.textContent = "Could not reach the server. Try again.";
  }
}

export async function doLogout() {
  await api.logout();
  state.currentRole = null;
  renderAll();
}

document.getElementById("sidebarLoginBtn").addEventListener("click", doLogin);
document.getElementById("sidebarPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});
document.getElementById("sidebarLogoutBtn").addEventListener("click", doLogout);
