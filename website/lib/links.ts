/* Shared site links / download config — imported by the home page and header.
   Edit REPO / VERSION here when you cut a release. */
export const REPO = "SaladStik/LockInAI"; // GitHub owner/repo
export const BASE = `https://github.com/${REPO}`;
export const RELEASES = `${BASE}/releases/latest`;

// Direct one-click download for a published release asset.
//   dl("Mac", "LOCKIN.AI-0.1.0-arm64.dmg")
export const dl = (tag: string, asset: string) =>
  `${BASE}/releases/download/${tag}/${asset}`;

export const DOWNLOADS = {
  // macOS (Apple Silicon) — published under the "Mac" release tag.
  mac: dl("Mac", "LOCKIN.AI-0.1.0-arm64.dmg"),
  // No Windows build yet — send to the releases page.
  win: dl("Windows", "LOCKIN.AI.Setup-0.1.0.exe"),
};
