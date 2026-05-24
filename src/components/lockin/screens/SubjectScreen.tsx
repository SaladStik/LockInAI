import { Plus, ChevronRight, ArrowLeft } from "lucide-react";
import { SetupShell, Chip, CustomChip, PrimaryButton } from "@/components/lockin/primitives";
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
  const trimmed = subject.trim();
  const nameTaken =
    creating &&
    trimmed.length > 0 &&
    (customSessions.some((s) => s.name.toLowerCase() === trimmed.toLowerCase()) ||
      SUBJECTS.some((s) => s.toLowerCase() === trimmed.toLowerCase()));
  const canContinue = !creating || (trimmed.length > 0 && !nameTaken);

  return (
    <SetupShell
      step={1}
      title={creating ? "Create a preset" : "What are you locking into?"}
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
            htmlFor="preset-name"
            className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground"
          >
            Preset name
          </label>
          <input
            id="preset-name"
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
            <CustomChip
              key={session.id}
              name={session.name}
              active={sessionKey === `custom:${session.id}`}
              onToggle={() => onSelectCustom(session)}
              onRemove={() => onRemoveCustomSession(session.id)}
            />
          ))}
          <button
            type="button"
            onClick={onStartNew}
            className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary-glow/60 hover:text-foreground"
          >
            <Plus size={12} /> New preset
          </button>
        </div>
      )}

      {!creating && (
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
      )}

      {creating && !trimmed && (
        <p className="text-[10px] text-muted-foreground/70">Name your preset to continue.</p>
      )}
      {nameTaken && (
        <p className="text-[10px] text-warning/80">
          “{trimmed}” is already taken — pick another name.
        </p>
      )}
      <PrimaryButton onClick={onNext} disabled={!canContinue} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}
