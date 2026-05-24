/*
 * LOCK//IN "locked-in browser" — hybrid Google wrapper.
 *
 * During an active focus session we keep Google's REAL results (so images,
 * YouTube, and the AI Overview all keep working, and result-filter.js still
 * hides disallowed sites), but:
 *   • float our own LOCK//IN header + search bar on top,
 *   • paint the app's aurora background, and
 *   • dark-theme Google's result columns (see google-skin.css).
 *
 * This script only toggles the `lockin-locked` / `lockin-hide-gemini` classes
 * (which drive the CSS) and injects the header. It does NOT restructure or
 * scrape Google's DOM — that's what broke earlier.
 */
(function () {
  const hn = location.hostname.toLowerCase().replace(/^www\./, "");
  const parts = hn.split(".");
  const isGoogle = parts[0] === "google" && parts.length <= 3;
  const isResults = isGoogle && location.pathname.startsWith("/search");
  if (!isResults) return;

  let state = { active: false, hideGemini: false };

  function query() {
    try {
      return new URL(location.href).searchParams.get("q") || "";
    } catch {
      return "";
    }
  }

  function buildHeader() {
    if (document.getElementById("lockin-header")) return;
    const header = document.createElement("div");
    header.id = "lockin-header";
    header.innerHTML = `
      <div class="lk-brand">LOCK<span class="lk-slash">//</span>IN</div>
      <form class="lk-search" id="lk-form" role="search">
        <svg class="lk-mag" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
          <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"></line>
        </svg>
        <input id="lk-q" type="text" name="q" autocomplete="off" aria-label="Search" placeholder="Search the web" />
      </form>`;
    // documentElement always exists at document_start; the header is fixed-position.
    document.documentElement.appendChild(header);

    const form = header.querySelector("#lk-form");
    const input = header.querySelector("#lk-q");
    input.value = query();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = input.value.trim();
      if (q) location.href = "https://www.google.com/search?q=" + encodeURIComponent(q);
    });
  }

  function apply() {
    const root = document.documentElement;
    root.classList.toggle("lockin-locked", state.active);
    root.classList.toggle("lockin-hide-gemini", state.active && state.hideGemini);
    if (state.active) {
      buildHeader();
      const input = document.getElementById("lk-q");
      if (input && document.activeElement !== input) input.value = query();
    } else {
      document.getElementById("lockin-header")?.remove();
    }
  }

  function requestState() {
    try {
      chrome.runtime.sendMessage({ type: "get-filter-state" }, (r) => {
        if (chrome.runtime.lastError || !r) return;
        state = { active: !!r.active, hideGemini: !!r.hideGemini };
        apply();
      });
    } catch {
      /* extension context not ready */
    }
  }

  // Google can re-render its results region; keep our header present (debounced).
  let scheduled = false;
  new MutationObserver(() => {
    if (!state.active || scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      buildHeader();
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

  requestState();
  setInterval(requestState, 3000);
})();
