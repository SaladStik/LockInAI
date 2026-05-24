import { useCallback, useEffect, useState } from "react";
import type { CustomSession } from "@/types/electron";

export function useCustomSessions() {
  const [sessions, setSessions] = useState<CustomSession[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const api = typeof window !== "undefined" ? window.electronAPI : undefined;
    if (!api?.customSessions) {
      setSessions([]);
      setReady(true);
      return;
    }
    const list = await api.customSessions.list();
    setSessions(list);
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addSession = useCallback(
    async (payload: { name: string; default_apps: string[]; default_sites?: string[] }) => {
      const api = window.electronAPI;
      if (!api?.customSessions) {
        const created: CustomSession = {
          id: Date.now(),
          name: payload.name,
          default_apps: payload.default_apps,
          default_sites: payload.default_sites ?? [],
        };
        setSessions((prev) => [...prev, created]);
        return created;
      }
      const created = await api.customSessions.add(payload);
      await reload();
      return created;
    },
    [reload],
  );

  const removeSession = useCallback(
    async (id: number) => {
      const api = window.electronAPI;
      if (!api?.customSessions) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        return;
      }
      await api.customSessions.remove(id);
      await reload();
    },
    [reload],
  );

  return { sessions, ready, addSession, removeSession, reload };
}
