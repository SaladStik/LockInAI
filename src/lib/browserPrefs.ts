/**
 * Small persisted preferences for the companion-browser experience.
 * Stored in SQLite (via the preload `prefs` bridge) so they survive restarts
 * and are readable synchronously from the renderer.
 */

const HIDE_GEMINI_KEY = "hideGemini";

function getApi() {
  if (typeof window === "undefined") return null;
  return window.electronAPI ?? null;
}

export function getHideGemini(): boolean {
  return getApi()?.prefs.get(HIDE_GEMINI_KEY) === "1";
}

export function setHideGemini(value: boolean): void {
  getApi()?.prefs.set(HIDE_GEMINI_KEY, value ? "1" : "0");
}
