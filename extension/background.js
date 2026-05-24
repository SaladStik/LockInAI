/**
 * LOCK//IN AI Companion — MV3 background service worker.
 *
 * Connects to the desktop app over a localhost WebSocket, then:
 *   • reports the active tab's real URL + whether THIS browser has focus, so
 *     the app reads the browser the user is actually looking at (the thing
 *     get-windows can't give us on Windows, and the key to multi-browser);
 *   • during a focus session, redirects new tabs to the app's "nuh uh uh"
 *     page; and
 *   • runs searches from that page using the user's default search engine
 *     (falling back to Google).
 *
 * Service workers get killed when idle, so we reconnect with backoff and use a
 * keep-alive alarm to wake the worker and re-establish the socket.
 */

const WS_URL = "ws://127.0.0.1:17372";
const TOKEN = "lockin-dev-token"; // must match electron/extension-bridge.cjs

let ws = null;
let authed = false;
let backoffMs = 500;
const MAX_BACKOFF_MS = 10000;

// Pushed by the app: whether a focus session is active and where the blocked
// page lives, so we can redirect new tabs to it.
let session = { active: false, blockedUrl: null };

function browserLabel() {
  try {
    const brands = navigator.userAgentData?.brands;
    if (Array.isArray(brands) && brands.length) {
      return brands.map((b) => b.brand).filter((b) => !/Not.?A.?Brand/i.test(b)).join("/");
    }
  } catch {}
  return (navigator.userAgent || "browser").slice(0, 60);
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }
  try {
    ws = new WebSocket(WS_URL);
  } catch {
    scheduleReconnect();
    return;
  }

  ws.onopen = () => {
    authed = false;
    ws.send(JSON.stringify({ type: "hello", token: TOKEN, browser: browserLabel() }));
  };

  ws.onmessage = (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }
    if (msg.type === "welcome") {
      authed = true;
      backoffMs = 500;
      reportTabs();
      return;
    }
    if (!authed) return;
    if (msg.type === "session") {
      session = { active: Boolean(msg.active), blockedUrl: msg.blockedUrl || null };
    } else if (msg.type === "navigate") {
      handleNavigate(msg);
    } else if (msg.type === "switch") {
      handleSwitch(msg);
    }
  };

  ws.onclose = () => {
    authed = false;
    scheduleReconnect();
  };
  ws.onerror = () => {
    try { ws.close(); } catch {}
  };
}

function scheduleReconnect() {
  setTimeout(connect, backoffMs);
  backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
}

function send(obj) {
  if (ws && ws.readyState === WebSocket.OPEN && authed) {
    try { ws.send(JSON.stringify(obj)); } catch {}
  }
}

/** Snapshot the focused window's tabs + whether this browser has OS focus. */
async function reportTabs() {
  if (!authed) return;
  try {
    const win = await chrome.windows.getLastFocused({ populate: true });
    if (!win || !Array.isArray(win.tabs)) return;
    const tabs = win.tabs.map((t) => ({
      id: t.id,
      url: t.url || t.pendingUrl || "",
      title: t.title || "",
      active: Boolean(t.active),
    }));
    const active = win.tabs.find((t) => t.active);
    send({
      type: "tabs",
      windowId: win.id,
      activeTabId: active ? active.id : null,
      focused: Boolean(win.focused), // does THIS browser currently hold focus?
      tabs,
    });
  } catch {
    /* window may be closing */
  }
}

async function handleNavigate(msg) {
  let ok = false;
  try {
    if (typeof msg.tabId === "number" && msg.url) {
      await chrome.tabs.update(msg.tabId, { url: msg.url });
      ok = true;
    }
  } catch {
    ok = false;
  }
  send({ type: "ack", cmdId: msg.cmdId, ok });
}

async function handleSwitch(msg) {
  let ok = false;
  try {
    if (typeof msg.tabId === "number") {
      const tab = await chrome.tabs.update(msg.tabId, { active: true });
      if (tab && typeof tab.windowId === "number") {
        await chrome.windows.update(tab.windowId, { focused: true });
      }
      ok = true;
    }
  } catch {
    ok = false;
  }
  send({ type: "ack", cmdId: msg.cmdId, ok });
}

// ---- New-tab redirect ----------------------------------------------------

// Browser "new tab" / start pages, plus blank. Real navigations (links, typed
// URLs) are NOT matched, so only genuinely-empty new tabs get redirected.
const NEW_TAB_RE =
  /^(about:(blank|newtab|home)|(chrome|edge|brave|vivaldi|opera|browser):\/\/(newtab|new-tab-page|startpage|start|new-tab)\/?)/i;

function isNewTabUrl(url) {
  if (!url) return true; // freshly created blank tab
  if (/^https?:\/\/127\.0\.0\.1:\d+\/blocked/i.test(url)) return false; // already the blocked page
  return NEW_TAB_RE.test(url);
}

function maybeRedirectNewTab(tabId, url) {
  if (!session.active || !session.blockedUrl) return;
  if (typeof tabId !== "number") return;
  if (isNewTabUrl(url)) {
    chrome.tabs.update(tabId, { url: session.blockedUrl }).catch(() => {});
  }
}

chrome.tabs.onCreated.addListener((tab) => {
  maybeRedirectNewTab(tab.id, tab.pendingUrl || tab.url || "");
  reportTabs();
});
chrome.tabs.onActivated.addListener(() => reportTabs());
chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.url) maybeRedirectNewTab(tabId, info.url);
  if (info.url || info.title || info.status === "complete") reportTabs();
});
chrome.tabs.onRemoved.addListener(() => reportTabs());
chrome.windows.onFocusChanged.addListener(() => reportTabs());

// ---- Default-engine search (from the blocked page) -----------------------

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== "lockin-search" || !msg.q) return;
  const q = String(msg.q);
  const tabId = sender.tab?.id;
  const googleFallback = () => {
    const g = "https://www.google.com/search?q=" + encodeURIComponent(q);
    if (typeof tabId === "number") chrome.tabs.update(tabId, { url: g }).catch(() => {});
  };
  try {
    if (chrome.search?.query) {
      const opts = typeof tabId === "number" ? { text: q, tabId } : { text: q, disposition: "CURRENT_TAB" };
      chrome.search.query(opts, () => {
        if (chrome.runtime.lastError) googleFallback();
      });
      return;
    }
  } catch {}
  googleFallback();
});

// ---- Lifecycle / keep-alive ----------------------------------------------

chrome.alarms.create("keepalive", { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener(() => {
  connect();
  reportTabs();
});
chrome.runtime.onStartup.addListener(() => connect());
chrome.runtime.onInstalled.addListener(() => connect());

connect();
