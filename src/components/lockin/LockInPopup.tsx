import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Flame,
  Sparkles,
  Plus,
  X,
  Lock,
  AlertTriangle,
  ChevronRight,
  Leaf,
  ArrowLeft,
  Trophy,
  Volume2,
  VolumeX,
  Settings as SettingsIcon,
} from "lucide-react";
import { Plant } from "./Plant";
import { Particles } from "./Particles";
import { CircularTimer } from "./CircularTimer";
import { Lockie, type LockieMood } from "./Lockie";
import { SettingsScreen } from "./SettingsScreen";
import { useActiveApp } from "@/hooks/useActiveApp";
import { useCustomApps } from "@/hooks/useCustomApps";
import { useCustomSites } from "@/hooks/useCustomSites";
import {
  buildAchievements,
  streakSkin,
  streakSkinLabel,
  type Achievement,
} from "./achievements";
import { isAllowedFocusApp, ALWAYS_ALLOWED_HOSTS, hostnameOf } from "@/lib/apps";
import { speak, setVoiceMuted, isVoiceMuted } from "@/lib/voice";

type Screen =
  | "welcome"
  | "subject"
  | "time"
  | "apps"
  | "sites"
  | "confirm"
  | "focus"
  | "complete"
  | "garden"
  | "achievements"
  | "settings";

const SUBJECTS = ["Math", "Coding", "Reading", "Writing", "Exam Prep"];
const ALL_APPS = ["Chrome", "VSCode", "Notion", "YouTube", "PDF Viewer", "Figma", "Spotify"];
const ALL_SITES = [
  "chatgpt.com",
  "claude.ai",
  "github.com",
  "stackoverflow.com",
  "developer.mozilla.org",
  "youtube.com",
];

type PlantStatus = "alive" | "dead";
interface GardenPlant {
  id: string;
  name: string;
  stage: number;
  status: PlantStatus;
  days: number;
  subject: string;
}

const INITIAL_GARDEN: GardenPlant[] = [
  { id: "p1", name: "Aurora", stage: 4, status: "alive", days: 23, subject: "Coding" },
  { id: "p2", name: "Sprig", stage: 3, status: "alive", days: 14, subject: "Math" },
  { id: "p3", name: "Ember", stage: 2, status: "alive", days: 7, subject: "Reading" },
  { id: "p4", name: "Mossy", stage: 0, status: "dead", days: 2, subject: "Writing" },
  { id: "p5", name: "Vine", stage: 1, status: "dead", days: 4, subject: "Exam Prep" },
  { id: "p6", name: "Lumen", stage: 2, status: "dead", days: 9, subject: "Coding" },
];

export function LockInPopup() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [subject, setSubject] = useState<string>("Coding");
  const [minutes, setMinutes] = useState<number>(25);
  const [apps, setApps] = useState<string[]>(["Chrome", "VSCode", "Notion"]);
  const [sites, setSites] = useState<string[]>(["chatgpt.com", "github.com"]);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [streak] = useState<number>(7);
  const [xp, setXp] = useState<number>(640);
  const [stage, setStage] = useState<number>(2);
  const [breach, setBreach] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [emergencyExit, setEmergencyExit] = useState<boolean>(false);
  const [garden, setGarden] = useState<GardenPlant[]>(INITIAL_GARDEN);
  const [totalSessions, setTotalSessions] = useState<number>(12);
  const [longestSessionMin, setLongestSessionMin] = useState<number>(45);
  const [voiceOn, setVoiceOn] = useState<boolean>(!isVoiceMuted());
  const [breachCount, setBreachCount] = useState<number>(0);
  const MAX_BREACHES = 3;
  const breachTimer = useRef<number | null>(null);
  const focusAllowedRef = useRef(true);
  // The app the user was already in when they locked in — don't fire a breach
  // until they switch away from it.
  const sessionStartGraceRef = useRef<string | null>(null);
  const hasNativeAppDetection =
    typeof window !== "undefined" && Boolean(window.electronAPI);

  const skin = streakSkin(streak);
  const skinLabel = streakSkinLabel(skin);
  const { snapshot: activeApp, error: activeAppError } = useActiveApp();
  const { apps: customApps, addApp: addCustomApp, removeApp: removeCustomApp } = useCustomApps();
  const {
    sites: customSites,
    addSite: addCustomSite,
    removeSite: removeCustomSite,
  } = useCustomSites();

  // Tell the main process which apps + sites are allowed so it can snap back.
  useEffect(() => {
    if (!hasNativeAppDetection) return;
    window.electronAPI?.syncFocusSession(screen === "focus", apps, sites);
    if (screen !== "focus") {
      focusAllowedRef.current = true;
      sessionStartGraceRef.current = null;
    }
  }, [screen, apps, sites, hasNativeAppDetection]);

  useEffect(() => {
    if (!hasNativeAppDetection) return;
    const off = window.electronAPI?.onFocusRestored((info) => {
      // Main snapped focus back to an allowed window — fire breach feedback
      // here too as a safety net in case the disallowed snapshot was deduped.
      if (focusAllowedRef.current) {
        focusAllowedRef.current = false;
        triggerBreach(info?.blocked ?? "blocked app");
        setBreachCount((c) => {
          const next = c + 1;
          if (next >= MAX_BREACHES) {
            window.setTimeout(() => emergencyExitNow(), 300);
          }
          return next;
        });
      }
    });
    return () => off?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNativeAppDetection]);

  // Tick the focus timer
  useEffect(() => {
    if (screen !== "focus") return;
    if (secondsLeft <= 0) {
      setScreen("complete");
      setXp((x) => x + 50);
      setTotalSessions((n) => n + 1);
      setLongestSessionMin((m) => Math.max(m, minutes));
      setStage((s) => {
        const next = Math.min(4, s + 1);
        setGarden((g) => [
          {
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: randomPlantName(),
            stage: next,
            status: "alive",
            days: 1,
            subject,
          },
          ...g,
        ]);
        return next;
      });
      speak("Session complete. Your plant bloomed.");
      return;
    }
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [screen, secondsLeft]);

  // Focus protection: OS-level app detection in Electron (Windows/macOS/Linux).
  useEffect(() => {
    if (screen !== "focus" || !hasNativeAppDetection || !activeApp) return;

    // Grace: the app the user already had open at lock-in time doesn't count
    // as a breach. The grace clears as soon as they switch to anything else.
    const currentKey = `${activeApp.app}|${activeApp.url ?? ""}`;
    if (sessionStartGraceRef.current === currentKey) return;
    if (sessionStartGraceRef.current !== null) {
      sessionStartGraceRef.current = null;
    }

    const allowed = isAllowedFocusApp(activeApp, apps, sites);
    if (allowed) {
      focusAllowedRef.current = true;
      return;
    }

    // Still on a disallowed app — only count one breach per leave.
    if (!focusAllowedRef.current) return;
    focusAllowedRef.current = false;

    triggerBreach(activeApp.app);
    setBreachCount((c) => {
      const next = c + 1;
      if (next >= MAX_BREACHES) {
        window.setTimeout(() => emergencyExitNow(), 300);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, activeApp, apps, sites, hasNativeAppDetection]);

  // Browser fallback when not running inside Electron.
  useEffect(() => {
    if (screen !== "focus" || hasNativeAppDetection) return;
    const onHidden = () => {
      triggerBreach("tab hidden");
      setBreachCount((c) => {
        const next = c + 1;
        if (next >= MAX_BREACHES) {
          window.setTimeout(() => emergencyExitNow(), 300);
        }
        return next;
      });
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") onHidden();
    };
    const handleBlur = () => onHidden();
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, hasNativeAppDetection]);

  function triggerBreach(_reason?: string) {
    setBreach(true);
    if (breachTimer.current) window.clearTimeout(breachTimer.current);
    breachTimer.current = window.setTimeout(() => setBreach(false), 2400);
    speak("Focus interrupted.");
  }

  function startSession() {
    setSecondsLeft(minutes * 60);
    setEmergencyExit(false);
    setBreachCount(0);
    setBreach(false);
    focusAllowedRef.current = true;
    // Don't trigger a breach for the app the user was already in — wait until
    // they actually switch to something else.
    sessionStartGraceRef.current = activeApp
      ? `${activeApp.app}|${activeApp.url ?? ""}`
      : null;
    setScreen("focus");
    setToast("LOCKED IN");
    window.setTimeout(() => setToast(null), 1800);
    speak(`Locked in for ${minutes} minutes. You've got this.`);
  }

  function emergencyExitNow() {
    setEmergencyExit(true);
    setTotalSessions((n) => n + 1);
    setGarden((g) => [
      {
        id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: randomPlantName(),
        stage: Math.max(0, stage - 1),
        status: "dead",
        days: 1,
        subject,
      },
      ...g,
    ]);
    setScreen("complete");
    speak("Streak broken. Your Lockie is disappointed.");
  }

  function toggleVoice() {
    const next = !voiceOn;
    setVoiceOn(next);
    setVoiceMuted(!next);
    if (next) speak("Voice cues on.");
  }

  const totalSeconds = minutes * 60;
  const progress = screen === "focus" ? 1 - secondsLeft / totalSeconds : 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div
      className="relative h-[680px] w-[400px] overflow-hidden rounded-[28px] bg-popup shadow-popup"
      style={{ border: "1px solid oklch(1 0 0 / 8%)" }}
    >
      {/* aurora bg */}
      <div className="absolute inset-0 bg-aurora" />
      <div className="absolute inset-0 opacity-40">
        <Particles count={28} color="var(--primary-glow)" />
      </div>

      {/* breach overlay */}
      <AnimatePresence>
        {breach && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-30"
            style={{
              background:
                "radial-gradient(circle at center, transparent 50%, color-mix(in oklab, var(--warning) 35%, transparent))",
            }}
          />
        )}
      </AnimatePresence>

      {/* faux window chrome */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4">
        <div className="group flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Close window"
            onClick={() => window.electronAPI?.windowClose()}
            className="h-3 w-3 rounded-full bg-destructive/80 transition hover:bg-destructive"
          />
          <button
            type="button"
            aria-label="Minimize window"
            onClick={() => window.electronAPI?.windowMinimize()}
            className="h-3 w-3 rounded-full bg-warning/80 transition hover:bg-warning"
          />
          <button
            type="button"
            aria-label="Maximize window"
            onClick={() => window.electronAPI?.windowMaximize()}
            className="h-3 w-3 rounded-full bg-primary/80 transition hover:bg-primary"
          />
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          LOCK<span className="text-primary">//</span>IN · AI
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleVoice}
            aria-label="Toggle voice"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-foreground transition hover:bg-secondary/70"
          >
            {voiceOn ? <Volume2 size={11} /> : <VolumeX size={11} />}
          </button>
          <button
            onClick={() =>
              setScreen((s) =>
                screen === "focus" ? s : s === "settings" ? "welcome" : "settings",
              )
            }
            disabled={screen === "focus"}
            aria-label="Settings"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-foreground transition hover:bg-secondary/70 disabled:opacity-30"
          >
            <SettingsIcon size={11} />
          </button>
          <button
            onClick={() =>
              setScreen((s) =>
                screen === "focus" ? s : s === "achievements" ? "welcome" : "achievements",
              )
            }
            disabled={screen === "focus"}
            aria-label="Achievements"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-warning transition hover:bg-secondary/70 disabled:opacity-30"
          >
            <Trophy size={11} />
          </button>
          <button
            onClick={() =>
              setScreen((s) =>
                screen === "focus" ? s : s === "garden" ? "welcome" : "garden",
              )
            }
            disabled={screen === "focus"}
            aria-label="Open garden"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-primary-glow transition hover:bg-secondary/70 disabled:opacity-30"
          >
            <Leaf size={11} />
          </button>
        </div>
      </div>

      {/* screen body */}
      <div className={`relative z-10 h-[calc(100%-72px)] ${breach ? "animate-shake-soft" : ""}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col px-6 pb-6 pt-3"
          >
            {screen === "welcome" && (
              <WelcomeScreen
                onNext={() => setScreen("subject")}
                skin={skin}
                skinLabel={skinLabel}
                streak={streak}
              />
            )}
            {screen === "subject" && (
              <SubjectScreen
                subject={subject}
                setSubject={setSubject}
                onNext={() => setScreen("time")}
              />
            )}
            {screen === "time" && (
              <TimeScreen
                minutes={minutes}
                setMinutes={setMinutes}
                onNext={() => setScreen("apps")}
              />
            )}
            {screen === "apps" && (
              <AppsScreen
                apps={apps}
                setApps={setApps}
                customApps={customApps}
                detectedAppName={activeApp?.app ?? null}
                onAddCustom={addCustomApp}
                onRemoveCustom={removeCustomApp}
                onNext={() => setScreen("sites")}
              />
            )}
            {screen === "sites" && (
              <SitesScreen
                sites={sites}
                setSites={setSites}
                customSites={customSites}
                detectedHost={hostnameOf(activeApp?.url)}
                onAddCustom={addCustomSite}
                onRemoveCustom={removeCustomSite}
                onNext={() => setScreen("confirm")}
              />
            )}
            {screen === "confirm" && (
              <ConfirmScreen
                subject={subject}
                minutes={minutes}
                apps={apps}
                onLock={startSession}
              />
            )}
            {screen === "focus" && (
              <FocusScreen
                mm={mm}
                ss={ss}
                progress={progress}
                subject={subject}
                apps={apps}
                sites={sites}
                streak={streak}
                xp={xp}
                stage={stage}
                warning={breach}
                activeApp={activeApp}
                appDetection={hasNativeAppDetection}
                onEmergencyExit={emergencyExitNow}
                breachCount={breachCount}
                maxBreaches={MAX_BREACHES}
                skin={skin}
              />
            )}
            {screen === "complete" && (
              <CompleteScreen
                minutes={minutes}
                stage={stage}
                broken={emergencyExit}
                onAgain={() => {
                  setEmergencyExit(false);
                  setScreen("subject");
                }}
                onGarden={() => setScreen("garden")}
                skin={skin}
              />
            )}
            {screen === "garden" && (
              <GardenScreen
                plants={garden}
                onBack={() => setScreen("welcome")}
              />
            )}
            {screen === "achievements" && (
              <AchievementsScreen
                ctx={{
                  streak,
                  xp,
                  totalSessions,
                  aliveCount: garden.filter((p) => p.status === "alive").length,
                  deadCount: garden.filter((p) => p.status === "dead").length,
                  longestSessionMin,
                }}
                skinLabel={skinLabel}
                onBack={() => setScreen("welcome")}
              />
            )}
            {screen === "settings" && (
              <SettingsScreen onBack={() => setScreen("welcome")} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full px-5 py-2 text-[11px] font-medium uppercase tracking-[0.3em]"
            style={{
              background: "color-mix(in oklab, var(--primary) 18%, transparent)",
              border: "1px solid color-mix(in oklab, var(--primary) 40%, transparent)",
              color: "var(--primary-glow)",
              boxShadow: "var(--shadow-glow-primary)",
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <ActiveAppFooter snapshot={activeApp} error={activeAppError} />
    </div>
  );
}

/* ============ SCREENS ============ */

function WelcomeScreen({
  onNext,
  skin,
  skinLabel,
  streak,
}: {
  onNext: () => void;
  skin: import("./achievements").LockieSkin;
  skinLabel: string | null;
  streak: number;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-between text-center">
      <div className="pt-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-glow">
          Welcome
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-glow">
          Meet your Lockie
        </h1>
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-2">
        <Lockie mood="curious" size={120} skin={skin} />
        <Plant stage={0} size={130} />
        {skinLabel && (
          <div
            className="font-mono text-[9px] uppercase tracking-[0.3em]"
            style={{ color: "var(--warning)" }}
          >
            ★ {skinLabel} · {streak}d streak
          </div>
        )}
      </div>

      <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
        Focus helps <span className="text-accent-glow">both of them</span> grow.
      </p>

      <div className="mt-5 flex items-center gap-4">
        <Stat icon={<Flame size={12} />} label="0 day streak" />
        <Stat icon={<Sparkles size={12} />} label="0 XP" />
      </div>

      <PrimaryButton onClick={onNext} className="mt-6">
        Start locking in
      </PrimaryButton>
    </div>
  );
}

function SubjectScreen({
  subject,
  setSubject,
  onNext,
}: {
  subject: string;
  setSubject: (s: string) => void;
  onNext: () => void;
}) {
  return (
    <SetupShell step={1} title="What are you locking into?" plantStage={0} excited>
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <Chip key={s} active={s === subject} onClick={() => setSubject(s)}>
            {s}
          </Chip>
        ))}
        <Chip onClick={() => {}}>
          <Plus size={12} /> Custom
        </Chip>
      </div>
      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}

function TimeScreen({
  minutes,
  setMinutes,
  onNext,
}: {
  minutes: number;
  setMinutes: (n: number) => void;
  onNext: () => void;
}) {
  // Snap to 5 min
  const handle = (v: number) => setMinutes(Math.max(5, Math.round(v / 5) * 5));
  const stage = minutes >= 60 ? 3 : minutes >= 30 ? 2 : 1;
  const intensity = Math.min(1, minutes / 90);

  return (
    <SetupShell step={2} title="How long will you focus?" plantStage={stage} excited={minutes >= 45}>
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex items-baseline gap-2 text-glow">
          <span className="text-6xl font-semibold tabular-nums tracking-tight text-foreground">
            {minutes}
          </span>
          <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground">min</span>
        </div>
        <GlowSlider value={minutes} min={5} max={120} onChange={handle} intensity={intensity} />
        <div className="flex w-full justify-between px-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>5m</span>
          <span>flow state</span>
          <span>120m</span>
        </div>
      </div>
      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}

function AppsScreen({
  apps,
  setApps,
  customApps,
  detectedAppName,
  onAddCustom,
  onRemoveCustom,
  onNext,
}: {
  apps: string[];
  setApps: (a: string[]) => void;
  customApps: import("@/types/electron").CustomApp[];
  detectedAppName: string | null;
  onAddCustom: (name: string) => Promise<import("@/types/electron").CustomApp | null>;
  onRemoveCustom: (id: number) => Promise<void>;
  onNext: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customNames = customApps.map((c) => c.name.toLowerCase());
  const allKnownNames = [...ALL_APPS.map((a) => a.toLowerCase()), ...customNames];
  const defaults = ALL_APPS.filter((a) => !customNames.includes(a.toLowerCase()));

  // The user clicks +, then alt-tabs to the target app. While they're gone,
  // useActiveApp keeps updating detectedAppName. When they return, the latest
  // detected value is the app they were just in.
  const candidate = adding ? detectedAppName : null;
  const candidateExists =
    candidate != null && allKnownNames.includes(candidate.toLowerCase());

  const toggle = (a: string) =>
    setApps(apps.includes(a) ? apps.filter((x) => x !== a) : [...apps, a]);

  function openAddForm() {
    setError(null);
    setAdding(true);
  }

  function cancelAdd() {
    setAdding(false);
    setError(null);
  }

  async function commitAdd() {
    if (!candidate) return;
    if (candidateExists) {
      setError(`"${candidate}" is already in your list`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await onAddCustom(candidate);
      if (created) setApps([...apps.filter((x) => x !== created.name), created.name]);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function removeCustom(id: number, name: string) {
    await onRemoveCustom(id);
    setApps(apps.filter((x) => x.toLowerCase() !== name.toLowerCase()));
  }

  return (
    <SetupShell step={3} title="Allowed apps" plantStage={2}>
      <div className="flex flex-wrap gap-2">
        {defaults.map((a) => (
          <Chip key={a} active={apps.includes(a)} onClick={() => toggle(a)}>
            {apps.includes(a) ? null : <Plus size={12} />}
            {a}
            {apps.includes(a) && <X size={12} />}
          </Chip>
        ))}
        {customApps.map((c) => (
          <CustomChip
            key={c.id}
            name={c.name}
            active={apps.includes(c.name)}
            onToggle={() => toggle(c.name)}
            onRemove={() => removeCustom(c.id, c.name)}
          />
        ))}
        {!adding && (
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary-glow/60 hover:text-foreground"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-primary-glow/40 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-primary-glow"
              style={{ boxShadow: "0 0 8px var(--primary-glow)" }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow">
              listening
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Open the app you want to add, then come back to this window.
          </p>

          <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
            {candidate ? (
              <>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                  last detected
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {candidate}
                </div>
                {candidateExists && (
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-warning">
                    already in your list
                  </div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-muted-foreground">
                Switch to any app and I'll catch it…
              </div>
            )}
          </div>

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelAdd}
              disabled={saving}
              className="flex-1 rounded-lg border border-border/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commitAdd}
              disabled={saving || !candidate || candidateExists}
              className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            >
              {saving
                ? "Saving…"
                : candidate
                  ? `Add "${candidate}"`
                  : "Waiting…"}
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Anything outside this list will gently nudge your plant.
      </p>
      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}

function SitesScreen({
  sites,
  setSites,
  customSites,
  detectedHost,
  onAddCustom,
  onRemoveCustom,
  onNext,
}: {
  sites: string[];
  setSites: (s: string[]) => void;
  customSites: import("@/types/electron").CustomSite[];
  detectedHost: string | null;
  onAddCustom: (host: string) => Promise<import("@/types/electron").CustomSite | null>;
  onRemoveCustom: (id: number) => Promise<void>;
  onNext: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customHosts = customSites.map((c) => c.host.toLowerCase());
  const allKnownHosts = [...ALL_SITES.map((s) => s.toLowerCase()), ...customHosts];
  const defaults = ALL_SITES.filter((s) => !customHosts.includes(s.toLowerCase()));

  const candidate = adding ? detectedHost : null;
  const candidateExists =
    candidate != null && allKnownHosts.includes(candidate.toLowerCase());

  const toggle = (s: string) =>
    setSites(sites.includes(s) ? sites.filter((x) => x !== s) : [...sites, s]);

  function openAddForm() {
    setError(null);
    setAdding(true);
  }

  function cancelAdd() {
    setAdding(false);
    setError(null);
  }

  async function commitAdd() {
    if (!candidate) return;
    if (candidateExists) {
      setError(`"${candidate}" is already in your list`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await onAddCustom(candidate);
      if (created) setSites([...sites.filter((x) => x !== created.host), created.host]);
      setAdding(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function removeCustom(id: number, host: string) {
    await onRemoveCustom(id);
    setSites(sites.filter((x) => x.toLowerCase() !== host.toLowerCase()));
  }

  return (
    <SetupShell step={4} title="Allowed websites" plantStage={3}>
      <div className="rounded-xl border border-primary-glow/30 bg-primary/5 px-3 py-2">
        <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow">
          always allowed
        </div>
        <div className="mt-0.5 text-[10px] text-muted-foreground">
          {ALWAYS_ALLOWED_HOSTS.join(" · ")} · new tab pages
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {defaults.map((s) => (
          <Chip key={s} active={sites.includes(s)} onClick={() => toggle(s)}>
            {sites.includes(s) ? null : <Plus size={12} />}
            {s}
            {sites.includes(s) && <X size={12} />}
          </Chip>
        ))}
        {customSites.map((c) => (
          <CustomChip
            key={c.id}
            name={c.host}
            active={sites.includes(c.host)}
            onToggle={() => toggle(c.host)}
            onRemove={() => removeCustom(c.id, c.host)}
          />
        ))}
        {!adding && (
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center gap-1 rounded-full border border-dashed border-border/60 px-3.5 py-1.5 text-xs text-muted-foreground transition hover:border-primary-glow/60 hover:text-foreground"
          >
            <Plus size={12} /> Add
          </button>
        )}
      </div>

      {adding && (
        <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-primary-glow/40 bg-primary/5 p-3">
          <div className="flex items-center gap-2">
            <span
              className="h-2 w-2 animate-pulse rounded-full bg-primary-glow"
              style={{ boxShadow: "0 0 8px var(--primary-glow)" }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-primary-glow">
              listening
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Open the website you want to add in any browser, then come back.
          </p>

          <div className="rounded-xl border border-border/40 bg-background/40 px-3 py-2">
            {candidate ? (
              <>
                <div className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                  last detected
                </div>
                <div className="mt-0.5 truncate text-sm font-medium text-foreground">
                  {candidate}
                </div>
                {candidateExists && (
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-warning">
                    already in your list
                  </div>
                )}
              </>
            ) : (
              <div className="text-[11px] text-muted-foreground">
                Switch to a browser tab and I'll catch the URL…
              </div>
            )}
          </div>

          {error && <p className="text-[10px] text-destructive">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelAdd}
              disabled={saving}
              className="flex-1 rounded-lg border border-border/50 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={commitAdd}
              disabled={saving || !candidate || candidateExists}
              className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
            >
              {saving ? "Saving…" : candidate ? `Add "${candidate}"` : "Waiting…"}
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Other tabs will be auto-closed back to your last allowed page.
      </p>
      <PrimaryButton onClick={onNext} className="mt-auto">
        Continue <ChevronRight size={16} />
      </PrimaryButton>
    </SetupShell>
  );
}

function CustomChip({
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

function ConfirmScreen({
  subject,
  minutes,
  apps,
  onLock,
}: {
  subject: string;
  minutes: number;
  apps: string[];
  onLock: () => void;
}) {
  return (
    <SetupShell step={5} title="Ready to lock in?" plantStage={3} excited>
      <div
        className="glass rounded-2xl p-4"
        style={{ boxShadow: "var(--shadow-glow-accent)" }}
      >
        <Row label="Subject" value={subject} />
        <div className="my-3 h-px bg-border" />
        <Row label="Duration" value={`${minutes} min`} />
        <div className="my-3 h-px bg-border" />
        <Row
          label="Allowed"
          value={
            <div className="flex flex-wrap justify-end gap-1">
              {apps.slice(0, 3).map((a) => (
                <span
                  key={a}
                  className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] text-foreground"
                >
                  {a}
                </span>
              ))}
              {apps.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{apps.length - 3}
                </span>
              )}
            </div>
          }
        />
      </div>

      <button
        onClick={onLock}
        className="group relative mt-auto flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-semibold uppercase tracking-[0.4em] text-primary-foreground transition-transform active:scale-[0.98]"
        style={{
          background: "var(--gradient-leaf)",
          boxShadow: "var(--shadow-glow-primary)",
        }}
      >
        <span
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "linear-gradient(90deg, transparent, oklch(1 0 0 / 30%), transparent)",
            backgroundSize: "200% 100%",
            animation: "shimmer 2.5s linear infinite",
          }}
        />
        <Lock size={16} className="relative" />
        <span className="relative">Lock in</span>
      </button>
    </SetupShell>
  );
}

function FocusScreen({
  mm,
  ss,
  progress,
  subject,
  apps,
  sites,
  streak,
  xp,
  stage,
  warning,
  activeApp,
  appDetection,
  onEmergencyExit,
  breachCount,
  maxBreaches,
  skin,
}: {
  mm: string;
  ss: string;
  progress: number;
  subject: string;
  apps: string[];
  sites: string[];
  streak: number;
  xp: number;
  stage: number;
  warning: boolean;
  activeApp: import("@/types/electron").ActiveAppSnapshot | null;
  appDetection: boolean;
  onEmergencyExit: () => void;
  breachCount: number;
  maxBreaches: number;
  skin: import("./achievements").LockieSkin;
}) {
  const lockieMood: LockieMood = warning ? "worried" : "focused";
  const offApp =
    appDetection &&
    activeApp &&
    !isAllowedFocusApp(activeApp, apps, sites);
  return (
    <div className="flex h-full flex-col items-center">
      {/* Top bar with plant + streak */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <Lockie mood={lockieMood} size={44} skin={skin} />
          <div className="relative h-11 w-11">
            <Plant stage={stage} size={44} health={warning ? 0.5 : 1} />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.3em] text-primary-glow">
              ● Locked in
            </div>
            <div className="text-[11px] text-muted-foreground">{subject}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1 text-[11px] text-foreground">
            <Flame size={11} className="text-warning" /> {streak}d
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles size={10} className="text-accent" /> {xp} XP
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary/40">
        <div
          className="h-full rounded-full"
          style={{
            width: `${(xp % 1000) / 10}%`,
            background: "var(--gradient-leaf)",
            boxShadow: "var(--shadow-glow-primary)",
          }}
        />
      </div>

      {/* Timer */}
      <div className="relative mt-4 flex flex-1 items-center justify-center">
        <CircularTimer progress={progress} size={240} warning={warning}>
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            {warning ? "Focus interrupted" : "Deep focus"}
          </div>
          <div className="mt-1 font-mono text-5xl font-semibold tabular-nums text-foreground text-glow">
            {mm}:{ss}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-primary-glow">
            {subject}
          </div>
        </CircularTimer>
      </div>

      {/* Allowed apps */}
      <div className="mb-3 flex flex-wrap justify-center gap-1.5">
        {apps.slice(0, 4).map((a) => (
          <span
            key={a}
            className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {a}
          </span>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="flex w-full flex-col items-center gap-2">
        <div className="flex w-full items-center justify-center gap-1.5">
          {Array.from({ length: maxBreaches }).map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-6 rounded-full transition-colors"
              style={{
                background:
                  i < breachCount
                    ? "var(--warning)"
                    : "color-mix(in oklab, var(--muted-foreground) 25%, transparent)",
                boxShadow: i < breachCount ? "0 0 10px -2px var(--warning)" : "none",
              }}
            />
          ))}
        </div>
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/70">
          {!appDetection
            ? breachCount === 0
              ? "focus protection active · stay in app"
              : `${maxBreaches - breachCount} breach${maxBreaches - breachCount === 1 ? "" : "es"} remaining`
            : offApp
              ? `outside allowed apps · ${activeApp?.app ?? "unknown"}`
              : breachCount === 0
                ? `watching apps · ${activeApp?.app ?? "…"}`
                : `${maxBreaches - breachCount} breach${maxBreaches - breachCount === 1 ? "" : "es"} remaining`}
        </p>
        <button
          onClick={onEmergencyExit}
          className="group relative flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 text-xs uppercase tracking-[0.3em] text-destructive transition hover:bg-destructive/20"
        >
          <AlertTriangle size={14} /> Emergency exit
        </button>
      </div>
    </div>
  );
}

function CompleteScreen({
  minutes,
  stage,
  broken,
  onAgain,
  onGarden,
  skin,
}: {
  minutes: number;
  stage: number;
  broken: boolean;
  onAgain: () => void;
  onGarden: () => void;
  skin: import("./achievements").LockieSkin;
}) {
  if (broken) {
    return (
      <div className="flex h-full flex-col items-center justify-between text-center">
        <div className="pt-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-warning">
            Streak broken
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            Your Lockie is disappointed
          </h1>
        </div>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-3">
          <Lockie mood="sad" size={120} skin={skin} />
          <Plant stage={Math.max(0, stage - 1)} size={120} health={0.45} />
        </div>
        <p className="max-w-[280px] text-sm leading-relaxed text-muted-foreground">
          The plant dimmed a little. Come back stronger — they're waiting.
        </p>
        <div className="mt-4 flex w-full flex-col gap-2">
          <PrimaryButton onClick={onAgain}>Try again</PrimaryButton>
          <button
            onClick={onGarden}
            className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-primary-glow"
          >
            Visit garden
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col items-center justify-between text-center">
      <div className="pt-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          Perfect session
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground text-glow">
          Your Lockie is thriving
        </h1>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center gap-2">
        <Lockie mood="excited" size={110} skin={skin} />
        <Plant stage={Math.min(4, stage)} size={150} excited />
        <Particles count={18} color="var(--accent-glow)" intensity={1.2} />
      </div>

      <div className="flex w-full flex-col gap-2">
        <RewardRow label="Focus XP" value="+50" />
        <RewardRow label="Plant growth" value="+1" />
        <RewardRow label="Time locked" value={`${minutes}m`} />
      </div>

      <div className="mt-4 flex w-full flex-col gap-2">
        <PrimaryButton onClick={onAgain}>Lock in again</PrimaryButton>
        <button
          onClick={onGarden}
          className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-primary-glow"
        >
          Visit garden
        </button>
      </div>
    </div>
  );
}

/* ============ GARDEN ============ */

const PLANT_NAMES = [
  "Aurora", "Sprig", "Ember", "Mossy", "Vine", "Lumen", "Fern", "Sage",
  "Iris", "Juno", "Rhea", "Zephyr", "Orin", "Sol", "Nova", "Bloom",
];
function randomPlantName() {
  return PLANT_NAMES[Math.floor(Math.random() * PLANT_NAMES.length)];
}

function GardenScreen({
  plants,
  onBack,
}: {
  plants: GardenPlant[];
  onBack: () => void;
}) {
  const alive = plants.filter((p) => p.status === "alive");
  const dead = plants.filter((p) => p.status === "dead");

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back
        </button>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary-glow">
          Your garden
        </h2>
        <div className="w-12" />
      </div>

      {/* Stats */}
      <div className="flex gap-2">
        <GardenStat label="Alive" value={alive.length} tone="primary" />
        <GardenStat label="Lost" value={dead.length} tone="warning" />
        <GardenStat label="Total" value={plants.length} tone="accent" />
      </div>

      {/* Scrollable grid */}
      <div className="-mx-2 flex-1 overflow-y-auto px-2 pb-2">
        {alive.length > 0 && (
          <>
            <SectionLabel>Thriving</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {alive.map((p) => (
                <PlantCard key={p.id} plant={p} />
              ))}
            </div>
          </>
        )}
        {dead.length > 0 && (
          <>
            <SectionLabel className="mt-4">In memoriam</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {dead.map((p) => (
                <PlantCard key={p.id} plant={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.4em] text-muted-foreground ${className}`}
    >
      <span className="h-px flex-1 bg-border" />
      <span>{children}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function GardenStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "warning" | "accent";
}) {
  const color =
    tone === "primary"
      ? "var(--primary-glow)"
      : tone === "warning"
        ? "var(--warning)"
        : "var(--accent-glow)";
  return (
    <div
      className="glass flex flex-1 flex-col items-center rounded-xl py-2"
      style={{
        boxShadow: `0 0 24px -10px ${color}`,
      }}
    >
      <span
        className="font-mono text-lg font-semibold tabular-nums"
        style={{ color, textShadow: `0 0 12px ${color}` }}
      >
        {value}
      </span>
      <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function PlantCard({ plant }: { plant: GardenPlant }) {
  const dead = plant.status === "dead";
  return (
    <div
      className="glass relative flex flex-col items-center overflow-hidden rounded-xl px-2 pb-2 pt-1"
      style={{
        boxShadow: dead
          ? "0 0 18px -10px var(--warning)"
          : "0 0 22px -10px var(--primary)",
        opacity: dead ? 0.65 : 1,
      }}
    >
      {dead && (
        <span
          className="absolute right-1.5 top-1.5 rounded-full px-1.5 py-px font-mono text-[8px] uppercase tracking-[0.2em]"
          style={{
            background: "color-mix(in oklab, var(--warning) 20%, transparent)",
            color: "var(--warning)",
          }}
        >
          †
        </span>
      )}
      <div
        className="flex h-20 w-full items-end justify-center"
        style={{ filter: dead ? "grayscale(0.7) brightness(0.7)" : undefined }}
      >
        <Plant
          stage={plant.stage}
          size={72}
          health={dead ? 0.2 : 1}
        />
      </div>
      <div className="mt-1 w-full text-center">
        <div className="truncate text-[11px] font-medium text-foreground">
          {plant.name}
        </div>
      </div>
    </div>
  );
}

/* ============ PRIMITIVES ============ */

function SetupShell({
  step,
  title,
  plantStage,
  excited,
  children,
}: {
  step: number;
  title: string;
  plantStage: number;
  excited?: boolean;
  children: React.ReactNode;
}) {
  const mood: LockieMood = excited ? "excited" : "curious";
  return (
    <div className="flex h-full flex-col gap-5">
      {/* progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="h-1 rounded-full transition-all"
            style={{
              width: i === step ? 22 : 8,
              background:
                i <= step ? "var(--primary)" : "color-mix(in oklab, var(--primary) 18%, transparent)",
              boxShadow: i === step ? "var(--shadow-glow-primary)" : undefined,
            }}
          />
        ))}
      </div>
      {/* Lockie + plant duo */}
      <div className="flex items-end justify-center gap-3">
        <Lockie mood={mood} size={72} />
        <Plant stage={plantStage} size={92} excited={excited} />
      </div>
      <h2 className="text-center text-lg font-medium tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

function PrimaryButton({
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

function Chip({
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function RewardRow({ label, value }: { label: string; value: string }) {
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

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/30 px-3 py-1 text-[11px] text-muted-foreground">
      <span className="text-warning">{icon}</span>
      {label}
    </div>
  );
}

function GlowSlider({
  value,
  min,
  max,
  onChange,
  intensity,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  intensity: number;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onChange(min + p * (max - min));
  };

  useEffect(() => {
    const move = (e: PointerEvent) => dragging.current && updateFromClientX(e.clientX);
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapMarks = useMemo(() => {
    const arr = [];
    for (let m = min; m <= max; m += 15) arr.push(((m - min) / (max - min)) * 100);
    return arr;
  }, [min, max]);

  return (
    <div
      ref={trackRef}
      onPointerDown={(e) => {
        dragging.current = true;
        updateFromClientX(e.clientX);
      }}
      className="relative h-10 w-full cursor-pointer touch-none select-none"
    >
      <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-secondary/60" />
      <div
        className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full"
        style={{
          width: `${pct}%`,
          background: "var(--gradient-leaf)",
          boxShadow: `0 0 ${10 + intensity * 20}px color-mix(in oklab, var(--primary) ${50 + intensity * 30}%, transparent)`,
        }}
      />
      {snapMarks.map((m, i) => (
        <span
          key={i}
          className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-foreground/15"
          style={{ left: `${m}%` }}
        />
      ))}
      <div
        className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${pct}%`,
          background: "oklch(0.98 0 0)",
          border: "2px solid var(--primary)",
          boxShadow: `0 0 ${12 + intensity * 24}px color-mix(in oklab, var(--primary) ${60 + intensity * 30}%, transparent)`,
        }}
      />
    </div>
  );
}

/* ============ ACHIEVEMENTS ============ */

function AchievementsScreen({
  ctx,
  skinLabel,
  onBack,
}: {
  ctx: import("./achievements").AchievementContext;
  skinLabel: string | null;
  onBack: () => void;
}) {
  const items = buildAchievements(ctx);
  const unlocked = items.filter((a) => a.unlocked).length;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[11px] uppercase tracking-[0.3em] text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={12} /> Back
        </button>
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-warning">
          Achievements
        </h2>
        <div className="w-12" />
      </div>

      {/* Streak reward banner */}
      <div
        className="glass relative overflow-hidden rounded-2xl px-3 py-2.5"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--warning) 14%, transparent), color-mix(in oklab, var(--primary) 8%, transparent))",
          boxShadow: "0 0 24px -10px var(--warning)",
        }}
      >
        <div className="flex items-center gap-2">
          <Flame size={14} className="text-warning" />
          <div className="flex-1">
            <div className="text-[11px] font-medium text-foreground">
              Lockie streak reward
            </div>
            <div className="text-[10px] text-muted-foreground">
              {skinLabel
                ? `Unlocked: ${skinLabel}`
                : `Next reward at 7 days · ${ctx.streak}/7`}
            </div>
          </div>
          <div className="font-mono text-[11px] font-semibold text-warning">
            {unlocked}/{items.length}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="-mx-2 flex-1 overflow-y-auto px-2 pb-1">
        <div className="grid grid-cols-2 gap-2">
          {items.map((a) => (
            <AchievementCard key={a.id} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ a }: { a: Achievement }) {
  const Icon = a.icon;
  const tone =
    a.rarity === "legendary"
      ? "var(--warning)"
      : a.rarity === "rare"
        ? "var(--accent-glow)"
        : "var(--primary-glow)";
  return (
    <div
      className="glass relative flex flex-col gap-1.5 rounded-xl p-2.5"
      style={{
        opacity: a.unlocked ? 1 : 0.55,
        boxShadow: a.unlocked ? `0 0 22px -10px ${tone}` : undefined,
        borderColor: a.unlocked
          ? `color-mix(in oklab, ${tone} 40%, transparent)`
          : undefined,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{
            background: a.unlocked
              ? `color-mix(in oklab, ${tone} 22%, transparent)`
              : "oklch(1 0 0 / 4%)",
            color: a.unlocked ? tone : "var(--muted-foreground)",
            boxShadow: a.unlocked ? `0 0 12px -4px ${tone}` : undefined,
          }}
        >
          <Icon size={13} />
        </div>
        <div className="flex-1 truncate">
          <div className="truncate text-[11px] font-medium text-foreground">
            {a.name}
          </div>
          <div
            className="font-mono text-[8px] uppercase tracking-[0.2em]"
            style={{ color: a.unlocked ? tone : "var(--muted-foreground)" }}
          >
            {a.rarity}
          </div>
        </div>
      </div>
      <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
        {a.description}
      </p>
      {a.progress && !a.unlocked && (
        <div className="mt-0.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/50">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(a.progress.current / a.progress.target) * 100}%`,
                background: tone,
              }}
            />
          </div>
          <div className="mt-0.5 text-right font-mono text-[9px] text-muted-foreground">
            {a.progress.current}/{a.progress.target}
          </div>
        </div>
      )}
    </div>
  );
}

function ActiveAppFooter({
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