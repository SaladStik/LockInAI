export function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
      {children}
    </button>
  );
}
