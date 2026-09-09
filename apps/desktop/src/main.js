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
const { app, BrowserWindow, dialog, ipcMain, shell, session } = require('electron');
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
    if (!workspaceRoot) return { connected: false };
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

  ipcMain.handle('workspace:read', (_e, relPath) => workspace.readFileIn(requireRoot(), relPath));
  ipcMain.handle('workspace:write', (_e, relPath, data, encoding) =>
    workspace.writeFileIn(requireRoot(), relPath, data, encoding));
  ipcMain.handle('workspace:list', (_e, relPath) => workspace.listIn(requireRoot(), relPath));
  ipcMain.handle('workspace:remove', (_e, relPath) => workspace.removeIn(requireRoot(), relPath));
  ipcMain.handle('workspace:backup', (_e, label) => workspace.backupFolder(requireRoot(), label));

  ipcMain.handle('consent:list', () => workspace.readConsent(requireRoot()));
  ipcMain.handle('consent:grant', (_e, entry) => workspace.recordConsent(requireRoot(), entry));
  ipcMain.handle('consent:revoke', (_e, toolId) => workspace.revokeConsent(requireRoot(), toolId));

  // Opens the folder in Explorer/Finder so the user can see their own data. Scoped to
  // the workspace root; it cannot be pointed anywhere else.
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

app.whenReady().then(() => {
  // Content-Security-Policy for the bundled UI: it may talk to our API and load Google
  // Fonts, and nothing else. Without this the renderer could be talked into fetching
  // from anywhere, which matters a great deal more here than in a browser tab.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self';",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
          'font-src \'self\' https://fonts.gstatic.com data:;',
          "img-src 'self' data: blob:;",
          `connect-src 'self' ${API_ORIGIN};`,
          "object-src 'none';",
          "frame-ancestors 'none';",
        ].join(' '),
      },
    });
  });

  // Restore the previously chosen folder, but only if it still exists — a moved or
  // deleted folder drops us back to "not connected" rather than erroring on every call.
  const saved = readConfig().workspaceRoot;
  if (saved && fs.existsSync(saved)) workspaceRoot = saved;

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
