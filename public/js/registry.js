import { state, renderAll } from "./core.js";
import { escapeHtml, safeUrl, fmtDate, clientColor } from "./utils.js";
import { findingText } from "./findingSeverity.js";
import * as api from "./api.js";
import { refreshRestorePanel } from "./admin.js";
import { icon } from "./icons.js";
import { openSiteDetail } from "./siteDetail.js";

// Known threat-service metadata, keyed by a substring of the URL's hostname.
// `aliases` are the prose spellings used in findings/summary text, so a service
// mentioned in a later report updates its "Seen" range even when that report
// did not re-list it under References.
const siteMeta = {
  "testhelper.org":          { category: "Test-taker-for-hire", status: "monitoring", aliases: [/test\s?helper/i] },
  "examsharks.com":          { category: "Proctoring circumvention + test-taker-for-hire", status: "contacted", aliases: [/exam\s?sharks/i] },
  "examinator.cc":           { category: "Test-taker-for-hire / proctoring circumvention", status: "monitoring", aliases: [/examinator/i] },
  // Deliberately narrow: a bare "Reddit" in a list of platforms searched is not a sighting.
  "reddit.com":              { category: "Marketplace ad (community forum)", status: "monitoring", aliases: [/r\/[a-z0-9_]+/i, /reddit\s+(?:thread|ad|post|advert)/i] },
  "examheroes.cc":           { category: "Test-taker-for-hire", status: "monitoring", aliases: [/exam\s?heroes/i] },
  "easy-code-interview.com": { category: "AI exam / interview assistant (claims undetectable)", status: "new", aliases: [/easy[\s-]?code[\s-]?interview/i] },
  "hireexamhelp.com":        { category: "Test-taker-for-hire + claimed proctoring bypass", status: "contacted", aliases: [/hire\s?exam\s?help/i] },
  "linkjob.ai":              { category: "AI interview assistant (“Stealth Mode” claim)", status: "monitoring", aliases: [/linkjob/i] },
  "bypassmyexam.com":        { category: "Proxy testing / test-taker-for-hire", status: "monitoring", aliases: [/bypass\s?my\s?exam/i] },
  "takemyproctoredexamforme.com": { category: "Proxy testing / test-taker-for-hire", status: "monitoring", aliases: [/take\s?my\s?proctored\s?exam\s?for\s?me/i] }
};

function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; }
}

function matchMeta(hostname) {
  for (const key in siteMeta) { if (hostname.includes(key)) return siteMeta[key]; }
  return { category: "External reference", status: "monitoring" };
}

// All prose in an entry that could name a tracked service.
export function entryProse(e) {
  return [
    e.title || "",
    ...(e.findings || []).map(findingText),
    ...(e.summary || []).map(s => (s && typeof s === "object" ? String(s.text || "") : String(s || "")))
  ].join("\n");
}

export function buildRegistry() {
  const map = new Map();

  const touch = (host, e) => {
    const item = map.get(host);
    if (!item) return;
    item.clients = new Set([...item.clients, ...e.clients]);
    if (e.date < item.firstSeen) item.firstSeen = e.date;
    if (e.date > item.lastSeen) item.lastSeen = e.date;
  };

  // Pass 1: a site enters the registry through an entry's References, which is
  // the only place a real URL for it exists.
  state.entries.forEach(e => {
    (e.references || []).forEach(r => {
      const host = hostnameOf(r.url);
      if (state.hiddenSites.has(host)) return;
      if (!map.has(host)) {
        map.set(host, { host, label: r.label, url: r.url, clients: new Set(), firstSeen: e.date, lastSeen: e.date, ...matchMeta(host) });
      }
      touch(host, e);
    });
  });

  // Pass 2: re-sightings. A service discussed in a later report's findings or
  // summary extends its Seen range even if that report didn't re-list the link.
  const aliased = Array.from(map.keys())
    .map(host => {
      const meta = Object.entries(siteMeta).find(([key]) => host.includes(key));
      return { host, patterns: (meta && meta[1].aliases) || [] };
    })
    .filter(x => x.patterns.length);

  if (aliased.length) {
    state.entries.forEach(e => {
      const prose = entryProse(e);
      aliased.forEach(({ host, patterns }) => {
        if (patterns.some(re => re.test(prose))) touch(host, e);
      });
    });
  }

  return Array.from(map.values()).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export function renderRegistry() {
  const items = buildRegistry();
  const grid = document.getElementById("registryGrid");
  if (!items.length) {
    grid.innerHTML = `<div class="empty">No external sites or services referenced yet.</div>`;
    return;
  }
  grid.innerHTML = items.map(it => {
    const statusClass = it.status === "new" ? "st-new" : it.status === "contacted" ? "st-contacted" : "st-monitoring";
    const statusText = it.status === "new" ? "NEW" : it.status === "contacted" ? "CONTACTED" : "MONITORING";
    const clientChips = Array.from(it.clients).map(c => `<span class="tag"><span class="dot" style="background:${clientColor(c)}"></span>${escapeHtml(c)}</span>`).join("");
    const seenRange = it.firstSeen === it.lastSeen ? fmtDate(it.firstSeen) : `${fmtDate(it.firstSeen)} → ${fmtDate(it.lastSeen)}`;
    const deleteBtn = state.currentRole === "admin"
      ? `<button class="icon-btn site-delete-btn" data-host="${escapeHtml(it.host)}" title="Hide this site">${icon("trash", 14)}</button>`
      : "";
    return `
      <div class="reg-card" data-host="${escapeHtml(it.host)}" title="Click for notes on this site">
        <div class="reg-name"><a href="${safeUrl(it.url)}" target="_blank" rel="noopener" title="${escapeHtml(it.host)}">${escapeHtml(it.host)}</a><span class="reg-status-group"><span class="reg-status ${statusClass}">${statusText}</span>${deleteBtn}</span></div>
        <div class="reg-cat">${escapeHtml(it.category)}</div>
        <div class="reg-meta">Seen: ${seenRange}</div>
        <div class="reg-clients">${clientChips}</div>
      </div>`;
  }).join("");
}

document.getElementById("registryGrid").addEventListener("click", async (e) => {
  const deleteBtn = e.target.closest(".site-delete-btn");
  if (deleteBtn) {
    const host = deleteBtn.dataset.host;
    if (!confirm(`Hide "${host}" from the tracked sites list? It will stay in the database and can be restored from "Recently deleted."`)) return;
    try {
      const res = await api.hideSite(host);
      if (!res.ok) { alert("Could not hide this site."); return; }
      state.hiddenSites.add(host);
      renderAll();
      refreshRestorePanel();
    } catch (err) {
      alert("Could not reach the server.");
    }
    return;
  }

  if (e.target.closest("a")) return; // let the external site link navigate normally

  const card = e.target.closest(".reg-card");
  if (card) openSiteDetail(card.dataset.host);
});
