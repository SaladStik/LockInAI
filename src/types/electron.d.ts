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

export type EnforcementPayload = {
  enforced: boolean;
  allowedApps: string[];
};

export type EnforcementBreach = {
  detected: string;
  refocused: string;
};

export type CustomApp = {
  id: number;
  name: string;
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
      getCurrentActiveApp: () => Promise<{ snapshot: ActiveAppSnapshot | null; error: ActiveAppError }>;
      openAccessibilitySettings: () => void;
      openScreenRecordingSettings: () => void;
      setEnforcement: (payload: EnforcementPayload) => void;
      onEnforcementBreach: (cb: (info: EnforcementBreach) => void) => () => void;
      customApps: {
        list: () => Promise<CustomApp[]>;
        add: (name: string) => Promise<CustomApp | null>;
        remove: (id: number) => Promise<boolean>;
      };
    };
  }
}
