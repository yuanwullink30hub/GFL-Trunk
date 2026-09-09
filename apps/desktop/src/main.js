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
 */
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const workspace = require('./workspace');

const API_ORIGIN = 'https://api.gardenforlife.nl';
const isDev = !app.isPackaged;

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
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Anything that isn't our own UI opens in the user's browser, never in a window that
  // has the preload bridge attached.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url).catch(() => {});
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  win.loadFile(path.join(__dirname, '..', 'ui', 'index.html'));
  return win;
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

  ipcMain.handle('profile:read-partial', () => workspace.readPartial(requireRoot()));
  ipcMain.handle('profile:write-partial', (_e, data) => workspace.writePartial(requireRoot(), data));
  ipcMain.handle('profile:read-full', () => workspace.readFullProfile(requireRoot()));
  ipcMain.handle('profile:write-full', (_e, data) => workspace.writeFullProfile(requireRoot(), data));

  ipcMain.handle('reports:save', (_e, pdfBase64) => workspace.saveReport(requireRoot(), pdfBase64));
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
  // NOTE: the CSP is delivered as a <meta> tag injected into the bundled index.html by
  // scripts/sync-ui.js, NOT as a response header. Header interception via
  // webRequest.onHeadersReceived does not fire for file:// loads, which is the only kind
  // this app performs — so a header-based policy silently did nothing at all.

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

  registerIpc();
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
  app.on('ready', () => console.log('[GFL Desktop] dev mode — userData:', app.getPath('userData')));
}
