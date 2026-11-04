/**
 * Stage the built management UI (apps/admin/dist) for the app — the installer's own copy (ui/) and, through
 * scripts/publish-ui.js, the signed builds the app downloads later (src/uiBundle.js). One staging step for
 * both, so what an update delivers is exactly what an installer would have carried.
 *
 * Leaves out the source maps, writes the CSP into index.html as a meta tag, and writes ui-manifest.json:
 * { schema, app: 'admin', buildId, builtAt, commit, requiresApi, files: { path: { sha256, size } }, csp }.
 *
 *   corepack pnpm@9.0.0 --filter @gfl/admin build   (from the repo root)
 *   node scripts/sync-ui.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { buildCsp } = require('../src/csp');

const HERE = path.resolve(__dirname, '..');
const ADMIN_DIST = path.resolve(HERE, '..', 'admin', 'dist');
const TARGET = path.join(HERE, 'ui');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** HEAD's short hash, with "-dirty" when the working tree's content differs from it (CRLF-only changes do not count). */
function gitCommit() {
  try {
    const opts = { cwd: HERE, stdio: ['ignore', 'pipe', 'ignore'] };
    const sha = execSync('git rev-parse --short HEAD', opts).toString().trim() || 'unknown';
    let dirty = false;
    try { execSync('git diff --quiet HEAD --', opts); } catch { dirty = true; }
    return dirty ? `${sha}-dirty` : sha;
  } catch { return 'unknown'; }
}

/** Copy the build from `source` to `target` (replacing it) and return its manifest (also written there). */
function stageUi({ source = ADMIN_DIST, target = TARGET, log = console.log } = {}) {
  if (!fs.existsSync(path.join(source, 'index.html'))) {
    throw new Error(`No management build at ${source}\n  From the repo root: corepack pnpm@9.0.0 --filter @gfl/admin build`);
  }
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true, filter: (src) => !src.endsWith('.map') });

  const indexPath = path.join(target, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  if (/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?\S[\s\S]*?<\/script>/i.test(html)) {
    throw new Error('The management index.html has an inline script; the CSP (script-src self) would block it.');
  }
  html = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/i, '');
  if (!/<head>/i.test(html)) throw new Error('No <head> in the built index.html — cannot install the CSP.');
  html = html.replace(/<head>/i, `<head>\n    <meta http-equiv="Content-Security-Policy" content="${buildCsp({ forMeta: true })}">`);
  fs.writeFileSync(indexPath, html);

  const files = {};
  let bytes = 0;
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) { walk(abs, r); continue; }
      if (!rel && entry.name === 'ui-manifest.json') continue;
      const buf = fs.readFileSync(abs);
      files[r] = { sha256: sha256(buf), size: buf.length };
      bytes += buf.length;
    }
  };
  walk(target, '');
  const builtAt = new Date().toISOString();
  const commit = gitCommit();
  const { SHELL_API_LEVEL } = require('../src/shellApi');
  const manifest = {
    schema: 1,
    app: 'admin',
    buildId: `${builtAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${commit}`,
    builtAt,
    commit,
    requiresApi: SHELL_API_LEVEL,
    files,
    csp: { scripts: [] }, // the management UI has no inline scripts (checked above)
  };
  fs.writeFileSync(path.join(target, 'ui-manifest.json'), JSON.stringify(manifest, null, 2));
  log(`✓ Management UI staged → ${path.relative(process.cwd(), target) || target} (${Object.keys(files).length} files, ${(bytes / 1048576).toFixed(1)} MB; build ${manifest.buildId})`);
  return manifest;
}

module.exports = { stageUi, ADMIN_DIST };

if (require.main === module) {
  try {
    stageUi();
  } catch (err) {
    console.error(`\n✘ ${err.message}\n`);
    process.exit(1);
  }
}
