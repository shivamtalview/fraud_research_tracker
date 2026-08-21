// Shared slide-over machinery: any number of panels can register themselves;
// opening one closes the others, and a single shared backdrop + Escape-key
// handler serves all of them instead of duplicating that logic per panel.
const panels = [];

export function registerPanel(id) {
  panels.push(id);
}

export function openPanel(id) {
  closeAllPanels();
  const el = document.getElementById(id);
  if (el) el.classList.add("open");
  document.getElementById("panelBackdrop").classList.add("show");
}

export function closeAllPanels() {
  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
  });
  document.getElementById("panelBackdrop").classList.remove("show");
}

document.getElementById("panelBackdrop").addEventListener("click", closeAllPanels);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllPanels();
});
