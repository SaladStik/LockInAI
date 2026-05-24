import { useEffect, useRef, useState } from "react";
import { useActiveApp } from "@/hooks/useActiveApp";
import { useCustomApps } from "@/hooks/useCustomApps";
import { useCustomSites } from "@/hooks/useCustomSites";
import { useCustomSessions } from "@/hooks/useCustomSessions";
import { useGarden } from "@/hooks/useGarden";
import { streakSkin, streakSkinLabel } from "./achievements";
import { isAllowedFocusApp } from "@/lib/apps";
import { createPlantId, resolvePlantName, type GardenPlant } from "@/lib/garden";
import { speak, setVoiceMuted, isVoiceMuted } from "@/lib/voice";
import { getHideGemini, setHideGemini } from "@/lib/browserPrefs";
import { isOnboarded } from "@/lib/onboarding";
import type { Screen } from "./types";
import { normalizeAllowedApps } from "./constants";

/**
 * All the LOCK//IN session state, side-effects and handlers — extracted from the
 * component so LockInPopup stays presentational. Behaviour is unchanged: the
 * effects and their dependency arrays are exactly as before.
 */
export function useLockInSession() {
  const [screen, setScreen] = useState<Screen>(() =>
    isOnboarded() ? "welcome" : "onboarding",
  );
  const [subject, setSubject] = useState<string>("Coding");
  const [sessionKey, setSessionKey] = useState<string>("builtin:Coding");
  const [plantName, setPlantName] = useState<string>("");
  const [activePlantName, setActivePlantName] = useState<string>("");
  const [minutes, setMinutes] = useState<number>(25);
  const [apps, setApps] = useState<string[]>(["Cursor", "Browser", "Notion"]);
  const [sites, setSites] = useState<string[]>(["chatgpt.com", "github.com"]);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [streak] = useState<number>(7);
  const [xp, setXp] = useState<number>(640);
  const [stage, setStage] = useState<number>(2);
  const [breach, setBreach] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [emergencyExit, setEmergencyExit] = useState<boolean>(false);
  // The exact plant grown by the session just finished — shown on the complete
  // screen so it matches its garden self (same id-seed, stage, rarity, status).
  const [lastPlant, setLastPlant] = useState<GardenPlant | null>(null);
  const { plants: garden, addPlant, clearGarden: clearGardenDb, reload: reloadGarden } = useGarden();
  const [totalSessions, setTotalSessions] = useState<number>(12);
  const [longestSessionMin, setLongestSessionMin] = useState<number>(45);
  const [voiceOn, setVoiceOn] = useState<boolean>(!isVoiceMuted());
  const [breachCount, setBreachCount] = useState<number>(0);
  const [hideGemini, setHideGeminiState] = useState<boolean>(() => getHideGemini());
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
  const { apps: customApps, addApp: addCustomApp, removeApp: removeCustomApp, reload: reloadCustomApps } = useCustomApps();
  const {
    sites: customSites,
    addSite: addCustomSite,
    removeSite: removeCustomSite,
    reload: reloadCustomSites,
  } = useCustomSites();
  const {
    sessions: customSessions,
    addSession: addCustomSession,
    removeSession: removeCustomSession,
    reload: reloadCustomSessions,
  } = useCustomSessions();

  function selectBuiltInSubject(name: string) {
    setSessionKey(`builtin:${name}`);
    setSubject(name);
  }

  function selectCustomSession(session: import("@/types/electron").CustomSession) {
    setSessionKey(`custom:${session.id}`);
    setSubject(session.name);
    setApps(normalizeAllowedApps([...session.default_apps]));
    setSites([...session.default_sites]);
  }

  // Begin building a brand-new custom session: name it, then pick its apps/sites
  // through the normal flow. It's saved to the DB when the user locks in.
  function startNewCustomSession() {
    setSessionKey("new");
    setSubject("");
    setApps(["Browser"]); // a starter so the preset is never empty
    setSites([]);
  }

  function cancelNewCustomSession() {
    selectBuiltInSubject("Coding");
  }

  async function handleRemoveCustomSession(id: number) {
    if (sessionKey === `custom:${id}`) {
      selectBuiltInSubject("Coding");
    }
    await removeCustomSession(id);
  }

  /**
   * Full app reset — wipes every persisted thing (garden, custom apps/sites,
   * sessions, prefs incl. onboarding flag) and drops the user back at the
   * onboarding flow so they go through it fresh.
   */
  async function clearGarden() {
    const api = window.electronAPI;
    if (api?.resetApp) {
      await api.resetApp();
    } else {
      await clearGardenDb();
    }
    await Promise.all([
      reloadGarden(),
      reloadCustomApps(),
      reloadCustomSites(),
      reloadCustomSessions(),
    ]);
    selectBuiltInSubject("Coding");
    setApps(["Cursor", "Browser", "Notion"]);
    setSites(["chatgpt.com", "github.com"]);
    setPlantName("");
    setActivePlantName("");
    setBreachCount(0);
    setBreach(false);
    // After reset there's no onboarded flag — show the onboarding flow again.
    // Reloading the renderer is the cleanest way to re-run the prefs bootstrap
    // and re-evaluate the initial screen from scratch.
    window.location.reload();
  }

  // Tell the main process which apps + sites are allowed so it can snap back.
  useEffect(() => {
    if (!hasNativeAppDetection) return;
    window.electronAPI?.syncFocusSession(screen === "focus", apps, sites, { hideGemini });
    if (screen !== "focus") {
      focusAllowedRef.current = true;
      sessionStartGraceRef.current = null;
    }
  }, [screen, apps, sites, hasNativeAppDetection, hideGemini]);

  function toggleHideGemini(value: boolean) {
    setHideGemini(value);
    setHideGeminiState(value);
  }

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
      const next = Math.min(4, stage + 1);
      const plant: GardenPlant = {
        id: createPlantId(),
        name: activePlantName || resolvePlantName(plantName, garden.map((p) => p.name)),
        stage: next,
        status: "alive",
        days: 1,
        subject,
        minutes,
      };
      void addPlant(plant);
      setLastPlant(plant);
      setStage(next);
      setXp((x) => x + 50);
      setTotalSessions((n) => n + 1);
      setLongestSessionMin((m) => Math.max(m, minutes));
      setScreen("complete");
      speak("Session complete. Your plant bloomed.");
      return;
    }
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [screen, secondsLeft, stage, activePlantName, plantName, garden, minutes, subject, addPlant]);

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
    // Building a new custom session — persist it as a reusable preset. The DB
    // requires at least one allowed app, so fall back to Browser.
    if (sessionKey === "new" && subject.trim()) {
      addCustomSession({
        name: subject.trim(),
        default_apps: normalizeAllowedApps(apps.length ? apps : ["Browser"]),
        default_sites: sites,
      }).catch((e) => console.warn("[custom-session] save failed:", e?.message ?? e));
    }
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
    const plant: GardenPlant = {
      id: createPlantId(),
      name: activePlantName || resolvePlantName(plantName, garden.map((p) => p.name)),
      stage: Math.max(0, stage - 1),
      status: "dead",
      days: 1,
      subject,
      minutes,
    };
    void addPlant(plant);
    setLastPlant(plant);
    setEmergencyExit(true);
    setTotalSessions((n) => n + 1);
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

  return {
    // state + setters
    screen, setScreen,
    subject, setSubject,
    sessionKey,
    plantName, setPlantName,
    activePlantName, setActivePlantName,
    minutes, setMinutes,
    apps, setApps,
    sites, setSites,
    setSecondsLeft,
    streak,
    xp,
    stage,
    breach,
    toast,
    emergencyExit, setEmergencyExit,
    lastPlant,
    garden, addPlant, clearGarden,
    totalSessions,
    longestSessionMin,
    voiceOn,
    breachCount,
    hideGemini,
    MAX_BREACHES,
    hasNativeAppDetection,
    skin,
    skinLabel,
    activeApp,
    activeAppError,
    customApps, addCustomApp, removeCustomApp,
    customSites, addCustomSite, removeCustomSite,
    customSessions,
    // handlers
    selectBuiltInSubject,
    selectCustomSession,
    startNewCustomSession,
    cancelNewCustomSession,
    handleRemoveCustomSession,
    toggleHideGemini,
    startSession,
    emergencyExitNow,
    toggleVoice,
    // derived
    mm, ss, progress,
  };
}
