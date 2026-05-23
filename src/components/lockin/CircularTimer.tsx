interface CircularTimerProps {
  progress: number; // 0..1
  size?: number;
  children?: React.ReactNode;
  warning?: boolean;
}

export function CircularTimer({ progress, size = 220, children, warning }: CircularTimerProps) {
  const stroke = 6;
  const r = (size - stroke * 4) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);
  const color = warning ? "var(--warning)" : "var(--primary)";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* outer breath glow */}
      <div
        className="absolute inset-0 rounded-full animate-breathe"
        style={{
          background: `radial-gradient(circle, color-mix(in oklab, ${color} 18%, transparent), transparent 65%)`,
        }}
      />
      <svg width={size} height={size} className="relative -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="oklch(1 0 0 / 6%)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1s linear, stroke 0.4s",
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}