const http = require("node:http");

/**
 * Tiny HTTP server bound to 127.0.0.1 that serves the "blocked" page when
 * the user lands on a disallowed URL during a focus session. The page is
 * served BY THIS APP (Electron main process), not from any remote host.
 */

const PATH = "/blocked";

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
  const list = all.length
    ? all
        .map((host) => {
          const safe = escapeHtml(host);
          return `<a class="site" href="https://${safe}" rel="noreferrer">${safe}</a>`;
        })
        .join("")
    : '<p class="empty">No specific sites set.</p>';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>nuh uh uh · LOCK//IN AI</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; }
    body {
      background: radial-gradient(circle at 20% 20%, oklch(0.28 0.1 220 / 60%), transparent 55%),
                  radial-gradient(circle at 80% 80%, oklch(0.26 0.12 155 / 50%), transparent 55%),
                  oklch(0.1 0.02 250);
      color: oklch(0.95 0.02 250);
      font-family: -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Display", system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      overflow: hidden;
    }
    .grid {
      position: fixed; inset: 0; pointer-events: none; opacity: 0.04;
      background-image:
        linear-gradient(oklch(1 0 0) 1px, transparent 1px),
        linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .card {
      position: relative;
      width: 100%;
      max-width: 520px;
      padding: 36px 32px 32px;
      background: linear-gradient(160deg, oklch(0.16 0.025 250 / 0.92), oklch(0.08 0.02 250 / 0.92));
      border: 1px solid oklch(1 0 0 / 8%);
      border-radius: 28px;
      box-shadow: 0 30px 80px -20px oklch(0 0 0 / 0.7),
                  0 0 60px -10px oklch(0.6 0.16 220 / 0.25);
      text-align: center;
    }
    .lockie {
      width: 140px;
      height: 140px;
      margin: 0 auto 12px;
      filter: drop-shadow(0 0 24px oklch(0.6 0.16 220 / 0.5));
    }
    @keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
    @keyframes wag    { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
    .lockie         { animation: floaty 3.6s ease-in-out infinite; }
    .lockie .finger { transform-origin: 60% 70%; animation: wag 0.9s ease-in-out infinite; }
    h1 {
      margin: 8px 0 6px;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: oklch(0.95 0.05 220);
    }
    .sub {
      margin: 0 0 18px;
      font-size: 13px;
      color: oklch(0.7 0.04 250);
    }
    .label {
      font-family: ui-monospace, "SF Mono", monospace;
      font-size: 10px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: oklch(0.65 0.08 220);
      margin: 0 0 10px;
    }
    .sites {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-bottom: 18px;
    }
    .site {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid oklch(0.6 0.16 220 / 0.4);
      background: oklch(0.6 0.16 220 / 0.12);
      color: oklch(0.92 0.06 220);
      font-size: 12px;
      text-decoration: none;
      transition: all 0.18s ease;
    }
    .site:hover {
      background: oklch(0.6 0.16 220 / 0.25);
      border-color: oklch(0.7 0.18 220 / 0.65);
      transform: translateY(-1px);
    }
    .empty { color: oklch(0.6 0.04 250); font-size: 12px; }
    .search {
      display: flex;
      gap: 8px;
      margin: 4px auto 22px;
      max-width: 420px;
    }
    .search input {
      flex: 1;
      padding: 13px 16px;
      border-radius: 999px;
      border: 1px solid oklch(1 0 0 / 12%);
      background: oklch(0.12 0.02 250 / 0.8);
      color: oklch(0.95 0.02 250);
      font-size: 14px;
      outline: none;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }
    .search input::placeholder { color: oklch(0.55 0.03 250); }
    .search input:focus {
      border-color: oklch(0.7 0.18 220 / 0.7);
      box-shadow: 0 0 0 3px oklch(0.6 0.16 220 / 0.18);
    }
    .search button {
      padding: 13px 20px;
      border-radius: 999px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: oklch(0.12 0.03 250);
      background: linear-gradient(135deg, oklch(0.85 0.16 215), oklch(0.72 0.16 220));
      transition: transform 0.12s ease, filter 0.18s ease;
    }
    .search button:hover { filter: brightness(1.08); }
    .search button:active { transform: scale(0.97); }
    .search-hint {
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: oklch(0.5 0.04 250);
      margin: -14px 0 22px;
    }
    .footer {
      font-family: ui-monospace, "SF Mono", monospace;
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: oklch(0.5 0.04 250);
      margin: 14px 0 0;
    }
    .brand .slash { color: oklch(0.75 0.18 220); }
  </style>
</head>
<body>
  <div class="grid"></div>
  <div class="card">
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
      <!-- worried eyes -->
      <circle cx="40" cy="52" r="3.6" fill="oklch(0.12 0.03 250)" />
      <circle cx="60" cy="52" r="3.6" fill="oklch(0.12 0.03 250)" />
      <circle cx="41" cy="51" r="1.1" fill="oklch(1 0 0)" />
      <circle cx="61" cy="51" r="1.1" fill="oklch(1 0 0)" />
      <!-- mouth -->
      <path d="M44 67 Q50 62 56 67" stroke="oklch(0.12 0.03 250)" stroke-width="2.4" fill="none" stroke-linecap="round" />
      <!-- wagging finger -->
      <g class="finger">
        <line x1="78" y1="40" x2="86" y2="22" stroke="oklch(0.85 0.16 215)" stroke-width="3.4" stroke-linecap="round" />
        <circle cx="86" cy="22" r="3" fill="oklch(0.95 0.1 210)" />
      </g>
    </svg>
    <p class="label">access denied</p>
    <h1>nuh uh uh</h1>
    <p class="sub">You're locked in. Stick to your allowed sites.</p>

    <form id="lockin-search" class="search" action="https://www.google.com/search" method="get" role="search">
      <input type="text" name="q" placeholder="Search the web…" autocomplete="off" autofocus aria-label="Search" />
      <button type="submit">Search</button>
    </form>
    <p class="search-hint">searches your default engine · google fallback</p>

    <p class="label">allowed sites</p>
    <div class="sites">${list}</div>

    <p class="footer brand">LOCK<span class="slash">//</span>IN AI · focus mode</p>
  </div>
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
      resolve({ port, url: `http://127.0.0.1:${port}${PATH}`, server });
    });
  });
}

module.exports = { start };
