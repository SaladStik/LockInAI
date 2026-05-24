/**
 * Chrome DevTools Protocol tab manager (Windows parity with macOS AppleScript).
 *
 * macOS reads/sets browser tab URLs through AppleScript. Windows browsers
 * expose no such scripting bus, so we use the browser's *own* DevTools
 * Protocol instead — the sanctioned automation surface. It gives us the two
 * things UIA + keystrokes only approximated:
 *
 *   • real per-tab URLs (so site allow/deny actually works), and
 *   • deterministic switch / navigate (so restoration is reliable).
 *
 * Requirements: the browser must have been launched with
 * `--remote-debugging-port=<port>` (see managed-browser.cjs). Chromium 136+
 * also requires a non-default `--user-data-dir` for the port to open.
 * Vivaldi deliberately ignores the flag — it has no CDP endpoint.
 *
 * Dependency-free: the HTTP endpoints cover list/activate, and a tiny
 * built-in WebSocket client issues the single `Page.navigate` command.
 */
const http = require("node:http");
const net = require("node:net");
const crypto = require("node:crypto");

const HTTP_TIMEOUT_MS = 1500;
const WS_TIMEOUT_MS = 2500;

/** GET a DevTools HTTP endpoint and JSON-parse the body. */
function httpJson(port, path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { host: "127.0.0.1", port, path, timeout: HTTP_TIMEOUT_MS },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new Error(`HTTP ${res.statusCode} for ${path}`));
          }
          try {
            resolve(body ? JSON.parse(body) : null);
          } catch {
            // /json/activate returns a plain "Target activated" string.
            resolve(body);
          }
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
  });
}

/** Is a CDP endpoint live on this port? Returns the browser string or null. */
async function probe(port) {
  try {
    const v = await httpJson(port, "/json/version");
    return v?.Browser ?? null;
  } catch {
    return null;
  }
}

/**
 * List open page targets with their real URLs.
 * @returns {Promise<Array<{id,title,url,wsUrl}>>}
 */
async function listPages(port) {
  const targets = await httpJson(port, "/json");
  if (!Array.isArray(targets)) return [];
  return targets
    .filter((t) => t.type === "page" && typeof t.url === "string")
    .map((t) => ({
      id: t.id,
      title: t.title ?? "",
      url: t.url,
      wsUrl: t.webSocketDebuggerUrl ?? null,
    }));
}

/** Bring a tab to the foreground. Pure HTTP — no socket needed. */
async function activate(port, targetId) {
  try {
    await httpJson(port, `/json/activate/${targetId}`);
    return true;
  } catch (e) {
    console.error("[cdp-tabs] activate failed:", e?.message ?? e);
    return false;
  }
}

/**
 * Minimal CDP-over-WebSocket: open the socket, send one command, await the
 * matching reply, close. Sufficient for fire-one-command operations like
 * Page.navigate; we never need long-lived event subscriptions here.
 */
function sendCommand(wsUrl, method, params = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try { socket.destroy(); } catch {}
      fn(arg);
    };

    const u = new URL(wsUrl);
    const key = crypto.randomBytes(16).toString("base64");
    const socket = net.connect(Number(u.port), u.hostname);
    const timer = setTimeout(
      () => finish(reject, new Error("ws timeout")),
      WS_TIMEOUT_MS,
    );
    socket.on("error", (e) => finish(reject, e));

    let handshakeDone = false;
    let inBuf = Buffer.alloc(0);

    socket.on("connect", () => {
      socket.write(
        `GET ${u.pathname}${u.search} HTTP/1.1\r\n` +
          `Host: ${u.host}\r\n` +
          "Upgrade: websocket\r\n" +
          "Connection: Upgrade\r\n" +
          `Sec-WebSocket-Key: ${key}\r\n` +
          "Sec-WebSocket-Version: 13\r\n\r\n",
      );
    });

    socket.on("data", (chunk) => {
      inBuf = Buffer.concat([inBuf, chunk]);
      if (!handshakeDone) {
        const sep = inBuf.indexOf("\r\n\r\n");
        if (sep === -1) return;
        const head = inBuf.slice(0, sep).toString("ascii");
        if (!/HTTP\/1\.1 101/i.test(head)) {
          return finish(reject, new Error("ws handshake failed"));
        }
        handshakeDone = true;
        inBuf = inBuf.slice(sep + 4);
        // Send the command as a masked client text frame.
        socket.write(encodeTextFrame(JSON.stringify({ id: 1, method, params })));
      }
      // Parse server frames (server→client frames are never masked).
      let frame;
      while ((frame = decodeFrame(inBuf))) {
        inBuf = frame.rest;
        if (frame.opcode === 0x8) return finish(reject, new Error("ws closed"));
        if (frame.opcode === 0x1) {
          try {
            const msg = JSON.parse(frame.payload.toString("utf8"));
            if (msg.id === 1) {
              if (msg.error) return finish(reject, new Error(msg.error.message));
              return finish(resolve, msg.result ?? {});
            }
          } catch {
            /* ignore non-JSON / event frames */
          }
        }
      }
    });
  });
}

/** Encode a single masked text frame (payloads here are always small). */
function encodeTextFrame(text) {
  const payload = Buffer.from(text, "utf8");
  const len = payload.length;
  const mask = crypto.randomBytes(4);
  let header;
  if (len < 126) {
    header = Buffer.from([0x81, 0x80 | len]);
  } else if (len < 65536) {
    header = Buffer.from([0x81, 0x80 | 126, (len >> 8) & 0xff, len & 0xff]);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 0x80 | 127;
    header.writeUInt32BE(0, 2);
    header.writeUInt32BE(len, 6);
  }
  const masked = Buffer.alloc(len);
  for (let i = 0; i < len; i++) masked[i] = payload[i] ^ mask[i & 3];
  return Buffer.concat([header, mask, masked]);
}

/** Decode one server frame from buf, or null if not enough bytes yet. */
function decodeFrame(buf) {
  if (buf.length < 2) return null;
  const opcode = buf[0] & 0x0f;
  const masked = (buf[1] & 0x80) !== 0;
  let len = buf[1] & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < 4) return null;
    len = buf.readUInt16BE(2);
    offset = 4;
  } else if (len === 127) {
    if (buf.length < 10) return null;
    len = Number(buf.readBigUInt64BE(2));
    offset = 10;
  }
  const maskKey = masked ? buf.slice(offset, offset + 4) : null;
  if (masked) offset += 4;
  if (buf.length < offset + len) return null;
  let payload = buf.slice(offset, offset + len);
  if (masked) {
    payload = Buffer.from(payload);
    for (let i = 0; i < len; i++) payload[i] ^= maskKey[i & 3];
  }
  return { opcode, payload, rest: buf.slice(offset + len) };
}

/** Point a specific tab at a new URL. */
async function navigate(port, targetId, url) {
  const pages = await listPages(port);
  const page = pages.find((p) => p.id === targetId);
  if (!page?.wsUrl) return false;
  try {
    await sendCommand(page.wsUrl, "Page.navigate", { url });
    return true;
  } catch (e) {
    console.error("[cdp-tabs] navigate failed:", e?.message ?? e);
    return false;
  }
}

module.exports = { probe, listPages, activate, navigate };
