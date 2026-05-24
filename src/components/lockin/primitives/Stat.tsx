export function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/30 px-3 py-1 text-[11px] text-muted-foreground">
      <span className="text-warning">{icon}</span>
      {label}
    </div>
  );
}
