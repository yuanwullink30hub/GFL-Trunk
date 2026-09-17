/**
 * Screen refresh rate.
 *
 * Windows ships many high-refresh monitors (120–240 Hz) running at 60 Hz, and every app on the desktop
 * inherits that — only games switch the mode themselves. Electron reports the current rate but not what
 * the screen supports, so on Windows this asks the display API directly (user32, through koffi): the same
 * mode list the Settings app shows.
 *
 * Safety lives here, in the main process, not in the page: every change starts a 15-second revert timer
 * that only an explicit "keep" stops. If the new mode leaves the screen black, or the page is broken, the
 * old rate comes back on its own — the same guarantee Windows' own display dialog gives.
 *
 * Other platforms: detection reports the current rate only and nothing is ever changed (macOS ProMotion
 * screens adapt by themselves).
 */
const { BrowserWindow } = require('electron');
// `screen` may only be touched after app 'ready'; this module is required earlier.
const electronScreen = () => require('electron').screen;

const REVERT_AFTER_MS = 15000;

// ── Windows display API ──────────────────────────────────────────────────────────

const DEVMODE_SIZE = 220; // sizeof(DEVMODEW)
const OFF = { size: 68, driverExtra: 70, fields: 72, bpp: 168, width: 172, height: 176, displayFlags: 180, frequency: 184 };
const ENUM_CURRENT_SETTINGS = 0xffffffff;
const DM_INTERLACED = 0x2;
const DM_DISPLAYFREQUENCY = 0x400000;
const CDS_UPDATEREGISTRY = 0x1;
const CDS_TEST = 0x2;
const MONITOR_DEFAULTTONEAREST = 2;
const MONITORINFOEX_SIZE = 104; // cbSize, rcMonitor, rcWork, dwFlags, szDevice[32]
const DISP_CHANGE = { 0: 'successful', 1: 'restart', '-1': 'failed', '-2': 'badmode', '-3': 'notupdated', '-4': 'badflags', '-5': 'badparam', '-6': 'baddualview' };

let api; // undefined = not tried, null = unavailable
function win32() {
  if (api !== undefined) return api;
  api = null;
  if (process.platform !== 'win32') return api;
  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    api = {
      enumSettings: user32.func('bool __stdcall EnumDisplaySettingsExW(str16 lpszDeviceName, uint32 iModeNum, _Inout_ uint8_t *lpDevMode, uint32 dwFlags)'),
      changeSettings: user32.func('long __stdcall ChangeDisplaySettingsExW(str16 lpszDeviceName, uint8_t *lpDevMode, uintptr_t hwnd, uint32 dwflags, uintptr_t lParam)'),
      monitorFromWindow: user32.func('uintptr_t __stdcall MonitorFromWindow(uintptr_t hwnd, uint32 dwFlags)'),
      monitorInfo: user32.func('bool __stdcall GetMonitorInfoW(uintptr_t hMonitor, _Inout_ uint8_t *lpmi)'),
    };
  } catch (err) {
    console.error('[GFL Desktop] display API unavailable:', err.message);
    api = null;
  }
  return api;
}

function devmode() {
  const b = Buffer.alloc(DEVMODE_SIZE);
  b.writeUInt16LE(DEVMODE_SIZE, OFF.size);
  return b;
}

function readMode(b) {
  return {
    bpp: b.readUInt32LE(OFF.bpp),
    width: b.readUInt32LE(OFF.width),
    height: b.readUInt32LE(OFF.height),
    interlaced: (b.readUInt32LE(OFF.displayFlags) & DM_INTERLACED) !== 0,
    hz: b.readUInt32LE(OFF.frequency),
  };
}

/** The Windows device name (\\.\DISPLAYn) of the monitor a window is mostly on. */
function deviceForWindow(win) {
  const a = win32();
  if (!a || !win || win.isDestroyed()) return null;
  const handle = win.getNativeWindowHandle();
  const hwnd = handle.length >= 8 ? handle.readBigUInt64LE(0) : BigInt(handle.readUInt32LE(0));
  const hMonitor = a.monitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
  if (!hMonitor) return null;
  const info = Buffer.alloc(MONITORINFOEX_SIZE);
  info.writeUInt32LE(MONITORINFOEX_SIZE, 0);
  if (!a.monitorInfo(hMonitor, info)) return null;
  return info.toString('utf16le', 40, 104).replace(/\0[\s\S]*$/, '');
}

/**
 * Current mode plus every refresh rate the monitor lists at the SAME resolution and colour depth (a rate
 * switch never changes resolution). Progressive modes only.
 */
function readModes(device) {
  const a = win32();
  const current = devmode();
  if (!a || !a.enumSettings(device, ENUM_CURRENT_SETTINGS, current, 0)) return null;
  const cur = readMode(current);
  const rates = new Set([cur.hz]);
  for (let i = 0; ; i++) {
    const m = devmode();
    if (!a.enumSettings(device, i, m, 0)) break;
    const r = readMode(m);
    if (r.width === cur.width && r.height === cur.height && r.bpp === cur.bpp && !r.interlaced) rates.add(r.hz);
  }
  return { current: cur, currentBuffer: current, rates: [...rates].sort((x, y) => x - y) };
}

/** The current mode with only the frequency changed: resolution, orientation and position stay as they are. */
function withRate(currentBuffer, hz) {
  const b = Buffer.from(currentBuffer);
  b.writeUInt32LE(DM_DISPLAYFREQUENCY, OFF.fields);
  b.writeUInt32LE(hz, OFF.frequency);
  return b;
}

function applyMode(device, modeBuffer) {
  const a = win32();
  const test = a.changeSettings(device, modeBuffer, 0, CDS_TEST, 0);
  if (test !== 0) return { ok: false, reason: DISP_CHANGE[test] || String(test) };
  const res = a.changeSettings(device, modeBuffer, 0, CDS_UPDATEREGISTRY, 0);
  return res === 0 ? { ok: true } : { ok: false, reason: DISP_CHANGE[res] || String(res) };
}

// ── Public ────────────────────────────────────────────────────────────────────────

/**
 * What the page shows: { canChange, label, width, height, hz, rates[] }. `rates` is only filled where a
 * change is possible (Windows); elsewhere it is just the current rate.
 */
function describe(win) {
  const screen = electronScreen();
  const eDisplay = win && !win.isDestroyed() ? screen.getDisplayMatching(win.getBounds()) : screen.getPrimaryDisplay();
  const base = {
    canChange: false,
    label: eDisplay.label || '',
    width: Math.round(eDisplay.size.width * eDisplay.scaleFactor),
    height: Math.round(eDisplay.size.height * eDisplay.scaleFactor),
    hz: Math.round(eDisplay.displayFrequency || 0),
    rates: [],
  };
  const device = deviceForWindow(win);
  const modes = device && readModes(device);
  if (!modes) return { ...base, rates: base.hz ? [base.hz] : [] };
  return {
    ...base,
    canChange: true,
    device,
    width: modes.current.width,
    height: modes.current.height,
    hz: modes.current.hz,
    rates: modes.rates,
  };
}

/** A change waiting for "keep": { device, from, to, fromBuffer, deadline, timer }. One at a time. */
let pending = null;

function broadcast(channel, payload) {
  for (const w of BrowserWindow.getAllWindows()) if (!w.isDestroyed()) w.webContents.send(channel, payload);
}

function publicPending() {
  return pending ? { from: pending.from, to: pending.to, deadline: pending.deadline, reason: pending.reason } : null;
}

/**
 * Switch the window's monitor to `hz` and start the revert timer. `reason` is 'first-run' or 'settings'
 * (the page words the question accordingly).
 */
function requestRate(win, hz, reason = 'settings') {
  if (pending) return { ok: false, reason: 'pending' };
  const device = deviceForWindow(win);
  const modes = device && readModes(device);
  if (!modes) return { ok: false, reason: 'unsupported' };
  const to = Number(hz);
  if (!modes.rates.includes(to)) return { ok: false, reason: 'badmode' };
  if (modes.current.hz === to) return { ok: true, unchanged: true };

  const res = applyMode(device, withRate(modes.currentBuffer, to));
  if (!res.ok) return res;
  pending = {
    device, reason, from: modes.current.hz, to, fromBuffer: withRate(modes.currentBuffer, modes.current.hz),
    deadline: Date.now() + REVERT_AFTER_MS,
    timer: setTimeout(() => settle(false, 'timeout'), REVERT_AFTER_MS),
  };
  console.log(`[GFL Desktop] refresh rate ${pending.from} → ${pending.to} Hz on ${device} (${reason}), waiting for keep`);
  broadcast('display:pending', publicPending());
  return { ok: true, pending: publicPending() };
}

/** keep = true stops the timer; false (or the timer) puts the previous mode back. */
function settle(keep, why = keep ? 'kept' : 'reverted') {
  if (!pending) return { ok: false, reason: 'none' };
  const p = pending;
  pending = null;
  clearTimeout(p.timer);
  let result = { kept: keep, hz: keep ? p.to : p.from, why };
  if (!keep) {
    const res = applyMode(p.device, p.fromBuffer);
    if (!res.ok) result = { kept: true, hz: p.to, why: `revert-failed:${res.reason}` };
  }
  console.log(`[GFL Desktop] refresh rate ${result.kept ? 'kept at' : 'reverted to'} ${result.hz} Hz (${result.why})`);
  broadcast('display:settled', result);
  return { ok: true, ...result };
}

/** Quitting mid-question counts as "no": never leave an unconfirmed mode behind. */
function revertPendingOnQuit() {
  if (pending) settle(false, 'quit');
}

module.exports = { describe, requestRate, settle, revertPendingOnQuit, getPending: publicPending, REVERT_AFTER_MS };
