/**
 * Publish the heavy archetype-portrait tiers to R2.
 *
 * The 263 portraits come to roughly 660 MB across two tiers, so they are not in git and not on
 * Cloudflare Pages (owner, 2026-09-27): they sit in the same bucket as the installers and are served
 * from https://downloads.gardenforlife.nl/portraits/. Only web/ (~31 MB) and depth/ ship with the site.
 *
 *   node scripts/publish-portraits.mjs              → show what would be uploaded, change nothing
 *   node scripts/publish-portraits.mjs --confirm     → … and upload
 *   node scripts/publish-portraits.mjs --cors        → print the bucket CORS rule the PDF cover needs
 *   --tier print|full                                → just one tier
 *   --ci                                             → without the secrets, say so and stop cleanly
 *
 * On R2: portraits/<tier>/<slot>.webp, named by slot rather than by content hash, so a portrait keeps
 * its URL when the art is retouched. That means the cache cannot be immutable: it is a week, and a
 * replaced file is re-uploaded whenever its size differs from what R2 holds (--force for all of them).
 *
 * R2 access as apps/desktop/scripts/publish.js: CLOUDFLARE_API_TOKEN, or `npx wrangler login`;
 * bucket GFL_R2_BUCKET / "gfl-downloads", jurisdiction GFL_R2_JURISDICTION / "eu".
 */
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

// The heavy tiers live at the repo root, NOT under apps/platform/public/: Vite copies public/ into
// the build straight off the disk regardless of .gitignore, so a tier kept there would deploy to
// Cloudflare Pages as well as to R2 — ~660 MB of it.
const DIR = 'portraits';
const PUBLIC_BASE = 'https://downloads.gardenforlife.nl/portraits';
const WRANGLER = 'wrangler@4.133.0'; // pinned, as in apps/desktop/scripts/publish.js
const CACHE = 'public,max-age=604800'; // a week: the slot name is stable, so this may not be immutable

const argv = process.argv.slice(2);
const confirm = argv.includes('--confirm');
const force = argv.includes('--force');
const ci = argv.includes('--ci');
const onlyTier = argv[argv.indexOf('--tier') + 1];
const tiers = argv.includes('--tier') ? [onlyTier] : ['print', 'full'];
const bucket = process.env.GFL_R2_BUCKET || 'gfl-downloads';
const jurisdiction = process.env.GFL_R2_JURISDICTION || 'eu';

// The cover reads the portrait's pixels (a canvas rasterises it to its printed size, then
// coverLesson.js samples its alpha), so the image must be readable cross-origin or the canvas taints
// and the whole cover throws. web/ and depth/ stay same-origin; this is only for the print tier.
const CORS_RULE = [
  {
    AllowedOrigins: ['https://gardenforlife.nl', 'https://www.gardenforlife.nl', 'http://localhost:3000'],
    AllowedMethods: ['GET', 'HEAD'],
    AllowedHeaders: ['*'],
    ExposeHeaders: ['Content-Length'],
    MaxAgeSeconds: 86400,
  },
];

if (argv.includes('--cors')) {
  console.log(`Save as portraits-cors.json, then:\n`);
  console.log(`  npx --yes ${WRANGLER} r2 bucket cors set ${bucket} --file portraits-cors.json --jurisdiction ${jurisdiction} --remote\n`);
  console.log(JSON.stringify(CORS_RULE, null, 2));
  console.log(`\nWithout this the PDF cover cannot read the print copy's pixels and falls back to the`);
  console.log(`card copy (1100 px, ~119 dpi on the page). Check it with:\n`);
  console.log(`  npx --yes ${WRANGLER} r2 bucket cors list ${bucket} --jurisdiction ${jurisdiction} --remote`);
  process.exit(0);
}

function wrangler(args) {
  const quoted = ['npx', '--yes', WRANGLER, ...args].map((a) => (/[\s"&|<>^]/.test(a) ? `"${a}"` : a));
  const res = spawnSync(quoted.join(' '), {
    shell: true, encoding: 'utf8', stdio: 'pipe',
    env: { ...process.env, WRANGLER_SEND_METRICS: 'false' },
  });
  if (res.status !== 0) throw new Error(`wrangler ${args.slice(0, 4).join(' ')} failed (exit ${res.status})\n${res.stdout || ''}${res.stderr || ''}`);
  return res.stdout || '';
}

/** What R2 already holds for this key, by size. null = not there. The query only busts an edge-cached 404. */
async function remoteSize(key) {
  try {
    const res = await fetch(`${PUBLIC_BASE}/${key}?check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) return null;
    const n = Number(res.headers.get('content-length'));
    return Number.isFinite(n) ? n : 0;
  } catch { return null; }
}

const plan = [];
let held = 0;
for (const tier of tiers) {
  let files;
  try {
    files = (await readdir(join(DIR, tier))).filter((f) => f.endsWith('.webp')).sort();
  } catch {
    console.error(`no ${DIR}/${tier}/ yet — run scripts/ingest-archetype-portraits.mjs --write first`);
    process.exit(1);
  }
  for (const file of files) {
    const local = (await stat(join(DIR, tier, file))).size;
    const key = `${tier}/${file}`;
    const remote = force ? null : await remoteSize(key);
    if (remote !== null && remote === local) { held++; continue; }
    plan.push({ key, path: join(DIR, tier, file), size: local, replacing: remote !== null });
  }
}

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
const bytes = plan.reduce((n, f) => n + f.size, 0);
const replacing = plan.filter((f) => f.replacing).length;
console.log(`\nR2 "${bucket}" (${jurisdiction}) portraits/ — tiers: ${tiers.join(', ')}`);
console.log(`  already published, unchanged: ${held}`);
console.log(`  to upload: ${plan.length} (${mb(bytes)})${replacing ? `, of which ${replacing} replace a different-sized file` : ''}`);

if (!plan.length) { console.log('\nNothing to do.'); process.exit(0); }
if (!confirm) {
  if (ci) { console.log('\n--ci without --confirm: nothing uploaded.'); process.exit(0); }
  console.log(`\nDry run — nothing uploaded. Add --confirm to publish.`);
  console.log(`Remember the bucket CORS rule too: node scripts/publish-portraits.mjs --cors`);
  process.exit(0);
}

let done = 0;
for (const f of plan) {
  wrangler(['r2', 'object', 'put', `${bucket}/portraits/${f.key}`, '--file', f.path,
    '--content-type', 'image/webp', '--cache-control', CACHE,
    '--jurisdiction', jurisdiction, '--remote']);
  if (++done % 20 === 0 || done === plan.length) console.log(`  ↑ ${done}/${plan.length}`);
}

// Spot-check through the public domain: one file per tier has to come back readable.
for (const tier of tiers) {
  const first = plan.find((f) => f.key.startsWith(`${tier}/`));
  if (!first) continue;
  const res = await fetch(`${PUBLIC_BASE}/${first.key}?check=${Date.now()}`, { cache: 'no-store' });
  console.log(`  ${res.ok ? 'ok  ' : 'FAIL'} ${PUBLIC_BASE}/${first.key} → ${res.status}`);
  if (res.ok && !res.headers.get('access-control-allow-origin')) {
    console.log(`       no access-control-allow-origin — the PDF cover will fall back to the card copy.`);
    console.log(`       Set the bucket CORS rule: node scripts/publish-portraits.mjs --cors`);
  }
}
console.log(`\nPublished ${plan.length} file(s), ${mb(bytes)}.`);
