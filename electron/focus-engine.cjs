const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { systemPreferences } = require("electron");
const {
  isAllowedFocusApp,
  isBrowserSnapshot,
  allowedHostsFor,
} = require("./app-match.cjs");
const winTabs = require("./win-tabs.cjs");
const { createFocusWindow } = require("./focus-window.cjs");

const execFileAsync = promisify(execFile);
const OSASCRIPT_TIMEOUT_MS = 2000;
const RESTORE_COOLDOWN_MS = 1200;

const OUR_APP_NAMES = new Set(["Electron", "LOCK//IN AI", "lockin-ai", "LOCKIN AI"]);

/**
 * The focus-protection engine: owns the focus-session state, polls the OS for
 * the active window (augmented by the companion extension's real tab URL), and
 * gently snaps focus / tabs back to allowed targets during a session.
 *
 * Built as a factory so it can close over its own state and the injected
 * dependencies (the extension bridge + a blocked-page URL builder) without
 * leaking module-level globals.
 */
function createFocusEngine({ extBridge, isDev, blockedPageUrlFor }) {
  const { focusWindowById, navigateActiveTab } = createFocusWindow();

  let lastSnapshot = null;
  let lastError = null;
  let focusSession = {
    active: false,
    allowedApps: [],
    allowedSites: [],
    extraAlwaysAllowed: [],
  };
  // Captured at session start so the app the user was in *before* locking in
  // doesn't count as a breach until they actually switch to it again.
  let sessionStartGraceKey = null;
  let lastAllowedWindowId = null; // Windows HWND
  let lastAllowedAppName = null; // macOS app name (for osascript fallback)
  let lastAllowedUrl = null; // for browser tab restoration (macOS)
  let lastAllowedTitle = null; // for Windows tab restoration (UIA exposes title, not URL)
  let lastRestoreAt = 0;

  let activeWindowFn = null;
  let openWindowsFn = null;
  async function getWindowsModule() {
    if (!activeWindowFn) {
      const mod = await import("get-windows");
      activeWindowFn = mod.activeWindow;
      openWindowsFn = mod.openWindows;
    }
    return { activeWindow: activeWindowFn, openWindows: openWindowsFn };
  }

  function isOurApp(info) {
    const name = info.owner?.name ?? "";
    if (OUR_APP_NAMES.has(name)) return true;
    const exe = (info.owner?.path ?? "").toLowerCase();
    return exe.includes("lockin") || (isDev && exe.includes("electron.exe"));
  }

  async function runOsascript(script) {
    try {
      const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script], {
        timeout: OSASCRIPT_TIMEOUT_MS,
      });
      return { ok: true, stdout: String(stdout ?? "") };
    } catch (e) {
      return { ok: false, error: e };
    }
  }

  // Windows-only fallback for steering a browser tab when the companion
  // extension isn't connected (keystroke-driven address-bar navigation). macOS
  // has no fallback — it relies on the extension, the primary path on both OSes.
  async function restoreBrowserTab(_appName, targetUrl, windowId = null) {
    if (!targetUrl) return false;
    if (process.platform === "win32") {
      if (!windowId) return false;
      try {
        return await navigateActiveTab(windowId, targetUrl);
      } catch (e) {
        console.error("[focus] win32 tab nav error:", e?.message ?? e);
        return false;
      }
    }
    return false;
  }

  function snapshotFromInfo(info) {
    return {
      app: info.owner.name,
      title: info.title ?? "",
      url: info.url ?? null,
      bundleId: info.owner?.bundleId ?? null,
      path: info.owner?.path ?? null,
      windowId: typeof info.id === "number" ? info.id : null,
    };
  }

  async function activateMacApp(appName) {
    if (process.platform !== "darwin" || !appName) return false;
    const safe = appName.replace(/"/g, '\\"');
    const r = await runOsascript(`tell application "${safe}" to activate`);
    if (!r.ok) console.error("[focus] activate error:", r.error?.message);
    return r.ok;
  }

  async function refocusLastAllowed() {
    // Windows: bring the specific HWND back to the foreground.
    if (lastAllowedWindowId && focusWindowById(lastAllowedWindowId)) {
      return { windowId: lastAllowedWindowId, refocused: null };
    }
    // macOS: activate the app by name via osascript.
    if (process.platform === "darwin" && lastAllowedAppName) {
      if (await activateMacApp(lastAllowedAppName)) {
        return { windowId: null, refocused: lastAllowedAppName };
      }
    }
    // Fallback: enumerate open windows and pick any allowed one.
    try {
      const { openWindows } = await getWindowsModule();
      const windows = await openWindows();
      for (const w of windows) {
        if (!w?.owner?.name || isOurApp(w)) continue;
        const snap = snapshotFromInfo(w);
        if (
          !isAllowedFocusApp(
            snap,
            focusSession.allowedApps,
            focusSession.allowedSites,
            focusSession.extraAlwaysAllowed,
          )
        )
          continue;
        if (typeof w.id === "number" && focusWindowById(w.id)) {
          lastAllowedWindowId = w.id;
          return { windowId: w.id, refocused: null };
        }
        if (process.platform === "darwin" && (await activateMacApp(snap.app))) {
          lastAllowedAppName = snap.app;
          return { windowId: null, refocused: snap.app };
        }
      }
    } catch (e) {
      console.error("[focus] enumerate error:", e?.message);
    }
    return null;
  }

  /** State for the active-app:get IPC handler. */
  function getActiveApp() {
    return { snapshot: lastSnapshot, error: lastError };
  }

  /** Apply a focus-session:sync payload from the renderer and broadcast it. */
  function syncSession(payload) {
    const wasActive = focusSession.active;
    focusSession = {
      active: Boolean(payload?.active),
      allowedApps: Array.isArray(payload?.allowedApps) ? payload.allowedApps : [],
      allowedSites: Array.isArray(payload?.allowedSites) ? payload.allowedSites : [],
      extraAlwaysAllowed: Array.isArray(payload?.extraAlwaysAllowed)
        ? payload.extraAlwaysAllowed
        : [],
      hideGemini: Boolean(payload?.hideGemini),
    };
    if (focusSession.active && !wasActive) {
      // Grace the current snapshot — don't penalize the user for an app they
      // already had open before they clicked Lock In.
      sessionStartGraceKey = lastSnapshot
        ? `${lastSnapshot.app}|${lastSnapshot.url ?? ""}`
        : null;
      // If they already had a browser tab open on a disallowed URL, navigate it
      // to a clean slate so they can start working without it counting as a
      // breach. Fire-and-forget — graceKey prevents breach if the nav lags.
      if (lastSnapshot) {
        const isBrowser = isBrowserSnapshot(lastSnapshot);
        const allowedNow = isAllowedFocusApp(
          lastSnapshot,
          focusSession.allowedApps,
          focusSession.allowedSites,
          focusSession.extraAlwaysAllowed,
        );
        if (isBrowser && !allowedNow) {
          const blocked = blockedPageUrlFor(focusSession.allowedSites);
          const extTab = extBridge.isConnected() ? extBridge.getActiveTab() : null;
          if (extTab && typeof extTab.tabId === "number") {
            // Extension path (macOS + Windows).
            extBridge.navigateTab(extTab.tabId, blocked).catch(() => {});
          } else {
            // Windows keystroke fallback.
            restoreBrowserTab(
              lastSnapshot.app,
              blocked,
              lastSnapshot.windowId,
            ).catch((e) => console.error("[focus] start-clean nav failed:", e?.message));
          }
        }
      }
    }
    if (!focusSession.active) {
      lastAllowedWindowId = null;
      lastAllowedAppName = null;
      lastAllowedUrl = null;
      lastAllowedTitle = null;
      sessionStartGraceKey = null;
    }

    // Tell every connected browser whether to redirect new tabs to the "nuh uh
    // uh" page, and where it lives.
    extBridge.broadcastSession({
      active: focusSession.active,
      blockedUrl: focusSession.active
        ? blockedPageUrlFor(focusSession.allowedSites)
        : null,
      // Allowed hostnames so the extension can filter search results client-side.
      allowedHosts: focusSession.active
        ? allowedHostsFor(
            focusSession.allowedApps,
            focusSession.allowedSites,
            focusSession.extraAlwaysAllowed,
          )
        : [],
      // Whether to hide Google's AI Overview (Gemini) on the re-skinned results page.
      hideGemini: focusSession.hideGemini,
    });
  }

  function startPolling(win) {
    let lastKey = null;
    let lastErrorSent = null;
    let consecutiveErrors = 0;
    // Don't show the scary "detection error" UI on a single hiccup — only after
    // several polls fail in a row. Permission-classified errors surface
    // immediately so the user can act.
    const UNKNOWN_ERROR_THRESHOLD = 4;
    let stopped = false;

    async function poll() {
      if (stopped || win.isDestroyed()) return;
      try {
        const { activeWindow } = await getWindowsModule();
        const info = await activeWindow();
        if (info?.owner?.name) {
          const snapshot = snapshotFromInfo(info);

          // The companion extension is the single source of browser tab info on
          // both macOS and Windows. When it's connected and a browser is focused,
          // use its real active-tab URL (overriding whatever the OS reported).
          if (isBrowserSnapshot(snapshot) && extBridge.isConnected()) {
            const extTab = extBridge.getActiveTab();
            if (extTab?.url) {
              snapshot.url = extTab.url;
              snapshot.extTabId = extTab.tabId;
            }
          }

          const ownApp = isOurApp(info);
          const allowed =
            !ownApp &&
            isAllowedFocusApp(
              snapshot,
              focusSession.allowedApps,
              focusSession.allowedSites,
              focusSession.extraAlwaysAllowed,
            );

          // Grace check — don't penalize the app the user already had open
          // before locking in. Clear the grace once they switch to anything else.
          const snapshotKey = `${snapshot.app}|${snapshot.url ?? ""}`;
          const inGrace =
            sessionStartGraceKey !== null && snapshotKey === sessionStartGraceKey;
          if (sessionStartGraceKey !== null && !inGrace) {
            sessionStartGraceKey = null;
          }

          // During a focus session, snap back to the last allowed window whenever
          // the user lands on something off the list. Don't `return` after — the
          // renderer's breach UI relies on still receiving the disallowed
          // snapshot so its breach effect can fire reliably.
          if (
            focusSession.active &&
            !ownApp &&
            !allowed &&
            !inGrace &&
            Date.now() - lastRestoreAt > RESTORE_COOLDOWN_MS
          ) {
            lastRestoreAt = Date.now();
            const inBrowser = isBrowserSnapshot(snapshot);
            let restored = null;
            if (inBrowser) {
              // Companion extension is the reliable path (real tab ids, no
              // keystrokes/UIA): send the offending tab in the focused browser to
              // the new-tab page. Never re-navigate a tab that's already there —
              // that would spam-reset the URL in a loop.
              const alreadyBlocked = /\/\/(127\.0\.0\.1|localhost):\d+\/blocked/i.test(
                snapshot.url ?? "",
              );
              if (
                extBridge.isConnected() &&
                typeof snapshot.extTabId === "number" &&
                !alreadyBlocked
              ) {
                const blocked = blockedPageUrlFor(focusSession.allowedSites);
                if (await extBridge.navigateTab(snapshot.extTabId, blocked)) {
                  restored = { windowId: null, refocused: blocked };
                }
              }
              // Windows-only fallback when the extension isn't connected: match a
              // tab by title via UIA, else keystroke-navigate the address bar.
              // (macOS relies entirely on the extension.)
              if (!restored && process.platform === "win32" && !alreadyBlocked) {
                if (lastAllowedTitle && snapshot.windowId) {
                  // UIA exposes tab page titles via TabItem.Name — match on title.
                  const tabs = await winTabs.listTabs(snapshot.windowId);
                  if (tabs && tabs.length) {
                    const wantTitle = String(lastAllowedTitle).toLowerCase();
                    const currentTitle = String(snapshot.title ?? "").toLowerCase();
                    // Exact match first, then case-insensitive contains.
                    let targetIndex = tabs.findIndex(
                      (t) =>
                        (t.name ?? "").toLowerCase() === wantTitle &&
                        (t.name ?? "").toLowerCase() !== currentTitle,
                    );
                    if (targetIndex < 0) {
                      targetIndex = tabs.findIndex((t) => {
                        const n = String(t.name ?? "").toLowerCase();
                        return (
                          n &&
                          n !== currentTitle &&
                          (n.includes(wantTitle) || wantTitle.includes(n))
                        );
                      });
                    }
                    if (targetIndex >= 0) {
                      if (await winTabs.selectTab(snapshot.windowId, targetIndex)) {
                        restored = {
                          windowId: null,
                          refocused: tabs[targetIndex].name ?? null,
                        };
                      }
                    }
                  }
                }
                if (!restored && lastAllowedUrl) {
                  if (
                    await restoreBrowserTab(snapshot.app, lastAllowedUrl, snapshot.windowId)
                  ) {
                    restored = { windowId: null, refocused: lastAllowedUrl };
                  }
                }
                if (!restored) {
                  const blocked = blockedPageUrlFor(focusSession.allowedSites);
                  if (await restoreBrowserTab(snapshot.app, blocked, snapshot.windowId)) {
                    restored = { windowId: null, refocused: blocked };
                  }
                }
              }
            }
            if (!restored) restored = await refocusLastAllowed();
            if (restored && !win.isDestroyed()) {
              win.webContents.send("focus:restored", {
                windowId: restored.windowId,
                blocked: snapshot.url ?? snapshot.app,
                refocused: restored.refocused ?? undefined,
              });
            }
          }

          if (!ownApp) {
            if (allowed) {
              if (typeof info.id === "number") lastAllowedWindowId = info.id;
              lastAllowedAppName = snapshot.app;
              if (snapshot.url) lastAllowedUrl = snapshot.url;
              if (snapshot.title) lastAllowedTitle = snapshot.title;
            }

            lastSnapshot = snapshot;
            const key = `${snapshot.app}|${snapshot.url ?? ""}|${snapshot.title}`;
            if (key !== lastKey) {
              lastKey = key;
              if (!win.isDestroyed()) win.webContents.send("active-app:change", snapshot);
            }
            if (lastErrorSent) {
              lastErrorSent = null;
              lastError = null;
              if (!win.isDestroyed()) win.webContents.send("active-app:error", null);
            }
            consecutiveErrors = 0;
          }
        } else {
          // Poll returned no info but didn't throw — treat as a transient miss.
          consecutiveErrors = 0;
        }
      } catch (e) {
        consecutiveErrors += 1;
        const msg = e?.message ?? String(e);

        // get-windows hangs for ~30s before printing its permission message, so
        // running it again is hopeless. Ask Electron's systemPreferences which
        // permission is actually missing — it's instant and authoritative.
        let kind = "unknown";
        if (process.platform === "darwin") {
          const screen = systemPreferences.getMediaAccessStatus("screen");
          const axTrusted = systemPreferences.isTrustedAccessibilityClient(false);
          if (screen !== "granted") kind = "needs-screen-recording";
          else if (!axTrusted) kind = "needs-accessibility";
          console.warn(
            `[active-app] permission probe: screen=${screen} ax=${axTrusted} → kind=${kind}`,
          );
        }
        // Suppress generic "unknown" errors until they persist — most are
        // transient (timeouts, the helper momentarily can't read a window).
        // Permission-classified errors surface immediately.
        const shouldEmit =
          kind !== "unknown" || consecutiveErrors >= UNKNOWN_ERROR_THRESHOLD;
        if (shouldEmit && lastErrorSent !== kind) {
          lastErrorSent = kind;
          lastError = { kind, message: msg };
          if (!win.isDestroyed()) {
            win.webContents.send("active-app:error", { kind, message: msg });
          }
          console.error("[active-app] poll error:", msg);
        } else if (!shouldEmit) {
          console.warn(
            `[active-app] transient poll error (${consecutiveErrors}/${UNKNOWN_ERROR_THRESHOLD}):`,
            msg,
          );
        }
      }
    }

    poll();
    const timer = setInterval(poll, 800);
    win.on("closed", () => {
      stopped = true;
      clearInterval(timer);
    });
  }

  return { getActiveApp, syncSession, startPolling };
}

module.exports = { createFocusEngine };
