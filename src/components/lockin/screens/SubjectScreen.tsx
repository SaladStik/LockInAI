import { useState } from "react";
import { Plus, ChevronRight, X } from "lucide-react";
import { SetupShell, Chip, CustomChip, PrimaryButton } from "@/components/lockin/primitives";
import { SUBJECTS, ALL_APPS } from "@/components/lockin/constants";
import type { CustomApp, CustomSession } from "@/types/electron";

export function SubjectScreen({
  subject,
  sessionKey,
  plantName,
  setPlantName,
  customSessions,
  customApps,
  detectedAppName,
  onSelectBuiltIn,
  onSelectCustom,
  onAddCustomSession,
  onRemoveCustomSession,
  onAddCustomApp,
  onRemoveCustomApp,
  onNext,
}: {
  subject: string;
  sessionKey: string;
  plantName: string;
  setPlantName: (s: string) => void;
  customSessions: CustomSession[];
  customApps: CustomApp[];
  detectedAppName: string | null;
  onSelectBuiltIn: (name: string) => void;
  onSelectCustom: (session: CustomSession) => void;
  onAddCustomSession: (payload: {
    name: string;
    default_apps: string[];
    default_sites: string[];
  }) => Promise<CustomSession | null>;
  onRemoveCustomSession: (id: number) => Promise<void>;
  onAddCustomApp: (name: string) => Promise<CustomApp | null>;
  onRemoveCustomApp: (id: number) => Promise<void>;
  onNext: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [addingApp, setAddingApp] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftApps, setDraftApps] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingApp, setSavingApp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);

  const builtInNames = new Set(SUBJECTS.map((s) => s.toLowerCase()));
  const customNames = customApps.map((c) => c.name.toLowerCase());
  const allKnownNames = [...ALL_APPS.map((a) => a.toLowerCase()), ...customNames];
  const defaultApps = ALL_APPS.filter((a) => !customNames.includes(a.toLowerCase()));
  const appCandidate = addingApp ? detectedAppName : null;
  const appCandidateExists =
    appCandidate != null && allKnownNames.includes(appCandidate.toLowerCase());

  function toggleDraftApp(app: string) {
    setDraftApps((prev) =>
      prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app],
    );
  }

  function openCreate() {
    setError(null);
    setAppError(null);
    setAddingApp(false);
    setDraftName("");
    setDraftApps([]);
    setCreating(true);
  }

  function cancelCreate() {
    setCreating(false);
    setAddingApp(false);
    setError(null);
    setAppError(null);
  }

  function openAddApp() {
    setAppError(null);
    setAddingApp(true);
  }

  function cancelAddApp() {
    setAddingApp(false);
    setAppError(null);
  }

  async function commitAddApp() {
    if (!appCandidate) return;
    if (appCandidateExists) {
      setAppError(`"${appCandidate}" is already in your list`);
      return;
    }
    setSavingApp(true);
    setAppError(null);
    try {
      const created = await onAddCustomApp(appCandidate);
      if (created) {
        setDraftApps((prev) => [...prev.filter((x) => x !== created.name), created.name]);
      }
      setAddingApp(false);
    } catch (e) {
      setAppError(e instanceof Error ? e.message : "Couldn't save app");
    } finally {
      setSavingApp(false);
    }
  }

  async function removeCustomApp(id: number, name: string) {
    await onRemoveCustomApp(id);
    setDraftApps((prev) => prev.filter((x) => x.toLowerCase() !== name.toLowerCase()));
  }

  async function saveCustomSession() {
    const name = draftName.trim();
    if (!name) {
      setError("Give your session a name");
      return;
    }
    if (builtInNames.has(name.toLowerCase())) {
      setError("That name is already used by a built-in session");
      return;
    }
    if (draftApps.length === 0) {
      setError("Pick at least one app to allow by default");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await onAddCustomSession({
        name,
        default_apps: draftApps,
        default_sites: [],
      });
      if (created) onSelectCustom(created);
      setCreating(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save session");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SetupShell step={1} title="What are you locking into?" plantStage={0} excited>
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <Chip
            key={s}
            active={sessionKey === `builtin:${s}`}
            onClick={() => onSelectBuiltIn(s)}
          >
            {s}
          </Chip>
        ))}
        {customSessions.map((session) => (
          <div key={session.id} className="inline-flex items-center gap-0.5">
            <Chip
              active={sessionKey === `custom:${session.id}`}
              onClick={() => onSelectCustom(session)}
            >
              {session.name}
            </Chip>
            <button
              type="button"
              onClick={() => onRemoveCustomSession(session.id)}
              aria-label={`Remove ${session.name}`}
              className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/15 hover:text-destructive"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {!creating && (
          <Chip onClick={openCreate}>
            <Plus size={12} /> Custom
          </Chip>
        )}
      </div>

      {creating && (
        <div className="mt-3 rounded-2xl border border-primary-glow/40 bg-primary/5 p-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow">
            Custom session
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Name it and pick apps that stay unblocked whenever you choose this session.
          </p>
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="e.g. Movie night, Language lab…"
            maxLength={64}
            className="mt-2 w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary-glow/50 focus:outline-none"
          />
          <div className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Default allowed apps
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {defaultApps.map((app) => (
              <Chip
                key={app}
                active={draftApps.includes(app)}
                onClick={() => toggleDraftApp(app)}
              >
                {draftApps.includes(app) ? null : <Plus size={12} />}
                {app}
                {draftApps.includes(app) && <X size={12} />}
              </Chip>
            ))}
            {customApps.map((c) => (
              <CustomChip
                key={c.id}
                name={c.name}
                active={draftApps.includes(c.name)}
                onToggle={() => toggleDraftApp(c.name)}
                onRemove={() => removeCustomApp(c.id, c.name)}
              />
            ))}
            {!addingApp && (
              <button
                type="button"
                onClick={openAddApp}
                className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary-glow/60 hover:text-foreground"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          {addingApp && (
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-border/40 bg-background/40 p-3">
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
                {appCandidate ? (
                  <>
                    <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                      last detected
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                      {appCandidate}
                    </div>
                    {appCandidateExists && (
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
              {appError && <p className="text-[10px] text-destructive">{appError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelAddApp}
                  disabled={savingApp}
                  className="flex-1 rounded-lg border border-border/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commitAddApp}
                  disabled={savingApp || !appCandidate || appCandidateExists}
                  className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
                >
                  {savingApp
                    ? "Saving…"
                    : appCandidate
                      ? `Add "${appCandidate}"`
                      : "Waiting…"}
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-2 text-[10px] text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={cancelCreate}
              disabled={saving}
              className="flex-1 rounded-lg border border-border/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveCustomSession}
              disabled={saving}
              className="flex-1 rounded-lg px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground"
              style={{ background: "var(--gradient-leaf)" }}
            >
              {saving ? "Saving…" : "Save & use"}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="plant-name"
          className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground"
        >
          Name your plant{" "}
          <span className="normal-case tracking-normal text-muted-foreground/70">(optional)</span>
        </label>
        <input
          id="plant-name"
          type="text"
          value={plantName}
          onChange={(e) => setPlantName(e.target.value)}
          placeholder="Leave blank and we'll pick one"
          maxLength={32}
          className="mt-1.5 w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary-glow/50 focus:outline-none"
        />
      </div>
      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}
