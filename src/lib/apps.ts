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

  const app = snapshot.app ?? "";
  const path = snapshot.path ?? "";
  const title = snapshot.title ?? "";

  return allowedApps.some((label) => {
    const patterns = APP_MATCHERS[label] ?? [new RegExp(label, "i")];
    if (patterns.some((re) => re.test(app) || re.test(path))) return true;
    if (EXE_MATCHERS[label]?.some((re) => re.test(path))) return true;
    // Browser-only allowances (YouTube has no stable Windows process name).
    if (label === "YouTube" && /youtube/i.test(title)) return true;
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
