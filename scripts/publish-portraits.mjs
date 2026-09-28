/**
 * Publish the archetype portraits' PNG originals to R2 — the account dashboard's download.
 *
 * The web, print, full and depth tiers ship with the site (scripts/ingest-archetype-portraits.mjs). The
 * PNG downloads do not: the masters flattened onto black, 263 of them at ~20 MB, too much for the repo
 * and for every Pages deploy.
 * They are also only ever downloaded, never drawn, so nothing needs to read their pixels and they can
 * live cross-origin: in the installers' bucket, at https://downloads.gardenforlife.nl/portraits/png/.
 *
 *   node scripts/ingest-archetype-portraits.mjs --png-manifest   (first: maps slot -> master + file name)
 *   node scripts/publish-portraits.mjs              → show what would be uploaded, change nothing
 *   node scripts/publish-portraits.mjs --confirm    → … and upload
 *   --force                                         → re-upload every file, not only new or changed ones
 *   --only <slot>                                   → one slot, e.g. outlaw-hero-male
 *
 * On R2: portraits/png/<slot>.png, named by slot so a portrait keeps its URL when the art is retouched
 * (a replaced master is re-uploaded whenever its size differs from what R2 holds). Each object carries
 * Content-Disposition: attachment with a readable name, so a plain link saves the file instead of
 * opening a 5000-pixel image in the tab — and the page that linked to it stays where it was.
 *
 * R2 access as apps/desktop/scripts/publish.js: CLOUDFLARE_API_TOKEN, or `npx wrangler login`;
 * bucket GFL_R2_BUCKET / "gfl-downloads", jurisdiction GFL_R2_JURISDICTION / "eu".
 */
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const MANIFEST = 'portraits/png-manifest.json';
const PUBLIC_BASE = 'https://downloads.gardenforlife.nl/portraits/png';
const WRANGLER = 'wrangler@4.133.0'; // pinned, as in apps/desktop/scripts/publish.js
const CACHE = 'public,max-age=604800'; // a week: the slot name is stable, so this may not be immutable
const PARALLEL = 4;

const argv = process.argv.slice(2);
const confirm = argv.includes('--confirm');
const force = argv.includes('--force');
const only = argv.includes('--only') ? argv[argv.indexOf('--only') + 1] : null;
const bucket = process.env.GFL_R2_BUCKET || 'gfl-downloads';
const jurisdiction = process.env.GFL_R2_JURISDICTION || 'eu';

function wrangler(args) {
  const quoted = ['npx', '--yes', WRANGLER, ...args].map((a) => (/[\s"&|<>^;]/.test(a) ? `"${a}"` : a));
  return new Promise((resolve, reject) => {
    const child = spawn(quoted.join(' '), { shell: true, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' } });
    let out = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { out += d; });
    child.on('close', (code) => (code === 0 ? resolve(out)
      : reject(new Error(`wrangler ${args.slice(0, 4).join(' ')} failed (exit ${code})\n${out}`))));
  });
}

/** What R2 already holds for this key, by size. null = not there. The query only busts an edge-cached 404. */
async function remoteSize(slot) {
  try {
    const res = await fetch(`${PUBLIC_BASE}/${slot}.png?check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) return null;
    const n = Number(res.headers.get('content-length'));
    return Number.isFinite(n) ? n : 0;
  } catch { return null; }
}

let manifest;
try {
  manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
} catch {
  console.error(`no ${MANIFEST} — run: node scripts/ingest-archetype-portraits.mjs --png-manifest`);
  process.exit(1);
}

const plan = [];
let held = 0;
for (const [slot, { source, filename }] of Object.entries(manifest)) {
  if (only && slot !== only) continue;
  if (!/^[A-Za-z0-9_.-]+$/.test(filename)) throw new Error(`unsafe download name for ${slot}: ${filename}`);
  const size = (await stat(source)).size;
  const remote = force ? null : await remoteSize(slot);
  if (remote !== null && remote === size) { held++; continue; }
  plan.push({ slot, source, filename, size, replacing: remote !== null });
}

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
const bytes = plan.reduce((n, f) => n + f.size, 0);
console.log(`\nR2 "${bucket}" (${jurisdiction}) portraits/png/`);
console.log(`  already published, unchanged: ${held}`);
console.log(`  to upload: ${plan.length} (${mb(bytes)})${plan.some((f) => f.replacing) ? `, of which ${plan.filter((f) => f.replacing).length} replace a different-sized file` : ''}`);

if (!plan.length) { console.log('\nNothing to do.'); process.exit(0); }
if (!confirm) { console.log('\nDry run — nothing uploaded. Add --confirm to publish.'); process.exit(0); }

let done = 0;
const failed = [];
const queue = [...plan];
async function worker() {
  for (let f = queue.shift(); f; f = queue.shift()) {
    try {
      await wrangler(['r2', 'object', 'put', `${bucket}/portraits/png/${f.slot}.png`, '--file', f.source,
        '--content-type', 'image/png', '--content-disposition', `attachment; filename=${f.filename}`,
        '--cache-control', CACHE, '--jurisdiction', jurisdiction, '--remote']);
    } catch (e) {
      failed.push({ slot: f.slot, error: e.message.split('\n')[0] });
    }
    if (++done % 10 === 0 || done === plan.length) console.log(`  ↑ ${done}/${plan.length}`);
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));

// Spot-check through the public domain: the first file must come back as a PNG attachment.
const first = plan.find((f) => !failed.some((x) => x.slot === f.slot));
if (first) {
  const res = await fetch(`${PUBLIC_BASE}/${first.slot}.png?check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' });
  console.log(`  ${res.ok ? 'ok  ' : 'FAIL'} ${PUBLIC_BASE}/${first.slot}.png → ${res.status}, ${res.headers.get('content-type')}, ${res.headers.get('content-disposition')}`);
}
if (failed.length) {
  console.log(`\n${failed.length} upload(s) failed — run again to retry only those:`);
  for (const f of failed) console.log(`  ${f.slot}: ${f.error}`);
  process.exit(1);
}
console.log(`\nPublished ${plan.length} file(s), ${mb(bytes)}.`);
