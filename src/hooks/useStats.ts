import { useCallback, useState } from "react";

/**
 * Persistent stats that drive achievements + streak skin. Stored as a single
 * JSON blob in the SQLite prefs table (key: "stats").
 *
 *   • streak             — consecutive days with ≥1 completed session
 *   • xp                 — total focus XP earned (50 per completion)
 *   • totalSessions      — every session ever started, including bails
 *   • longestSessionMin  — the longest completed session
 *   • lastSessionDate    — YYYY-MM-DD (local) of the last completion
 *   • unlockedSeen       — achievement IDs we've already toasted, so reload
 *                          doesn't re-celebrate.
 */
export type Stats = {
  streak: number;
  xp: number;
  totalSessions: number;
  longestSessionMin: number;
  lastSessionDate: string | null;
  unlockedSeen: string[];
};

const KEY = "stats";

function defaultStats(): Stats {
  return {
    streak: 0,
    xp: 0,
    totalSessions: 0,
    longestSessionMin: 0,
    lastSessionDate: null,
    unlockedSeen: [],
  };
}

function localDateString(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  // Local-date strings — convert to midnight-local and diff.
  const da = new Date(`${a}T00:00:00`).getTime();
  const db = new Date(`${b}T00:00:00`).getTime();
  return Math.round((db - da) / 86_400_000);
}

function loadStats(): Stats {
  if (typeof window === "undefined") return defaultStats();
  const raw = window.electronAPI?.prefs.get(KEY);
  if (!raw) return defaultStats();
  try {
    const parsed = JSON.parse(raw);
    return { ...defaultStats(), ...parsed };
  } catch {
    return defaultStats();
  }
}

function saveStats(s: Stats) {
  window.electronAPI?.prefs.set(KEY, JSON.stringify(s));
}

export function useStats() {
  const [stats, setStats] = useState<Stats>(() => loadStats());

  const update = useCallback((updater: (prev: Stats) => Stats) => {
    setStats((prev) => {
      const next = updater(prev);
      saveStats(next);
      return next;
    });
  }, []);

  /** Call when a focus session finishes successfully. */
  const recordCompletion = useCallback(
    (minutes: number) => {
      update((s) => {
        const today = localDateString();
        let streak = s.streak;
        if (s.lastSessionDate !== today) {
          if (s.lastSessionDate) {
            const gap = daysBetween(s.lastSessionDate, today);
            streak = gap === 1 ? s.streak + 1 : gap > 1 ? 1 : Math.max(1, s.streak);
          } else {
            streak = 1;
          }
        } else if (streak === 0) {
          // Defensive: first session today after a fresh install.
          streak = 1;
        }
        return {
          ...s,
          streak,
          xp: s.xp + 50,
          totalSessions: s.totalSessions + 1,
          longestSessionMin: Math.max(s.longestSessionMin, minutes),
          lastSessionDate: today,
        };
      });
    },
    [update],
  );

  /** Call when the user bails early. Counts as a session attempt; resets streak. */
  const recordBail = useCallback(() => {
    update((s) => ({
      ...s,
      streak: 0,
      totalSessions: s.totalSessions + 1,
    }));
  }, [update]);

  /** Persist the set of achievement IDs we've already toasted. */
  const markUnlockedSeen = useCallback(
    (ids: string[]) => {
      if (!ids.length) return;
      update((s) => ({
        ...s,
        unlockedSeen: Array.from(new Set([...s.unlockedSeen, ...ids])),
      }));
    },
    [update],
  );

  return { stats, recordCompletion, recordBail, markUnlockedSeen };
}
