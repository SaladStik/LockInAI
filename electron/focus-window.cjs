/**
 * Windows-only helpers: foreground a window by HWND and navigate the active
 * browser tab via keyboard simulation (Ctrl+L → paste → Enter).
 */
function createFocusWindow() {
  if (process.platform !== "win32") {
    return {
      focusWindowById: () => false,
      navigateActiveTab: async () => false,
    };
  }

  let api = null;
  try {
    const koffi = require("koffi");
    const user32 = koffi.load("user32.dll");
    const kernel32 = koffi.load("kernel32.dll");

    const IsWindow = user32.func("bool __stdcall IsWindow(intptr_t hWnd)");
    const IsIconic = user32.func("bool __stdcall IsIconic(intptr_t hWnd)");
    const ShowWindow = user32.func("bool __stdcall ShowWindow(intptr_t hWnd, int nCmdShow)");
    const SetForegroundWindow = user32.func(
      "bool __stdcall SetForegroundWindow(intptr_t hWnd)",
    );
    const SwitchToThisWindow = user32.func(
      "void __stdcall SwitchToThisWindow(intptr_t hWnd, bool fAltTab)",
    );
    const GetForegroundWindow = user32.func("intptr_t __stdcall GetForegroundWindow()");
    const GetWindowThreadProcessId = user32.func(
      "uint32 __stdcall GetWindowThreadProcessId(intptr_t hWnd, _Out_ uint32 *lpdwProcessId)",
    );
    const AttachThreadInput = user32.func(
      "bool __stdcall AttachThreadInput(uint32 idAttach, uint32 idAttachTo, bool fAttach)",
    );
    const GetCurrentThreadId = kernel32.func("uint32 __stdcall GetCurrentThreadId()");
    const keybd_event = user32.func(
      "void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, uintptr_t dwExtraInfo)",
    );

    const SW_RESTORE = 9;
    const KEYEVENTF_KEYUP = 0x0002;
    const VK_CONTROL = 0x11;
    const VK_L = 0x4c;
    const VK_A = 0x41;
    const VK_V = 0x56;
    const VK_RETURN = 0x0d;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    function tap(vk) {
      keybd_event(vk, 0, 0, 0);
      keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
    }

    function withCtrl(vk) {
      keybd_event(VK_CONTROL, 0, 0, 0);
      tap(vk);
      keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, 0);
    }

    function focusWindowByIdImpl(hwndId) {
      if (!hwndId || typeof hwndId !== "number") return false;
      const hwnd = hwndId;
      if (!IsWindow(hwnd)) return false;

      if (IsIconic(hwnd)) ShowWindow(hwnd, SW_RESTORE);

      const foreground = GetForegroundWindow();
      const currentThread = GetCurrentThreadId();
      const fgThread = foreground ? GetWindowThreadProcessId(foreground, null) : 0;
      const targetThread = GetWindowThreadProcessId(hwnd, null);

      if (fgThread) AttachThreadInput(currentThread, fgThread, true);
      if (targetThread) AttachThreadInput(currentThread, targetThread, true);

      SetForegroundWindow(hwnd);
      SwitchToThisWindow(hwnd, true);

      if (targetThread) AttachThreadInput(currentThread, targetThread, false);
      if (fgThread) AttachThreadInput(currentThread, fgThread, false);

      return GetForegroundWindow() === hwnd;
    }

    api = {
      focusWindowById: focusWindowByIdImpl,
      async navigateActiveTab(hwndId, url) {
        if (!url) return false;
        if (!focusWindowByIdImpl(hwndId)) return false;
        await sleep(80);
        // Stash URL on the system clipboard so we can paste it — far more
        // reliable than typing a URL key-by-key.
        const { clipboard } = require("electron");
        const previousClip = clipboard.readText();
        clipboard.writeText(url);
        try {
          // Ctrl+L = focus URL bar (Chrome, Edge, Firefox, Brave, Arc, Vivaldi, Opera).
          withCtrl(VK_L);
          await sleep(70);
          withCtrl(VK_A); // select-all the URL bar contents
          await sleep(20);
          withCtrl(VK_V); // paste the new URL
          await sleep(40);
          tap(VK_RETURN); // go
          return true;
        } finally {
          // Restore the user's clipboard after the paste completes.
          setTimeout(() => {
            try {
              clipboard.writeText(previousClip);
            } catch {
              /* clipboard may be unavailable on shutdown */
            }
          }, 700);
        }
      },
    };
  } catch (e) {
    console.error("[focus-window] Failed to load Win32 APIs:", e?.message ?? e);
    api = {
      focusWindowById: () => false,
      navigateActiveTab: async () => false,
    };
  }

  return api;
}

module.exports = { createFocusWindow };
