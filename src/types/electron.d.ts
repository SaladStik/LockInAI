export {};

declare global {
  interface Window {
    electronAPI?: {
      windowClose: () => void;
      windowMinimize: () => void;
      windowMaximize: () => void;
    };
  }
}
