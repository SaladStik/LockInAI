/**
 * Lightweight in-browser voice cues using the Web Speech API.
 * No API key, no network. Soft, calm tone for LOCK//IN AI.
 */

const STORAGE_KEY_VOICE = "lockin.voiceURI";
const STORAGE_KEY_MUTED = "lockin.voiceMuted";

/** Persisted preset — resolved to the best installed en-GB female voice. */
export const BRITISH_LADY_PRESET = "lockin:british-lady";

let cachedVoice: SpeechSynthesisVoice | null = null;
let selectedVoiceURI: string | null = BRITISH_LADY_PRESET;
let muted = false;
const voiceChangeListeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Restore persisted preferences on first import in the browser.
if (isBrowser()) {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_VOICE);
    selectedVoiceURI = stored ?? BRITISH_LADY_PRESET;
    muted = window.localStorage.getItem(STORAGE_KEY_MUTED) === "1";
  } catch {
    /* localStorage may be unavailable */
  }
}

/** Known British English female voices across Windows, macOS, and Chromium. */
const BRITISH_LADY_NAMES = [
  "Google UK English Female",
  "Microsoft Hazel - English (Great Britain)",
  "Microsoft Hazel Desktop - English (Great Britain)",
  "Microsoft Sonia Online (Natural) - English (United Kingdom)",
  "Microsoft Libby Online (Natural) - English (Great Britain)",
  "Microsoft Libby - English (Great Britain)",
  "Hazel",
  "Kate",
  "Serena",
  "Sonia",
  "Libby",
];

function isBritishLadyVoice(v: SpeechSynthesisVoice): boolean {
  const lang = v.lang.toLowerCase().replace("_", "-");
  const name = v.name;
  if (/male|daniel|arthur|ryan|george|brian|thomas|oliver|guy/i.test(name)) return false;
  if (BRITISH_LADY_NAMES.some((n) => name === n || name.startsWith(n))) return true;
  if (/female/i.test(name) && (lang.startsWith("en-gb") || /united kingdom|great britain|uk english/i.test(name))) {
    return true;
  }
  if (lang.startsWith("en-gb") && /hazel|sonia|libby|kate|serena|susan|emma|martha|fiona|zira|amy/i.test(name)) {
    return true;
  }
  return false;
}

export function pickBritishLadyVoice(): SpeechSynthesisVoice | null {
  if (!isBrowser()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  for (const name of BRITISH_LADY_NAMES) {
    const v = voices.find((x) => x.name === name || x.name.startsWith(name));
    if (v) return v;
  }

  const lady = voices.find(isBritishLadyVoice);
  if (lady) return lady;

  return voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith("en-gb")) ?? null;
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isBrowser()) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (selectedVoiceURI && selectedVoiceURI !== BRITISH_LADY_PRESET) {
    const match = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (match) return (cachedVoice = match);
  }

  if (!selectedVoiceURI || selectedVoiceURI === BRITISH_LADY_PRESET) {
    const british = pickBritishLadyVoice();
    if (british) return (cachedVoice = british);
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

/** Human-readable label for the active voice selection. */
export function getSelectedVoiceLabel(): string {
  if (!selectedVoiceURI || selectedVoiceURI === BRITISH_LADY_PRESET) {
    const v = pickBritishLadyVoice();
    return v ? `British lady · ${v.name}` : "British lady (recommended)";
  }
  const v = listVoices().find((x) => x.voiceURI === selectedVoiceURI);
  return v?.name ?? "Custom voice";
}

export function setSelectedVoice(voiceURI: string | null) {
  selectedVoiceURI = voiceURI ?? BRITISH_LADY_PRESET;
  cachedVoice = null;
  if (isBrowser()) {
    try {
      window.localStorage.setItem(STORAGE_KEY_VOICE, selectedVoiceURI);
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
  let v: SpeechSynthesisVoice | null = null;
  if (!voiceURI || voiceURI === BRITISH_LADY_PRESET) {
    v = pickBritishLadyVoice();
  } else {
    v = voices.find((x) => x.voiceURI === voiceURI) ?? null;
  }
  speakWithVoice(text, v ?? pickVoice());
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
