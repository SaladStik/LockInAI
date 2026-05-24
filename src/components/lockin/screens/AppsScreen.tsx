import { useState } from "react";
import { Plus, X, ChevronRight } from "lucide-react";
import { SetupShell, Chip, CustomChip, PrimaryButton } from "@/components/lockin/primitives";
import { ALL_APPS } from "@/components/lockin/constants";
import type { CustomApp } from "@/types/electron";

export function AppsScreen({
  apps,
  setApps,
  customApps,
  detectedAppName,
  onAddCustom,
  onRemoveCustom,
  onNext,
}: {
  apps: string[];
  setApps: (a: string[]) => void;
  customApps: CustomApp[];
  detectedAppName: string | null;
  onAddCustom: (name: string) => Promise<CustomApp | null>;
  onRemoveCustom: (id: number) => Promise<void>;
  onNext: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customNames = customApps.map((c) => c.name.toLowerCase());
  const allKnownNames = [...ALL_APPS.map((a) => a.toLowerCase()), ...customNames];
  const defaults = ALL_APPS.filter((a) => !customNames.includes(a.toLowerCase()));

  // The user clicks +, then alt-tabs to the target app. While they're gone,
  // useActiveApp keeps updating detectedAppName. When they return, the latest
  // detected value is the app they were just in.
  const candidate = adding ? detectedAppName : null;
  const candidateExists =
    candidate != null && allKnownNames.includes(candidate.toLowerCase());

  const toggle = (a: string) =>
    setApps(apps.includes(a) ? apps.filter((x) => x !== a) : [...apps, a]);

  function openAddForm() {
    setError(null);
    setAdding(true);
  }

  function cancelAdd() {
    setAdding(false);
    setError(null);
  }

  async function commitAdd() {
    if (!candidate) return;
    if (candidateExists) {
      setError(`"${candidate}" is already in your list`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await onAddCustom(candidate);
      if (created) setApps([...apps.filter((x) => x !== created.name), created.name]);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function removeCustom(id: number, name: string) {
    await onRemoveCustom(id);
    setApps(apps.filter((x) => x.toLowerCase() !== name.toLowerCase()));
  }

  return (
    <SetupShell step={3} title="Allowed apps" plantStage={2}>
      <div className="flex flex-wrap gap-2">
        {defaults.map((a) => (
          <Chip key={a} active={apps.includes(a)} onClick={() => toggle(a)}>
            {apps.includes(a) ? null : <Plus size={12} />}
            {a}
            {apps.includes(a) && <X size={12} />}
          </Chip>
        ))}
        {customApps.map((c) => (
          <CustomChip
            key={c.id}
            name={c.name}
            active={apps.includes(c.name)}
            onToggle={() => toggle(c.name)}
            onRemove={() => removeCustom(c.id, c.name)}
          />
        ))}
        {!adding && (
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary-glow/60 hover:text-foreground"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-primary-glow/40 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-primary-glow"
              style={{ boxShadow: "0 0 8px var(--primary-glow)" }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow">
              listening
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Open the app you want to add, then come back to this window.
          </p>

          <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
            {candidate ? (
              <>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                  last detected
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {candidate}
                </div>
                {candidateExists && (
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-warning">
                    already in your list
                  </div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-muted-foreground">
                Switch to any app and I'll catch it…
              </div>
            )}
          </div>

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelAdd}
              disabled={saving}
              className="flex-1 rounded-lg border border-border/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commitAdd}
              disabled={saving || !candidate || candidateExists}
              className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            >
              {saving
                ? "Saving…"
                : candidate
                  ? `Add "${candidate}"`
                  : "Waiting…"}
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Anything outside this list will gently nudge your plant.
      </p>
      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}
