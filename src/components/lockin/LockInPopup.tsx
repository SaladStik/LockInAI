import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Leaf, Trophy, Volume2, VolumeX, Settings as SettingsIcon } from "lucide-react";
import { Particles } from "./Particles";
import { SettingsScreen } from "./SettingsScreen";
import { useActiveApp } from "@/hooks/useActiveApp";
import { useCustomApps } from "@/hooks/useCustomApps";
import { useCustomSites } from "@/hooks/useCustomSites";
import { useCustomSessions } from "@/hooks/useCustomSessions";
import { useGarden } from "@/hooks/useGarden";
import { streakSkin, streakSkinLabel } from "./achievements";
import { isAllowedFocusApp, hostnameOf } from "@/lib/apps";
import { createPlantId, resolvePlantName } from "@/lib/garden";
import { speak, setVoiceMuted, isVoiceMuted } from "@/lib/voice";
import type { Screen } from "./types";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { SubjectScreen } from "./screens/SubjectScreen";
import { TimeScreen } from "./screens/TimeScreen";
import { AppsScreen } from "./screens/AppsScreen";
import { SitesScreen } from "./screens/SitesScreen";
import { ConfirmScreen } from "./screens/ConfirmScreen";
import { FocusScreen } from "./screens/FocusScreen";
import { CompleteScreen } from "./screens/CompleteScreen";
import { AchievementsScreen } from "./screens/AchievementsScreen";
import { GardenScreen } from "./garden/GardenScreen";
import { ActiveAppFooter } from "./ActiveAppFooter";

export function LockInPopup() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [subject, setSubject] = useState<string>("Coding");
  const [sessionKey, setSessionKey] = useState<string>("builtin:Coding");
  const [plantName, setPlantName] = useState<string>("");
  const [activePlantName, setActivePlantName] = useState<string>("");
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
  const { plants: garden, addPlant, clearGarden } = useGarden();
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
  const {
    sessions: customSessions,
    addSession: addCustomSession,
    removeSession: removeCustomSession,
  } = useCustomSessions();

  function selectBuiltInSubject(name: string) {
    setSessionKey(`builtin:${name}`);
    setSubject(name);
  }

  function selectCustomSession(session: import("@/types/electron").CustomSession) {
    setSessionKey(`custom:${session.id}`);
    setSubject(session.name);
    setApps([...session.default_apps]);
    setSites([...session.default_sites]);
  }

  async function handleRemoveCustomSession(id: number) {
    if (sessionKey === `custom:${id}`) {
      selectBuiltInSubject("Coding");
    }
    await removeCustomSession(id);
  }

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
        void addPlant({
          id: createPlantId(),
          name: activePlantName,
          stage: next,
          status: "alive",
          days: 1,
          subject,
        });
        return next;
      });
      speak("Session complete. Your plant bloomed.");
      return;
    }
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [screen, secondsLeft, activePlantName, minutes, subject, addPlant]);

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
    if (!activePlantName) {
      setActivePlantName(resolvePlantName(plantName, garden.map((p) => p.name)));
    }
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
    void addPlant({
      id: createPlantId(),
      name: activePlantName,
      stage: Math.max(0, stage - 1),
      status: "dead",
      days: 1,
      subject,
    });
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
            className="absolute inset-0 flex min-h-0 flex-col overflow-hidden px-6 pb-6 pt-3"
          >
            {screen === "welcome" && (
              <WelcomeScreen
                onNext={() => {
                  setPlantName("");
                  selectBuiltInSubject("Coding");
                  setScreen("subject");
                }}
                skin={skin}
                skinLabel={skinLabel}
                streak={streak}
              />
            )}
            {screen === "subject" && (
              <SubjectScreen
                subject={subject}
                sessionKey={sessionKey}
                plantName={plantName}
                setPlantName={setPlantName}
                customSessions={customSessions}
                customApps={customApps}
                detectedAppName={activeApp?.app ?? null}
                onSelectBuiltIn={selectBuiltInSubject}
                onSelectCustom={selectCustomSession}
                onAddCustomSession={addCustomSession}
                onRemoveCustomSession={handleRemoveCustomSession}
                onAddCustomApp={addCustomApp}
                onRemoveCustomApp={removeCustomApp}
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
                onNext={() => {
                  setActivePlantName(resolvePlantName(plantName, garden.map((p) => p.name)));
                  setScreen("confirm");
                }}
              />
            )}
            {screen === "confirm" && (
              <ConfirmScreen
                subject={subject}
                plantName={plantName}
                sessionPlantName={activePlantName}
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
                plantName={activePlantName}
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
                  setPlantName("");
                  setActivePlantName("");
                  selectBuiltInSubject("Coding");
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
                onAdd={(status) =>
                  void addPlant({
                    id: createPlantId(),
                    name: resolvePlantName("", garden.map((p) => p.name)),
                    stage:
                      status === "dead"
                        ? Math.floor(Math.random() * 3) // 0..2 withered
                        : 1 + Math.floor(Math.random() * 4), // 1..4 grown
                    status,
                    days: 1 + Math.floor(Math.random() * 20),
                    subject,
                  })
                }
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
              <SettingsScreen onBack={() => setScreen("welcome")} onClearGarden={clearGarden} />
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
