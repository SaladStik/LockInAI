import { useState } from "react";
import { Plus, X, ChevronRight } from "lucide-react";
import { SetupShell, Chip, CustomChip, PrimaryButton } from "@/components/lockin/primitives";
import { ALL_SITES } from "@/components/lockin/constants";
import { ALWAYS_ALLOWED_HOSTS, normalizeSiteHost } from "@/lib/apps";
import type { CustomSite } from "@/types/electron";

export function SitesScreen({
  sites,
  setSites,
  customSites,
  detectedHost,
  onAddCustom,
  onRemoveCustom,
  onNext,
}: {
  sites: string[];
  setSites: (s: string[]) => void;
  customSites: CustomSite[];
  detectedHost: string | null;
  onAddCustom: (host: string) => Promise<CustomSite | null>;
  onRemoveCustom: (id: number) => Promise<void>;
  onNext: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [typedHost, setTypedHost] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customHosts = customSites.map((c) => c.host.toLowerCase());
  const allKnownHosts = [...ALL_SITES.map((s) => s.toLowerCase()), ...customHosts];
  const defaults = ALL_SITES.filter((s) => !customHosts.includes(s.toLowerCase()));

  const detectedCandidate = adding ? detectedHost : null;
  const typedCandidate = adding ? normalizeSiteHost(typedHost) : null;
  const candidate = typedCandidate ?? detectedCandidate;
  const candidateExists =
    candidate != null && allKnownHosts.includes(candidate.toLowerCase());
  const typedInvalid = adding && typedHost.trim().length > 0 && !typedCandidate;

  const toggle = (s: string) =>
    setSites(sites.includes(s) ? sites.filter((x) => x !== s) : [...sites, s]);

  function openAddForm() {
    setError(null);
    setTypedHost("");
    setAdding(true);
  }

  function cancelAdd() {
    setAdding(false);
    setTypedHost("");
    setError(null);
  }

  async function commitAdd() {
    if (!candidate) {
      setError(typedInvalid ? "Enter a valid domain like netflix.com" : "Pick a site to add");
      return;
    }
    if (candidateExists) {
      setError(`"${candidate}" is already in your list`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await onAddCustom(candidate);
      if (created) setSites([...sites.filter((x) => x !== created.host), created.host]);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function removeCustom(id: number, host: string) {
    await onRemoveCustom(id);
    setSites(sites.filter((x) => x.toLowerCase() !== host.toLowerCase()));
  }

  return (
    <SetupShell step={4} title="Allowed websites" plantStage={3}>
      <div className="rounded-xl border border-primary-glow/30 bg-primary/5 px-3 py-2">
        <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow">
          always allowed
        </div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">
          {ALWAYS_ALLOWED_HOSTS.join(" · ")} · new tab pages
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {defaults.map((s) => (
          <Chip key={s} active={sites.includes(s)} onClick={() => toggle(s)}>
            {sites.includes(s) ? null : <Plus size={12} />}
            {s}
            {sites.includes(s) && <X size={12} />}
          </Chip>
        ))}
        {customSites.map((c) => (
          <CustomChip
            key={c.id}
            name={c.host}
            active={sites.includes(c.host)}
            onToggle={() => toggle(c.host)}
            onRemove={() => removeCustom(c.id, c.host)}
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
            Open the website you want to add in any browser, then come back — or type the URL
            below.
          </p>

          <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
            {detectedCandidate ? (
              <>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                  last detected
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {detectedCandidate}
                </div>
                {!typedCandidate && candidateExists && (
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-warning">
                    already in your list
                  </div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-muted-foreground">
                Switch to a browser tab and I'll catch the URL…
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/40" />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
              or type
            </span>
            <div className="h-px flex-1 bg-border/40" />
          </div>

          <input
            type="text"
            value={typedHost}
            onChange={(e) => {
              setTypedHost(e.target.value);
              setError(null);
            }}
            placeholder="e.g. netflix.com or https://docs.google.com"
            maxLength={128}
            className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary-glow/50 focus:outline-none"
          />
          {typedInvalid && (
            <p className="text-[10px] text-destructive">Enter a valid domain like netflix.com</p>
          )}
          {typedCandidate && candidateExists && (
            <p className="text-[10px] text-warning">"{typedCandidate}" is already in your list</p>
          )}

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
              disabled={saving || !candidate || candidateExists || typedInvalid}
              className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            >
              {saving ? "Saving…" : candidate ? `Add "${candidate}"` : "Add site"}
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Other tabs will be auto-closed back to your last allowed page.
      </p>
      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}
