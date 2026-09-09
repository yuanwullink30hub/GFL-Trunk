/**
 * Copy the built platform UI into the app for bundling.
 *
 * The app ships the interface inside itself rather than loading it from the web, so it
 * works with no connection — which matters when the whole point is data that lives on
 * this machine. The trade is that shipping a new UI means shipping a new app version.
 *
 *   node scripts/sync-ui.js
 */
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const DESKTOP = path.resolve(HERE, '..');
const PLATFORM_DIST = path.resolve(DESKTOP, '..', 'platform', 'dist');
const TARGET = path.join(DESKTOP, 'ui');

if (!fs.existsSync(path.join(PLATFORM_DIST, 'index.html'))) {
  console.error('\n✘ No platform build found at:\n  ' + PLATFORM_DIST);
  console.error('\n  Build it first, from the repo root:');
  console.error('    corepack pnpm@9.0.0 --filter @gfl/platform build\n');
  process.exit(1);
}

fs.rmSync(TARGET, { recursive: true, force: true });
fs.cpSync(PLATFORM_DIST, TARGET, { recursive: true });

// Source maps are development aids that would otherwise ship the readable source of the
// whole platform inside the installer — several megabytes, and more of the model's
// internals than belongs on a user's disk.
let removed = 0;
const stripMaps = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) stripMaps(p);
    else if (entry.name.endsWith('.map')) { fs.rmSync(p); removed += 1; }
  }
};
stripMaps(TARGET);

const size = (() => {
  let bytes = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else bytes += fs.statSync(p).size;
    }
  };
  walk(TARGET);
  return (bytes / 1048576).toFixed(1);
})();

console.log(`✓ UI synced → apps/desktop/ui (${size} MB, ${removed} source maps stripped)`);
