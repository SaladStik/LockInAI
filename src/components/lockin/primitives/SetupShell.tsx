import { Lockie, type LockieMood } from "@/components/lockin/Lockie";
import { Plant } from "@/components/lockin/Plant";

export function SetupShell({
  step,
  title,
  plantStage,
  excited,
  children,
}: {
  step: number;
  title: string;
  plantStage: number;
  excited?: boolean;
  children: React.ReactNode;
}) {
  const mood: LockieMood = excited ? "excited" : "curious";
  return (
    <div className="flex h-full flex-col gap-5">
      {/* progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
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
      <div className="flex items-end justify-center gap-3">
        <Lockie mood={mood} size={72} />
        <Plant stage={plantStage} size={92} excited={excited} />
      </div>
      <h2 className="text-center text-lg font-medium tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}
