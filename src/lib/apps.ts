import type { ActiveAppSnapshot } from "@/types/electron";

/** Friendly labels shown in the setup UI → patterns for OS-reported names/paths. */
const APP_MATCHERS: Record<string, RegExp[]> = {
  Chrome: [/chrome/i, /google chrome/i],
  VSCode: [/visual studio code/i, /^code$/i, /cursor/i, /vscode/i],
  Notion: [/notion/i],
  YouTube: [/youtube/i],
  "PDF Viewer": [/acrobat/i, /foxit/i, /sumatra/i, /pdf/i, /reader/i],
  Figma: [/figma/i],
  Spotify: [/spotify/i],
};

const EXE_MATCHERS: Record<string, RegExp[]> = {
  Chrome: [/\\chrome\.exe$/i, /\\msedge\.exe$/i],
  VSCode: [/\\code\.exe$/i, /\\cursor\.exe$/i],
  Notion: [/\\notion\.exe$/i],
  Figma: [/\\figma\.exe$/i],
  Spotify: [/\\spotify\.exe$/i],
};

const OUR_APP_PATTERNS = [
  /electron/i,
  /lockin/i,
  /lock\/\/in/i,
];

// System utilities the user always needs unrestricted access to.
const SYSTEM_BUNDLE_IDS = new Set([
  "com.apple.finder",
  "com.apple.systempreferences",
  "com.apple.ActivityMonitor",
  "com.apple.dock",
  "com.apple.controlcenter",
  "com.apple.notificationcenterui",
  "com.apple.WindowManager",
  "com.apple.Spotlight",
]);

const SYSTEM_NAME_PATTERNS = [
  /^Finder$/i,
  /^System Settings$/i,
  /^System Preferences$/i,
  /^Activity Monitor$/i,
  /^Windows Explorer$/i,
  /^File Explorer$/i,
  /^Task Manager$/i,
  /^Settings$/i,
  /^Control Panel$/i,
];

const SYSTEM_EXE_PATTERNS = [
  /\\explorer\.exe$/i,
  /\\taskmgr\.exe$/i,
  /\\systemsettings\.exe$/i,
  /\\control\.exe$/i,
  /\\mmc\.exe$/i,
];

export function isSystemApp(snapshot: ActiveAppSnapshot): boolean {
  const name = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const bundleId = snapshot.bundleId ?? "";
  if (bundleId && SYSTEM_BUNDLE_IDS.has(bundleId)) return true;
  if (SYSTEM_NAME_PATTERNS.some((re) => re.test(name))) return true;
  if (SYSTEM_EXE_PATTERNS.some((re) => re.test(path))) return true;
  return false;
}

export function isOwnApp(snapshot: ActiveAppSnapshot): boolean {
  const name = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const title = snapshot.title ?? "";
  return OUR_APP_PATTERNS.some(
    (re) => re.test(name) || re.test(path) || re.test(title),
  );
}

export function isAllowedFocusApp(
  snapshot: ActiveAppSnapshot,
  allowedApps: string[],
): boolean {
  if (isOwnApp(snapshot)) return true;
  if (isSystemApp(snapshot)) return true;

  const app = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const title = snapshot.title ?? "";

  return allowedApps.some((label) => {
    const patterns = APP_MATCHERS[label] ?? [new RegExp(label, "i")];
    if (patterns.some((re) => re.test(app) || re.test(path))) return true;
    if (EXE_MATCHERS[label]?.some((re) => re.test(path))) return true;
    // Browser-only allowances (YouTube has no stable Windows process name).
    if (label === "YouTube" && /youtube/i.test(title)) return true;
    return false;
  });
}

export function formatDetectedApp(snapshot: ActiveAppSnapshot): string {
  if (snapshot.url) {
    try {
      return new URL(snapshot.url).hostname.replace(/^www\./, "");
    } catch {
      /* fall through */
    }
  }
  return snapshot.app;
}
