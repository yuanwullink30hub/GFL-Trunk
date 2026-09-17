/**
 * Copy the built management UI (apps/admin/dist) into the app, without source maps, with the CSP as a
 * meta tag.
 *
 *   corepack pnpm@9.0.0 --filter @gfl/admin build   (from the repo root)
 *   node scripts/sync-ui.js
 */
const fs = require('fs');
const path = require('path');
const { buildCsp } = require('../src/csp');

const HERE = path.resolve(__dirname, '..');
const ADMIN_DIST = path.resolve(HERE, '..', 'admin', 'dist');
const TARGET = path.join(HERE, 'ui');

if (!fs.existsSync(path.join(ADMIN_DIST, 'index.html'))) {
  console.error(`\n✘ No management build at ${ADMIN_DIST}\n  From the repo root: corepack pnpm@9.0.0 --filter @gfl/admin build\n`);
  process.exit(1);
}

fs.rmSync(TARGET, { recursive: true, force: true });
fs.cpSync(ADMIN_DIST, TARGET, { recursive: true });

let removed = 0;
const stripMaps = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) stripMaps(p);
    else if (entry.name.endsWith('.map')) { fs.rmSync(p); removed += 1; }
  }
};
stripMaps(TARGET);

const indexPath = path.join(TARGET, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(html)) {
  console.error('✘ The management index.html has an inline script; the CSP (script-src self) would block it.');
  process.exit(1);
}
html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/i, '');
html = html.replace(/<head>/i, `<head>\n    <meta http-equiv="Content-Security-Policy" content="${buildCsp({ forMeta: true })}">`);
fs.writeFileSync(indexPath, html);

console.log(`✓ Management UI synced → apps/admin-desktop/ui (${removed} source maps stripped)`);
