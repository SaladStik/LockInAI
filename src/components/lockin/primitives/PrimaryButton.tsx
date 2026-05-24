export function PrimaryButton({
  children,
  onClick,
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-medium text-primary-foreground transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ${className}`}
      style={{
        background: "var(--gradient-leaf)",
        // Pulled-in glow so it fades within the popup instead of clipping square.
        boxShadow: "0 0 34px -12px color-mix(in oklab, var(--primary) 70%, transparent)",
      }}
    >
      <span
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(1 0 0 / 30%), transparent)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s linear infinite",
        }}
      />
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  );
}
