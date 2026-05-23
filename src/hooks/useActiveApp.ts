import { useEffect, useState } from "react";
import type { ActiveAppError, ActiveAppSnapshot } from "@/types/electron";

export function useActiveApp(): {
  snapshot: ActiveAppSnapshot | null;
  error: ActiveAppError;
} {
  const [snapshot, setSnapshot] = useState<ActiveAppSnapshot | null>(null);
  const [error, setError] = useState<ActiveAppError>(null);

  useEffect(() => {
    const api = typeof window !== "undefined" ? window.electronAPI : undefined;
    if (!api) return;

    // Pull the current state in case main already polled before this hook mounted.
    api.getCurrentActiveApp().then((state) => {
      if (state.snapshot) setSnapshot(state.snapshot);
      if (state.error) setError(state.error);
    });

    const offChange = api.onActiveAppChange(setSnapshot);
    const offError = api.onActiveAppError(setError);
    return () => {
      offChange();
      offError();
    };
  }, []);

  return { snapshot, error };
}
