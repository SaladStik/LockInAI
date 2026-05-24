import type { ActiveAppSnapshot } from "@/types/electron";

const APP_MATCHERS: Record<string, RegExp[]> = {
  Chrome: [/chrome/i, /google chrome/i],
  VSCode: [/visual studio code/i, /^code$/i, /cursor/i, /vscode/i],
  Notion: [/notion/i],
  YouTube: [/youtube/i],
  Netflix: [/netflix/i],
  "PDF Viewer": [/acrobat/i, /foxit/i, /sumatra/i, /pdf/i, /reader/i],
  Figma: [/figma/i],
  Spotify: [/spotify/i],
};

const EXE_MATCHERS: Record<string, RegExp[]> = {
  Chrome: [/\\chrome\.exe$/i, /\\msedge\.exe$/i],
  VSCode: [/\\code\.exe$/i, /\\cursor\.exe$/i],
  Notion: [/\\notion\.exe$/i],
  Netflix: [/\\netflix\.exe$/i],
  Figma: [/\\figma\.exe$/i],
  Spotify: [/\\spotify\.exe$/i],
};

// Apps that are really websites — allowing the app should permit its site(s)
// when accessed in a browser. ("Chrome" is the browser itself and grants no
// site; browser usage is governed by allowed sites.)
const APP_SITE_HOSTS: Record<string, string[]> = {
  YouTube: ["youtube.com", "youtu.be"],
  Netflix: ["netflix.com"],
  Notion: ["notion.so"],
  Figma: ["figma.com"],
  Spotify: ["open.spotify.com", "spotify.com"],
  VSCode: ["vscode.dev", "github.dev"],
};

/** Allowed sites + the site hosts of any allowed site-like apps. */
function effectiveAllowedHosts(allowedApps: string[] = [], allowedSites: string[] = []): string[] {
  const hosts = [...allowedSites];
  for (const label of allowedApps) {
    const extra = APP_SITE_HOSTS[label];
    if (extra) hosts.push(...extra);
  }
  return hosts;
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

export const ALWAYS_ALLOWED_HOSTS = ["google.com", "wikipedia.org"];

const NEW_TAB_PATTERNS = [
  /^chrome:\/\/new[\w-]*tab/i,
  /^edge:\/\/new[\w-]*tab/i,
  /^arc:\/\/(new[\w-]*tab|space)/i,
  /^brave:\/\/new[\w-]*tab/i,
  /^vivaldi:\/\/(start|new[\w-]*tab)/i,
  /^opera:\/\/(start|new[\w-]*tab)/i,
  /^about:(blank|newtab|home|new[\w-]*tab)/i,
  /^firefox-newtab/i,
  /^https?:\/\/127\.0\.0\.1:\d+\/blocked/i,
  /^https?:\/\/localhost:\d+\/blocked/i,
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

/** Decide whether the URL the user is on is allowed. */
export function isSiteAllowed(
  url: string | null | undefined,
  allowedSites: string[] = [],
): boolean {
  if (!url) return true;
  if (NEW_TAB_PATTERNS.some((re) => re.test(url))) return true;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }
  // Browser-internal pages (chrome://, vivaldi://, about:, extension pages, the
  // browser's own new-tab/start page) are not websites — never a distraction.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  if (!host) return true;
  const allChecks = [
    ...ALWAYS_ALLOWED_HOSTS,
    ...allowedSites.map((s) => s.toLowerCase().replace(/^www\./, "")),
  ];
  return allChecks.some((h) => {
    if (!h) return false;
    return host === h || host.endsWith(`.${h}`);
  });
}

/** Extract the bare hostname from a snapshot URL (e.g. "github.com"). */
export function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

export function isAllowedFocusApp(
  snapshot: ActiveAppSnapshot,
  allowedApps: string[],
  allowedSites: string[] = [],
): boolean {
  if (isOwnApp(snapshot)) return true;
  if (isSystemApp(snapshot)) return true;

  // Browser/web context: when we have a real URL, the decision is the SITE, not
  // which browser binary it is. New-tab / our own blocked page are neutral
  // (isSiteAllowed returns true). Site-like allowed apps contribute their hosts.
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
