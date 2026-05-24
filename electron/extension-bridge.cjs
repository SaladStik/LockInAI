/**
 * Companion-extension bridge (multi-browser).
 *
 * macOS reads/sets browser tab URLs through AppleScript. Windows browsers
 * (Vivaldi especially) expose no such bus and block CDP, so the only reliable
 * way to see real tab URLs and steer tabs is from *inside* the browser — a
 * WebExtension. This is the app-side endpoint it talks to.
 *
 * Transport: a localhost-only WebSocket server, token-gated so a random web
 * page can't drive the browser. Multiple browsers can connect at once (each
 * runs its own extension instance). Each connection reports whether *its*
 * browser currently holds OS focus, so the app always reads/steers the browser
 * the user is actually looking at — no name matching, no guessing.
 *
 * The extension reports tab state *always* (so the app can show the current
 * site any time); the app only issues steering commands during a focus session.
 */
const { WebSocketServer } = require("ws");

// Fixed port so the packaged extension knows where to connect without
// discovery. Collisions fail the listen() gracefully.
const DEFAULT_PORT = 17372;
// MVP shared secret. For production, generate per-install and surface it in the
// extension's options page instead of shipping a constant.
const DEFAULT_TOKEN = "lockin-dev-token";

const COMMAND_TIMEOUT_MS = 1500;

function createBridge() {
  let wss = null;
  // socket -> { browser, focused, state, lastSeq }
  const conns = new Map();
  let onStateChange = null;
  let lastSession = null; // { active, blockedUrl }
  let cmdSeq = 0;
  const pending = new Map(); // cmdId -> { resolve, timer }
  let seenSeq = 0; // monotonic, to break focus ties by recency

  function start({ port = DEFAULT_PORT, token = DEFAULT_TOKEN, onState } = {}) {
    onStateChange = typeof onState === "function" ? onState : null;
    return new Promise((resolve, reject) => {
      try {
        wss = new WebSocketServer({ host: "127.0.0.1", port });
      } catch (e) {
        return reject(e);
      }
      wss.on("error", (e) => {
        console.error("[ext-bridge] server error:", e?.message ?? e);
        reject(e);
      });
      wss.on("listening", () => {
        console.log(`[ext-bridge] listening on ws://127.0.0.1:${port}`);
        resolve({ port });
      });
      wss.on("connection", (socket) => handleConnection(socket, token));
    });
  }

  function handleConnection(socket, token) {
    let authed = false;
    const authTimer = setTimeout(() => {
      if (!authed) socket.close(4001, "auth timeout");
    }, 3000);

    socket.on("message", (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (!authed) {
        if (msg.type === "hello" && msg.token === token) {
          authed = true;
          clearTimeout(authTimer);
          const browser = String(msg.browser || "browser").slice(0, 60);
          conns.set(socket, { browser, focused: false, state: null, lastSeq: 0 });
          socket.send(JSON.stringify({ type: "welcome" }));
          if (lastSession) socket.send(JSON.stringify({ type: "session", ...lastSession }));
          console.log(`[ext-bridge] connected & authed: ${browser} (${conns.size} total)`);
        } else {
          socket.close(4003, "bad token");
        }
        return;
      }

      const conn = conns.get(socket);
      if (!conn) return;

      switch (msg.type) {
        case "tabs":
          conn.state = {
            activeTabId: msg.activeTabId ?? null,
            windowId: msg.windowId ?? null,
            tabs: Array.isArray(msg.tabs) ? msg.tabs : [],
          };
          conn.focused = Boolean(msg.focused);
          conn.lastSeq = ++seenSeq;
          if (onStateChange) {
            try { onStateChange(getActiveTab()); } catch (e) {
              console.error("[ext-bridge] onState error:", e?.message ?? e);
            }
          }
          break;
        case "ack": {
          const p = pending.get(msg.cmdId);
          if (p) {
            clearTimeout(p.timer);
            pending.delete(msg.cmdId);
            p.resolve(Boolean(msg.ok));
          }
          break;
        }
        default:
          break;
      }
    });

    socket.on("close", () => {
      clearTimeout(authTimer);
      const conn = conns.get(socket);
      conns.delete(socket);
      if (conn) console.log(`[ext-bridge] disconnected: ${conn.browser} (${conns.size} left)`);
    });
    socket.on("error", () => {});
  }

  /** The connection for the browser that currently holds OS focus, if any. */
  function focusedConn() {
    let best = null;
    for (const conn of conns.values()) {
      if (conn.focused && conn.state) {
        if (!best || conn.lastSeq > best.lastSeq) best = conn;
      }
    }
    return best;
  }

  function isConnected() {
    return conns.size > 0;
  }

  /** Active tab of the focused browser, or null. */
  function getActiveTab() {
    const conn = focusedConn();
    if (!conn?.state) return null;
    const { tabs, activeTabId, windowId } = conn.state;
    const active =
      tabs.find((t) => t.id === activeTabId) || tabs.find((t) => t.active) || null;
    return active
      ? { tabId: active.id, url: active.url ?? null, title: active.title ?? "", windowId, browser: conn.browser }
      : null;
  }

  /** Send a command to a specific socket and await its ack (best-effort). */
  function commandTo(socket, type, payload = {}) {
    return new Promise((resolve) => {
      if (!socket || socket.readyState !== 1) return resolve(false);
      const cmdId = ++cmdSeq;
      const timer = setTimeout(() => {
        pending.delete(cmdId);
        resolve(false);
      }, COMMAND_TIMEOUT_MS);
      pending.set(cmdId, { resolve, timer });
      try {
        socket.send(JSON.stringify({ type, cmdId, ...payload }));
      } catch {
        clearTimeout(timer);
        pending.delete(cmdId);
        resolve(false);
      }
    });
  }

  /** Find the socket for a connection object. */
  function socketFor(conn) {
    for (const [sock, c] of conns.entries()) if (c === conn) return sock;
    return null;
  }

  function navigateTab(tabId, url) {
    const conn = focusedConn();
    return conn ? commandTo(socketFor(conn), "navigate", { tabId, url }) : Promise.resolve(false);
  }

  function switchTab(tabId) {
    const conn = focusedConn();
    return conn ? commandTo(socketFor(conn), "switch", { tabId }) : Promise.resolve(false);
  }

  /** Push focus-session state (active, blocked-page URL, allowed hosts, gemini pref) to every browser. */
  function broadcastSession({ active, blockedUrl, allowedHosts, hideGemini }) {
    lastSession = {
      active: Boolean(active),
      blockedUrl: blockedUrl ?? null,
      allowedHosts: Array.isArray(allowedHosts) ? allowedHosts : [],
      hideGemini: Boolean(hideGemini),
    };
    const payload = JSON.stringify({ type: "session", ...lastSession });
    for (const socket of conns.keys()) {
      if (socket.readyState === 1) {
        try { socket.send(payload); } catch {}
      }
    }
  }

  function stop() {
    for (const { timer } of pending.values()) clearTimeout(timer);
    pending.clear();
    try { wss?.close(); } catch {}
    wss = null;
    conns.clear();
    lastSession = null;
  }

  return {
    start,
    stop,
    isConnected,
    getActiveTab,
    navigateTab,
    switchTab,
    broadcastSession,
    connectionCount: () => conns.size,
    DEFAULT_PORT,
    DEFAULT_TOKEN,
  };
}

module.exports = { createBridge, DEFAULT_PORT, DEFAULT_TOKEN };
