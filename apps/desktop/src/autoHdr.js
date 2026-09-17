'use strict';

/**
 * Windows Auto HDR opt-out for this app.
 *
 * Auto HDR treats a full-screen DirectX window like a game and stretches its SDR colours into HDR. Soft,
 * faint glows over the near-black page (the orb and header halos) span only a few colour steps; stretched,
 * those steps show as rings. The page dithers its glows as well, but the app also asks Windows to leave it
 * alone — through the same per-app switch as Settings › System › Display › Graphics › Auto HDR, which lives
 * in HKCU\Software\Microsoft\DirectX\UserGpuPreferences under a value named after the exe. Windows writes
 * "AutoHDREnable=2097;" for an app with Auto HDR on; 2096 is the same flags with it off. Other settings in
 * that value (a GPU preference) are kept, and so are other apps and games.
 *
 * Done once per install path (config.autoHdrOptOut records it), so someone who turns Auto HDR back on for
 * the app in Settings is not overridden. Runs before 'ready', while the GPU process doesn't exist yet, so
 * it applies to this launch. Never throws.
 */

const { execFileSync } = require('child_process');

const KEY = 'HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences';
const OFF = 'AutoHDREnable=2096';
const REG_OPTS = { encoding: 'utf8', windowsHide: true, timeout: 5000, stdio: ['ignore', 'pipe', 'ignore'] };

function optOutOfAutoHdr({ exePath, readConfig, writeConfig }) {
  if (process.platform !== 'win32') return 'not windows';
  const cfg = readConfig();
  if (cfg.autoHdrOptOut === exePath) return 'already done';
  try {
    let current = '';
    try {
      const out = execFileSync('reg', ['query', KEY, '/v', exePath], REG_OPTS);
      current = (out.match(/REG_SZ[ \t]+(.*)$/m) || [])[1] || '';
    } catch { /* no entry for this exe yet */ }
    const kept = current.split(';').map((p) => p.trim()).filter((p) => p && !/^AutoHDREnable=/i.test(p));
    const value = `${[...kept, OFF].join(';')};`;
    execFileSync('reg', ['add', KEY, '/v', exePath, '/t', 'REG_SZ', '/d', value, '/f'], REG_OPTS);
    writeConfig({ ...cfg, autoHdrOptOut: exePath });
    return `set ${value} (was ${current || 'unset'})`;
  } catch (err) {
    return `failed: ${err.message}`;
  }
}

module.exports = { optOutOfAutoHdr };
