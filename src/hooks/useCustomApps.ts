import { useCallback, useEffect, useState } from "react";
import type { CustomApp } from "@/types/electron";

export function useCustomApps() {
  const [apps, setApps] = useState<CustomApp[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const api = typeof window !== "undefined" ? window.electronAPI : undefined;
    if (!api) {
      setReady(true);
      return;
    }
    const list = await api.customApps.list();
    setApps(list);
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addApp = useCallback(
    async (name: string) => {
      const api = window.electronAPI;
      if (!api) return null;
      const created = await api.customApps.add(name);
      await reload();
      return created;
    },
    [reload],
  );

  const removeApp = useCallback(
    async (id: number) => {
      const api = window.electronAPI;
      if (!api) return;
      await api.customApps.remove(id);
      await reload();
    },
    [reload],
  );

  return { apps, ready, addApp, removeApp, reload };
}
