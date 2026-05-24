const { systemPreferences, desktopCapturer, shell } = require("electron");

/**
 * macOS permission helpers (Accessibility + Screen Recording).
 *
 * On non-darwin platforms everything reports "granted" — get-windows needs no
 * special permission there. On macOS we report status, trigger the one-shot
 * system prompts, and fall back to opening the relevant Privacy pane.
 */

let permissionsRequestedOnce = false;

function getPermissionsStatus() {
  if (process.platform !== "darwin") {
    return { accessibility: "granted", screenRecording: "granted" };
  }
  return {
    accessibility: systemPreferences.isTrustedAccessibilityClient(false)
      ? "granted"
      : "denied",
    screenRecording: systemPreferences.getMediaAccessStatus("screen"),
  };
}

/**
 * Trigger macOS permission prompts. Each prompt is one-shot per app install —
 * if the user already dismissed it, the system won't re-show; the caller
 * should fall back to opening the relevant Privacy & Security pane.
 */
async function requestMacPermissions({ prompt = true } = {}) {
  if (process.platform !== "darwin") return getPermissionsStatus();

  // Accessibility — `isTrustedAccessibilityClient(true)` shows the prompt the
  // first time the user is asked.
  try {
    systemPreferences.isTrustedAccessibilityClient(Boolean(prompt));
  } catch (e) {
    console.error("[permissions] accessibility check failed:", e?.message ?? e);
  }

  // Screen Recording — Electron exposes the status but not a direct prompt.
  // Calling `desktopCapturer.getSources({ types: ['screen'] })` is what
  // actually triggers the macOS prompt the first time.
  if (prompt) {
    const status = systemPreferences.getMediaAccessStatus("screen");
    if (status === "not-determined" || status === "denied") {
      try {
        await desktopCapturer.getSources({
          types: ["screen"],
          thumbnailSize: { width: 1, height: 1 },
        });
      } catch (e) {
        console.error("[permissions] screen recording prompt failed:", e?.message ?? e);
      }
    }
  }

  permissionsRequestedOnce = true;
  return getPermissionsStatus();
}

// The "Grant ..." buttons in the footer call this. We try the OS prompt first
// (which only works the first time per app), then open the settings pane as a
// reliable fallback so the user always has a path forward.
async function ensurePermission(kind) {
  if (process.platform !== "darwin") return;
  const status = await requestMacPermissions({ prompt: true });
  if (kind === "accessibility" && status.accessibility !== "granted") {
    shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
    );
  } else if (kind === "screen-recording" && status.screenRecording !== "granted") {
    shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
    );
  }
}

/** True once the initial prompts have been requested (guards first-launch). */
function hasRequestedPermissions() {
  return permissionsRequestedOnce;
}

module.exports = {
  getPermissionsStatus,
  requestMacPermissions,
  ensurePermission,
  hasRequestedPermissions,
};
