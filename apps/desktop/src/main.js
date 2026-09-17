/**
 * Garden For Life — desktop main process.
 *
 * The app is the platform UI plus one thing the browser cannot give it: a real folder on
 * the user's own machine that they choose, that we never see, and that survives us.
 *
 * Security posture (an app with a filesystem bridge is a genuine attack surface):
 *   - the renderer runs sandboxed, context-isolated, with no Node integration
 *   - it reaches the disk only through the narrow IPC surface below, never through fs
 *   - every path is contained inside the chosen workspace root (see workspace.js)
 *   - navigation away from the bundled UI is blocked, and new windows open in the
 *     system browser rather than in a window that can see the bridge
 *
 * Where the UI comes from:
 *   - packaged / `pnpm run start`: the bundled ui/ served from app://gardenforlife (appProtocol.js)
 *   - `pnpm run dev`: the live Vite dev server (GFL_DEV_URL, default http://localhost:3000), so the
 *     platform hot-reloads inside the real app with the real folder bridge. Development builds only.
 */
const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const workspace = require('./workspace');
const { setupUpdater } = require('./updater');
const { registerAppScheme, handleAppScheme, APP_ORIGIN } = require('./appProtocol');
const { API_ORIGIN } = require('./csp');
const display = require('./display');
const { readSettings, writeSettings } = require('./settings');
const { optOutOfAutoHdr } = require('./autoHdr');

const isDev = !app.isPackaged;
// Live development: load the Vite dev server instead of the bundled UI. Never in a packaged build.
const DEV_URL = isDev && (process.env.GFL_DEV_URL || (process.argv.includes('--dev') ? 'http://localhost:3000' : ''));
/**
 * scheme://host of a URL. Not URL.origin: for a custom scheme such as app:// that is the string "null",
 * which made every reload of our own page (login, logout) look foreign — it was blocked and handed to
 * Windows, which then asked for "an app to open this link".
 */
function originOf(url) {
  try { const u = new URL(url); return `${u.protocol}//${u.host}`; } catch { return ''; }
}

/** Only web and mail links leave the app, to the user's own browser/mail client. Anything else is dropped. */
function openOutside(url) {
  let protocol = '';
  try { protocol = new URL(url).protocol; } catch { return; }
  if (protocol === 'https:' || protocol === 'http:' || protocol === 'mailto:') shell.openExternal(url).catch(() => {});
}

const UI_ORIGIN = DEV_URL ? originOf(DEV_URL) : APP_ORIGIN;
// The app logo. Packaged Windows/macOS builds take their icon from the executable / bundle
// (electron-builder, build/icon.png); the window icon covers Linux and unpackaged runs.
const APP_ICON = path.join(__dirname, '..', 'build', 'icon.png');

registerAppScheme(); // before 'ready'

// Without this, dev takes its userData path from the scoped package name and lands in
// AppData/Roaming/@gfl/desktop while the packaged build uses productName — so a folder
// connected while developing would not be remembered by the real app. Must run before
// any getPath('userData') call.
app.setName('Garden For Life');

// No remote debugging of the installed app: --remote-debugging-port/--remote-debugging-pipe would let
// any local program drive the page (and its session). The fuses already block --inspect and run-as-Node.
if (app.isPackaged && (app.commandLine.hasSwitch('remote-debugging-port') || app.commandLine.hasSwitch('remote-debugging-pipe'))) {
  app.exit(1);
}

// One running app per user: a second copy would fight over the same folder and settings. It must stop
// HERE — app.quit() before 'ready' still lets the whenReady handler run (verified), which built a
// second full-screen window and a second updater before the copy exited. The lock lives in userData,
// so this comes after setName.
const isPrimaryInstance = app.requestSingleInstanceLock();
if (!isPrimaryInstance) app.exit(0);

/**
 * Optional graphics overrides for diagnosing rendering problems on a specific machine, without a new
 * build: <userData>/graphics-flags.json, e.g.
 *   { "switches": ["disable-direct-composition"], "disableFeatures": ["…"], "css": "canvas{opacity:.999}" }
 * Absent file = defaults. Chromium switches must be set before 'ready'.
 */
const graphicsFlags = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'graphics-flags.json'), 'utf8')) || {}; } catch { return {}; }
})();
for (const sw of Array.isArray(graphicsFlags.switches) ? graphicsFlags.switches : []) {
  const [name, value] = String(sw).replace(/^--/, '').split('=');
  if (/^[a-z0-9-]+$/.test(name)) { if (value !== undefined) app.commandLine.appendSwitch(name, value); else app.commandLine.appendSwitch(name); }
}
// Render in sRGB (SDR) on every display. With Windows HDR on, Chromium otherwise composites the page in
// HDR, where the orb's soft glow and the pyramid's additive colours come out differently from what the
// design (and every screenshot, and every non-HDR screen) shows. graphics-flags.json
// { "colorProfile": "system" } turns this off for diagnosis.
if (graphicsFlags.colorProfile !== 'system') app.commandLine.appendSwitch('force-color-profile', 'srgb');

if (Array.isArray(graphicsFlags.disableFeatures) && graphicsFlags.disableFeatures.length) {
  app.commandLine.appendSwitch('disable-features', graphicsFlags.disableFeatures.filter((f) => /^[A-Za-z0-9]+$/.test(f)).join(','));
}

/** Where the app remembers which folder the user picked. Not the data — just the path. */
const configFile = () => path.join(app.getPath('userData'), 'config.json');

function readConfig() {
  try { return JSON.parse(fs.readFileSync(configFile(), 'utf8')); } catch { return {}; }
}
function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(configFile()), { recursive: true });
  fs.writeFileSync(configFile(), JSON.stringify(cfg, null, 2), 'utf8');
}

// Keep Windows Auto HDR off this app (it turns soft glows into rings); once per install, before 'ready'.
// Only the installed app: a dev run would register electron.exe instead.
const autoHdrResult = isDev ? 'skipped (dev)' : optOutOfAutoHdr({ exePath: process.execPath, readConfig, writeConfig });

/**
 * Folders that a cloud service synchronises (Windows 11 moves Documents/Desktop into OneDrive by
 * default). Personal data placed there leaves the device, so a move into one asks first.
 */
function isCloudSynced(p) {
  const target = path.resolve(p).toLowerCase();
  const roots = [process.env.OneDrive, process.env.OneDriveConsumer, process.env.OneDriveCommercial]
    .filter(Boolean).map((r) => path.resolve(r).toLowerCase());
  if (roots.some((r) => target === r || target.startsWith(r + path.sep))) return true;
  return /[\\/](icloud ?drive|mobile documents|dropbox|google ?drive|onedrive[^\\/]*)([\\/]|$)/i.test(p);
}

/** The workspace root in use, or null when none is connected. */
let workspaceRoot = null;

/** Why the saved folder could not be opened at startup, surfaced to the UI. */
let startupWorkspaceError = null;

/** Guard for every IPC handler: refuse to touch disk before a folder has been chosen. */
function requireRoot() {
  if (!workspaceRoot) throw new Error('No workspace folder has been selected yet');
  return workspaceRoot;
}

// ── Window ─────────────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0a0510', // matches the platform ground so there is no white flash
    icon: APP_ICON,
    show: false,
    // The platform is the whole interface: full screen, no native menu bar. Maximize returns to full
    // screen, F11 toggles it, Esc leaves full screen, Esc twice quits. "Start in full screen" can be
    // turned off in the dashboard (settings.json).
    fullscreen: readSettings().startFullscreen,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Maximize = full screen (the maximized window with a title bar is never the resting state).
  win.on('maximize', () => { win.unmaximize(); win.setFullScreen(true); });

  // Esc once = leave full screen (a normal window with minimize / maximize / close); Esc twice quickly
  // = quit. The page still sees a single Esc, so closing a menu or overlay keeps working.
  let lastEsc = 0;
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    } else if (input.key === 'Escape' && !input.isAutoRepeat) {
      const now = Date.now();
      if (now - lastEsc < 600) { event.preventDefault(); app.quit(); return; }
      lastEsc = now;
      if (win.isFullScreen()) win.setFullScreen(false);
    } else if (input.key === 'F9') {
      // Diagnosis: the preload writes the stack of layers under a few screen points to the log.
      event.preventDefault();
      win.webContents.send('app:diagnose-layers');
      // …and what the page itself renders, to compare with what is on screen.
      win.webContents.capturePage().then((img) => {
        const out = path.join(app.getPath('logs'), `diagnose-${Date.now()}.png`);
        fs.writeFileSync(out, img.toPNG());
      }).catch(() => {});
    } else if (input.key === 'F10' && !input.isAutoRepeat) {
      // Diagnosis: F10 starts a Chromium performance trace, F10 again saves it to the logs folder.
      event.preventDefault();
      togglePerformanceTrace(win);
    } else if (isDev && input.key === 'F12') {
      win.webContents.toggleDevTools();
    }
  });

  attachRendererLog(win);
  win.webContents.once('did-finish-load', () => {
    try { console.log('[GFL Desktop] gpu', JSON.stringify(app.getGPUFeatureStatus())); } catch { /* ignore */ }
    try { require('fs').appendFileSync(path.join(app.getPath('logs'), 'renderer.log'), `${new Date().toISOString()} [gpu] ${JSON.stringify(app.getGPUFeatureStatus())}
`); } catch { /* ignore */ }
  });
  if (typeof graphicsFlags.css === 'string' && graphicsFlags.css) {
    win.webContents.on('did-finish-load', () => { win.webContents.insertCSS(graphicsFlags.css).catch(() => {}); });
  }
  // Diagnosis: { "benchShot": "<name>" } saves one screenshot of the landing and quits — the same view
  // under different graphics settings, to judge quality next to the numbers.
  if (typeof graphicsFlags.benchShot === 'string' && graphicsFlags.benchShot) {
    setTimeout(() => {
      win.webContents.capturePage().then((img) => {
        const safe = graphicsFlags.benchShot.replace(/[^a-z0-9_.-]/gi, '_');
        fs.writeFileSync(path.join(app.getPath('logs'), `shot-${safe}.png`), img.toPNG());
      }).catch(() => {}).then(() => app.quit());
    }, Number(graphicsFlags.benchShotMs) || 14000);
  }
  // Benchmark run ({ "bench": true }, see App.jsx): quit once the page reports the sequence finished.
  if (graphicsFlags.bench) {
    win.webContents.on('console-message', (_e, _level, message) => {
      if (String(message).startsWith('[bench] done')) setTimeout(() => app.quit(), 1000);
    });
  }

  // Anything that isn't our own UI opens in the user's browser, never in a window that
  // has the preload bridge attached.
  win.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });

  // Reloads of our own page (login and logout hard-refresh) pass; everything else leaves the app.
  win.webContents.on('will-navigate', (event, url) => {
    if (originOf(url) !== UI_ORIGIN) {
      event.preventDefault();
      openOutside(url);
    }
  });

  if (DEV_URL) {
    win.loadURL(DEV_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadURL(`${APP_ORIGIN}/index.html`);
  }
  return win;
}

/**
 * F10: a Chromium performance trace of what every frame costs — main-thread script, style, layout and
 * paint, the compositor's per-frame pipeline (presented or dropped) and the GPU process — for jank that
 * the per-pan fps line in renderer.log can only count. Saved as logs/trace-<time>.json (opens in Chrome
 * DevTools → Performance, or ui.perfetto.dev). Stays on this device, like the log.
 */
// Kept lean: the viz pipeline events, the V8 sampling profiler and every thread's generic task events
// ('toplevel') made a 30-second trace too big to save (the app closed without writing it). Main-thread
// tasks still come from devtools.timeline, presented/dropped frames from PipelineReporter (timeline.frame).
const TRACE_CATEGORIES = [
  'cc', 'gpu', 'blink.user_timing', 'v8.execute',
  'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame',
];
let traceState = 'idle'; // idle → recording → saving → idle

/** A short message on screen, so the user knows the key did something (the trace itself is invisible). */
function traceToast(win, text) {
  if (!win || win.isDestroyed()) return;
  const js = `(() => {
    const id = 'gfl-trace-toast';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      Object.assign(el.style, { position: 'fixed', top: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 2147483647,
        padding: '0.5rem 1rem', borderRadius: '0.15rem', background: 'rgba(2,0,3,0.85)', border: '1px solid rgba(255,174,0,0.5)',
        color: '#ffae00', font: "700 max(10px,0.5vw) 'Lexend Mega', Arial, sans-serif", letterSpacing: '0.12em',
        textTransform: 'uppercase', pointerEvents: 'none' });
      document.body.appendChild(el);
    }
    el.textContent = ${JSON.stringify(text)};
    clearTimeout(el._hide);
    el._hide = setTimeout(() => el.remove(), 6000);
  })()`;
  win.webContents.executeJavaScript(js).catch(() => {});
}

async function togglePerformanceTrace(win) {
  const { contentTracing } = require('electron');
  const note = (line) => {
    try { fs.appendFileSync(path.join(app.getPath('logs'), 'renderer.log'), `${new Date().toISOString()} [trace] ${line}\n`); } catch { /* ignore */ }
  };
  try {
    if (traceState === 'idle') {
      await contentTracing.startRecording({
        included_categories: TRACE_CATEGORIES,
        excluded_categories: ['*'],
        record_mode: 'record-until-full',
        trace_buffer_size_in_kb: 200 * 1024,
      });
      traceState = 'recording';
      note('recording — press F10 again to save');
      traceToast(win, 'Trace recording — F10 to save');
    } else if (traceState === 'recording') {
      traceState = 'saving';
      note('saving…');
      traceToast(win, 'Saving trace…');
      const out = await contentTracing.stopRecording(path.join(app.getPath('logs'), `trace-${Date.now()}.json`));
      const mb = (() => { try { return (fs.statSync(out).size / 1e6).toFixed(1); } catch { return '?'; } })();
      note(`saved ${out} (${mb} MB)`);
      traceToast(win, `Trace saved (${mb} MB)`);
      traceState = 'idle';
    }
  } catch (err) {
    note(`failed: ${err && err.message}`);
    traceToast(win, 'Trace failed — see renderer.log');
    traceState = 'idle';
  }
}

/**
 * Renderer warnings and errors go to a local log file (…/Garden For Life/logs/renderer.log), so a
 * problem in the installed app can be diagnosed without DevTools. Stays on this device; capped at
 * about 1 MB (older half dropped). Info lines only when they concern rendering (GPU, WebGL, workers).
 */
function attachRendererLog(win) {
  const file = path.join(app.getPath('logs'), 'renderer.log');
  const write = (line) => {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      if (fs.existsSync(file) && fs.statSync(file).size > 1024 * 1024) {
        const keep = fs.readFileSync(file, 'utf8');
        fs.writeFileSync(file, keep.slice(Math.floor(keep.length / 2)));
      }
      fs.appendFileSync(file, `${new Date().toISOString()} ${line}
`);
    } catch { /* logging must never break the app */ }
  };
  write(`— start v${app.getVersion()} ${process.platform} electron ${process.versions.electron} UI ${DEV_URL || APP_ORIGIN} flags ${JSON.stringify(graphicsFlags)}`);
  // Refresh rate per display: the app renders at the rate of the display its window is on.
  const { screen } = require('electron'); // only usable after 'ready'
  write(`[auto-hdr] ${autoHdrResult}`);
  write(`[display] ${screen.getAllDisplays().map((d) => `${d.size.width}x${d.size.height} @ ${d.displayFrequency} Hz${d.id === screen.getPrimaryDisplay().id ? ' (primary)' : ''}`).join(' · ')}`);
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    const relevant = level >= 2 || /nebula|webgl|gpu|worker|offscreen|shader/i.test(String(message));
    if (relevant) write(`[${['log', 'info', 'warn', 'error'][level] || level}] ${String(message).slice(0, 2000)} (${String(sourceId || '').split('/').pop()}:${line})`);
  });
  win.webContents.on('did-fail-load', (_e, code, desc, url) => write(`[load-failed] ${code} ${desc} ${url}`));
  win.webContents.on('render-process-gone', (_e, details) => write(`[renderer-gone] ${details.reason} ${details.exitCode}`));
  app.on('child-process-gone', (_e, details) => write(`[child-gone] ${details.type} ${details.reason} ${details.exitCode}`));
}

// ── IPC: the entire surface the renderer can reach ─────────────────────────────

function registerIpc() {
  // Which folder is in use, and whether it needs setting up. Safe before selection.
  ipcMain.handle('workspace:status', async () => {
    if (!workspaceRoot) return { connected: false, error: startupWorkspaceError };
    const manifest = await workspace.readManifest(workspaceRoot);
    return {
      connected: true,
      root: workspaceRoot,
      schemaVersion: manifest?.schemaVersion ?? null,
      folderId: manifest?.folderId ?? null,
      accountId: manifest?.accountId ?? null,
    };
  });

  // The one moment the user grants access. A native dialog is the grant — there is no
  // way for the page to widen it afterwards, because every later call is contained.
  ipcMain.handle('workspace:choose', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Choose your Garden For Life folder',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Use this folder',
    });
    if (result.canceled || !result.filePaths.length) return { connected: false };

    const root = result.filePaths[0];
    const manifest = await workspace.ensureScaffold(root, app.getVersion());
    const migration = await workspace.migrate(root, app.getVersion());

    workspaceRoot = root;
    startupWorkspaceError = null;
    writeConfig({ ...readConfig(), workspaceRoot: root });
    return {
      connected: true,
      root,
      schemaVersion: (migration.manifest || manifest).schemaVersion,
      migrated: migration.migrated || false,
    };
  });

  // The app's own folder for this account: <home>/Garden For Life, or the next free "Garden For Life N"
  // when that one belongs to another account on this computer. Created, connected and bound in one go.
  ipcMain.handle('workspace:create', async (_e, accountId) => {
    const id = typeof accountId === 'string' ? accountId.trim() : '';
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) throw new Error('A valid account id is required');
    const root = await workspace.defaultFolderFor(app.getPath('home'), id);
    await workspace.ensureScaffold(root, app.getVersion());
    await workspace.migrate(root, app.getVersion());
    await workspace.linkAccount(root, id);
    workspaceRoot = root;
    startupWorkspaceError = null;
    writeConfig({ ...readConfig(), workspaceRoot: root });
    return { connected: true, root };
  });

  // Move the folder somewhere else (another drive, a folder of the user's choice). The folder keeps
  // its name; the copy is verified before the original is removed (workspace.moveFolder).
  ipcMain.handle('workspace:move', async (event) => {
    const root = requireRoot();
    const win = BrowserWindow.fromWebContents(event.sender);
    const pick = await dialog.showOpenDialog(win, {
      title: 'Werkmap verplaatsen — kies de nieuwe locatie',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: 'Hierheen verplaatsen',
    });
    if (pick.canceled || !pick.filePaths.length) return { moved: false };
    const dest = pick.filePaths[0];
    if (isCloudSynced(dest)) {
      const answer = await dialog.showMessageBox(win, {
        type: 'warning',
        buttons: ['Annuleren', 'Toch verplaatsen'],
        defaultId: 0,
        cancelId: 0,
        title: 'Gesynchroniseerde map',
        message: 'Deze locatie wordt gesynchroniseerd met een cloudopslag (zoals OneDrive, iCloud, Dropbox of Google Drive).',
        detail: 'Je persoonlijke gegevens komen dan ook bij die dienst terecht. Kies liever een map die niet wordt gesynchroniseerd.',
      });
      if (answer.response !== 1) return { moved: false };
    }
    const result = await workspace.moveFolder(root, dest);
    workspaceRoot = result.root;
    writeConfig({ ...readConfig(), workspaceRoot: result.root });
    return { moved: result.moved, root: result.root };
  });

  ipcMain.handle('workspace:forget', async () => {
    // Forgets the path only. The folder and everything in it stay on disk — the app
    // has no business deleting the user's own data because they disconnected it.
    workspaceRoot = null;
    const cfg = readConfig();
    delete cfg.workspaceRoot;
    writeConfig(cfg);
    return { connected: false };
  });

  // ── Named operations. None of these takes a path from the renderer. ──
  ipcMain.handle('workspace:backup', () => workspace.backupFolder(requireRoot()));

  // Bind the folder to the logged-in account (manifest.accountId). First link sets it; another
  // account is refused, so a shared computer cannot mix two people's data in one folder.
  ipcMain.handle('workspace:link-account', (_e, accountId) => workspace.linkAccount(requireRoot(), accountId));

  ipcMain.handle('profile:read-partial', () => workspace.readPartial(requireRoot()));
  ipcMain.handle('profile:write-partial', (_e, data) => workspace.writePartial(requireRoot(), data));
  ipcMain.handle('profile:read-full', () => workspace.readFullProfile(requireRoot()));
  ipcMain.handle('profile:write-full', (_e, data) => workspace.writeFullProfile(requireRoot(), data));

  ipcMain.handle('reports:save', (_e, pdfBase64, label) => workspace.saveReport(requireRoot(), pdfBase64, label));
  ipcMain.handle('reports:list', () => workspace.listReports(requireRoot()));
  ipcMain.handle('reports:read', (_e, name) => workspace.readReport(requireRoot(), name));

  ipcMain.handle('tools:read-state', (_e, toolId) => workspace.readToolState(requireRoot(), toolId));
  ipcMain.handle('tools:write-state', (_e, toolId, data) => workspace.writeToolState(requireRoot(), toolId, data));
  ipcMain.handle('tools:write-output', (_e, toolId, name, data) => workspace.writeToolOutput(requireRoot(), toolId, name, data));
  ipcMain.handle('tools:list-output', (_e, toolId) => workspace.listToolOutput(requireRoot(), toolId));

  ipcMain.handle('consent:list', () => workspace.readConsent(requireRoot()));
  ipcMain.handle('consent:grant', (_e, entry) => workspace.recordConsent(requireRoot(), entry));
  ipcMain.handle('consent:revoke', (_e, toolId) => workspace.revokeConsent(requireRoot(), toolId));

  // Opens the folder in Explorer/Finder. Scoped to the root; it takes no argument, so it
  // cannot be pointed anywhere else.
  ipcMain.handle('workspace:reveal', async () => {
    await shell.openPath(requireRoot());
    return { revealed: true };
  });

  // The diagnosis flags the page may read (layer / nebula mode switches). Data only.
  ipcMain.on('app:graphics-flags', (event) => { event.returnValue = graphicsFlags; });

  // App settings (dashboard → Instellingen → App). Read synchronously once by the preload, because the
  // graphics profile is fixed when the page starts; a change applies on the next page load.
  ipcMain.on('app:settings', (event) => { event.returnValue = readSettings(); });
  ipcMain.handle('settings:get', () => readSettings());
  ipcMain.handle('settings:set', (_e, patch) => writeSettings(patch));
  ipcMain.handle('app:reload', (event) => { event.sender.reload(); return true; });

  // Screen refresh rate (display.js). Every change waits 15 s for "keep" and reverts otherwise.
  const windowOf = (event) => BrowserWindow.fromWebContents(event.sender);
  ipcMain.handle('display:describe', (event) => display.describe(windowOf(event)));
  ipcMain.handle('display:set-rate', (event, hz) => display.requestRate(windowOf(event), hz, 'settings'));
  ipcMain.handle('display:keep', () => display.settle(true));
  ipcMain.handle('display:revert', () => display.settle(false));
  ipcMain.handle('display:pending', () => display.getPending());
  // Once per machine, on first start: move the screen the app is on to the highest rate it offers.
  // Marked done before switching, so a revert (or a crash) never turns this into a question on every start.
  ipcMain.handle('display:first-run', (event) => {
    const cfg = readConfig();
    if (cfg.displayRateChecked) return { ok: true, skipped: 'done' };
    writeConfig({ ...cfg, displayRateChecked: true });
    const info = display.describe(windowOf(event));
    const best = Math.max(0, ...info.rates);
    if (!info.canChange || best <= info.hz) return { ok: true, skipped: 'highest', hz: info.hz };
    return display.requestRate(windowOf(event), best, 'first-run');
  });

  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    apiOrigin: API_ORIGIN,
  }));
}

// ── Boot ───────────────────────────────────────────────────────────────────────

if (isPrimaryInstance) app.whenReady().then(async () => {
  // The bundled UI is served from app://gardenforlife with the CSP as a response header
  // (appProtocol.js); sync-ui.js also writes it into index.html as a meta tag.
  handleAppScheme();
  Menu.setApplicationMenu(null); // no native menu bar — the platform is the interface

  // First start: the app creates the folder itself, <home>/Garden For Life, so nobody has to decide
  // where their data goes (they can move it later). It is bound to the account at the first login.
  // Afterwards: restore the saved folder, but only if it still exists — a folder that was moved
  // outside the app, or sits on a drive that is not plugged in, drops us back to "not connected"
  // (the Werkruimte tab offers to reconnect it or make a new one) instead of silently starting over.
  const cfg = readConfig();
  if (!cfg.workspaceRoot && !cfg.workspaceSetUp) {
    try {
      const root = path.join(app.getPath('home'), workspace.DEFAULT_FOLDER_NAME);
      await workspace.ensureScaffold(root, app.getVersion());
      writeConfig({ ...cfg, workspaceRoot: root, workspaceSetUp: true });
    } catch (err) {
      console.error('[GFL Desktop] Could not create the default folder:', err.message);
      startupWorkspaceError = err.message;
    }
  }
  const saved = readConfig().workspaceRoot;
  if (saved && fs.existsSync(saved)) {
    // Migration has to run on a RESTORED folder too, not just a freshly picked one:
    // this is the path that runs on every subsequent launch, and it is where a folder
    // written by a newer app version must be refused before anything writes to it.
    try {
      await workspace.migrate(saved, app.getVersion());
      workspaceRoot = saved;
    } catch (err) {
      // A newer-schema folder (or an unreadable one) leaves us disconnected rather than
      // silently operating on it with older assumptions.
      console.error('[GFL Desktop] Workspace not opened:', err.message);
      startupWorkspaceError = err.message;
    }
  }

  // macOS ignores the window icon; an unpackaged run would otherwise show Electron's in the dock.
  if (isDev && process.platform === 'darwin' && app.dock) app.dock.setIcon(APP_ICON);

  registerIpc();
  setupUpdater();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Never leave an unconfirmed refresh rate behind.
app.on('will-quit', () => display.revertPendingOnQuit());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Opening the app again (shortcut, installer) brings the running window forward.
app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

if (isDev) {
  app.on('ready', () => console.log('[GFL Desktop] dev — UI:', DEV_URL || APP_ORIGIN, '· userData:', app.getPath('userData')));
}
