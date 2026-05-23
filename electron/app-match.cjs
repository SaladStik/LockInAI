/**
 * @typedef {{
 *   app: string,
 *   title?: string,
 *   path?: string | null,
 *   bundleId?: string | null,
 *   url?: string | null
 * }} AppSnapshot
 */

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

// Sites the user can always reach — search, reference, browser new-tab pages.
const ALWAYS_ALLOWED_HOSTS = ["google.com", "wikipedia.org"];

const NEW_TAB_PATTERNS = [
  /^chrome:\/\/new[\w-]*tab/i,
  /^edge:\/\/new[\w-]*tab/i,
  /^arc:\/\/(new[\w-]*tab|space)/i,
  /^brave:\/\/new[\w-]*tab/i,
  /^vivaldi:\/\/(start|new[\w-]*tab)/i,
  /^opera:\/\/(start|new[\w-]*tab)/i,
  /^about:(blank|newtab|home|new[\w-]*tab)/i,
  /^firefox-newtab/i,
  // Our local "blocked" page is served by Electron's main process.
  /^https?:\/\/127\.0\.0\.1:\d+\/blocked/i,
  /^https?:\/\/localhost:\d+\/blocked/i,
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

/**
 * Decide whether the URL the user is on is allowed.
 * No URL → not in a browser context, defer to the app check.
 * @param {string | null | undefined} url
 * @param {string[]} allowedSites — user-picked hostnames
 */
function isSiteAllowed(url, allowedSites = []) {
  if (!url) return true;
  if (NEW_TAB_PATTERNS.some((re) => re.test(url))) return true;
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    // Unparseable URL — fail open, otherwise weird internal pages break flow.
    return true;
  }
  if (!host) return true;
  const allChecks = [
    ...ALWAYS_ALLOWED_HOSTS,
    ...allowedSites.map((s) => String(s).toLowerCase().replace(/^www\./, "")),
  ];
  return allChecks.some((h) => {
    if (!h) return false;
    return host === h || host.endsWith(`.${h}`);
  });
}

/**
 * @param {AppSnapshot} snapshot
 * @param {string[]} allowedApps
 * @param {string[]} [allowedSites]
 */
function isAllowedFocusApp(snapshot, allowedApps, allowedSites = []) {
  if (isOwnApp(snapshot)) return true;
  if (isSystemApp(snapshot)) return true;

  const app = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const title = snapshot.title ?? "";

  const appAllowed = allowedApps.some((label) => {
    const patterns = APP_MATCHERS[label] ?? [new RegExp(label, "i")];
    if (patterns.some((re) => re.test(app) || re.test(path))) return true;
    if (EXE_MATCHERS[label]?.some((re) => re.test(path))) return true;
    if (label === "YouTube" && /youtube/i.test(title)) return true;
    return false;
  });
  if (!appAllowed) return false;

  // App is allowed. If this is a browser with a captured URL, the site must
  // also be on the allowed list (or be an always-allowed default).
  if (snapshot.url) {
    return isSiteAllowed(snapshot.url, allowedSites);
  }
  return true;
}

module.exports = {
  isAllowedFocusApp,
  isOwnApp,
  isSystemApp,
  isSiteAllowed,
  ALWAYS_ALLOWED_HOSTS,
};
