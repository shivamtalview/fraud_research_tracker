// Entry point: importing each section module registers its event listeners
// (a side effect of module evaluation); this file also owns generic page
// chrome (collapsible sections, dark/light toggle) since neither belongs to
// any one data section, then boots the app once everything is wired up.
import "./entries.js";
import "./registry.js";
import "./admin.js";
import "./form.js";
import { checkAuthAndLoad } from "./auth.js";

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
  document.getElementById("themeToggle").textContent = isDark ? "🌙 Dark mode" : "☀️ Light mode";
});

checkAuthAndLoad();
