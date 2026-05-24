import { useCallback, useEffect, useState } from "react";
import { INITIAL_GARDEN, type GardenPlant } from "@/lib/garden";
import type { GardenPlant as StoredGardenPlant } from "@/types/electron";

function toGardenPlant(row: StoredGardenPlant): GardenPlant {
  return {
    id: row.id,
    name: row.name,
    stage: row.stage,
    status: row.status,
    days: row.days,
    subject: row.subject,
  };
}

export function useGarden() {
  const [plants, setPlants] = useState<GardenPlant[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const api = typeof window !== "undefined" ? window.electronAPI : undefined;
    // Fall back to the seed garden when not in Electron, or when the running
    // app still has an older preload without the garden API exposed.
    if (!api?.garden) {
      setPlants(INITIAL_GARDEN);
      setReady(true);
      return;
    }
    const list = await api.garden.list();
    setPlants(list.map(toGardenPlant));
    setReady(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addPlant = useCallback(
    async (plant: GardenPlant) => {
      const api = window.electronAPI;
      if (!api?.garden) {
        setPlants((prev) => [plant, ...prev]);
        return plant;
      }
      await api.garden.add(plant);
      await reload();
      return plant;
    },
    [reload],
  );

  const clearGarden = useCallback(async () => {
    const api = window.electronAPI;
    if (!api?.garden?.clear) {
      setPlants([]);
      return;
    }
    await api.garden.clear();
    await reload();
  }, [reload]);

  return { plants, ready, addPlant, clearGarden, reload };
}
