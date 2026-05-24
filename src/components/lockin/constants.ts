export const SUBJECTS = ["Math", "Coding", "Reading", "Writing", "Exam Prep"];

export const ALL_APPS = [
  "Cursor",
  "Browser",
  "VSCode",
  "Notion",
  "Netflix",
  "Figma",
  "Spotify",
  "Discord",
  "Zoom",
];

export const ALL_SITES = [
  "chatgpt.com",
  "claude.ai",
  "github.com",
  "stackoverflow.com",
  "developer.mozilla.org",
  "youtube.com",
];

/** Map legacy app labels to their current names. */
export function normalizeAllowedApp(label: string): string {
  if (label.toLowerCase() === "chrome") return "Browser";
  return label;
}

export function normalizeAllowedApps(apps: string[]): string[] {
  return apps.map(normalizeAllowedApp);
}
