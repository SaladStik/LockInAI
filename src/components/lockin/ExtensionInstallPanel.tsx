import { useEffect, useState } from "react";
import { ChevronRight, Copy, FolderOpen, Puzzle } from "lucide-react";
import { Lockie } from "@/components/lockin/Lockie";
import { PrimaryButton } from "@/components/lockin/primitives";

type ExtensionInfo = {
  path: string | null;
  connected: boolean;
  installUrl: string | null;
};

export function ExtensionInstallPanel({
  compact = false,
  onNext,
}: {
  compact?: boolean;
  onNext?: () => void;
}) {
  const [info, setInfo] = useState<ExtensionInfo>({ path: null, connected: false, installUrl: null });
  const [opening, setOpening] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    let stopped = false;
    async function refresh() {
      const next = await api!.extension.getPath();
      if (!stopped) setInfo(next);
    }
    refresh();
    const t = window.setInterval(refresh, 1500);
    return () => {
      stopped = true;
      window.clearInterval(t);
    };
  }, []);

  async function openInstaller() {
    setOpening(true);
    try {
      const next = await window.electronAPI?.extension.openInstall();
      if (next) setInfo((cur) => ({ ...cur, ...next, connected: cur.connected }));
    } finally {
      setOpening(false);
    }
  }

  async function revealFolder() {
    const next = await window.electronAPI?.extension.revealFolder();
    if (next?.path) setInfo((cur) => ({ ...cur, path: next.path ?? cur.path }));
  }

  async function copyPath() {
    const next = await window.electronAPI?.extension.copyPath();
    if (next?.copied) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
    if (next?.path) setInfo((cur) => ({ ...cur, path: next.path ?? cur.path }));
  }

  const { connected, path } = info;

  return (
    <div className={compact ? "space-y-3" : "flex h-full flex-col"}>
      {!compact && (
        <>
          <div className="flex items-end justify-center gap-3 pt-2">
            <Lockie mood={connected ? "excited" : "curious"} size={64} />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/30 text-primary-glow">
              <Puzzle size={22} />
            </div>
          </div>

          <div className="mt-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
              browser extension
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              Plug Lockie into your browser
            </h2>
            <p className="mt-1 px-2 text-[11px] leading-relaxed text-muted-foreground">
              The companion extension lets Lockie see your active tab and steer you back when you
              wander.
            </p>
          </div>
        </>
      )}

      {compact && (
        <div>
          <div className="text-[11px] font-medium text-foreground">Browser extension</div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Load the bundled companion extension in Chrome, Edge, Brave, Arc, or Vivaldi so Lockie
            can see your tabs during focus sessions.
          </p>
        </div>
      )}

      <div
        className={`glass flex items-center justify-between rounded-xl px-3 py-2.5 ${compact ? "" : "mt-4"}`}
        style={
          connected
            ? {
                boxShadow: "0 0 18px -10px var(--primary-glow)",
                borderColor: "var(--primary-glow)",
              }
            : undefined
        }
      >
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: connected ? "var(--primary-glow)" : "var(--muted-foreground)",
              boxShadow: connected ? "0 0 8px var(--primary-glow)" : undefined,
            }}
          />
          <span className="text-[12px] font-medium text-foreground">
            {connected ? "Extension connected" : "Waiting for extension…"}
          </span>
        </div>
        {connected && (
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow">
            ready
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border/40 bg-secondary/20 px-3 py-2.5">
        <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
          extension folder
        </div>
        <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-foreground">
          {path ?? "Preparing extension folder…"}
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
          In your browser, open <span className="font-mono text-foreground">chrome://extensions</span>
          , turn on Developer mode, click <span className="text-foreground">Load unpacked</span>,
          then select this folder.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={revealFolder}
            disabled={!path}
            className="flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.15em] text-foreground transition hover:bg-secondary/40 disabled:opacity-40"
          >
            <FolderOpen size={11} /> Reveal folder
          </button>
          <button
            type="button"
            onClick={copyPath}
            disabled={!path}
            className="flex items-center gap-1 rounded-lg border border-border/50 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.15em] text-foreground transition hover:bg-secondary/40 disabled:opacity-40"
          >
            <Copy size={11} /> {copied ? "Copied" : "Copy path"}
          </button>
        </div>
      </div>

      {!compact && (
        <ol className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
          <li>
            <span className="text-foreground">1.</span> Click{" "}
            <span className="text-foreground">Open browser & reveal folder</span> below.
          </li>
          <li>
            <span className="text-foreground">2.</span> Toggle{" "}
            <span className="text-foreground">Developer mode</span> on the extensions page.
          </li>
          <li>
            <span className="text-foreground">3.</span> Click{" "}
            <span className="text-foreground">Load unpacked</span> and pick the highlighted folder.
          </li>
        </ol>
      )}

      <div className={compact ? "space-y-2" : "mt-auto flex flex-col gap-2"}>
        {onNext && connected ? (
          <PrimaryButton onClick={onNext}>
            Let's go <ChevronRight size={16} />
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={openInstaller} disabled={opening || !path}>
            {opening ? "Opening…" : "Open browser & reveal folder"}{" "}
            {!compact && <ChevronRight size={16} />}
          </PrimaryButton>
        )}
        {!compact && (
          <p className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            {connected ? "extension ready" : "waiting for extension…"}
          </p>
        )}
      </div>
    </div>
  );
}
