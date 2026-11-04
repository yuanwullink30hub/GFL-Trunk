/**
 * Updates for the management app — from a PRIVATE feed.
 *
 * The feed is the backend's management API (…/api/admin/app/update, electron-builder.yml `publish`),
 * which answers only a valid management token and looks nonexistent to anything else. So the updater
 * cannot run before someone has logged in: the page hands the session token over (setSession), the
 * updater sends it along with every feed and download request, checks right away and every few hours.
 * Logging out removes the token and stops the checks. Differential downloads are off (the feed serves
 * whole files), so every update downloads the full installer.
 *
 * The screens update apart from the installer (uiUpdates.js): their state rides in `status.ui`; the update
 * button checks both, and "restart" installs a downloaded installer or, when only new screens wait, restarts.
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const { checkUi, scheduleUiUpdates, uiStatus } = require('./uiUpdates');

const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;

let status = { state: app.isPackaged ? 'idle' : 'dev', current: app.getVersion() };
let token = null;
let timer = null;

function publish(next) {
  status = { ...status, ...next, current: app.getVersion(), ui: uiStatus() };
  for (const win of BrowserWindow.getAllWindows()) if (!win.isDestroyed()) win.webContents.send('update:status', status);
}

/** Restart into the newly downloaded screens. */
function restartForUi() {
  if (!uiStatus() || uiStatus().state !== 'staged') return false;
  setImmediate(() => { app.relaunch(); app.exit(0); });
  return true;
}

function setupUpdater() {
  ipcMain.handle('update:status', () => ({ ...status, ui: uiStatus() }));
  scheduleUiUpdates(() => publish({}));

  if (!app.isPackaged) {
    ipcMain.handle('session:set', () => false);
    ipcMain.handle('update:check', async () => { await checkUi(); return { ...status, ui: uiStatus() }; });
    ipcMain.handle('update:install', () => restartForUi());
    return;
  }

  const { autoUpdater } = require('electron-updater');
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.disableDifferentialDownload = true;
  autoUpdater.logger = null;

  autoUpdater.on('checking-for-update', () => publish({ state: 'checking' }));
  autoUpdater.on('update-not-available', () => publish({ state: 'current' }));
  autoUpdater.on('update-available', (info) => publish({ state: 'downloading', version: info.version, percent: 0 }));
  autoUpdater.on('download-progress', (p) => publish({ state: 'downloading', percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', (info) => publish({ state: 'ready', version: info.version }));
  autoUpdater.on('error', (err) => publish({ state: 'error', message: String((err && err.message) || err).slice(0, 200) }));

  const check = () => { if (token) autoUpdater.checkForUpdates().catch(() => { /* reported via 'error' */ }); };

  ipcMain.handle('session:set', (_e, value) => {
    token = typeof value === 'string' && value.length > 20 && value.length < 4096 ? value : null;
    autoUpdater.requestHeaders = token ? { Authorization: `Bearer ${token}` } : null;
    clearInterval(timer);
    timer = null;
    if (token) {
      check();
      timer = setInterval(check, CHECK_EVERY_MS);
    } else {
      publish({ state: 'idle' });
    }
    return true;
  });

  // The "check for updates" button (dashboard header). Needs the session: the feed answers nothing else.
  // The installer feed needs the session; the screens' feed does not.
  ipcMain.handle('update:check', async () => {
    await Promise.all([
      token ? autoUpdater.checkForUpdates().catch(() => { /* reported via 'error' */ }) : null,
      checkUi(),
    ]);
    return { ...status, ui: uiStatus() };
  });

  ipcMain.handle('update:install', () => {
    if (status.state === 'ready') {
      setImmediate(() => autoUpdater.quitAndInstall(false, true));
      return true;
    }
    return restartForUi();
  });
}

module.exports = { setupUpdater };
