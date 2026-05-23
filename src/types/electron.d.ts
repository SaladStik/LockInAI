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

export type CustomApp = {
  id: number;
  name: string;
  created_at?: number;
};

export type CustomSite = {
  id: number;
  host: string;
  created_at?: number;
};

declare global {
  interface Window {
    electronAPI?: {
      windowClose: () => void;
      windowMinimize: () => void;
      windowMaximize: () => void;
      onActiveAppChange: (cb: (snapshot: ActiveAppSnapshot) => void) => () => void;
      onActiveAppError: (cb: (error: ActiveAppError) => void) => () => void;
      getCurrentActiveApp: () => Promise<{
        snapshot: ActiveAppSnapshot | null;
        error: ActiveAppError;
      }>;
      openAccessibilitySettings: () => void;
      openScreenRecordingSettings: () => void;
      syncFocusSession: (
        active: boolean,
        allowedApps: string[],
        allowedSites: string[],
      ) => void;
      onFocusRestored: (
        cb: (payload: {
          windowId: number | null;
          blocked: string;
          refocused?: string;
        }) => void,
      ) => () => void;
      customApps: {
        list: () => Promise<CustomApp[]>;
        add: (name: string) => Promise<CustomApp | null>;
        remove: (id: number) => Promise<boolean>;
      };
      customSites: {
        list: () => Promise<CustomSite[]>;
        add: (host: string) => Promise<CustomSite | null>;
        remove: (id: number) => Promise<boolean>;
      };
    };
  }
}
