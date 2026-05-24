import type { useActiveApp } from "@/hooks/useActiveApp";

export function ActiveAppFooter({
  snapshot,
  error,
}: {
  snapshot: ReturnType<typeof useActiveApp>["snapshot"];
  error: ReturnType<typeof useActiveApp>["error"];
}) {
  if (error?.kind === "needs-accessibility") {
    return (
      <button
        type="button"
        onClick={() => window.electronAPI?.openAccessibilitySettings()}
        className="absolute bottom-0 left-0 right-0 z-30 flex h-6 items-center justify-center gap-1.5 border-t border-warning/40 bg-warning/10 px-4 text-warning backdrop-blur-md transition hover:bg-warning/20"
      >
        <span className="h-1 w-1 rounded-full bg-warning" />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em]">
          {typeof navigator !== "undefined" && /win/i.test(navigator.platform)
            ? "app detection unavailable →"
            : "grant accessibility →"}
        </span>
      </button>
    );
  }

  if (error?.kind === "needs-screen-recording") {
    return (
      <button
        type="button"
        onClick={() => window.electronAPI?.openScreenRecordingSettings()}
        className="absolute bottom-0 left-0 right-0 z-30 flex h-6 items-center justify-center gap-1.5 border-t border-warning/40 bg-warning/10 px-4 text-warning backdrop-blur-md transition hover:bg-warning/20"
      >
        <span className="h-1 w-1 rounded-full bg-warning" />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em]">
          grant screen recording →
        </span>
      </button>
    );
  }

  if (error?.kind === "unknown" && error.message) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-30 flex h-6 items-center justify-center gap-1.5 border-t border-warning/40 bg-warning/10 px-4 text-warning backdrop-blur-md">
        <span className="truncate font-mono text-[9px] uppercase tracking-[0.2em]">
          detection error · restart app
        </span>
      </div>
    );
  }

  const label = snapshot?.app ?? "listening…";
  const subtitle = snapshot?.url
    ? formatHost(snapshot.url)
    : snapshot?.title
      ? truncate(snapshot.title, 32)
      : null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex h-6 items-center justify-center gap-1.5 border-t border-border/30 bg-background/40 px-4 backdrop-blur-md">
      <span
        className="h-1 w-1 rounded-full bg-primary-glow"
        style={{ boxShadow: "0 0 6px var(--primary-glow)" }}
      />
      <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        now in:
      </span>
      <span className="truncate text-[10px] font-medium text-foreground">{label}</span>
      {subtitle && (
        <span className="truncate text-[10px] text-muted-foreground">— {subtitle}</span>
      )}
    </div>
  );
}

function formatHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? truncate(u.pathname, 18) : "");
  } catch {
    return truncate(url, 24);
  }
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}
