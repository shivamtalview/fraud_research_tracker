// Small hand-rolled inline-SVG icon set — no icon font or CDN dependency.
// 24x24 viewBox, stroke-based, `currentColor` so each icon inherits its
// surrounding text color and works in both themes automatically.
//
// Deliberately does NOT cover the severity markers (⛔ ▲ ◐ ✓) used by
// findingSeverity.js — those are load-bearing for the admin text-marker
// parsing/round-trip feature (parseFinding/serialiseFinding), not chrome
// decoration, so they're left untouched.

const PATHS = {
  shield: '<path d="M12 3 4 6.5v5.2c0 4.9 3.4 8.9 8 10.3 4.6-1.4 8-5.4 8-10.3V6.5Z"/>',
  file: '<path d="M6 2.5h8.5L19 7v14.5H6Z"/><path d="M14.5 2.5V7H19"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M10 21v-4.5h4V21"/><path d="M8.5 7h1.2M14.3 7h1.2M8.5 10.6h1.2M14.3 10.6h1.2M8.5 14.2h1.2M14.3 14.2h1.2"/>',
  link: '<path d="M10 14a4.2 4.2 0 0 0 6 0l2-2a4.2 4.2 0 0 0-6-6l-1.2 1.2"/><path d="M14 10a4.2 4.2 0 0 0-6 0l-2 2a4.2 4.2 0 0 0 6 6l1.2-1.2"/>',
  "alert-triangle": '<path d="M12 3 22 20H2Z"/><path d="M12 9.5v4"/><path d="M12 16.8h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3.2 2"/>',
  trash: '<path d="M4.5 7h15"/><path d="M9 7V4.3h6V7"/><path d="M6.5 7 7.6 21h8.8L17.5 7"/><path d="M10.2 11v6.5M13.8 11v6.5"/>',
  pencil: '<path d="M4 20.5 4.6 17 16 5.6a1.8 1.8 0 0 1 2.5 0l0 0a1.8 1.8 0 0 1 0 2.5L7 19.5Z"/><path d="M14 7.6 16.4 10"/>',
  moon: '<path d="M20.5 13.4A8.5 8.5 0 0 1 10.6 3.5 8.8 8.8 0 1 0 20.5 13.4Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3.5v2M12 18.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3.5 12h2M18.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  "chevron-down": '<path d="M6 9.5 12 15.5 18 9.5"/>',
  x: '<path d="M6 6 18 18"/><path d="M18 6 6 18"/>',
  "log-out": '<path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9"/><path d="M15 16l4-4-4-4"/><path d="M19 12H9"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'
};

export function icon(name, size = 16) {
  const body = PATHS[name] || "";
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
