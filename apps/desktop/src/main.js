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

const isDev = !app.isPackaged;
// Live development: load the Vite dev server instead of the bundled UI. Never in a packaged build.
const DEV_URL = isDev && (process.env.GFL_DEV_URL || (process.argv.includes('--dev') ? 'http://localhost:3000' : ''));
const UI_ORIGIN = DEV_URL ? new URL(DEV_URL).origin : APP_ORIGIN;
// The app logo. Packaged Windows/macOS builds take their icon from the executable / bundle
// (electron-builder, build/icon.png); the window icon covers Linux and unpackaged runs.
const APP_ICON = path.join(__dirname, '..', 'build', 'icon.png');

registerAppScheme(); // before 'ready'

// Without this, dev takes its userData path from the scoped package name and lands in
// AppData/Roaming/@gfl/desktop while the packaged build uses productName — so a folder
// connected while developing would not be remembered by the real app. Must run before
// any getPath('userData') call.
app.setName('Garden For Life');

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

/** The chosen workspace root, or null when the user hasn't picked one yet. */
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
    // screen, F11 toggles it, Esc leaves full screen, Esc twice quits.
    fullscreen: true,
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
    } else if (isDev && input.key === 'F12') {
      win.webContents.toggleDevTools();
    }
  });

  attachRendererLog(win);
  if (typeof graphicsFlags.css === 'string' && graphicsFlags.css) {
    win.webContents.on('did-finish-load', () => { win.webContents.insertCSS(graphicsFlags.css).catch(() => {}); });
  }

  // Anything that isn't our own UI opens in the user's browser, never in a window that
  // has the preload bridge attached.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    let origin = '';
    try { origin = new URL(url).origin; } catch { /* not a URL */ }
    if (origin !== UI_ORIGIN) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
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

  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    apiOrigin: API_ORIGIN,
  }));
}

// ── Boot ───────────────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  // The bundled UI is served from app://gardenforlife with the CSP as a response header
  // (appProtocol.js); sync-ui.js also writes it into index.html as a meta tag.
  handleAppScheme();
  Menu.setApplicationMenu(null); // no native menu bar — the platform is the interface

  // Restore the previously chosen folder, but only if it still exists — a moved or
  // deleted folder drops us back to "not connected" rather than erroring on every call.
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// A second instance would fight over the same folder; focus the existing window instead.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
}

if (isDev) {
  app.on('ready', () => console.log('[GFL Desktop] dev — UI:', DEV_URL || APP_ORIGIN, '· userData:', app.getPath('userData')));
}
