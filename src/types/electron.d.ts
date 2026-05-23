export {};

export type ActiveAppSnapshot = {
  app: string;
  title: string;
  url: string | null;
  bundleId: string | null;
  /** Windows/Linux: path to the owning process executable */
  path: string | null;
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
      openAccessibilitySettings: () => void;
    };
  }
}
