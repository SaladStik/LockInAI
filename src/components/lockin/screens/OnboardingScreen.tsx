import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRight, Leaf, Lock, Sparkles, Shield, Check, X, Puzzle } from "lucide-react";
import { Lockie } from "../Lockie";
import { Plant } from "@/components/lockin/Plant";
import { PrimaryButton } from "../primitives";
import { markOnboarded } from "@/lib/onboarding";
import type { PermissionsStatus } from "@/types/electron";

type Step =
  | "egg"
  | "hatch"
  | "meet"
  | "intro"
  | "sad"
  | "permissions"
  | "extension"
  | "done";

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("egg");
  const isMac =
    typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  // After the egg-shattering animation finishes, auto-advance to the "meet"
  // beat (which holds with a Continue button — never auto-disappears).
  useEffect(() => {
    if (step !== "hatch") return;
    const t = window.setTimeout(() => setStep("meet"), 2200);
    return () => window.clearTimeout(t);
  }, [step]);

  function finish() {
    markOnboarded();
    onComplete();
  }

  function next() {
    if (step === "egg") setStep("hatch");
    else if (step === "meet") setStep("intro");
    else if (step === "intro") setStep("sad");
    else if (step === "sad") setStep(isMac ? "permissions" : "extension");
    else if (step === "permissions") setStep("extension");
    else if (step === "extension") finish();
  }

  return (
    <div className="flex h-full flex-col px-6 pb-6 pt-3">
      <AnimatePresence mode="wait">
        {step === "egg" && <EggStep key="egg" onHatch={next} />}
        {step === "hatch" && <HatchStep key="hatch" />}
        {step === "meet" && <MeetStep key="meet" onNext={next} />}
        {step === "intro" && <IntroStep key="intro" onNext={next} />}
        {step === "sad" && <SadStep key="sad" onNext={next} />}
        {step === "permissions" && (
          <PermissionsStep key="permissions" onNext={next} onSkip={next} />
        )}
        {step === "extension" && (
          <ExtensionStep key="extension" onNext={finish} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Egg — sits in the popup, gently rocks, waits for the user to tap.
// ---------------------------------------------------------------------------
function EggStep({ onHatch }: { onHatch: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="flex h-full flex-col items-center justify-between"
    >
      <div className="pt-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          welcome
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          Something's in there…
        </h1>
      </div>

      <motion.button
        type="button"
        onClick={onHatch}
        className="relative flex items-center justify-center"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        aria-label="Hatch the egg"
      >
        <motion.div
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <EggSvg size={170} />
        </motion.div>
        {/* glow halo */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 blur-2xl"
          style={{
            background:
              "radial-gradient(circle, color-mix(in oklab, var(--primary) 28%, transparent), transparent 70%)",
          }}
        />
      </motion.button>

      <div className="pb-1 text-center">
        <p className="text-[12px] text-muted-foreground">
          Tap the egg.
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Hatch animation — egg shakes harder, cracks, then Lockie appears.
// ---------------------------------------------------------------------------
function HatchStep() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center"
    >
      <div className="relative flex h-44 items-center justify-center">
        {/* Egg: shakes hard, then shatters away. */}
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            rotate: [-12, 12, -16, 16, -6, 0],
            opacity: [1, 1, 1, 1, 0.6, 0],
            scale: [1, 1, 1, 1, 1.2, 0.4],
          }}
          transition={{ duration: 1.5, times: [0, 0.2, 0.4, 0.6, 0.85, 1] }}
          className="absolute"
        >
          <EggSvg size={170} cracked />
        </motion.div>
        {/* Lockie: emerges after the egg disappears. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.2, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.45, duration: 0.65, type: "spring", bounce: 0.5 }}
          className="absolute"
        >
          <Lockie mood="excited" size={140} />
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.9 }}
        className="mt-6 font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow"
      >
        meet lockie
      </motion.p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 2.5: Meet — Lockie stands in the middle of the popup, waiting for the
// user to actually read "hi, I'm Lockie" before continuing.
// ---------------------------------------------------------------------------
function MeetStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45 }}
      className="flex h-full flex-col items-center justify-between"
    >
      <div className="pt-2 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          meet lockie
        </p>
      </div>

      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Lockie mood="excited" size={140} />
      </motion.div>

      <div className="w-full">
        <h2 className="text-center text-lg font-semibold tracking-tight text-foreground">
          Hi! I'm Lockie.
        </h2>
        <p className="mt-1 px-2 text-center text-[12px] leading-relaxed text-muted-foreground">
          I'll help you stay focused. There are a couple of things you should
          know about me first.
        </p>
        <PrimaryButton onClick={onNext} className="mt-4">
          Continue <ChevronRight size={16} />
        </PrimaryButton>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Intro — Lockie tells the user about plants + locking in.
// ---------------------------------------------------------------------------
function IntroStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col items-center"
    >
      <div className="flex w-full items-end justify-center gap-3 pt-3">
        <Lockie mood="curious" size={80} />
        <Plant stage={2} size={92} excited />
      </div>

      <div className="mt-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          i really like plants
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          Focus grows them.
        </h2>
      </div>

      <div className="mt-5 flex w-full flex-col gap-2.5">
        <Bullet icon={<Lock size={12} />}>
          Every time you <span className="text-primary-glow">lock in</span>,
          a new plant starts growing.
        </Bullet>
        <Bullet icon={<Leaf size={12} />}>
          Stay focused the whole session and it blooms into your{" "}
          <span className="text-primary-glow">garden</span>.
        </Bullet>
        <Bullet icon={<Sparkles size={12} />}>
          The longer you focus, the rarer the plant.
        </Bullet>
      </div>

      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Sad — Lockie shows the user what happens when you bail.
// ---------------------------------------------------------------------------
function SadStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col items-center"
    >
      <div className="flex w-full items-end justify-center gap-3 pt-3">
        <motion.div
          animate={{ y: [0, 2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Lockie mood="sad" size={84} />
        </motion.div>
        <Plant stage={0} size={92} health={0} />
      </div>

      <div className="mt-4 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-warning">
          but…
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          If you bail, the plant dies.
        </h2>
      </div>

      <div className="mt-5 flex w-full flex-col gap-2.5">
        <Bullet
          icon={<X size={12} />}
          tone="warning"
        >
          Switch to a blocked app or quit the session early and the seedling
          withers.
        </Bullet>
        <Bullet icon={<Sparkles size={12} />} tone="warning">
          Dead plants stay in your garden as a little reminder.
        </Bullet>
        <Bullet icon={<Leaf size={12} />} tone="warning">
          And honestly?{" "}
          <span className="text-warning">It really hurts Lockie's feelings.</span>
        </Bullet>
      </div>

      <PrimaryButton onClick={onNext} className="mt-auto">
        I'll try not to <ChevronRight size={16} />
      </PrimaryButton>
    </motion.div>
  );
}

function Bullet({
  icon,
  children,
  tone = "primary",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: "primary" | "warning";
}) {
  const isWarning = tone === "warning";
  return (
    <div className="glass flex items-start gap-2 rounded-xl px-3 py-2">
      <span
        className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          background: isWarning
            ? "color-mix(in oklab, var(--warning) 18%, transparent)"
            : "color-mix(in oklab, var(--primary) 15%, transparent)",
          color: isWarning ? "var(--warning)" : "var(--primary-glow)",
        }}
      >
        {icon}
      </span>
      <p className="text-[11px] leading-relaxed text-foreground/90">{children}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Permissions (macOS only) — confirm Accessibility + Screen Recording.
// ---------------------------------------------------------------------------
function PermissionsStep({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [status, setStatus] = useState<PermissionsStatus | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) {
      onSkip();
      return;
    }
    let stopped = false;
    const probe = api;
    async function load() {
      const s = await probe.getPermissionsStatus();
      if (!stopped) setStatus(s);
    }
    load();
    const t = window.setInterval(load, 1500);
    return () => {
      stopped = true;
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allGranted =
    status?.accessibility === "granted" &&
    status?.screenRecording === "granted";

  async function request(kind: "accessibility" | "screen-recording") {
    setRequesting(true);
    const api = window.electronAPI;
    if (!api) return;
    if (kind === "accessibility") api.openAccessibilitySettings();
    else api.openScreenRecordingSettings();
    setRequesting(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-full flex-col"
    >
      <div className="flex items-end justify-center gap-3 pt-2">
        <Lockie mood={allGranted ? "excited" : "worried"} size={64} />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/30 text-primary-glow">
          <Shield size={22} />
        </div>
      </div>

      <div className="mt-3 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          one more thing
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
          Let Lockie watch your apps
        </h2>
        <p className="mt-1 px-2 text-[11px] leading-relaxed text-muted-foreground">
          macOS needs two permissions so Lockie can tell what you're in and
          gently steer you back during focus.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <PermissionRow
          label="Accessibility"
          state={status?.accessibility}
          onGrant={() => request("accessibility")}
          disabled={requesting}
        />
        <PermissionRow
          label="Screen Recording"
          state={status?.screenRecording}
          onGrant={() => request("screen-recording")}
          disabled={requesting}
        />
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <PrimaryButton onClick={onNext} disabled={!allGranted}>
          {allGranted ? "All set" : "Waiting…"} <ChevronRight size={16} />
        </PrimaryButton>
        {!allGranted && (
          <button
            type="button"
            onClick={onSkip}
            className="font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            skip for now
          </button>
        )}
      </div>
    </motion.div>
  );
}

function PermissionRow({
  label,
  state,
  onGrant,
  disabled,
}: {
  label: string;
  state: PermissionsStatus[keyof PermissionsStatus] | undefined;
  onGrant: () => void;
  disabled: boolean;
}) {
  const granted = state === "granted";
  return (
    <div
      className="glass flex items-center justify-between rounded-xl px-3 py-2.5"
      style={
        granted
          ? { boxShadow: "0 0 18px -10px var(--primary-glow)", borderColor: "var(--primary-glow)" }
          : undefined
      }
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{
            background: granted
              ? "color-mix(in oklab, var(--primary-glow) 25%, transparent)"
              : "color-mix(in oklab, var(--warning) 20%, transparent)",
            color: granted ? "var(--primary-glow)" : "var(--warning)",
          }}
        >
          {granted ? <Check size={11} /> : <X size={11} />}
        </span>
        <div>
          <div className="text-[12px] font-medium text-foreground">{label}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
            {state ?? "checking…"}
          </div>
        </div>
      </div>
      {!granted && (
        <button
          type="button"
          onClick={onGrant}
          disabled={disabled}
          className="rounded-lg border border-primary-glow/40 bg-primary/10 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow transition hover:bg-primary/20 disabled:opacity-50"
        >
          grant →
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Browser extension — open default browser + reveal extension folder.
// ---------------------------------------------------------------------------
function ExtensionStep({ onNext }: { onNext: () => void }) {
  const [connected, setConnected] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    let stopped = false;
    const probe = api;
    async function poll() {
      const s = await probe.extension.status();
      if (!stopped) setConnected(s.connected);
    }
    poll();
    const t = window.setInterval(poll, 1500);
    return () => {
      stopped = true;
      window.clearInterval(t);
    };
  }, []);

  async function openInstaller() {
    setOpening(true);
    try {
      await window.electronAPI?.extension.openInstall();
    } finally {
      setOpening(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex h-full flex-col"
    >
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
          The companion extension lets Lockie see your active tab and steer
          you back when you wander.
        </p>
      </div>

      <div
        className="glass mt-4 flex items-center justify-between rounded-xl px-3 py-2.5"
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

      <ol className="mt-3 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <li>
          <span className="text-foreground">1.</span> Open <span className="font-mono text-foreground">chrome://extensions</span> in your browser.
        </li>
        <li>
          <span className="text-foreground">2.</span> Toggle <span className="text-foreground">Developer mode</span> on (top-right).
        </li>
        <li>
          <span className="text-foreground">3.</span> Click <span className="text-foreground">Load unpacked</span> and pick the highlighted folder.
        </li>
      </ol>

      <div className="mt-auto flex flex-col gap-2">
        {connected ? (
          <PrimaryButton onClick={onNext}>
            Let's go <ChevronRight size={16} />
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={openInstaller} disabled={opening}>
            {opening ? "Opening…" : "Open browser & reveal folder"}{" "}
            <ChevronRight size={16} />
          </PrimaryButton>
        )}
        <p className="text-center font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
          {connected ? "extension ready" : "waiting for extension…"}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Egg SVG — simple ovoid with a soft gradient + optional crack overlay.
// ---------------------------------------------------------------------------
function EggSvg({ size = 160, cracked = false }: { size?: number; cracked?: boolean }) {
  return (
    <svg
      viewBox="0 0 100 130"
      width={size}
      height={(size * 130) / 100}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="egg-body" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="oklch(0.95 0.06 220)" />
          <stop offset="55%" stopColor="oklch(0.78 0.12 220)" />
          <stop offset="100%" stopColor="oklch(0.45 0.12 235)" />
        </radialGradient>
        <radialGradient id="egg-highlight" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="oklch(1 0 0 / 0.7)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
      {/* shadow */}
      <ellipse cx="50" cy="122" rx="22" ry="3" fill="oklch(0 0 0 / 0.45)" />
      {/* egg body — slightly asymmetric ellipse */}
      <path
        d="M50 8 C72 8 86 38 86 70 C86 96 70 118 50 118 C30 118 14 96 14 70 C14 38 28 8 50 8 Z"
        fill="url(#egg-body)"
        stroke="oklch(0.85 0.12 220 / 0.65)"
        strokeWidth="1"
      />
      {/* highlight */}
      <ellipse cx="40" cy="34" rx="13" ry="9" fill="url(#egg-highlight)" />
      {cracked && (
        <g
          stroke="oklch(0.18 0.04 250)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M30 56 L36 62 L32 70 L40 76 L36 84" />
          <path d="M62 50 L58 60 L66 64 L60 72 L68 78" />
          <path d="M46 38 L50 46 L44 52" />
        </g>
      )}
    </svg>
  );
}
