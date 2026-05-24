import { useEffect, useState } from "react";
import { ArrowLeft, Check, Play } from "lucide-react";
import {
  BRITISH_LADY_PRESET,
  getSelectedVoiceURI,
  listVoices,
  onVoicesChanged,
  pickBritishLadyVoice,
  previewVoice,
  setSelectedVoice,
} from "@/lib/voice";

const SAMPLE_PHRASE = "Lock in. Stay focused. You've got this.";

export function SettingsScreen({
  onBack,
  onClearGarden,
  hideGemini,
  onToggleGemini,
}: {
  onBack: () => void;
  onClearGarden: () => Promise<void>;
  hideGemini: boolean;
  onToggleGemini: (value: boolean) => void;
}) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => listVoices());
  const [selected, setSelected] = useState<string | null>(() => getSelectedVoiceURI());
  const [showAll, setShowAll] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setVoices(listVoices());
    refresh();
    return onVoicesChanged(refresh);
  }, []);

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const britishLady = pickBritishLadyVoice();
  const visible = (showAll ? voices : englishVoices.length ? englishVoices : voices).filter(
    (v) => !britishLady || v.voiceURI !== britishLady.voiceURI,
  );

  function isBritishLadySelected() {
    const sel = getSelectedVoiceURI();
    return !sel || sel === BRITISH_LADY_PRESET;
  }

  function choose(uri: string | null) {
    setSelected(uri);
    setSelectedVoice(uri);
  }

  function preview(voiceURI: string | null) {
    previewVoice(SAMPLE_PHRASE, voiceURI);
  }

  async function handleResetApp() {
    const ok = window.confirm(
      "Reset your garden? All plants will be permanently deleted. This cannot be undone.",
    );
    if (!ok) return;
    setResetting(true);
    setResetError(null);
    try {
      await onClearGarden();
    } catch (e) {
      setResetError(e instanceof Error ? e.message : "Couldn't reset garden");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back
        </button>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          Settings
        </h2>
        <div className="w-12" />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-medium text-foreground">AI voice</div>
          <button
            onClick={() => setShowAll((v) => !v)}
            className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground"
          >
            {showAll ? "English only" : `Show all (${voices.length})`}
          </button>
        </div>
        <p className="mb-2 text-[10px] leading-relaxed text-muted-foreground">
          Choose how Lockie sounds. Uses your device's installed text-to-speech voices.
        </p>
      </div>

      <div className="-mx-2 flex-1 space-y-1.5 overflow-y-auto px-2 pb-1">
        <VoiceRow
          name="British lady"
          lang={
            britishLady
              ? `${britishLady.lang} · ${britishLady.name}${britishLady.localService ? " · local" : " · network"}`
              : "en-GB · auto-selected from your device"
          }
          isSelected={isBritishLadySelected()}
          onSelect={() => choose(BRITISH_LADY_PRESET)}
          onPreview={() => preview(BRITISH_LADY_PRESET)}
        />

        {visible.length === 0 && (
          <div className="rounded-xl border border-border/40 bg-secondary/20 px-3 py-3 text-center text-[10px] text-muted-foreground">
            No voices detected yet. Try again in a moment.
          </div>
        )}

        {visible.map((v) => (
          <VoiceRow
            key={v.voiceURI}
            name={v.name}
            lang={v.lang + (v.localService ? " · local" : " · network")}
            isSelected={selected === v.voiceURI}
            onSelect={() => choose(v.voiceURI)}
            onPreview={() => preview(v.voiceURI)}
          />
        ))}

        <div className="mt-4 border-t border-border/40 pt-4">
          <div className="text-[11px] font-medium text-foreground">Locked-in browser</div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Searches always run on Google and the results page is re-skinned to match LOCK//IN.
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={hideGemini}
            onClick={() => onToggleGemini(!hideGemini)}
            className="glass mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-secondary/40"
          >
            <div className="min-w-0 flex-1 pr-3">
              <div className="text-[11px] font-medium text-foreground">Hide Google AI Overview</div>
              <div className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
                {hideGemini ? "Gemini answers hidden" : "Gemini answers shown"}
              </div>
            </div>
            <span
              className="relative h-5 w-9 shrink-0 rounded-full transition-colors"
              style={{
                background: hideGemini
                  ? "var(--primary-glow)"
                  : "color-mix(in oklab, var(--border) 80%, transparent)",
                boxShadow: hideGemini ? "0 0 14px -4px var(--primary-glow)" : undefined,
              }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                style={{ left: hideGemini ? "1.125rem" : "0.125rem" }}
              />
            </span>
          </button>
        </div>

        <div className="mt-4 border-t border-border/40 pt-4">
          <div className="text-[11px] font-medium text-foreground">Reset app</div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Clears your entire garden. New plants will grow as you complete future sessions.
          </p>
          {resetError && (
            <p className="mt-2 text-[10px] text-destructive">{resetError}</p>
          )}
          <button
            type="button"
            onClick={handleResetApp}
            disabled={resetting}
            className="mt-3 w-full rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
          >
            {resetting ? "Resetting…" : "Reset garden"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceRow({
  name,
  lang,
  isSelected,
  onSelect,
  onPreview,
}: {
  name: string;
  lang: string;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}) {
  return (
    <div
      className="glass flex items-center gap-2 rounded-xl px-3 py-2 transition"
      style={
        isSelected
          ? { boxShadow: "0 0 18px -10px var(--primary-glow)", borderColor: "var(--primary-glow)" }
          : undefined
      }
    >
      <button
        onClick={onSelect}
        className="flex flex-1 items-center gap-2 text-left"
        aria-label={`Select ${name}`}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full border"
          style={{
            borderColor: isSelected ? "var(--primary-glow)" : "var(--border)",
            background: isSelected ? "color-mix(in oklab, var(--primary-glow) 25%, transparent)" : "transparent",
          }}
        >
          {isSelected && <Check size={11} className="text-primary-glow" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-medium text-foreground">{name}</div>
          <div className="truncate font-mono text-[9px] uppercase tracking-[0.15em] text-muted-foreground">
            {lang}
          </div>
        </div>
      </button>
      <button
        onClick={onPreview}
        aria-label={`Preview ${name}`}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-foreground transition hover:bg-secondary/70"
      >
        <Play size={11} />
      </button>
    </div>
  );
}
