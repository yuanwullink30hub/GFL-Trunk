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

// The CSP (src/csp.js) is sent as a header by the app:// handler; it is also written into the
// copied index.html as a meta tag so the policy holds even if the page is ever opened another way.
const crypto = require('crypto');
const { buildCsp, HASHES_FILE } = require('../src/csp');

const indexPath = path.join(TARGET, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Allow exactly the inline scripts of this build (boot overlay, GPU tier), by hash. The HTML parser
// turns CRLF into LF before the browser hashes a script, so hash the normalised text.
const inlineHashes = [];
const inlineRe = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
const normalised = html.replace(/\r\n?/g, '\n');
for (let m; (m = inlineRe.exec(normalised));) {
  if (/type="(?!text\/javascript|module)[^"]+"/i.test(m[1])) continue; // data blocks do not run
  inlineHashes.push('sha256-' + crypto.createHash('sha256').update(m[2], 'utf8').digest('base64'));
}
fs.writeFileSync(HASHES_FILE, JSON.stringify({ scripts: inlineHashes }, null, 2));
console.log(`✓ ${inlineHashes.length} inline script hash(es) → ui/csp-hashes.json`);
const CSP = buildCsp({ inlineHashes, forMeta: true });
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
