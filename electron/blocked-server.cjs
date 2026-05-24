const http = require("node:http");

/**
 * Tiny HTTP server bound to 127.0.0.1 that serves LOCK//IN's new-tab page.
 * During a focus session the companion extension redirects new/blank tabs here
 * (and sends disallowed tabs here too). The page is served BY THIS APP
 * (Electron main process), not from any remote host.
 *
 * It's designed to feel like a calm, useful new tab: a clock + greeting, a
 * search bar (default engine via the extension, Google fallback), and the
 * user's approved sites as quick-launch shortcuts.
 */

const PATH = "/blocked";
const INSTALL_PATH = "/install";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPage({ allowedSites, alwaysAllowed }) {
  const sites = (allowedSites || []).slice(0, 40).map((s) => String(s).slice(0, 64));
  const always = (alwaysAllowed || []).slice(0, 10).map((s) => String(s).slice(0, 64));
  const all = [...always, ...sites.filter((s) => !always.includes(s.toLowerCase()))];

  const tiles = all.length
    ? all
        .map((host) => {
          const safe = escapeHtml(host);
          const letter = escapeHtml((host.trim()[0] || "?").toUpperCase());
          const fav = `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;
          return `<a class="tile" href="https://${safe}" rel="noreferrer">
        <span class="ico">
          <img src="${fav}" alt="" loading="lazy" referrerpolicy="no-referrer"
               onerror="this.closest('.ico').classList.add('noimg')" />
          <b>${letter}</b>
        </span>
        <span class="name">${safe}</span>
      </a>`;
        })
        .join("")
    : `<p class="empty">No approved sites yet — add some in the app.</p>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Tab</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; }
    body {
      background:
        radial-gradient(circle at 18% 12%, oklch(0.30 0.1 220 / 45%), transparent 55%),
        radial-gradient(circle at 85% 88%, oklch(0.28 0.12 155 / 38%), transparent 55%),
        oklch(0.11 0.02 250);
      color: oklch(0.95 0.02 250);
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
    }
    .grid {
      position: fixed; inset: 0; pointer-events: none; opacity: 0.04;
      background-image:
        linear-gradient(oklch(1 0 0) 1px, transparent 1px),
        linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px);
      background-size: 64px 64px;
    }
    .wrap {
      position: relative;
      width: 100%;
      max-width: 660px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 30px;
    }
    @keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
    .lockie {
      width: 92px;
      height: 92px;
      filter: drop-shadow(0 0 26px oklch(0.6 0.16 220 / 0.5));
      animation: floaty 3.8s ease-in-out infinite;
    }
    .top { text-align: center; }
    .clock {
      font-size: 66px;
      font-weight: 300;
      letter-spacing: 0.01em;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      color: oklch(0.97 0.02 230);
      text-shadow: 0 0 40px oklch(0.6 0.16 220 / 0.25);
    }
    .meta {
      margin-top: 10px;
      font-size: 13px;
      letter-spacing: 0.05em;
      color: oklch(0.68 0.04 250);
    }
    .search { position: relative; width: 100%; max-width: 560px; }
    .search .mag {
      position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
      width: 18px; height: 18px; opacity: 0.55; pointer-events: none;
    }
    .search input {
      width: 100%;
      padding: 17px 22px 17px 52px;
      border-radius: 999px;
      border: 1px solid oklch(1 0 0 / 10%);
      background: oklch(0.16 0.02 250 / 0.85);
      color: oklch(0.96 0.02 250);
      font-size: 16px;
      outline: none;
      box-shadow: 0 14px 44px -18px oklch(0 0 0 / 0.65);
      transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
    }
    .search input::placeholder { color: oklch(0.55 0.03 250); }
    .search input:focus {
      border-color: oklch(0.7 0.18 220 / 0.7);
      background: oklch(0.18 0.02 250 / 0.95);
      box-shadow: 0 14px 48px -16px oklch(0.6 0.16 220 / 0.4);
    }
    .shortcuts {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px 24px;
      max-width: 620px;
    }
    .tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 9px;
      width: 78px;
      text-decoration: none;
      color: oklch(0.82 0.03 250);
      transition: transform 0.14s ease;
    }
    .tile:hover { transform: translateY(-2px); }
    .tile:hover .name { color: oklch(0.95 0.04 220); }
    .ico {
      position: relative;
      display: grid;
      place-items: center;
      width: 58px; height: 58px;
      border-radius: 18px;
      background: oklch(0.20 0.025 250 / 0.85);
      border: 1px solid oklch(1 0 0 / 8%);
      box-shadow: 0 10px 26px -14px oklch(0 0 0 / 0.6);
      overflow: hidden;
    }
    .ico img { width: 28px; height: 28px; border-radius: 6px; }
    .ico b { display: none; font-size: 22px; font-weight: 600; color: oklch(0.9 0.1 215); }
    .ico.noimg img { display: none; }
    .ico.noimg b { display: block; }
    .name {
      font-size: 12px;
      max-width: 78px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty { color: oklch(0.6 0.04 250); font-size: 13px; }
    .foot {
      margin-top: 4px;
      font-family: ui-monospace, "SF Mono", monospace;
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: oklch(0.45 0.04 250);
    }
    .foot .slash { color: oklch(0.7 0.18 220); }
  </style>
</head>
<body>
  <div class="grid"></div>
  <main class="wrap">
    <svg class="lockie" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="bodyGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="oklch(0.95 0.1 210)" />
          <stop offset="55%" stop-color="oklch(0.82 0.16 220)" />
          <stop offset="100%" stop-color="oklch(0.5 0.14 235)" />
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stop-color="oklch(0.85 0.16 215 / 0.55)" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#glow)" />
      <circle cx="50" cy="50" r="34" fill="url(#bodyGrad)" stroke="oklch(0.85 0.16 215)" stroke-width="1" />
      <ellipse cx="40" cy="38" rx="12" ry="7" fill="oklch(1 0 0 / 0.55)" />
      <!-- happy eyes -->
      <circle cx="40" cy="51" r="3.6" fill="oklch(0.12 0.03 250)" />
      <circle cx="60" cy="51" r="3.6" fill="oklch(0.12 0.03 250)" />
      <circle cx="41" cy="50" r="1.1" fill="oklch(1 0 0)" />
      <circle cx="61" cy="50" r="1.1" fill="oklch(1 0 0)" />
      <!-- gentle smile -->
      <path d="M42 60 Q50 68 58 60" stroke="oklch(0.12 0.03 250)" stroke-width="2.4" fill="none" stroke-linecap="round" />
    </svg>
    <header class="top">
      <div class="clock" id="clock">--:--</div>
      <div class="meta"><span id="greeting">Hello</span> · <span id="date"></span></div>
    </header>

    <form id="lockin-search" class="search" action="https://www.google.com/search" method="get" role="search">
      <svg class="mag" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      <input type="text" name="q" placeholder="Search the web" autocomplete="off" autofocus aria-label="Search" />
    </form>

    <section class="shortcuts">${tiles}</section>

    <footer class="foot"><span>LOCK<span class="slash">//</span>IN</span> · focus mode</footer>
  </main>

  <script>
    (function () {
      var clock = document.getElementById("clock");
      var greeting = document.getElementById("greeting");
      var dateEl = document.getElementById("date");
      function tick() {
        var d = new Date();
        clock.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        var h = d.getHours();
        greeting.textContent = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
        dateEl.textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
      }
      tick();
      setInterval(tick, 1000);
    })();
  </script>
</body>
</html>`;
}

function renderInstallPage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Install LOCK//IN AI Companion</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; min-height: 100%; }
  body {
    background: radial-gradient(circle at 20% 20%, oklch(0.28 0.1 220 / 60%), transparent 55%),
                radial-gradient(circle at 80% 80%, oklch(0.26 0.12 155 / 50%), transparent 55%),
                oklch(0.1 0.02 250);
    color: oklch(0.95 0.02 250);
    font-family: -apple-system, BlinkMacSystemFont, "Inter", system-ui, sans-serif;
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 32px;
  }
  .card {
    width: 100%; max-width: 580px;
    background: linear-gradient(160deg, oklch(0.16 0.025 250 / 0.92), oklch(0.08 0.02 250 / 0.92));
    border: 1px solid oklch(1 0 0 / 8%);
    border-radius: 28px;
    padding: 32px;
    box-shadow: 0 30px 80px -20px oklch(0 0 0 / 0.7),
                0 0 60px -10px oklch(0.6 0.16 220 / 0.25);
  }
  h1 { margin: 0 0 6px; font-size: 26px; letter-spacing: -0.01em; }
  .label { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: oklch(0.65 0.08 220); margin: 0 0 12px; }
  p { color: oklch(0.72 0.04 250); font-size: 13px; line-height: 1.55; margin: 0 0 12px; }
  .browser { font-family: ui-monospace, monospace; font-size: 12px; color: oklch(0.95 0.05 220); padding: 4px 10px; border-radius: 999px; background: oklch(0.6 0.16 220 / 0.15); border: 1px solid oklch(0.6 0.16 220 / 0.4); display: inline-block; }
  ol { padding-left: 18px; color: oklch(0.85 0.03 250); font-size: 13px; line-height: 1.7; }
  ol code { background: oklch(1 0 0 / 0.06); padding: 2px 6px; border-radius: 5px; font-family: ui-monospace, monospace; font-size: 12px; }
  .urlrow { display: flex; align-items: center; gap: 8px; margin: 14px 0 6px; }
  .urlbox { flex: 1; min-width: 0; padding: 10px 14px; border-radius: 12px; background: oklch(1 0 0 / 0.04); border: 1px solid oklch(1 0 0 / 0.08); font-family: ui-monospace, monospace; font-size: 13px; color: oklch(0.95 0.05 220); user-select: all; overflow-x: auto; white-space: nowrap; }
  .cta { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 12px; background: oklch(0.6 0.16 220); color: oklch(0.1 0.02 250); font-weight: 600; text-decoration: none; border: 0; cursor: pointer; font-family: inherit; }
  .cta:hover { background: oklch(0.66 0.18 220); }
  .cta:disabled { opacity: 0.6; cursor: default; }
  .why { font-size: 11px; color: oklch(0.55 0.04 250); margin: 0 0 6px; }
  .muted { font-size: 11px; color: oklch(0.55 0.04 250); margin-top: 16px; }
</style>
</head>
<body>
  <div class="card">
    <p class="label">install the companion extension</p>
    <h1 id="title">Detecting your browser…</h1>
    <p id="intro">We need a tiny extension installed so Lockie can see your tabs and gently steer you back during a focus session.</p>

    <p class="why" id="why">Browsers block sites from linking to internal pages (like <code>chrome://extensions</code>). Copy the URL below and paste it into your address bar.</p>

    <div class="urlrow">
      <div class="urlbox" id="urlBox">—</div>
      <button id="copyBtn" class="cta" type="button">Copy</button>
    </div>

    <ol id="steps" style="margin-top: 18px;">
      <li>Paste the URL above into your address bar and press Enter.</li>
      <li>Toggle <strong>Developer mode</strong> (top-right of the extensions page).</li>
      <li>Click <strong>Load unpacked</strong>.</li>
      <li>Select the <code>extension</code> folder revealed in your file browser.</li>
      <li>Switch back to LOCK//IN — the popup will say <em>extension connected</em>.</li>
    </ol>
    <p class="muted">Browser detected: <span id="browserName" class="browser">—</span></p>
  </div>
<script>
  (function () {
    var ua = navigator.userAgent;
    function detect() {
      if (/Edg\\//.test(ua))     return { name: "Microsoft Edge", url: "edge://extensions/" };
      if (/OPR\\//.test(ua) || /Opera/.test(ua)) return { name: "Opera", url: "opera://extensions/" };
      if (/Brave/.test(ua) || (navigator.brave && navigator.brave.isBrave)) return { name: "Brave", url: "brave://extensions/" };
      if (/Vivaldi/.test(ua))    return { name: "Vivaldi", url: "vivaldi://extensions/" };
      if (/Arc/.test(ua))        return { name: "Arc", url: "chrome://extensions/" };
      if (/Firefox/.test(ua))    return { name: "Firefox", url: "about:debugging#/runtime/this-firefox", firefox: true };
      if (/Safari/.test(ua) && !/Chrome/.test(ua)) return { name: "Safari", url: null, safari: true };
      if (/Chrome/.test(ua))     return { name: "Chrome", url: "chrome://extensions/" };
      return { name: "Unknown browser", url: "chrome://extensions/" };
    }
    var b = detect();
    document.getElementById("browserName").textContent = b.name;
    var title = document.getElementById("title");
    var urlBox = document.getElementById("urlBox");
    var copyBtn = document.getElementById("copyBtn");
    var why = document.getElementById("why");
    var steps = document.getElementById("steps");

    if (b.safari) {
      title.textContent = "Safari isn't supported";
      document.getElementById("intro").textContent = "The companion extension is built for Chromium-based browsers. Set Chrome, Edge, Brave, Arc or Vivaldi as your default to use Lockie's full focus features.";
      urlBox.parentElement.style.display = "none";
      why.style.display = "none";
      steps.style.display = "none";
      return;
    }
    title.textContent = "Install in " + b.name;
    urlBox.textContent = b.url;

    if (b.firefox) {
      // Firefox lets you click http→about: links, no need to copy.
      why.textContent = "Click the link below to open Firefox's debug page.";
      urlBox.style.cursor = "pointer";
      urlBox.addEventListener("click", function () { location.href = b.url; });
      copyBtn.textContent = "Open page";
      copyBtn.addEventListener("click", function () { location.href = b.url; });
      steps.innerHTML = "<li>Click <strong>Load Temporary Add-on</strong>.</li><li>Select <code>extension/manifest.json</code> from the file browser window we opened.</li><li>Switch back to LOCK//IN — the popup will say <em>extension connected</em>.</li>";
      return;
    }

    copyBtn.addEventListener("click", async function () {
      try {
        await navigator.clipboard.writeText(b.url);
        var t = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.disabled = true;
        setTimeout(function () { copyBtn.textContent = t; copyBtn.disabled = false; }, 1400);
      } catch (e) {
        // Fallback for older browsers
        var range = document.createRange();
        range.selectNodeContents(urlBox);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand("copy");
      }
    });
  })();
</script>
</body>
</html>`;
}

function start({ alwaysAllowed = [] } = {}) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url) {
        res.writeHead(404).end();
        return;
      }
      const parsed = new URL(req.url, "http://127.0.0.1");
      if (parsed.pathname === INSTALL_PATH) {
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        });
        res.end(renderInstallPage());
        return;
      }
      if (parsed.pathname !== PATH) {
        res.writeHead(404, { "Content-Type": "text/plain" }).end("not found");
        return;
      }
      let sites = [];
      try {
        const raw = parsed.searchParams.get("sites");
        if (raw) sites = JSON.parse(raw);
      } catch {
        /* fall through with empty list */
      }
      const html = renderPage({ allowedSites: sites, alwaysAllowed });
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(html);
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        port,
        url: `http://127.0.0.1:${port}${PATH}`,
        installUrl: `http://127.0.0.1:${port}${INSTALL_PATH}`,
        server,
      });
    });
  });
}

module.exports = { start };
