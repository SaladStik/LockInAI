import { Plus, ChevronRight } from "lucide-react";
import { SetupShell, Chip, PrimaryButton } from "@/components/lockin/primitives";
import { SUBJECTS } from "@/components/lockin/constants";

export function SubjectScreen({
  subject,
  setSubject,
  plantName,
  setPlantName,
  onNext,
}: {
  subject: string;
  setSubject: (s: string) => void;
  plantName: string;
  setPlantName: (s: string) => void;
  onNext: () => void;
}) {
  return (
    <SetupShell step={1} title="What are you locking into?" plantStage={0} excited>
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <Chip key={s} active={s === subject} onClick={() => setSubject(s)}>
            {s}
          </Chip>
        ))}
        <Chip onClick={() => {}}>
          <Plus size={12} /> Custom
        </Chip>
      </div>
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
