import { Lockie, type LockieMood } from "@/components/lockin/Lockie";
import { Plant } from "@/components/lockin/Plant";

export function SetupShell({
  step,
  title,
  plantStage,
  excited,
  children,
  footer,
}: {
  step: number;
  title: string;
  plantStage: number;
  excited?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const mood: LockieMood = excited ? "excited" : "curious";
  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      {/* progress dots */}
      <div className="flex shrink-0 items-center justify-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === step ? 22 : 8,
              background:
                i <= step ? "var(--primary)" : "color-mix(in oklab, var(--primary) 18%, transparent)",
              boxShadow: i === step ? "var(--shadow-glow-primary)" : undefined,
            }}
          />
        ))}
      </div>
      {/* Lockie + plant duo */}
      <div className="flex shrink-0 items-end justify-center gap-3">
        <Lockie mood={mood} size={72} />
        <Plant stage={plantStage} size={92} excited={excited} />
      </div>
      <h2 className="shrink-0 text-center text-lg font-medium tracking-tight text-foreground">
        {title}
      </h2>
      <div className="scroll-hidden flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-y-contain pb-1">
        {children}
      </div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
