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

// The app loads its UI from file://, where response-header CSP never applies — Electron's
// webRequest hooks simply do not fire for that scheme. A <meta http-equiv> policy is the
// only form the renderer will honour here, so it is injected into the copied index.html
// rather than left to the main process.
const API_ORIGIN = 'https://api.gardenforlife.nl';
const CSP = [
  "default-src 'self'",
  // The platform bundle is built by Vite and includes inline style attributes; scripts
  // stay strictly self-hosted, which is the part that matters next to a filesystem bridge.
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  `connect-src 'self' ${API_ORIGIN}`,
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const indexPath = path.join(TARGET, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (html.includes('http-equiv="Content-Security-Policy"')) {
  html = html.replace(
    /<meta[^>]+http-equiv="Content-Security-Policy"[^>]*>/i,
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">`
  );
} else if (/<head[^>]*>/i.test(html)) {
  html = html.replace(/<head[^>]*>/i, (m) => `${m}\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`);
} else {
  console.error('\n✘ No <head> in the built index.html — cannot install the CSP. Refusing to ship without it.');
  process.exit(1);
}
fs.writeFileSync(indexPath, html, 'utf8');
console.log('✓ CSP meta tag installed in ui/index.html');

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
