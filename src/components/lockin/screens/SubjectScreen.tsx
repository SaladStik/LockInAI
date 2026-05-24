import { Plus, ChevronRight, X, ArrowLeft } from "lucide-react";
import { SetupShell, Chip, PrimaryButton } from "@/components/lockin/primitives";
import { SUBJECTS } from "@/components/lockin/constants";
import type { CustomSession } from "@/types/electron";

export function SubjectScreen({
  subject,
  setSubject,
  sessionKey,
  plantName,
  setPlantName,
  customSessions,
  onSelectBuiltIn,
  onSelectCustom,
  onRemoveCustomSession,
  onStartNew,
  onCancelNew,
  onNext,
}: {
  subject: string;
  setSubject: (s: string) => void;
  sessionKey: string;
  plantName: string;
  setPlantName: (s: string) => void;
  customSessions: CustomSession[];
  onSelectBuiltIn: (name: string) => void;
  onSelectCustom: (session: CustomSession) => void;
  onRemoveCustomSession: (id: number) => Promise<void>;
  onStartNew: () => void;
  onCancelNew: () => void;
  onNext: () => void;
}) {
  const creating = sessionKey === "new";
  const canContinue = !creating || subject.trim().length > 0;

  return (
    <SetupShell
      step={1}
      title={creating ? "Create a session" : "What are you locking into?"}
      plantStage={0}
      excited
    >
      {creating ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onCancelNew}
            className="flex items-center gap-1 self-start text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft size={11} /> Pick a preset
          </button>
          <label
            htmlFor="session-name"
            className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground"
          >
            Session name
          </label>
          <input
            id="session-name"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Movie night, Thesis, Language lab"
            maxLength={64}
            autoFocus
            className="w-full rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary-glow/50 focus:outline-none"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Choose its allowed apps & sites in the next steps — we'll save it as a
            reusable preset when you lock in.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <Chip key={s} active={sessionKey === `builtin:${s}`} onClick={() => onSelectBuiltIn(s)}>
              {s}
            </Chip>
          ))}
          {customSessions.map((session) => (
            <div key={session.id} className="inline-flex items-center gap-0.5">
              <Chip active={sessionKey === `custom:${session.id}`} onClick={() => onSelectCustom(session)}>
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
          <Chip onClick={onStartNew}>
            <Plus size={12} /> New session
          </Chip>
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

      {creating && !subject.trim() && (
        <p className="text-[10px] text-muted-foreground/70">Name your session to continue.</p>
      )}
      <PrimaryButton onClick={onNext} disabled={!canContinue} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}
