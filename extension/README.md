# LOCK//IN AI Companion Extension

Gives the desktop app real browser tab URLs and reliable tab control on Windows —
the same capability AppleScript provides on macOS. Works in any Chromium browser
(Chrome, Edge, Brave, **Vivaldi**) since they all support Chrome extensions.

## What it does

- Reports the active tab's real URL — plus whether **this** browser currently
  has OS focus — to the app over a localhost WebSocket (`ws://127.0.0.1:17372`),
  so site allow/deny works on Windows and the app always reads the browser
  you're actually looking at.
- **Multi-browser:** run it in Vivaldi *and* Chrome *and* Edge at once. Each
  connects independently; the app steers whichever browser has focus.
- During a focus session, **redirects new tabs** to the app's "nuh uh uh" page,
  and sends disallowed tabs there too — via `chrome.tabs`, no keystrokes.
- The blocked page's **search bar** runs through your **default search engine**
  (`chrome.search.query`), falling back to Google.

The extension reports tab state **always** so the app can show your current site
any time; it only redirects/steers while a focus session is active.

> **After changing extension files, reload it:** on `chrome://extensions`, click
> the reload (↻) icon on the LOCK//IN card. The service worker won't pick up
> edits to `background.js` / `manifest.json` / `search-inject.js` otherwise.

## Load it (development)

1. Open your browser's extensions page:
   - Vivaldi/Chrome/Brave: `chrome://extensions`
   - Edge: `edge://extensions`
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this `extension/` folder.
4. Make sure the desktop app is running, then watch its log for
   `[ext-bridge] extension connected & authed`.

## Security note (MVP)

The connection is bound to `127.0.0.1` and gated by a shared token
(`lockin-dev-token`) defined in both `background.js` and
`electron/extension-bridge.cjs`. For production, generate a per-install token in
the app and surface it on an extension options page instead of shipping a
constant.
