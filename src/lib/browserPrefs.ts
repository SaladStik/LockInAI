/**
 * Small persisted preferences for the companion-browser experience.
 * Stored in localStorage so they survive restarts and are readable synchronously.
 */

const HIDE_GEMINI_KEY = "lockin.hideGemini";

export function getHideGemini(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HIDE_GEMINI_KEY) === "1";
  } catch {
    return false;
  }
}

export function setHideGemini(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HIDE_GEMINI_KEY, value ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}
