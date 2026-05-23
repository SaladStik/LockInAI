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
    const offChange = api.onActiveAppChange((s) => setSnapshot(s));
    const offError = api.onActiveAppError((e) => setError(e));
    return () => {
      offChange();
      offError();
    };
  }, []);

  return { snapshot, error };
}
