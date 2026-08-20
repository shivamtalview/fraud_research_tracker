// Entry point: importing each section module registers its event listeners
// (a side effect of module evaluation); this file also owns generic page
// chrome (icon hydration, collapsible sections, dark/light toggle) since none
// of that belongs to any one data section, then boots the app once
// everything is wired up.
import "./entries.js";
import "./registry.js";
import "./admin.js";
import "./form.js";
import { icon } from "./icons.js";
import { checkAuthAndLoad } from "./auth.js";

// Static icons declared as <span data-icon="name"> in the markup get their
// SVG injected once on load — keeps icons.js the single source of icon
// markup instead of duplicating path data inside index.html.
document.querySelectorAll("[data-icon]").forEach(el => {
  el.innerHTML = icon(el.dataset.icon, el.classList.contains("chev") ? 14 : 16);
});

document.querySelectorAll(".block-head").forEach(h => {
  h.addEventListener("click", () => {
    const body = document.getElementById(h.dataset.target);
    body.classList.toggle("collapsed");
    h.querySelector(".chev").style.transform = body.classList.contains("collapsed") ? "rotate(-90deg)" : "rotate(0deg)";
  });
});

document.getElementById("themeToggle").addEventListener("click", () => {
  const root = document.documentElement;
  const isDark = root.getAttribute("data-theme") === "dark";
  root.setAttribute("data-theme", isDark ? "light" : "dark");
  const btn = document.getElementById("themeToggle");
  btn.dataset.icon = isDark ? "moon" : "sun";
  btn.innerHTML = icon(btn.dataset.icon, 16);
  btn.title = isDark ? "Switch to dark mode" : "Switch to light mode";
});

checkAuthAndLoad();
