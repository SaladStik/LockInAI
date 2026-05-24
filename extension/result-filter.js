/**
 * Search-result filter — runs on any search engine's results page.
 *
 * During an active focus session it hides organic results whose destination
 * host isn't on the allow-list, so the user isn't tempted by links they can't
 * visit anyway. This is a UX layer on top of enforcement: if a result slips
 * through and gets clicked, the session's site-blocking still redirects it.
 *
 * Engine-agnostic: instead of per-engine selectors (brittle, and there are
 * dozens of engines + Google country TLDs), it recognizes the page as a search
 * engine by hostname, then hides any result-title link (a heading wrapped in or
 * wrapping an <a>) pointing to a disallowed host. The allow-list comes from the
 * service worker, which the app keeps in sync.
 */
(function () {
  const hn = location.hostname.toLowerCase();

  // Recognize the major search engines by their registrable domain — covers all
  // Google/Yahoo/Yandex country TLDs without matching impersonation domains
  // like "google.com.evil.com".
  const ENGINE_NAMES = new Set([
    "google", "bing", "duckduckgo", "yahoo", "yandex", "ecosia", "startpage",
    "qwant", "mojeek", "swisscows", "baidu", "kagi", "presearch", "naver",
  ]);
  // Common multi-part public suffixes, so we don't mistake "google.evil.com"
  // (suffix .com, registrable evil.com) for a real "google.co.uk".
  const TWO_PART_TLDS = new Set([
    "co.uk", "com.au", "co.jp", "co.in", "com.br", "co.nz", "com.mx", "co.za",
    "com.tr", "co.kr", "com.hk", "com.sg", "com.tw", "co.id", "com.ua", "co.il",
    "com.ar", "com.co", "com.ph", "com.my", "co.th", "com.vn", "co.uk",
  ]);
  /** The registrable name (e.g. "google" in google.co.uk), accounting for two-part TLDs. */
  function registrableName(h) {
    const labels = h.split(".");
    if (labels.length < 2) return null;
    const last2 = labels.slice(-2).join(".");
    if (TWO_PART_TLDS.has(last2) && labels.length >= 3) return labels[labels.length - 3];
    return labels[labels.length - 2];
  }
  function isSearchEngine(h) {
    const name = registrableName(h);
    if (name && ENGINE_NAMES.has(name)) return true;
    // brave is a search engine only at search.brave.com (brave.com is the browser).
    if (/(?:^|\.)search\.brave\.com$/.test(h)) return true;
    if (h.split(".").includes("searx")) return true;
    return false;
  }
  if (!isSearchEngine(hn)) return;

  const engineHost = hn.replace(/^www\./, "");
  let state = { active: false, allowedHosts: [] };

  function hostOf(href) {
    try {
      return new URL(href, location.href).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return null;
    }
  }

  function isAllowed(h) {
    if (!h) return true; // unparseable → don't hide
    // Never hide links back to the search engine itself (tabs, pagination…).
    if (h === engineHost || h.endsWith(`.${engineHost}`)) return true;
    return state.allowedHosts.some((a) => h === a || h.endsWith(`.${a}`));
  }

  function hide(el) {
    if (el && el.dataset.lockinHidden !== "1") {
      el.dataset.lockinHidden = "1";
      el.style.setProperty("display", "none", "important");
    }
  }

  // The container to collapse for a given result-title link, across engines.
  const CONTAINER_SELECTOR =
    'li, article, [class*="result" i], [data-testid*="result" i], .g, .b_algo, .MjjYud, .snippet';

  function filterAll() {
    if (!state.active) return;
    // Organic result titles are headings either wrapping an <a> (Bing-style) or
    // wrapped inside one (Google-style). Match both, then check the destination.
    document.querySelectorAll("a[href]").forEach((a) => {
      if (!/^https?:/i.test(a.href)) return;
      const isTitleLink = a.querySelector("h1,h2,h3,h4") || a.closest("h1,h2,h3,h4");
      if (!isTitleLink) return;
      if (isAllowed(hostOf(a.href))) return;
      hide(a.closest(CONTAINER_SELECTOR) || a.parentElement || a);
    });
  }

  function requestState() {
    try {
      chrome.runtime.sendMessage({ type: "get-filter-state" }, (resp) => {
        if (chrome.runtime.lastError || !resp) return;
        state = resp;
        filterAll();
      });
    } catch {
      /* extension context not ready */
    }
  }

  // Results render/append dynamically (and on infinite scroll), so re-filter on
  // DOM changes, debounced to a frame.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      filterAll();
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  requestState();
  // Session can toggle while the page is open — refresh the allow-list.
  setInterval(requestState, 3000);
})();
