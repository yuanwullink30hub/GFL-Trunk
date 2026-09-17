/**
 * App settings the user changes in the dashboard (Profiel → Instellingen → App).
 *
 * These belong to the machine, not the account: a laptop and a desktop of the same user want different
 * graphics. Stored as settings.json in the app's user-data folder, never sent to our servers.
 */
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const GRAPHICS = ['high', 'balanced', 'saver'];
const DEFAULTS = Object.freeze({ graphics: 'high', startFullscreen: true });

const file = () => path.join(app.getPath('userData'), 'settings.json');

/** Only known keys with valid values survive; everything else falls back to the default. */
function sanitize(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  return {
    graphics: GRAPHICS.includes(s.graphics) ? s.graphics : DEFAULTS.graphics,
    startFullscreen: typeof s.startFullscreen === 'boolean' ? s.startFullscreen : DEFAULTS.startFullscreen,
  };
}

function readSettings() {
  try { return sanitize(JSON.parse(fs.readFileSync(file(), 'utf8'))); } catch { return { ...DEFAULTS }; }
}

function writeSettings(patch) {
  const next = sanitize({ ...readSettings(), ...(patch && typeof patch === 'object' ? patch : {}) });
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(next, null, 2), 'utf8');
  return next;
}

module.exports = { readSettings, writeSettings, sanitize, DEFAULTS, GRAPHICS };
