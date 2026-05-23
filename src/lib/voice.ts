/**
 * Lightweight in-browser voice cues using the Web Speech API.
 * No API key, no network. Soft, calm tone for LOCK//IN AI.
 */

const STORAGE_KEY_VOICE = "lockin.voiceURI";
const STORAGE_KEY_MUTED = "lockin.voiceMuted";

let cachedVoice: SpeechSynthesisVoice | null = null;
let selectedVoiceURI: string | null = null;
let muted = false;
const voiceChangeListeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Restore persisted preferences on first import in the browser.
if (isBrowser()) {
  try {
    selectedVoiceURI = window.localStorage.getItem(STORAGE_KEY_VOICE);
    muted = window.localStorage.getItem(STORAGE_KEY_MUTED) === "1";
  } catch {
    /* localStorage may be unavailable */
  }
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isBrowser()) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (selectedVoiceURI) {
    const match = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (match) return (cachedVoice = match);
  }

  const preferred = [
    "Google UK English Female",
    "Samantha",
    "Karen",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Google US English",
  ];
  for (const name of preferred) {
    const v = voices.find((x) => x.name === name);
    if (v) return (cachedVoice = v);
  }
  cachedVoice = voices.find((v) => v.lang.startsWith("en")) ?? voices[0];
  return cachedVoice;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!isBrowser()) return [];
  return window.speechSynthesis.getVoices();
}

export function getSelectedVoiceURI(): string | null {
  return selectedVoiceURI;
}

export function setSelectedVoice(voiceURI: string | null) {
  selectedVoiceURI = voiceURI;
  cachedVoice = null;
  if (isBrowser()) {
    try {
      if (voiceURI) window.localStorage.setItem(STORAGE_KEY_VOICE, voiceURI);
      else window.localStorage.removeItem(STORAGE_KEY_VOICE);
    } catch {
      /* ignore */
    }
  }
  voiceChangeListeners.forEach((cb) => cb());
}

export function onVoicesChanged(cb: () => void): () => void {
  voiceChangeListeners.add(cb);
  if (isBrowser()) {
    const handler = () => cb();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => {
      voiceChangeListeners.delete(cb);
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
    };
  }
  return () => voiceChangeListeners.delete(cb);
}

export function setVoiceMuted(value: boolean) {
  muted = value;
  if (isBrowser()) {
    if (value) window.speechSynthesis.cancel();
    try {
      window.localStorage.setItem(STORAGE_KEY_MUTED, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }
}
export function isVoiceMuted() {
  return muted;
}

export function speak(text: string, opts: { rate?: number; pitch?: number; force?: boolean } = {}) {
  if (muted && !opts.force) return;
  speakWithVoice(text, pickVoice(), opts);
}

// Speak a phrase with an explicit voice — used by the settings preview so the
// utterance doesn't depend on the global selectedVoiceURI state.
export function previewVoice(text: string, voiceURI: string | null) {
  if (!isBrowser()) return;
  const voices = window.speechSynthesis.getVoices();
  const v = voiceURI ? voices.find((x) => x.voiceURI === voiceURI) ?? null : pickVoice();
  speakWithVoice(text, v, { force: true });
}

function speakWithVoice(
  text: string,
  voice: SpeechSynthesisVoice | null,
  opts: { rate?: number; pitch?: number } = {},
) {
  if (!isBrowser()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1.05;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

// Chrome lazy-loads voices; clear cache when the list arrives so pickVoice re-runs.
if (isBrowser()) {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    cachedVoice = null;
  });
}
