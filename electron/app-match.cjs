/**
 * @typedef {{
 *   app: string,
 *   title?: string,
 *   path?: string | null,
 *   bundleId?: string | null,
 *   url?: string | null
 * }} AppSnapshot
 */

const BROWSER_PATTERNS = [
  /chrome/i,
  /google chrome/i,
  /microsoft edge/i,
  /msedge/i,
  /firefox/i,
  /brave/i,
  /vivaldi/i,
  /opera/i,
  /arc/i,
  /safari/i,
];

const BROWSER_EXE_PATTERNS = [
  /\\chrome\.exe$/i,
  /\\msedge\.exe$/i,
  /\\firefox\.exe$/i,
  /\\brave\.exe$/i,
  /\\vivaldi\.exe$/i,
  /\\opera\.exe$/i,
  /\\arc\.exe$/i,
];

const APP_MATCHERS = {
  Browser: BROWSER_PATTERNS,
  // Legacy presets saved before the Browser rename.
  Chrome: BROWSER_PATTERNS,
  VSCode: [/visual studio code/i, /^code$/i, /vscode/i],
  Cursor: [/^cursor$/i, /\bcursor\b/i],
  Notion: [/notion/i],
  YouTube: [/youtube/i],
  Netflix: [/netflix/i],
  "PDF Viewer": [/acrobat/i, /foxit/i, /sumatra/i, /pdf/i, /reader/i],
  Figma: [/figma/i],
  Spotify: [/spotify/i],
  Discord: [/discord/i],
  Zoom: [/zoom workplace/i, /^zoom$/i, /\bzoom\b/i],
};

const EXE_MATCHERS = {
  Browser: BROWSER_EXE_PATTERNS,
  Chrome: BROWSER_EXE_PATTERNS,
  VSCode: [/\\code\.exe$/i],
  Cursor: [/\\cursor\.exe$/i],
  Notion: [/\\notion\.exe$/i],
  Netflix: [/\\netflix\.exe$/i],
  Figma: [/\\figma\.exe$/i],
  Spotify: [/\\spotify\.exe$/i],
  Discord: [/\\discord(?:canary|ptb)?\.exe$/i],
  Zoom: [/\\zoom\.exe$/i],
};

// Apps that are really websites — allowing the app should permit its site(s)
// when accessed in a browser. (The "Browser" app is the browser itself and
// grants no site; browser usage is governed by allowed sites.)
const APP_SITE_HOSTS = {
  YouTube: ["youtube.com", "youtu.be"],
  Netflix: ["netflix.com"],
  Notion: ["notion.so"],
  Figma: ["figma.com"],
  Spotify: ["open.spotify.com", "spotify.com"],
  VSCode: ["vscode.dev", "github.dev"],
};

/** Allowed sites + the site hosts of any allowed site-like apps. */
function effectiveAllowedHosts(allowedApps = [], allowedSites = []) {
  const hosts = [...allowedSites];
  for (const label of allowedApps) {
    const extra = APP_SITE_HOSTS[label];
    if (extra) hosts.push(...extra);
  }
  return hosts;
}

/**
 * The complete, normalized set of hostnames allowed in a browser during a
 * session: always-allowed defaults + user sites + site-like app hosts. Shared
 * with the companion extension so it can filter search results client-side.
 */
function allowedHostsFor(allowedApps = [], allowedSites = []) {
  const hosts = [
    ...ALWAYS_ALLOWED_HOSTS,
    ...effectiveAllowedHosts(allowedApps, allowedSites),
  ]
    .map((h) => String(h).toLowerCase().replace(/^www\./, "").trim())
    .filter(Boolean);
  return [...new Set(hosts)];
}

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

/** Browsers we can read/navigate via the address bar on Windows. */
function isSupportedBrowser(appName, exePath = "") {
  const hay = `${appName ?? ""} ${exePath ?? ""}`.toLowerCase();
  return BROWSER_PATTERNS.some((re) => re.test(hay));
}

/** True when the snapshot is a browser window (macOS url or Windows exe/name). */
function isBrowserSnapshot(snapshot) {
  if (snapshot?.url) return true;
  return isSupportedBrowser(snapshot?.app, snapshot?.path ?? "");
}

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
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    // Unparseable URL — fail open, otherwise weird internal pages break flow.
    return true;
  }
  // Browser-internal pages (chrome://, vivaldi://, about:, extension pages, the
  // browser's own new-tab/start page) are not websites — never a distraction.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
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

  // Browser/web context: when we have a real URL, the decision is the SITE, not
  // which browser binary it is. We can't expect every browser (e.g. Vivaldi) to
  // be on the allowed-apps list, and a new-tab page or our own blocked page is
  // neutral ground (isSiteAllowed returns true for those). Site-like allowed
  // apps (YouTube, Notion, …) contribute their hosts.
  if (snapshot.url) {
    return isSiteAllowed(snapshot.url, effectiveAllowedHosts(allowedApps, allowedSites));
  }

  // Native app (no URL): judge by app match.
  const app = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const title = snapshot.title ?? "";
  return allowedApps.some((label) => {
    const patterns = APP_MATCHERS[label] ?? [new RegExp(label, "i")];
    if (patterns.some((re) => re.test(app) || re.test(path))) return true;
    if (EXE_MATCHERS[label]?.some((re) => re.test(path))) return true;
    if (label === "YouTube" && /youtube/i.test(title)) return true;
    if (label === "Netflix" && /netflix/i.test(title)) return true;
    return false;
  });
}

module.exports = {
  isAllowedFocusApp,
  isOwnApp,
  isSystemApp,
  isSiteAllowed,
  isSupportedBrowser,
  isBrowserSnapshot,
  allowedHostsFor,
  ALWAYS_ALLOWED_HOSTS,
};
