import { useCallback, useEffect, useState } from "react";
import type { CustomSite } from "@/types/electron";

export function useCustomSites() {
  const [sites, setSites] = useState<CustomSite[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const api = typeof window !== "undefined" ? window.electronAPI : undefined;
    if (!api) {
      setReady(true);
      return;
    }
    const list = await api.customSites.list();
    setSites(list);
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addSite = useCallback(
    async (host: string) => {
      const api = window.electronAPI;
      if (!api) return null;
      const created = await api.customSites.add(host);
      await reload();
      return created;
    },
    [reload],
  );

  const removeSite = useCallback(
    async (id: number) => {
      const api = window.electronAPI;
      if (!api) return;
      await api.customSites.remove(id);
      await reload();
    },
    [reload],
  );

  return { sites, ready, addSite, removeSite, reload };
}
