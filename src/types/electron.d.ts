export {};

export type ActiveAppSnapshot = {
  app: string;
  title: string;
  url: string | null;
  bundleId: string | null;
  /** Windows/Linux: path to the owning process executable */
  path: string | null;
  /** Windows: HWND used to restore focus to this window */
  windowId: number | null;
};

export type ActiveAppError = {
  kind: "needs-accessibility" | "needs-screen-recording" | "unknown";
  message: string;
} | null;

declare global {
  interface Window {
    electronAPI?: {
      windowClose: () => void;
      windowMinimize: () => void;
      windowMaximize: () => void;
      onActiveAppChange: (cb: (snapshot: ActiveAppSnapshot) => void) => () => void;
      onActiveAppError: (cb: (error: ActiveAppError) => void) => () => void;
      getCurrentActiveApp: () => Promise<{ snapshot: ActiveAppSnapshot | null; error: ActiveAppError }>;
      openAccessibilitySettings: () => void;
      syncFocusSession: (active: boolean, allowedApps: string[]) => void;
      onFocusRestored: (
        cb: (payload: {
          windowId: number | null;
          blocked: string;
          refocused?: string;
        }) => void,
      ) => () => void;
    };
  }
}
