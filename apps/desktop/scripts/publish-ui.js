/**
 * Publish the app's UI — what makes the installed apps follow the website (live UI updates, src/uiBundle.js).
 * Runs with every website deploy (.github/workflows/app-ui.yml) and by hand.
 *
 *   node scripts/publish-ui.js              → build + stage + sign, show what would be uploaded, change nothing
 *   node scripts/publish-ui.js --confirm    → … and upload to R2 (https://downloads.gardenforlife.nl/ui/)
 *   --no-build                              → use the existing apps/platform/dist-app
 *   (--confirm refuses a working tree with uncommitted changes — build from a clean worktree or CI)
 *   --ci                                    → without the secrets, say so and stop cleanly (exit 0)
 *
 * On R2: ui/files/<sha256> — every file by its content hash (immutable; a file already there is not sent
 * again, so a deploy uploads only what changed) — and ui/latest.json LAST: the signed manifest
 * { manifest: "<exact JSON>", signature: "<base64 Ed25519>" }. The app downloads nothing a manifest does
 * not name and runs nothing the pinned public key (src/uiKey.js) does not verify.
 *
 * Signing key (Ed25519, scripts/ui-keygen.js): GFL_UI_SIGNING_KEY (the PEM text — the CI secret), else the
 * file GFL_UI_SIGNING_KEY_FILE, else ~/.gfl/ui-signing-key.pem. R2 access: as scripts/publish.js
 * (CLOUDFLARE_API_TOKEN, or `npx wrangler login`); bucket GFL_R2_BUCKET / "gfl-downloads", jurisdiction
 * GFL_R2_JURISDICTION / "eu".
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { stageUi } = require('./sync-ui');
const { verifySignedManifest } = require('../src/uiBundle');
const { UI_PUBLIC_KEY_PEM } = require('../src/uiKey');

const HERE = path.resolve(__dirname, '..');
const REPO = path.resolve(HERE, '..', '..');
const STAGE = path.join(HERE, 'release', 'ui-bundle');
const PUBLIC_BASE = 'https://downloads.gardenforlife.nl/ui';
const WRANGLER = 'wrangler@4.133.0'; // pinned, as in publish.js

const confirm = process.argv.includes('--confirm');
const ci = process.argv.includes('--ci');
const bucket = process.env.GFL_R2_BUCKET || 'gfl-downloads';
const jurisdiction = process.env.GFL_R2_JURISDICTION || 'eu';

function signingKey() {
  if (process.env.GFL_UI_SIGNING_KEY) return process.env.GFL_UI_SIGNING_KEY;
  const file = process.env.GFL_UI_SIGNING_KEY_FILE || path.join(os.homedir(), '.gfl', 'ui-signing-key.pem');
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
}

function run(cmd, opts = {}) {
  const res = spawnSync(cmd, { shell: true, stdio: 'inherit', cwd: REPO, ...opts });
  if (res.status !== 0) throw new Error(`${cmd.split(' ').slice(0, 4).join(' ')} failed (exit ${res.status})`);
}

function wrangler(args) {
  const quoted = ['npx', '--yes', WRANGLER, ...args].map((a) => (/[\s"&|<>^]/.test(a) ? `"${a}"` : a));
  const res = spawnSync(quoted.join(' '), {
    cwd: HERE, shell: true, encoding: 'utf8', stdio: 'pipe',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  });
  if (res.status !== 0) throw new Error(`wrangler ${args.slice(0, 4).join(' ')} failed (exit ${res.status})\n${res.stdout || ''}${res.stderr || ''}`);
  return res.stdout || '';
}

// The query only busts an edge-cached 404 of a file uploaded moments ago; R2 ignores it.
async function exists(url) {
  try { return (await fetch(`${url}?check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' })).ok; } catch { return false; }
}

async function main() {
  const key = signingKey();
  if (!key) {
    if (ci) { console.log('No GFL_UI_SIGNING_KEY — app UI not published (set the repository secret to enable it).'); return; }
    throw new Error('no signing key: set GFL_UI_SIGNING_KEY / GFL_UI_SIGNING_KEY_FILE, or run scripts/ui-keygen.js');
  }
  if (confirm && ci && !process.env.CLOUDFLARE_API_TOKEN) {
    console.log('No CLOUDFLARE_API_TOKEN — app UI not published (set the repository secret to enable it).');
    return;
  }

  if (!process.argv.includes('--no-build')) run('corepack pnpm@9.0.0 --filter @gfl/platform build:app');
  const manifest = stageUi({ target: STAGE });
  // Only what is in git reaches the apps: a build of a working tree with uncommitted changes (the shared
  // checkout, other sessions' half-done work) is never published. Build from a clean worktree or CI.
  if (confirm && /-dirty$|^unknown$/.test(manifest.commit) && !process.argv.includes('--allow-dirty')) {
    throw new Error(`the working tree has uncommitted changes (build ${manifest.buildId}) — publish from a clean worktree, or CI`);
  }

  // Sign the exact manifest text, and check it against the key the apps pin before anything leaves.
  const manifestText = JSON.stringify(manifest);
  const signature = crypto.sign(null, Buffer.from(manifestText, 'utf8'), crypto.createPrivateKey(key)).toString('base64');
  const signed = { manifest: manifestText, signature };
  verifySignedManifest(signed, UI_PUBLIC_KEY_PEM); // throws when the key is not the pinned one
  const latestPath = path.join(STAGE, '..', 'ui-latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(signed));

  // What the server does not have yet (content-addressed: a known hash is the same file).
  const byHash = new Map();
  for (const [rel, f] of Object.entries(manifest.files)) if (!byHash.has(f.sha256)) byHash.set(f.sha256, { rel, size: f.size });
  const missing = [];
  for (const [hash, f] of byHash) if (!(await exists(`${PUBLIC_BASE}/files/${hash}`))) missing.push({ hash, ...f });
  const bytes = missing.reduce((n, f) => n + f.size, 0);
  console.log(`UI build ${manifest.buildId} (commit ${manifest.commit}, shell API ${manifest.requiresApi}): ${byHash.size} files, ${missing.length} new (${(bytes / 1e6).toFixed(1)} MB) → R2 "${bucket}" (${jurisdiction}) ui/`);
  if (!confirm) { console.log('Dry run — signed and verified, nothing uploaded. Add --confirm to publish.'); return; }

  for (const f of missing) {
    console.log(`↑ ${f.rel}`);
    wrangler(['r2', 'object', 'put', `${bucket}/ui/files/${f.hash}`, '--file', path.join(STAGE, ...f.rel.split('/')),
      '--content-type', 'application/octet-stream', '--cache-control', 'public,max-age=31536000,immutable',
      '--jurisdiction', jurisdiction, '--remote']);
  }
  // The manifest last, so it never names a file that is not there yet.
  wrangler(['r2', 'object', 'put', `${bucket}/ui/latest.json`, '--file', latestPath,
    '--content-type', 'application/json', '--cache-control', 'no-cache', '--jurisdiction', jurisdiction, '--remote']);

  // Check what an app actually gets.
  const res = await fetch(`${PUBLIC_BASE}/latest.json`, { cache: 'no-store' });
  const live = res.ok ? await res.json() : null;
  const served = live ? verifySignedManifest(live, UI_PUBLIC_KEY_PEM) : null;
  if (!served || served.buildId !== manifest.buildId) throw new Error(`latest.json on the server is not this build (${served ? served.buildId : `HTTP ${res.status}`})`);
  for (const f of missing) if (!(await exists(`${PUBLIC_BASE}/files/${f.hash}`))) throw new Error(`${f.rel} is not served`);
  console.log(`✓ published — installed apps pick up ${manifest.buildId} at their next start`);
}

main().catch((err) => { console.error(`✘ ${err.message}`); process.exit(1); });
