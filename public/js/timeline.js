import { state } from "./core.js";
import { escapeHtml, fmtDate } from "./utils.js";
import { renderEntries } from "./entries.js";

export function renderTimeline() {
  const sorted = [...state.entries].sort((a, b) => a.date.localeCompare(b.date));
  const tl = document.getElementById("timeline");
  tl.innerHTML = sorted.map((e, i) => {
    const idx = state.entries.indexOf(e);
    const color = e.mode === 1 ? "var(--series-violet)" : "var(--series-magenta)";
    return `
      <div class="tl-node" data-idx="${idx}" title="${escapeHtml(e.title)}">
        <div class="tl-dot" style="background:${color}"></div>
        <div class="tl-date">${fmtDate(e.date)}</div>
        <div class="tl-label">${e.mode === 1 ? "Red Team" : "Investigation"}</div>
      </div>`;
  }).join("");
  tl.querySelectorAll(".tl-node").forEach(node => {
    node.addEventListener("click", () => {
      const idx = node.dataset.idx;
      state.activeMode = "all"; state.activeClient = "all"; state.searchTerm = "";
      document.getElementById("searchBox").value = "";
      document.getElementById("clientFilter").value = "all";
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      document.querySelector('.tab[data-mode="all"]').classList.add("active");
      renderEntries();
      requestAnimationFrame(() => {
        const card = document.getElementById("entry-" + idx);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.classList.add("flash");
          setTimeout(() => card.classList.remove("flash"), 1200);
        }
      });
    });
  });
}
