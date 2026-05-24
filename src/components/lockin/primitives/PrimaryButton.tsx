export function PrimaryButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98] ${className}`}
      style={{
        background: "var(--gradient-leaf)",
        boxShadow: "var(--shadow-glow-primary)",
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
