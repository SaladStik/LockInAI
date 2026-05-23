/** @typedef {{ app: string, title?: string, path?: string | null, bundleId?: string | null }} AppSnapshot */

const APP_MATCHERS = {
  Chrome: [/chrome/i, /google chrome/i],
  VSCode: [/visual studio code/i, /^code$/i, /cursor/i, /vscode/i],
  Notion: [/notion/i],
  YouTube: [/youtube/i],
  "PDF Viewer": [/acrobat/i, /foxit/i, /sumatra/i, /pdf/i, /reader/i],
  Figma: [/figma/i],
  Spotify: [/spotify/i],
};

const EXE_MATCHERS = {
  Chrome: [/\\chrome\.exe$/i, /\\msedge\.exe$/i],
  VSCode: [/\\code\.exe$/i, /\\cursor\.exe$/i],
  Notion: [/\\notion\.exe$/i],
  Figma: [/\\figma\.exe$/i],
  Spotify: [/\\spotify\.exe$/i],
};

const OUR_APP_PATTERNS = [/electron/i, /lockin/i, /lock\/\/in/i];

// System utilities the user always needs unrestricted access to — never trigger
// a refocus or breach even if they aren't on the allowed list.
const SYSTEM_BUNDLE_IDS = new Set([
  // macOS
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
  // macOS
  /^Finder$/i,
  /^System Settings$/i,
  /^System Preferences$/i,
  /^Activity Monitor$/i,
  // Windows
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

/** @param {AppSnapshot} snapshot */
function isSystemApp(snapshot) {
  const name = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const bundleId = snapshot.bundleId ?? "";
  if (bundleId && SYSTEM_BUNDLE_IDS.has(bundleId)) return true;
  if (SYSTEM_NAME_PATTERNS.some((re) => re.test(name))) return true;
  if (SYSTEM_EXE_PATTERNS.some((re) => re.test(path))) return true;
  return false;
}

/** @param {AppSnapshot} snapshot */
function isOwnApp(snapshot) {
  const name = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const title = snapshot.title ?? "";
  return OUR_APP_PATTERNS.some(
    (re) => re.test(name) || re.test(path) || re.test(title),
  );
}

/** @param {AppSnapshot} snapshot @param {string[]} allowedApps */
function isAllowedFocusApp(snapshot, allowedApps) {
  if (isOwnApp(snapshot)) return true;
  if (isSystemApp(snapshot)) return true;

  const app = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const title = snapshot.title ?? "";

  return allowedApps.some((label) => {
    const patterns = APP_MATCHERS[label] ?? [new RegExp(label, "i")];
    if (patterns.some((re) => re.test(app) || re.test(path))) return true;
    if (EXE_MATCHERS[label]?.some((re) => re.test(path))) return true;
    if (label === "YouTube" && /youtube/i.test(title)) return true;
    return false;
  });
}

module.exports = { isAllowedFocusApp, isOwnApp, isSystemApp };
