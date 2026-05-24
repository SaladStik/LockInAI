const KEY = "onboarded";

function getApi() {
  if (typeof window === "undefined") return null;
  return window.electronAPI ?? null;
}

export function isOnboarded(): boolean {
  const api = getApi();
  if (!api) return true; // browser-only mode → don't loop the user through onboarding
  return api.prefs.get(KEY) === "1";
}

export function markOnboarded() {
  const api = getApi();
  if (!api) return;
  api.prefs.set(KEY, "1");
}
