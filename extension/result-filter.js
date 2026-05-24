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

  // --- LOCK//IN AI badge (built via DOM so Trusted-Types CSP can't reject it) ---
  function svgEl(tag, attrs) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function lockieSvg() {
    const svg = svgEl("svg", { viewBox: "0 0 100 100", width: "24", height: "24" });
    const glow = svgEl("circle", { cx: 50, cy: 50, r: 46, fill: "rgba(110,200,240,0.25)" });
    const body = svgEl("circle", { cx: 50, cy: 50, r: 34, fill: "#5bc8e6", stroke: "#cfeeff", "stroke-width": 2 });
    const shine = svgEl("ellipse", { cx: 40, cy: 38, rx: 11, ry: 6, fill: "rgba(255,255,255,0.55)" });
    const eyeL = svgEl("circle", { cx: 41, cy: 50, r: 3.8, fill: "#0b1a22" });
    const eyeR = svgEl("circle", { cx: 59, cy: 50, r: 3.8, fill: "#0b1a22" });
    const smile = svgEl("path", { d: "M41 60 Q50 69 59 60", stroke: "#0b1a22", "stroke-width": 2.6, fill: "none", "stroke-linecap": "round" });
    svg.append(glow, body, shine, eyeL, eyeR, smile);
    return svg;
  }
  function mountBadge() {
    const b = document.createElement("div");
    b.id = "lockin-badge";
    Object.assign(b.style, {
      position: "fixed", top: "12px", left: "12px", zIndex: "2147483647",
      display: "flex", alignItems: "center", gap: "7px",
      padding: "5px 12px 5px 6px", borderRadius: "999px",
      background: "rgba(10,18,28,0.82)", color: "#def3ff",
      fontFamily: "-apple-system,BlinkMacSystemFont,Inter,system-ui,sans-serif",
      fontSize: "11px", fontWeight: "700", letterSpacing: "0.14em",
      textTransform: "uppercase", lineHeight: "1",
      boxShadow: "0 6px 22px rgba(0,0,0,0.45)",
      border: "1px solid rgba(120,200,255,0.28)",
      pointerEvents: "none", userSelect: "none",
    });
    const span = document.createElement("span");
    span.textContent = "LOCK//IN AI";
    b.append(lockieSvg(), span);
    (document.body || document.documentElement).appendChild(b);
  }
  function updateBadge() {
    const existing = document.getElementById("lockin-badge");
    if (state.active && !existing) mountBadge();
    else if (!state.active && existing) existing.remove();
  }

  function filterAll() {
    updateBadge();
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
