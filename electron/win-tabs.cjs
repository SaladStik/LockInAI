/**
 * Windows tab listing + selection via the UIAutomation .NET binding that
 * ships with Windows. We shell out to PowerShell because writing the COM
 * bindings directly through koffi would be a lot of work for the same result.
 *
 * Browsers expose each tab as a TabItem accessibility element whose `Name`
 * is the page title — so on Windows we match by title, not URL.
 */
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const execFileAsync = promisify(execFile);

const POWERSHELL_TIMEOUT_MS = 4500;

function encodeForPowerShell(script) {
  // PowerShell's -EncodedCommand expects UTF-16LE base64.
  return Buffer.from(script, "utf16le").toString("base64");
}

async function runPowerShell(script) {
  const { stdout } = await execFileAsync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-EncodedCommand",
      encodeForPowerShell(script),
    ],
    { timeout: POWERSHELL_TIMEOUT_MS, windowsHide: true },
  );
  return stdout;
}

/**
 * @param {number} hwnd HWND of the browser window
 * @returns {Promise<Array<{ index: number, name: string }> | null>}
 */
async function listTabs(hwnd) {
  if (process.platform !== "win32" || !hwnd) return null;
  const script = `
$ErrorActionPreference = 'Stop'
try {
  Add-Type -AssemblyName UIAutomationClient -ErrorAction Stop
  $hwnd = [IntPtr]::new(${Number(hwnd)})
  $wnd = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
  if ($null -eq $wnd) { '[]'; return }
  $cond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::TabItem
  )
  $tabs = $wnd.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
  $list = @()
  for ($i = 0; $i -lt $tabs.Count; $i++) {
    $name = ''
    try { $name = $tabs[$i].Current.Name } catch { $name = '' }
    $list += @{ index = $i; name = $name }
  }
  ConvertTo-Json -Compress -InputObject @($list)
} catch {
  '[]'
}
`;
  try {
    const out = (await runPowerShell(script)).trim();
    if (!out) return [];
    const parsed = JSON.parse(out);
    // ConvertTo-Json wraps single items as objects; ensure we always get an array.
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    console.error("[win-tabs] listTabs failed:", e?.message ?? e);
    return null;
  }
}

/**
 * @param {number} hwnd HWND of the browser window
 * @param {number} index 0-based tab index from listTabs
 */
async function selectTab(hwnd, index) {
  if (process.platform !== "win32" || !hwnd) return false;
  const script = `
$ErrorActionPreference = 'Stop'
try {
  Add-Type -AssemblyName UIAutomationClient -ErrorAction Stop
  $hwnd = [IntPtr]::new(${Number(hwnd)})
  $wnd = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
  if ($null -eq $wnd) { exit 1 }
  $cond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::TabItem
  )
  $tabs = $wnd.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
  $i = ${Number(index)}
  if ($i -lt 0 -or $i -ge $tabs.Count) { exit 2 }
  $tab = $tabs[$i]
  $pat = $null
  try { $pat = $tab.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern) } catch {}
  if ($null -ne $pat) {
    $pat.Select()
    exit 0
  }
  $invoke = $null
  try { $invoke = $tab.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern) } catch {}
  if ($null -ne $invoke) {
    $invoke.Invoke()
    exit 0
  }
  exit 3
} catch {
  exit 4
}
`;
  try {
    await runPowerShell(script);
    return true;
  } catch (e) {
    console.error("[win-tabs] selectTab failed:", e?.message ?? e);
    return false;
  }
}

module.exports = { listTabs, selectTab };
