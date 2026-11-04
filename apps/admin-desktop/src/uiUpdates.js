/**
 * Which management UI this run serves, and newer signed builds in the background (uiBundle.js).
 *
 * At start: the newest verified downloaded build that fits this shell, else the installer's copy (decided
 * once, before the window loads). Then a check 20 s after start, every 4 h, and whenever the update button is
 * pressed: a newer build is downloaded (only changed files) and staged; the button then offers a restart.
 * The feed is public (the source is public too); what runs is decided by the pinned key and `"app": "admin"`.
 * Only an unpackaged run may point at a test feed/key (GFL_ADMIN_UI_FEED, GFL_UI_PUBKEY_FILE).
 */
const { app, net } = require('electron');
const fs = require('fs');
const path = require('path');
const uiBundle = require('./uiBundle');
const { UI_PUBLIC_KEY_PEM } = require('./uiKey');
const { SHELL_API_LEVEL } = require('./shellApi');
const { setActiveUi, UI_ROOT } = require('./appProtocol');

const dev = !app.isPackaged;
const FEED = (dev && process.env.GFL_ADMIN_UI_FEED) || 'https://downloads.gardenforlife.nl/admin-ui';
const KEY = dev && process.env.GFL_UI_PUBKEY_FILE ? fs.readFileSync(process.env.GFL_UI_PUBKEY_FILE, 'utf8') : UI_PUBLIC_KEY_PEM;
const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;

const storeDir = () => path.join(app.getPath('userData'), 'ui-builds');
function log(message) {
  try { fs.appendFileSync(path.join(app.getPath('logs'), 'ui-updates.log'), `${new Date().toISOString()} ${message}\n`); } catch { /* ignore */ }
  if (dev) console.log('[Admin GFL]', message);
}

let current = null;
// { state: 'idle' | 'checking' | 'current' | 'staged' | 'needs-app-update' | 'error', buildId?, running? }
let status = { state: 'idle' };
let onChange = () => {};
let busy = null;

function set(next) {
  status = { ...next, running: current ? current.buildId : null };
  onChange(status);
}

/** Pick this run's UI. Call before the first window loads. */
function startUi() {
  current = uiBundle.resolveActiveUi({ bundledRoot: UI_ROOT, storeDir: storeDir(), publicKeyPem: KEY, shellApiLevel: SHELL_API_LEVEL, log });
  setActiveUi(current);
  log(`UI: ${current.source} build ${current.buildId}`);
  status = { state: 'idle', running: current.buildId };
  return current;
}

/** Look for a newer build now; resolves with the status. Never throws. */
function checkUi() {
  if (!current) return Promise.resolve(status);
  if (status.state === 'staged') return Promise.resolve(status); // already waiting for a restart
  if (busy) return busy;
  set({ state: 'checking' });
  busy = uiBundle.checkForUiUpdate({
    baseUrl: FEED, storeDir: storeDir(), current, publicKeyPem: KEY, shellApiLevel: SHELL_API_LEVEL,
    fetchImpl: (url, opts) => net.fetch(url, opts), log,
  }).then((r) => {
    set({ state: r.state, buildId: r.buildId });
    if (r.state === 'needs-app-update') log(`UI build ${r.buildId} needs a newer app (shell API ${SHELL_API_LEVEL})`);
  }).catch((err) => {
    log(`UI update check failed: ${err.message}`);
    set({ state: 'error', message: String(err.message || err).slice(0, 200) });
  }).then(() => { busy = null; return status; });
  return busy;
}

/** Background checks (packaged runs, or a dev run pointed at a test feed). */
function scheduleUiUpdates(listener) {
  if (listener) onChange = listener;
  if (dev && !process.env.GFL_ADMIN_UI_FEED) return;
  setTimeout(checkUi, 20 * 1000);
  setInterval(checkUi, CHECK_EVERY_MS);
}

const uiStatus = () => status;

module.exports = { startUi, checkUi, scheduleUiUpdates, uiStatus };
