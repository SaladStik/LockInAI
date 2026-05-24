export function GardenStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "warning" | "accent";
}) {
  const color =
    tone === "primary"
      ? "var(--primary-glow)"
      : tone === "warning"
        ? "var(--warning)"
        : "var(--accent-glow)";
  return (
    <div
      className="glass flex flex-1 flex-col items-center rounded-xl py-2"
      style={{
        boxShadow: `0 0 24px -10px ${color}`,
      }}
    >
      <span
        className="font-mono text-lg font-semibold tabular-nums"
        style={{ color, textShadow: `0 0 12px ${color}` }}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
