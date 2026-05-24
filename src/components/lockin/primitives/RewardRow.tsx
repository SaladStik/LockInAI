export function RewardRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass flex items-center justify-between rounded-xl px-4 py-2.5">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-sm font-semibold text-primary-glow text-glow">
        {value}
      </span>
    </div>
  );
}
