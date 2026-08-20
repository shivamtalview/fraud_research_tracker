// Shared mutable app state, plus renderAll() — the orchestrator that composes
// every section's render function. Kept together since renderAll necessarily
// forms a two-way import with each section file (it calls their render
// function; they call renderAll back after a mutation). That's safe in native
// ES modules as long as neither side reads the other's export at
// module-evaluation time — here everything is only ever touched from inside
// event-handler callbacks, long after the whole module graph has loaded.
import { renderStats, renderSeverity } from "./dashboard.js";
import { renderTimeline } from "./timeline.js";
import { renderRegistry } from "./registry.js";
import { renderEntries, renderTabs, renderLegend, renderClientFilter } from "./entries.js";
import { renderAdminUI } from "./admin.js";

export const state = {
  entries: [],
  activeMode: "all",
  activeClient: "all",
  searchTerm: "",
  currentRole: null,
  hiddenSites: new Set(),
  editingId: null
};

export function renderAll() {
  renderStats();
  renderLegend();
  renderClientFilter();
  renderTabs();
  renderTimeline();
  renderSeverity();
  renderRegistry();
  renderEntries();
  renderAdminUI();
}
