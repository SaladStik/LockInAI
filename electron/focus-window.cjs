/**
 * Bring a Windows HWND to the foreground (best-effort; OS may still flash the taskbar).
 */
function createFocusWindow() {
  if (process.platform !== "win32") {
    return { focusWindowById: () => false };
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

    const SW_RESTORE = 9;

    api = {
      focusWindowById(hwndId) {
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
      },
    };
  } catch (e) {
    console.error("[focus-window] Failed to load Win32 APIs:", e?.message ?? e);
    api = { focusWindowById: () => false };
  }

  return api;
}

module.exports = { createFocusWindow };
