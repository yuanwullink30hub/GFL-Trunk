/**
 * In-app updates.
 *
 * The app IS the platform (the UI ships inside it), so every platform release is an app release.
 * The app needs the internet anyway (account, network, models), so it keeps itself current:
 *   - checks the release feed on start and every few hours (feed = the R2 downloads bucket,
 *     `publish` in electron-builder.yml → latest.yml / latest-mac.yml / latest-linux.yml)
 *   - downloads a new version quietly in the background
 *   - tells the page "ready"; the user restarts when it suits them (the page shows the button),
 *     and an update left waiting installs on the next normal quit anyway
 *
 * The workspace folder lives outside the install directory, so an update never touches it.
 * Development builds (not packaged) never check.
 */
const { app, BrowserWindow, ipcMain } = require('electron');

const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;

/** Last known state, so a page that loads later still gets it. */
let status = { state: 'idle', version: app.getVersion() };

function publish(next) {
  status = { ...status, ...next, current: app.getVersion() };
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('update:status', status);
  }
}

function setupUpdater() {
  ipcMain.handle('update:status', () => ({ ...status, current: app.getVersion() }));

  if (!app.isPackaged) {
    status = { state: 'dev', current: app.getVersion() };
    ipcMain.handle('update:check', () => status);
    ipcMain.handle('update:install', () => false);
    return;
  }

  // Required lazily: electron-updater reads app-update.yml, which only exists in a packaged build.
  const { autoUpdater } = require('electron-updater');
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = null;

  autoUpdater.on('checking-for-update', () => publish({ state: 'checking' }));
  autoUpdater.on('update-not-available', () => publish({ state: 'current', version: app.getVersion() }));
  autoUpdater.on('update-available', (info) => publish({ state: 'downloading', version: info.version, percent: 0 }));
  autoUpdater.on('download-progress', (p) => publish({ state: 'downloading', percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', (info) => publish({ state: 'ready', version: info.version }));
  // Offline, feed unreachable, or (macOS) an unsigned build that cannot self-update: say so
  // quietly; the page offers the download page instead of an error.
  autoUpdater.on('error', (err) => publish({ state: 'error', message: String((err && err.message) || err).slice(0, 200) }));

  const check = () => autoUpdater.checkForUpdates().catch(() => { /* reported via 'error' */ });

  ipcMain.handle('update:check', async () => { await check(); return status; });
  // Only when the user clicks "restart": quit, install, relaunch.
  ipcMain.handle('update:install', () => {
    if (status.state !== 'ready') return false;
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
    return true;
  });

  // A little after start so it never competes with the first paint.
  setTimeout(check, 15 * 1000);
  setInterval(check, CHECK_EVERY_MS);
}

module.exports = { setupUpdater };
