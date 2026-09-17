/**
 * Garden For Life Beheer — main process.
 *
 * A window around the bundled management UI (apps/admin build, served from app://gflbeheer). It runs
 * only on the management computer: the installer is never public (the backend hands it out to a
 * logged-in management account) and updates come from the same private source (updater.js).
 */
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { registerAppScheme, handleAppScheme, APP_ORIGIN } = require('./appProtocol');
const { setupUpdater } = require('./updater');

const APP_ICON = path.join(__dirname, '..', 'build', 'icon.png');

registerAppScheme(); // before 'ready'
app.setName('Garden For Life Beheer');

// No remote debugging of the installed app: --remote-debugging-port/--remote-debugging-pipe would let
// any local program drive the page (and its session). The fuses already block --inspect and run-as-Node.
if (app.isPackaged && (app.commandLine.hasSwitch('remote-debugging-port') || app.commandLine.hasSwitch('remote-debugging-pipe'))) {
  app.exit(1);
}

// One running copy. A second one stops here, before any window or IPC exists.
const isPrimaryInstance = app.requestSingleInstanceLock();
if (!isPrimaryInstance) app.exit(0);

/** scheme://host — URL.origin is "null" for app://, so it cannot be used for this comparison. */
function originOf(url) {
  try { const u = new URL(url); return `${u.protocol}//${u.host}`; } catch { return ''; }
}

/** Only web and mail links leave the app, to the browser / mail client. Everything else is dropped. */
function openOutside(url) {
  let protocol = '';
  try { protocol = new URL(url).protocol; } catch { return; }
  if (protocol === 'https:' || protocol === 'mailto:') shell.openExternal(url).catch(() => {});
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0510',
    icon: APP_ICON,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: false,
    },
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  win.webContents.setWindowOpenHandler(({ url }) => {
    openOutside(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (originOf(url) !== APP_ORIGIN) {
      event.preventDefault();
      openOutside(url);
    }
  });

  win.loadURL(`${APP_ORIGIN}/index.html`);
  return win;
}

if (isPrimaryInstance) app.whenReady().then(() => {
  handleAppScheme();
  Menu.setApplicationMenu(null);
  setupUpdater();
  createWindow();
});

app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows();
  if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
});

app.on('window-all-closed', () => app.quit());
