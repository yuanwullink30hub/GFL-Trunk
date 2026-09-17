/**
 * Put a built desktop-app release on Cloudflare R2, where the website's download buttons and the
 * installed apps' update check both read it: https://downloads.gardenforlife.nl (the bucket's
 * custom domain).
 *
 *   node scripts/publish.js            → shows what would be uploaded, changes nothing
 *   node scripts/publish.js --confirm  → uploads, then checks every file is served
 *
 * Reads the update feeds electron-builder wrote into release/ (latest.yml, latest-mac.yml,
 * latest-linux.yml — whichever exist) and uploads the files they name plus their .blockmap
 * (differential updates). Order matters: installers first, feeds LAST, so a feed never points at a
 * file that is not there yet. Older versions are left in place — someone may be mid-download.
 *
 * Needs wrangler access to the Cloudflare account: CLOUDFLARE_API_TOKEN (R2 edit) in the
 * environment, or `npx wrangler login` in an interactive terminal first.
 * Bucket: --bucket <name>, else GFL_R2_BUCKET, else "gfl-downloads" — created in the EU jurisdiction
 * (data stays in the EU), which every wrangler call has to name: --jurisdiction, else
 * GFL_R2_JURISDICTION, else "eu".
 *
 * After the first upload of a platform, turn its download on in
 * apps/platform/src/workspace/localWorkspace.js (DESKTOP_RELEASE.available) and deploy the site.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const HERE = path.resolve(__dirname, '..');
const RELEASE = path.join(HERE, 'release');
const PUBLIC_BASE = 'https://downloads.gardenforlife.nl';
const FEEDS = ['latest.yml', 'latest-mac.yml', 'latest-linux.yml'];

// Installers never change under their versioned name, so they may be cached for good; the feeds
// must be re-read on every update check or a new version would be noticed late.
const CACHE_ARTEFACT = 'public,max-age=31536000,immutable';
const CACHE_FEED = 'no-cache';

const CONTENT_TYPES = {
  '.exe': 'application/octet-stream',
  '.dmg': 'application/x-apple-diskimage',
  '.zip': 'application/zip',
  '.AppImage': 'application/octet-stream',
  '.blockmap': 'application/octet-stream',
  '.yml': 'text/yaml',
};

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** The artefact file names a feed lists (`files[].url` and the top-level `path`). */
function feedArtefacts(feedPath) {
  const yml = fs.readFileSync(feedPath, 'utf8');
  const names = new Set();
  for (const m of yml.matchAll(/^\s*-?\s*url:\s*(.+?)\s*$/gm)) names.add(m[1].replace(/^['"]|['"]$/g, ''));
  const top = yml.match(/^path:\s*(.+?)\s*$/m);
  if (top) names.add(top[1].replace(/^['"]|['"]$/g, ''));
  const version = (yml.match(/^version:\s*(.+?)\s*$/m) || [])[1];
  return { version, names: [...names] };
}

// Pinned: a floating wrangler@4 can resolve to a release npm lists before it can serve it.
const WRANGLER = 'wrangler@4.133.0';

/** Run wrangler through npx. Arguments carry no spaces (see the cache values), so plain quoting is enough. */
function wrangler(args, { capture = false } = {}) {
  const quoted = ['npx', '--yes', WRANGLER, ...args].map((a) => (/[\s"&|<>^]/.test(a) ? `"${a}"` : a));
  const res = spawnSync(quoted.join(' '), {
    cwd: HERE,
    shell: true, // npx is a .cmd on Windows
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  });
  if (res.status !== 0) {
    const detail = capture ? `\n${res.stdout || ''}${res.stderr || ''}` : '';
    throw new Error(`wrangler ${args.slice(0, 3).join(' ')} failed (exit ${res.status})${detail}`);
  }
  return res.stdout || '';
}

async function main() {
  const confirm = process.argv.includes('--confirm');
  const bucket = argValue('--bucket') || process.env.GFL_R2_BUCKET || 'gfl-downloads';
  const jurisdiction = argValue('--jurisdiction') || process.env.GFL_R2_JURISDICTION || 'eu';

  const feeds = FEEDS.filter((f) => fs.existsSync(path.join(RELEASE, f)));
  if (!feeds.length) throw new Error('no latest*.yml in release/ — run `pnpm run dist:win` (or dist:mac) first');

  const artefacts = [];
  const versions = new Set();
  for (const feed of feeds) {
    const { version, names } = feedArtefacts(path.join(RELEASE, feed));
    if (!version || !names.length) throw new Error(`${feed} names no version or files`);
    versions.add(version);
    for (const name of names) {
      const file = path.join(RELEASE, name);
      if (!fs.existsSync(file)) throw new Error(`${feed} lists ${name}, but it is not in release/`);
      artefacts.push(name);
      if (fs.existsSync(`${file}.blockmap`)) artefacts.push(`${name}.blockmap`);
    }
  }
  const uploads = [
    ...[...new Set(artefacts)].map((name) => ({ name, cache: CACHE_ARTEFACT })),
    ...feeds.map((name) => ({ name, cache: CACHE_FEED })),
  ];

  console.log(`Release ${[...versions].join(', ')} → R2 bucket "${bucket}", jurisdiction ${jurisdiction} (${PUBLIC_BASE})`);
  for (const u of uploads) {
    const size = fs.statSync(path.join(RELEASE, u.name)).size;
    console.log(`  ${u.name}  ${(size / 1e6).toFixed(1)} MB  cache: ${u.cache}`);
  }
  if (!confirm) { console.log('Dry run. Add --confirm to upload.'); return; }

  const list = wrangler(['r2', 'bucket', 'list', '--jurisdiction', jurisdiction], { capture: true });
  if (!new RegExp(`name:\\s*${bucket}\\b`).test(list)) {
    throw new Error(`bucket "${bucket}" not found in jurisdiction "${jurisdiction}" of this Cloudflare account. Buckets:\n${list}`);
  }

  for (const u of uploads) {
    const ext = u.name.endsWith('.blockmap') ? '.blockmap' : path.extname(u.name);
    console.log(`\n↑ ${u.name}`);
    wrangler([
      'r2', 'object', 'put', `${bucket}/${u.name}`,
      '--file', path.join(RELEASE, u.name),
      '--content-type', CONTENT_TYPES[ext] || 'application/octet-stream',
      '--cache-control', u.cache,
      '--jurisdiction', jurisdiction,
      '--remote',
    ]);
  }

  // Check what a visitor and the updater actually get.
  let failed = 0;
  for (const u of uploads) {
    const expected = fs.statSync(path.join(RELEASE, u.name)).size;
    const res = await fetch(`${PUBLIC_BASE}/${encodeURIComponent(u.name)}`, { method: 'HEAD', cache: 'no-store' });
    const length = Number(res.headers.get('content-length'));
    const ok = res.ok && (!length || length === expected);
    if (!ok) failed += 1;
    console.log(`${ok ? '✓' : '✘'} ${PUBLIC_BASE}/${u.name} → ${res.status}${length ? `, ${length} bytes` : ''}`);
  }
  if (failed) throw new Error(`${failed} file(s) not served correctly from ${PUBLIC_BASE}`);
  console.log('\n✓ Release published. First upload for a platform? Turn it on in localWorkspace.js (DESKTOP_RELEASE.available) and deploy the site.');
}

main().catch((err) => { console.error('\n✘', err.message); process.exit(1); });
