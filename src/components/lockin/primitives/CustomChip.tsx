import { Plus, X } from "lucide-react";

export function CustomChip({
  name,
  active,
  onToggle,
  onRemove,
}: {
  name: string;
  active: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all"
      style={{
        border: active
          ? "1px solid color-mix(in oklab, var(--primary) 60%, transparent)"
          : "1px solid var(--border)",
        background: active
          ? "color-mix(in oklab, var(--primary) 18%, transparent)"
          : "oklch(1 0 0 / 3%)",
        color: active ? "var(--primary-glow)" : "var(--foreground)",
        boxShadow: active ? "var(--shadow-glow-primary)" : undefined,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-1.5 outline-none"
      >
        {!active && <Plus size={12} />}
        {name}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="flex h-4 w-4 items-center justify-center rounded-full opacity-70 transition hover:bg-destructive/20 hover:text-destructive hover:opacity-100"
      >
        <X size={11} />
      </button>
    </div>
  );
}
