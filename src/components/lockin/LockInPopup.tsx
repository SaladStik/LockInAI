import { AnimatePresence, motion } from "motion/react";
import { Leaf, Trophy, Volume2, VolumeX, Settings as SettingsIcon } from "lucide-react";
import { Particles } from "./Particles";
import { SettingsScreen } from "./SettingsScreen";
import { hostnameOf } from "@/lib/apps";
import { createPlantId, resolvePlantName } from "@/lib/garden";
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
import { useLockInSession } from "./useLockInSession";

export function LockInPopup() {
  const s = useLockInSession();
  const { screen, setScreen, breach, toast } = s;

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

      {/* faux window chrome — drag handle for frameless Electron window */}
      <div
        className="relative z-10 flex cursor-default items-center justify-between px-5 pb-2 pt-4"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div
          className="group flex items-center gap-1.5"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
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
        <div className="pointer-events-none font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground select-none">
          LOCK<span className="text-primary">//</span>IN · AI
        </div>
        <div
          className="flex items-center gap-1.5"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            onClick={s.toggleVoice}
            aria-label="Toggle voice"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-secondary/40 text-foreground transition hover:bg-secondary/70"
          >
            {s.voiceOn ? <Volume2 size={11} /> : <VolumeX size={11} />}
          </button>
          <button
            onClick={() =>
              setScreen((cur) =>
                screen === "focus" ? cur : cur === "settings" ? "welcome" : "settings",
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
              setScreen((cur) =>
                screen === "focus" ? cur : cur === "achievements" ? "welcome" : "achievements",
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
              setScreen((cur) =>
                screen === "focus" ? cur : cur === "garden" ? "welcome" : "garden",
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
                  s.setPlantName("");
                  s.selectBuiltInSubject("Coding");
                  setScreen("subject");
                }}
                skin={s.skin}
                skinLabel={s.skinLabel}
                streak={s.streak}
              />
            )}
            {screen === "subject" && (
              <SubjectScreen
                subject={s.subject}
                setSubject={s.setSubject}
                sessionKey={s.sessionKey}
                plantName={s.plantName}
                setPlantName={s.setPlantName}
                customSessions={s.customSessions}
                onSelectBuiltIn={s.selectBuiltInSubject}
                onSelectCustom={s.selectCustomSession}
                onRemoveCustomSession={s.handleRemoveCustomSession}
                onStartNew={s.startNewCustomSession}
                onCancelNew={s.cancelNewCustomSession}
                onNext={() => setScreen("time")}
              />
            )}
            {screen === "time" && (
              <TimeScreen
                minutes={s.minutes}
                setMinutes={s.setMinutes}
                onNext={() => setScreen("apps")}
              />
            )}
            {screen === "apps" && (
              <AppsScreen
                apps={s.apps}
                setApps={s.setApps}
                customApps={s.customApps}
                detectedAppName={s.activeApp?.app ?? null}
                onAddCustom={s.addCustomApp}
                onRemoveCustom={s.removeCustomApp}
                onNext={() => setScreen("sites")}
              />
            )}
            {screen === "sites" && (
              <SitesScreen
                sites={s.sites}
                setSites={s.setSites}
                customSites={s.customSites}
                detectedHost={hostnameOf(s.activeApp?.url)}
                onAddCustom={s.addCustomSite}
                onRemoveCustom={s.removeCustomSite}
                onNext={() => {
                  s.setActivePlantName(resolvePlantName(s.plantName, s.garden.map((p) => p.name)));
                  setScreen("confirm");
                }}
              />
            )}
            {screen === "confirm" && (
              <ConfirmScreen
                subject={s.subject}
                plantName={s.plantName}
                sessionPlantName={s.activePlantName}
                minutes={s.minutes}
                apps={s.apps}
                newPreset={s.sessionKey === "new"}
                onLock={s.startSession}
              />
            )}
            {screen === "focus" && (
              <FocusScreen
                mm={s.mm}
                ss={s.ss}
                progress={s.progress}
                subject={s.subject}
                plantName={s.activePlantName}
                apps={s.apps}
                sites={s.sites}
                streak={s.streak}
                xp={s.xp}
                stage={s.stage}
                warning={breach}
                activeApp={s.activeApp}
                appDetection={s.hasNativeAppDetection}
                onEmergencyExit={s.emergencyExitNow}
                onSkip={() => s.setSecondsLeft(0)}
                breachCount={s.breachCount}
                maxBreaches={s.MAX_BREACHES}
                skin={s.skin}
              />
            )}
            {screen === "complete" && (
              <CompleteScreen
                minutes={s.minutes}
                stage={s.stage}
                plant={s.lastPlant}
                broken={s.emergencyExit}
                onAgain={() => {
                  s.setEmergencyExit(false);
                  s.setPlantName("");
                  s.setActivePlantName("");
                  s.selectBuiltInSubject("Coding");
                  setScreen("subject");
                }}
                onGarden={() => setScreen("garden")}
                skin={s.skin}
              />
            )}
            {screen === "garden" && (
              <GardenScreen
                plants={s.garden}
                onBack={() => setScreen("welcome")}
                onAdd={(status) =>
                  void s.addPlant({
                    id: createPlantId(),
                    name: resolvePlantName("", s.garden.map((p) => p.name)),
                    stage:
                      status === "dead"
                        ? Math.floor(Math.random() * 3) // 0..2 withered
                        : 1 + Math.floor(Math.random() * 4), // 1..4 grown
                    status,
                    days: 1 + Math.floor(Math.random() * 20),
                    subject: s.subject,
                    // random length so the dev buttons showcase every rarity
                    minutes: [10, 25, 35, 50, 75, 95, 120][Math.floor(Math.random() * 7)],
                  })
                }
              />
            )}
            {screen === "achievements" && (
              <AchievementsScreen
                ctx={{
                  streak: s.streak,
                  xp: s.xp,
                  totalSessions: s.totalSessions,
                  aliveCount: s.garden.filter((p) => p.status === "alive").length,
                  deadCount: s.garden.filter((p) => p.status === "dead").length,
                  longestSessionMin: s.longestSessionMin,
                }}
                skinLabel={s.skinLabel}
                onBack={() => setScreen("welcome")}
              />
            )}
            {screen === "settings" && (
              <SettingsScreen
                onBack={() => setScreen("welcome")}
                onClearGarden={s.clearGarden}
                hideGemini={s.hideGemini}
                onToggleGemini={s.toggleHideGemini}
              />
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

      <ActiveAppFooter snapshot={s.activeApp} error={s.activeAppError} />
    </div>
  );
}
