/**
 * Lightweight in-browser voice cues using the Web Speech API.
 * No API key, no network. Soft, calm tone for LOCK//IN AI.
 */

let cachedVoice: SpeechSynthesisVoice | null = null;
let muted = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
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

export function setVoiceMuted(value: boolean) {
  muted = value;
  if (value && typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
export function isVoiceMuted() {
  return muted;
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (muted) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = opts.rate ?? 0.95;
    u.pitch = opts.pitch ?? 1.05;
    u.volume = 0.85;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}

// Prime voices list (Chrome lazy-loads them).
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}