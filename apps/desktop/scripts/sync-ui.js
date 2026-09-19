/**
 * Stage the platform UI for the app — the installer's own copy (ui/) and, through scripts/publish-ui.js,
 * the builds the app downloads later (src/uiBundle.js). One staging step for both, so what an update
 * delivers is exactly what an installer would have carried.
 *
 * The app ships the interface inside itself rather than loading it from the web, so it works with no
 * connection — which matters when the whole point is data that lives on this machine. Newer UI builds
 * arrive signed from the download server and run from the next start (live UI updates).
 *
 * Source: the APP build of the platform (apps/platform/dist-app, `pnpm --filter @gfl/platform build:app`,
 * Vite mode "app") — its own target, not the website build. Staging then leaves out what only a website
 * host uses or what must never ship: Cloudflare's _headers/_redirects/_routes.json, the local dev-replay
 * data, source maps.
 *
 *   node scripts/sync-ui.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const HERE = __dirname;
const DESKTOP = path.resolve(HERE, '..');
const PLATFORM_APP_DIST = path.resolve(DESKTOP, '..', 'platform', 'dist-app');
const TARGET = path.join(DESKTOP, 'ui');

// Website-host files and local data that must not be in the app — top-level names in the build output.
const EXCLUDE_TOP = new Set(['_headers', '_redirects', '_routes.json', 'dev-replay']);

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/** HEAD's short hash, with "-dirty" when the working tree has uncommitted changes (they are in the build). */
function gitCommit() {
  try {
    const opts = { cwd: DESKTOP, stdio: ['ignore', 'pipe', 'ignore'] };
    const sha = execSync('git rev-parse --short HEAD', opts).toString().trim() || 'unknown';
    const dirty = execSync('git status --porcelain --untracked-files=no', opts).toString().trim() !== '';
    return dirty ? `${sha}-dirty` : sha;
  } catch { return 'unknown'; }
}

/**
 * Copy the app build from `source` to `target` (replacing it), install the CSP, and return the manifest:
 * { schema, buildId, builtAt, commit, requiresApi, files: { path: { sha256, size } }, csp: { scripts } }.
 * Also writes it to target/ui-manifest.json (the installer's copy reads its own builtAt from there).
 */
function stageUi({ source = PLATFORM_APP_DIST, target = TARGET, log = console.log } = {}) {
  if (!fs.existsSync(path.join(source, 'index.html'))) {
    throw new Error(`No app build of the platform at ${source}.\n  From the repo root: corepack pnpm@9.0.0 --filter @gfl/platform build:app`);
  }
  fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });

  // Copy, leaving out host files, local data and source maps (they would ship the readable source of the
  // whole platform — several megabytes, and more of the model's internals than belongs on a user's disk).
  let left = 0;
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (EXCLUDE_TOP.has(entry.name)) { left += 1; continue; }
    fs.cpSync(path.join(source, entry.name), path.join(target, entry.name), {
      recursive: true,
      filter: (src) => { if (src.endsWith('.map')) { left += 1; return false; } return true; },
    });
  }

  // The CSP (src/csp.js) is sent as a header by the app:// handler; it is also written into index.html as
  // a meta tag so the policy holds even if the page is ever opened another way. Exactly the inline scripts
  // of this build (boot overlay, GPU tier) are allowed, by hash — the HTML parser turns CRLF into LF before
  // the browser hashes a script, so hash the normalised text.
  const { buildCsp, HASHES_FILE } = require('../src/csp');
  const indexPath = path.join(target, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const inlineHashes = [];
  const inlineRe = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  const normalised = html.replace(/\r\n?/g, '\n');
  for (let m; (m = inlineRe.exec(normalised));) {
    if (/type="(?!text\/javascript|module)[^"]+"/i.test(m[1])) continue; // data blocks do not run
    inlineHashes.push('sha256-' + crypto.createHash('sha256').update(m[2], 'utf8').digest('base64'));
  }
  const CSP = buildCsp({ inlineHashes, forMeta: true });
  if (html.includes('http-equiv="Content-Security-Policy"')) {
    html = html.replace(/<meta[^>]+http-equiv="Content-Security-Policy"[^>]*>/i, `<meta http-equiv="Content-Security-Policy" content="${CSP}">`);
  } else if (/<head[^>]*>/i.test(html)) {
    html = html.replace(/<head[^>]*>/i, (m) => `${m}\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`);
  } else {
    throw new Error('No <head> in the built index.html — cannot install the CSP. Refusing to ship without it.');
  }
  fs.writeFileSync(indexPath, html, 'utf8');
  if (path.resolve(target) === path.resolve(TARGET)) fs.writeFileSync(HASHES_FILE, JSON.stringify({ scripts: inlineHashes }, null, 2));

  // The manifest: every file with its hash and size.
  const files = {};
  let bytes = 0;
  const walk = (dir, rel) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const r = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) { walk(abs, r); continue; }
      if (!rel && (entry.name === 'ui-manifest.json' || entry.name === 'csp-hashes.json')) continue;
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
    buildId: `${builtAt.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${commit}`,
    builtAt,
    commit,
    requiresApi: SHELL_API_LEVEL,
    files,
    csp: { scripts: inlineHashes },
  };
  fs.writeFileSync(path.join(target, 'ui-manifest.json'), JSON.stringify(manifest, null, 2));
  log(`✓ UI staged → ${path.relative(process.cwd(), target) || target} (${Object.keys(files).length} files, ${(bytes / 1048576).toFixed(1)} MB; ${left} left out; ${inlineHashes.length} inline script hash(es); build ${manifest.buildId})`);
  return manifest;
}

module.exports = { stageUi, PLATFORM_APP_DIST, EXCLUDE_TOP };

if (require.main === module) {
  try {
    stageUi();
  } catch (err) {
    console.error(`\n✘ ${err.message}\n`);
    process.exit(1);
  }
  // The app icon is the platform's logo too: rebuild build/icon.png so a replaced logo ships with this
  // build instead of the last copy. A failure stops start/dist rather than packaging a stale icon.
  require('./sync-icon').syncIcon().catch((err) => { console.error(`\n✘ ${err.message}\n`); process.exit(1); });
}
