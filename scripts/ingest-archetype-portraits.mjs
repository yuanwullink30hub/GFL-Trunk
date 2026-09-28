// Ingest a delivered batch of archetype portraits.
//
// The delivered files land in portraits/_incoming/ under whatever names the delivery gave them
// ("The Ronin male - kopie.webp"). This script resolves each file to one of the 132 extended-archetype
// keys plus a male/female variant, and writes the four tiers under canonical key-derived names, so an
// apostrophe, a slash or a stray "kopie" in a delivery name can never reach a URL.
//
// WHERE EACH TIER LIVES, and why it matters: Vite copies apps/platform/public/ into the build
// wholesale, straight off the disk. .gitignore has no say in it — a 23 MB master sitting in public/
// ships to Cloudflare Pages on the next deploy. So only the two tiers that must be same-origin and
// are small enough to ship are kept under public/; everything heavy lives at the repo root in
// portraits/, which no build ever walks:
//
//   apps/platform/public/images/Archetype imags/   (all four ship with the site, same-origin)
//     web/<slot>.webp     1100 px — the results card.            ~45 MB
//     print/<slot>.webp   2764 px — the PDF cover at 300 dpi.   ~764 MB
//     full/<slot>.webp    the delivered resolution — the download. ~756 MB
//     depth/<slot>.png    the depth map.                           ~6 MB
//   portraits/                                  (gitignored: inputs only, never built, never deployed)
//     _incoming/<delivery name>                 what the delivery handed over
//     _masters/<delivery name>.png              the ~23 MB PNG originals: archival, and the source
//                                               every tier is cut from
//     _depth/<delivery name>                    the depth batch (see its README)
//
// Then it regenerates the ARCHETYPE_IMAGES table in packages/assessment-core/src/data/archetypeImages.js.
//
// Dry run by default: it prints the full audit (matched, unmatched, ambiguous, duplicate, still
// missing) and writes nothing. Pass --write to act.
//
//   node scripts/ingest-archetype-portraits.mjs              # audit only
//   node scripts/ingest-archetype-portraits.mjs --write      # audit, then write the tiers + table
//   node scripts/ingest-archetype-portraits.mjs --selftest   # exercise the name parser, touch no files
//   node scripts/ingest-archetype-portraits.mjs --png-manifest   # render the PNG masters on black for R2 (the download)
//
import sharp from 'sharp';
import { readdir, mkdir, copyFile, readFile, writeFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

// Shipped tiers (under public/, in git) vs heavy tiers (repo root, gitignored, R2).
const SHIPPED_DIR = 'apps/platform/public/images/Archetype imags';
const HEAVY_DIR = 'portraits';
// Every tier is cut from the PNG masters (3392x5056), not from the delivered webp. The webp set in
// _incoming/ is 1800 px tall — under the 2764 px the cover needs, so it cannot feed print/, and
// downscaling web/ from 5056 beats downscaling it from 1800 anyway. --source incoming overrides.
const SOURCE = process.argv.includes('--source') ? process.argv[process.argv.indexOf('--source') + 1] : '_masters';
const INCOMING = join(HEAVY_DIR, SOURCE.replace(/^_?/, '_'));
const DEPTH_INCOMING = join(HEAVY_DIR, '_depth');

// Depth maps: small greyscale, brighter = nearer (the Depth Anything convention), matching the
// established Ronin pair (172x256, 1 channel, ~12 KB). The cover samples them onto a ~78x117 grid, so
// 256 tall is already oversampled; bigger only costs git.
const DEPTH_H = 256;
// All four tiers ship with the site (owner, 2026-09-27): same-origin, so the cover can read the
// portrait's and the depth map's pixels without a CORS rule to forget, at ~1.5 GB in the repo and in
// every Pages deploy. portraits/ keeps only the inputs — _masters/, _incoming/, _depth/.
const TIER_DIR = { web: join(SHIPPED_DIR, 'web'), depth: join(SHIPPED_DIR, 'depth'), print: join(SHIPPED_DIR, 'print'), full: join(SHIPPED_DIR, 'full') };
const TABLE_FILE = 'packages/assessment-core/src/data/archetypeImages.js';
const SCORING_FILE = 'packages/assessment-core/src/data/scoring/index.js';

// The name canon is read out of the source rather than imported: scoring/index.js resolves its own
// imports the way the bundler does (extensionless), which plain Node ESM will not follow.
function readNameTable(name) {
  const src = readFileSync(SCORING_FILE, 'utf8');
  const open = `export const ${name} = {`;
  const start = src.indexOf(open);
  if (start < 0) throw new Error(`${name} not found in ${SCORING_FILE}`);
  const body = src.slice(start + open.length, src.indexOf('\n};', start));
  const out = {};
  for (const m of body.matchAll(/^\s*([A-Z_]+):\s*(['"])((?:\\.|(?!\2).)*)\2/gm)) {
    out[m[1]] = m[3].replace(/\\(.)/g, '$1');
  }
  return out;
}

const EXTENDED_ARCHETYPES = readNameTable('EXTENDED_ARCHETYPES');
const EXTENDED_ARCHETYPES_NL = readNameTable('EXTENDED_ARCHETYPES_NL');

// The two derived tiers. `full` is the delivered file copied verbatim.
// print: 234 mm (the cover's height on A4) x 300 dpi = 2764 px — the ceiling AssessmentResultsModal
// imposes with Math.min(img.naturalHeight, (drawH / 25.4) * 300); taller buys the PDF nothing.
// print/ is encoded nearLossless, not at a quality step. Measured on The Architect (2026-09-27),
// against a lossless cut of the same master at the same size:
//   q90                 1218 KB   34.5 dB   worst pixel 144
//   q98                 1855 KB   35.5 dB   worst pixel 143   <- 52% more bytes, 1 dB
//   q94 smartSubsample  1522 KB   35.9 dB   worst pixel  95
//   nearLossless q60    3193 KB   49.6 dB   worst pixel   4
// The plateau across the quality steps is the giveaway: the error is not quantisation but webp's
// default 4:2:0 chroma subsampling, which no quality setting undoes — and this artwork is saturated
// neon on near-black, the worst case for it, in smooth glows where banding shows. The extra bytes
// cost R2 storage and one download; they do NOT grow the PDF, which re-encodes the portrait to PNG
// on canvas whatever it was served as.
const TIERS = {
  print: { height: 2764, webp: { nearLossless: true, quality: 60 } },
  web: { height: 1100, webp: { quality: 82 } },
};

// One archetype is delivered as a single image that serves both variants (owner, 2026-09-27).
// Both slots point at one shared file, so `available` stays { male: true, female: true } and the
// results-card toggle behaves exactly as it does for a split pair.
const SHARED_VARIANT_KEYS = new Set(['SAGE_INNOCENT']); // #118 The Enlightened

const SRC_EXT = new Set(['.webp', '.png', '.jpg', '.jpeg']);
const slug = (key) => key.toLowerCase().replace(/_/g, '-');

// ── Name matching ────────────────────────────────────────────────────────────
// Normalise to a bare token: no case, no articles, no punctuation. 'The Devil's Advocate' and
// 'devils advocate' and 'Advocaat van de Duivel' all have to land on their key.
const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/['’`´]/g, '')
    .replace(/^\s*(the|de|het|een)\s+/, '')
    .replace(/[^a-z0-9]+/g, '');

// Names the delivery spells differently from the canon, plus names that carry their own variant.
// Applied AFTER the EN and NL canon and allowed to override it, so an alias can pin the variant on a
// name the canon already resolves (the canon knows "The Sorcerer" is MAGICIAN_SAGE; only the alias
// knows the file called just "Sorcerer" is the male one).
//
// Every entry below was verified against the delivered batch (2026-09-27): each typo maps to the one
// canon slot that no other file filled, and the four gendered/coded pairs were confirmed by eye.
const ALIASES = {
  // Misspellings in the delivery.
  adocate: { key: 'RULER_CAREGIVER' },                    // The Advocate
  entrepeneur: { key: 'RULER_EXPLORER' },                 // The Entrepreneur
  inovator: { key: 'EXPLORER_OUTLAW' },                   // The Innovator
  philospher: { key: 'EXPLORER_SAGE' },                   // The Philosopher
  chavlier: { key: 'HERO_LOVER' },                        // The Chevalier
  foundationalist: { key: 'INNOCENT_JUDGE' },             // The Traditionalist — the only slot left unfilled
  enlightenedtelling: { key: 'SAGE_INNOCENT' },           // the second, byte-identical Enlightened file

  // Gendered names: the name IS the variant, so the file carries no male/female token.
  sorcerer: { key: 'MAGICIAN_SAGE', variant: 'male' },
  sorceress: { key: 'MAGICIAN_SAGE', variant: 'female' },
  wingman: { key: 'LOVER_TRICKSTER', variant: 'male' },
  wingwoman: { key: 'LOVER_TRICKSTER', variant: 'female' },
  seducer: { key: 'TRICKSTER_LOVER', variant: 'male' },
  seductress: { key: 'TRICKSTER_LOVER', variant: 'female' },
  // 'The Patriarch / Matriarch' is one archetype under two gendered names. Both confirmed by eye:
  // the matriarch is the figure in the tree's roots, the patriarch the armoured one with the spade.
  patriarch: { key: 'CAREGIVER_RULER', variant: 'male' },
  matrpatriarch: { key: 'CAREGIVER_RULER', variant: 'male' },
  matriarch: { key: 'CAREGIVER_RULER', variant: 'female' },
  patriarchmatriarch: { key: 'CAREGIVER_RULER' },

  // The Chameleon came coded rather than labelled. Confirmed by eye: the leading letter is the
  // central winged figure — FM-MF leads with the female, MF-FM with the male.
  chameleonfmmf: { key: 'TRICKSTER_CAREGIVER', variant: 'female' },
  chameleonmffm: { key: 'TRICKSTER_CAREGIVER', variant: 'male' },
  // The Soulmate came as a mirrored pair, both figures androgynous — nothing in the art says which
  // is which, so the mapping is the owner's (2026-09-27): L is the male slot, R the female.
  soulmatel: { key: 'LOVER_CAREGIVER', variant: 'male' },
  soulmater: { key: 'LOVER_CAREGIVER', variant: 'female' },

  // From the depth-map batch (2026-09-27).
  tradtionalist: { key: 'INNOCENT_JUDGE' },               // The Traditionalist
  dmatriarchd: { key: 'CAREGIVER_RULER', variant: 'female' },  // "D matriarch D2"

  // Spellings the canon carries differently.
  deviladvocate: { key: 'TRICKSTER_JUDGE' },
  advocaatvandeduivel: { key: 'TRICKSTER_JUDGE' },
  freerunner: { key: 'TRICKSTER_EXPLORER' },
};

/** normalised name -> { key, variant? }, from the EN canon, the NL canon and the aliases. */
function buildNameIndex() {
  const index = new Map();
  const collisions = [];
  const add = (name, key, variant) => {
    const n = norm(name);
    if (!n) return;
    const prev = index.get(n);
    if (prev && prev.key !== key) { collisions.push({ n, a: prev.key, b: key }); return; }
    if (!prev) index.set(n, { key, variant });
  };
  for (const [key, name] of Object.entries(EXTENDED_ARCHETYPES)) add(name, key);
  for (const [key, name] of Object.entries(EXTENDED_ARCHETYPES_NL)) add(name, key);
  // Aliases go last and overwrite: a canon name already in the index may need its variant pinned
  // ("Sorcerer" is MAGICIAN_SAGE to the canon, and male to the alias).
  for (const [n, { key, variant }] of Object.entries(ALIASES)) index.set(norm(n), { key, variant });
  return { index, collisions };
}

const VARIANT_WORDS = {
  female: /(^|[^a-z])(female|females|vrouw|vrouwelijk|woman|v)([^a-z]|$)/i,
  male: /(^|[^a-z])(male|males|man|mannelijk|m)([^a-z]|$)/i,
};

/**
 * Resolve one delivery filename to { key, variant }.
 * Order matters: the copy markers and the variant word come off before what is left is read as a name.
 */
export function parseDeliveryName(filename, index = buildNameIndex().index) {
  let s = basename(filename, extname(filename));

  // Delivery noise, in this order. Separators go FIRST: an underscore is a word character, so
  // \bkopie\b never matches inside "kopie_1800" while the underscore is still there. Then the copy
  // markers, then every digit run — a resize suffix ("_1800"), a counter ("kopie 2"), "(3)". No
  // archetype name contains a digit, so stripping them all is safe.
  s = s
    .replace(/\.(jpe?g|png|webp|tiff?)\b/gi, ' ')   // a second extension left inside the name
    .replace(/[-–—_]+/g, ' ')
    .replace(/\b(kopie|kopieren|copy|copie)\b/gi, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Variant word. Tested female-first; the patterns are boundary-guarded so "female" never
  // reads as "male".
  let variant = null;
  for (const [v, re] of Object.entries(VARIANT_WORDS)) {
    if (re.test(s)) {
      variant = v;
      s = s.replace(re, '$1 $3');
      break;
    }
  }
  s = s.replace(/\s+/g, ' ').trim();

  const hit = index.get(norm(s));
  if (!hit) return { key: null, variant, raw: s };
  // An alias may carry the variant itself ("Matriarch" with no male/female token).
  return { key: hit.key, variant: variant || hit.variant || null, raw: s };
}

// ── Audit ────────────────────────────────────────────────────────────────────
async function audit(dir = INCOMING) {
  const { index, collisions } = buildNameIndex();
  let files = [];
  try {
    files = (await readdir(dir)).filter((f) => SRC_EXT.has(extname(f).toLowerCase()));
  } catch {
    throw new Error(`no staging folder yet — copy the batch into ${dir}/`);
  }

  const matched = new Map(); // `${key}:${variant}` -> { file, key, variant }
  const problems = { unmatched: [], noVariant: [], duplicate: [] };
  const sharedExtras = []; // a shared-variant archetype delivered as a male + female pair: expected

  for (const file of files.sort()) {
    const { key, variant, raw } = parseDeliveryName(file, index);
    if (!key) { problems.unmatched.push({ file, raw }); continue; }
    const shared = SHARED_VARIANT_KEYS.has(key);
    if (!variant && !shared) { problems.noVariant.push({ file, key }); continue; }
    const slotId = shared ? `${key}:shared` : `${key}:${variant}`;
    if (matched.has(slotId)) {
      // One image serves both variants, so a second file for that key is a duplicate by design.
      if (shared) sharedExtras.push({ file, key, kept: matched.get(slotId).file });
      else problems.duplicate.push({ file, slotId, kept: matched.get(slotId).file });
      continue;
    }
    matched.set(slotId, { file, key, variant: shared ? 'shared' : variant });
  }

  const missing = [];
  for (const key of Object.keys(EXTENDED_ARCHETYPES)) {
    if (SHARED_VARIANT_KEYS.has(key)) {
      if (!matched.has(`${key}:shared`)) missing.push(`${key} (shared)`);
      continue;
    }
    for (const v of ['female', 'male']) if (!matched.has(`${key}:${v}`)) missing.push(`${key} ${v}`);
  }

  return { files, matched, problems, sharedExtras, missing, collisions };
}

// ── Tier output ──────────────────────────────────────────────────────────────
async function writeTiers(matched) {
  for (const d of Object.values(TIER_DIR)) await mkdir(d, { recursive: true });

  let done = 0;
  const bytes = { full: 0, print: 0, web: 0 };
  for (const { file, key, variant } of matched.values()) {
    const name = `${slug(key)}-${variant}`;
    const src = join(INCOMING, file);

    // full/ is the master's own resolution as webp — a ~20 MB PNG is not a download to hand anyone,
    // and webp holds the alpha. A delivered webp is already encoded, so it is copied untouched.
    const fullOut = join(TIER_DIR.full, `${name}.webp`);
    if (extname(file).toLowerCase() === '.webp') await copyFile(src, fullOut);
    else await sharp(src).webp({ quality: 90 }).toFile(fullOut);
    bytes.full += (await stat(fullOut)).size;

    for (const [tier, { height, webp }] of Object.entries(TIERS)) {
      const out = join(TIER_DIR[tier], `${name}.webp`);
      await sharp(src)
        .resize({ height, fit: 'inside', withoutEnlargement: true })
        .webp(webp)
        .toFile(out);
      bytes[tier] += (await stat(out)).size;
    }
    if (++done % 25 === 0) process.stdout.write(`  …${done}/${matched.size}\n`);
  }
  return bytes;
}

// ── Depth maps ───────────────────────────────────────────────────────────────
/**
 * Write one depth map per slot, matched to its portrait.
 *
 * The cover draws the portrait's alpha and its depth map onto ONE grid (sampleScene in coverPage.js
 * stretches each to the same gw x rows box), so the two only line up if they share a framing. The
 * portrait is what the reader sees, so the portrait is leading: every map is resized to the portrait's
 * exact aspect. That is right when a map is the same framing at another resolution, and wrong when it
 * is a different crop — so a map whose own aspect is off by more than ASPECT_TOL is reported rather
 * than silently stretched.
 */
const ASPECT_TOL = 0.02; // 2% — covers rounding, not a reframe

/**
 * Match the depth batch to slots.
 *
 * Depth maps are delivered per ARCHETYPE, not per variant (2026-09-27): one map, no male/female token,
 * serving both portraits of that archetype. That works because the two carry the exact roles apart —
 * occlusion comes from each portrait's OWN alpha, so the levensles still never writes over the figure,
 * and all the map contributes is the front-to-back gradient that drives taper and lean, which is the
 * same pose either way. Where a variant was delivered on its own (puppeteer, seducer/seductress,
 * patriarch/matriarch) that specific map wins over the generic one for its slot.
 */
function matchDepth(files, index) {
  const generic = new Map();   // KEY -> file, applies to both variants
  const specific = new Map();  // `KEY:variant` -> file
  const unmatched = [];
  const overwritten = [];

  for (const file of [...files].sort()) {
    const { key, variant, raw } = parseDeliveryName(file, index);
    if (!key) { unmatched.push({ file, raw }); continue; }
    if (variant) specific.set(`${key}:${variant}`, file);
    else if (generic.has(key)) overwritten.push({ file, key, kept: generic.get(key) });
    else generic.set(key, file);
  }

  const plan = new Map();  // slot name -> source file
  const missing = [];
  const borrowed = [];
  for (const key of Object.keys(EXTENDED_ARCHETYPES)) {
    const variants = SHARED_VARIANT_KEYS.has(key) ? ['shared'] : ['female', 'male'];
    for (const v of variants) {
      const other = v === 'male' ? 'female' : 'male';
      // A name that IS a variant ("Sorcerer", "Wingman") parses as that variant, so a batch that
      // delivered only one of the pair would leave the other slot bare. Where the counterpart was
      // genuinely delivered (seducer/seductress, patriarch/matriarch, puppeteer) each keeps its own;
      // where it was not, the lone map covers both, exactly as the 126 generic ones do.
      const own = specific.get(`${key}:${v}`)
        || (v === 'shared' ? (specific.get(`${key}:female`) || specific.get(`${key}:male`)) : null)
        || generic.get(key);
      const src = own || specific.get(`${key}:${other}`);
      if (src && !own) borrowed.push({ key, v, file: src });
      if (src) plan.set(`${slug(key)}-${v}`, src);
      else missing.push(`${key} ${v}`);
    }
  }
  const shared = [...generic.keys()].filter((k) => !SHARED_VARIANT_KEYS.has(k)
    && !specific.has(`${k}:female`) && !specific.has(`${k}:male`)).length;
  return { plan, missing, unmatched, overwritten, borrowed, shared, specific: specific.size };
}

async function writeDepthMaps(plan) {
  await mkdir(TIER_DIR.depth, { recursive: true });
  const warn = [];
  let done = 0, bytes = 0;

  for (const [name, file] of plan) {
    // The portrait governs the shape. Prefer the shipped web copy; fall back to print.
    let ref = null;
    for (const p of [join(TIER_DIR.web, `${name}.webp`), join(TIER_DIR.print, `${name}.webp`)]) {
      try { ref = await sharp(p).metadata(); break; } catch { /* not cut yet — try the next */ }
    }
    if (!ref) { warn.push({ name, why: 'no portrait cut for this slot — run the portrait ingest first' }); continue; }

    const aspect = ref.width / ref.height;
    const src = await sharp(join(DEPTH_INCOMING, file)).metadata();
    const srcAspect = src.width / src.height;
    if (Math.abs(srcAspect - aspect) / aspect > ASPECT_TOL) {
      warn.push({ name, why: `aspect ${srcAspect.toFixed(4)} vs portrait ${aspect.toFixed(4)} (${file}) — stretched to fit; check the framing` });
    }

    const out = join(TIER_DIR.depth, `${name}.png`);
    await sharp(join(DEPTH_INCOMING, file))
      .resize({ width: Math.round(DEPTH_H * aspect), height: DEPTH_H, fit: 'fill' })
      .greyscale()
      .png({ compressionLevel: 9, effort: 8 })
      .toFile(out);
    bytes += (await stat(out)).size;
    done++;
  }
  return { done, bytes, warn };
}

// ── Table regeneration ───────────────────────────────────────────────────────
// Rewrites only the ARCHETYPE_IMAGES object literal, keeping the file's `// #n  The Name` comments.
async function writeTable(matched) {
  const src = await readFile(TABLE_FILE, 'utf8');
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  const open = 'const ARCHETYPE_IMAGES = {';
  const start = src.indexOf(open);
  if (start < 0) throw new Error(`could not find "${open}" in ${TABLE_FILE}`);
  const end = src.indexOf(`${nl}};`, start);
  if (end < 0) throw new Error(`could not find the end of ARCHETYPE_IMAGES in ${TABLE_FILE}`);

  // Keep every existing line's trailing comment, keyed by archetype key.
  const body = src.slice(start + open.length, end);
  const comments = new Map();
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+):\s*.*?(\/\/.*)$/);
    if (m) comments.set(m[1], m[2].trimEnd());
  }

  const keys = Object.keys(EXTENDED_ARCHETYPES);
  const pad = Math.max(...keys.map((k) => k.length)) + 2;
  const lines = keys.map((key) => {
    const shared = SHARED_VARIANT_KEYS.has(key);
    const have = shared
      ? matched.has(`${key}:shared`)
      : { female: matched.has(`${key}:female`), male: matched.has(`${key}:male`) };
    let value;
    if (shared) value = have ? `pair('${key}', { shared: true })` : '{ male: null, female: null }';
    else if (have.male && have.female) value = `pair('${key}')`;
    else if (have.male || have.female) {
      const m = have.male ? `art('${key}', 'male')` : 'null';
      const f = have.female ? `art('${key}', 'female')` : 'null';
      value = `{ male: ${m}, female: ${f} }`;
    } else value = '{ male: null, female: null }';
    const comment = comments.get(key);
    return `  ${(key + ':').padEnd(pad)}${value},${comment ? `  ${comment}` : ''}`;
  });

  const out = src.slice(0, start + open.length) + nl + lines.join(nl) + src.slice(end);
  await writeFile(TABLE_FILE, out);
  return lines.length;
}

// ── Self-test ────────────────────────────────────────────────────────────────
function selftest() {
  const { index, collisions } = buildNameIndex();
  const cases = [
    ['The Ronin male - kopie.webp', 'OUTLAW_HERO', 'male'],
    ['Ronin female.webp', 'OUTLAW_HERO', 'female'],
    ['ronin male.webp', 'OUTLAW_HERO', 'male'],
    ['The Sovereign female - kopie (2).webp', 'RULER_SAGE', 'female'],
    ["The Devil's Advocate male.webp", 'TRICKSTER_JUDGE', 'male'],
    ['Devils Advocate female - kopie.webp', 'TRICKSTER_JUDGE', 'female'],
    ['The Free-runner male.webp', 'TRICKSTER_EXPLORER', 'male'],
    ['The Free Spirit female.webp', 'INNOCENT_TRICKSTER', 'female'],
    ['Free_Spirit_male.webp', 'INNOCENT_TRICKSTER', 'male'],
    ['The Patriarch Matriarch male.webp', 'CAREGIVER_RULER', 'male'],
    ['Matriarch.webp', 'CAREGIVER_RULER', 'female'],
    ['Patriarch - kopie.webp', 'CAREGIVER_RULER', 'male'],
    ['The Enlightened.webp', 'SAGE_INNOCENT', null],
    ['De Verlichte - kopie.webp', 'SAGE_INNOCENT', null],
    ['De Ronin vrouw.webp', 'OUTLAW_HERO', 'female'],
    ['Advocaat van de Duivel man.webp', 'TRICKSTER_JUDGE', 'male'],
    ['The Patriarch / Matriarch female.webp', 'CAREGIVER_RULER', 'female'],
    ['The Source male.webp', 'ARTIST_INNOCENT', 'male'],
    ['The Forgemaster female - kopie.webp', 'ARTIST_HERO', 'female'],
    ['Totally Not An Archetype male.webp', null, 'male'],
  ];
  let bad = 0;
  for (const [file, wantKey, wantVariant] of cases) {
    const got = parseDeliveryName(file, index);
    const ok = got.key === wantKey && got.variant === wantVariant;
    if (!ok) bad++;
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${file.padEnd(42)} -> ${got.key ?? '(no match)'} ${got.variant ?? ''}${ok ? '' : `   want ${wantKey} ${wantVariant ?? ''}`}`);
  }
  console.log(`\n  ${cases.length - bad}/${cases.length} parsed as expected`);
  if (collisions.length) {
    console.log(`\n  name collisions across EN/NL/aliases (${collisions.length}):`);
    for (const c of collisions) console.log(`    "${c.n}" claimed by both ${c.a} and ${c.b}`);
  } else console.log('  no name collisions across the EN canon, the NL canon and the aliases');
  return bad === 0 ? 0 : 1;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--selftest')) process.exit(selftest());

const write = args.includes('--write');
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

// ── Depth maps: their own pass, because they are delivered per archetype, not per variant ──
if (args.includes('--depth')) {
  const { index } = buildNameIndex();
  let files;
  try {
    files = (await readdir(DEPTH_INCOMING)).filter((f) => SRC_EXT.has(extname(f).toLowerCase()));
  } catch {
    console.error(`no ${DEPTH_INCOMING}/ — see its README for the naming`);
    process.exit(1);
  }
  const { plan, missing: dMissing, unmatched, overwritten, borrowed, shared, specific } = matchDepth(files, index);

  console.log(`\n${DEPTH_INCOMING}: ${files.length} depth maps`);
  console.log(`  slots covered:  ${plan.size} of 263`);
  console.log(`  ${shared} map(s) serving both variants of their archetype, ${specific} tied to one variant`);
  if (unmatched.length) {
    console.log(`\n  unmatched name — ${unmatched.length}:`);
    for (const u of unmatched) console.log(`    ${u.file}   (read as "${u.raw}")`);
  }
  if (overwritten.length) {
    console.log(`\n  two generic maps for one archetype — ${overwritten.length}:`);
    for (const o of overwritten) console.log(`    ${o.file}   (${o.key}, keeping ${o.kept})`);
  }
  if (borrowed.length) {
    console.log(`
  one delivered variant covering both — ${borrowed.length}:`);
    for (const x of borrowed) console.log(`    ${x.key} ${x.v} ← ${x.file}`);
  }
  if (dMissing.length) {
    console.log(`\n  no map — ${dMissing.length}:`);
    for (const m of dMissing.slice(0, 40)) console.log(`    ${m}`);
  }

  if (!write) {
    console.log(`\ndry run — nothing written. Re-run with --depth --write.`);
    process.exit(unmatched.length ? 1 : 0);
  }
  if (unmatched.length) {
    console.error(`\nrefusing to write: ${unmatched.length} file(s) did not resolve. Fix the names above first.`);
    process.exit(1);
  }

  console.log(`\nwriting ${plan.size} depth maps → ${TIER_DIR.depth}/ …`);
  const { done, bytes, warn } = await writeDepthMaps(plan);
  console.log(`  ${done} written, ${mb(bytes)}${done ? ` (${kb(bytes / done)} avg)` : ''}`);
  if (warn.length) {
    console.log(`\n  needs a look — ${warn.length}:`);
    for (const w of warn) console.log(`    ${w.name}: ${w.why}`);
  }
  process.exit(0);
}

// ── PNG originals: the dashboard download (owner, 2026-09-28) ──
// Each master at its full resolution, flattened onto black: the art is cut out on transparency, which a
// photo viewer or a phone gallery shows as white or as a checkerboard, and the portraits are made to sit
// on the dark of the site. Written to portraits/png/<slot>.png (gitignored, ~5 GB) and published to R2 by
// scripts/publish-portraits.mjs, with the manifest mapping each slot to its file and to the name the
// browser saves it under. A slot whose PNG is newer than its master is not rendered again.
if (args.includes('--png-manifest')) {
  const mastersDir = join(HEAVY_DIR, '_masters');
  const pngDir = join(HEAVY_DIR, 'png');
  const { matched, problems } = await audit(mastersDir);
  const blocking = problems.unmatched.length + problems.noVariant.length + problems.duplicate.length;
  if (blocking) {
    console.error(`refusing: ${blocking} master(s) did not resolve cleanly — run the audit with --source _masters`);
    process.exit(1);
  }
  await mkdir(pngDir, { recursive: true });
  const manifest = {};
  let rendered = 0;
  for (const { file, key, variant } of matched.values()) {
    const slot = `${slug(key)}-${variant}`;
    const src = join(mastersDir, file);
    const out = join(pngDir, `${slot}.png`);
    const fresh = await stat(out).then((o) => o.mtimeMs > 0 && stat(src).then((s) => o.mtimeMs >= s.mtimeMs), () => false);
    if (!fresh) {
      await sharp(src).flatten({ background: '#000000' }).png().toFile(out);
      if (++rendered % 25 === 0) process.stdout.write(`  …${rendered} rendered\n`);
    }
    // "The Patriarch / Matriarch" + female -> GardenForLife_The_Patriarch_Matriarch_female.png
    const name = EXTENDED_ARCHETYPES[key].replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '');
    manifest[slot] = {
      source: out.split('\\').join('/'),
      filename: `GardenForLife_${name}${variant === 'shared' ? '' : `_${variant}`}.png`,
    };
  }
  const manifestFile = join(HEAVY_DIR, 'png-manifest.json');
  await writeFile(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${manifestFile}: ${Object.keys(manifest).length} slots (${rendered} rendered on black) → next: node scripts/publish-portraits.mjs`);
  process.exit(0);
}

const { files, matched, problems, sharedExtras, missing, collisions } = await audit();

console.log(`\n${INCOMING}: ${files.length} image files`);
console.log(`  resolved to a slot: ${matched.size}`);
console.log(`  still missing:      ${missing.length} of 263 slots (132 keys x 2, minus the shared pair)`);

for (const [label, rows, fmt] of [
  ['unmatched name', problems.unmatched, (r) => `${r.file}   (read as "${r.raw}")`],
  ['no male/female in the name', problems.noVariant, (r) => `${r.file}   (${r.key})`],
  ['two files for one slot', problems.duplicate, (r) => `${r.file}   (${r.slotId}, keeping ${r.kept})`],
]) {
  if (!rows.length) continue;
  console.log(`\n  ${label} — ${rows.length}:`);
  for (const r of rows) console.log(`    ${fmt(r)}`);
}
if (sharedExtras.length) {
  console.log(`\n  one image serves both variants — extra file(s) ignored by design:`);
  for (const r of sharedExtras) console.log(`    ${r.file}   (${r.key}, using ${r.kept} for male and female)`);
}
if (collisions.length) {
  console.log(`\n  name collisions (${collisions.length}):`);
  for (const c of collisions) console.log(`    "${c.n}" claimed by both ${c.a} and ${c.b}`);
}
if (missing.length && missing.length <= 40) {
  console.log(`\n  missing slots:`);
  for (const m of missing) console.log(`    ${m}`);
}

const blocking = problems.unmatched.length + problems.noVariant.length + problems.duplicate.length;
if (!write) {
  console.log(`\ndry run — nothing written. Re-run with --write once the audit is clean.`);
  process.exit(blocking ? 1 : 0);
}
if (blocking) {
  console.error(`\nrefusing to write: ${blocking} file(s) did not resolve cleanly. Fix the names above first.`);
  process.exit(1);
}

// The table goes first, then the pixels. It only needs the audit, and writing it up front means the
// cover preview (?coverpreview=1) resolves portraits while the tiers are still being cut — a slot whose
// files have not landed yet just shows no portrait, which is the same path a missing portrait takes.
const rows = await writeTable(matched);
console.log(`\n  ${TABLE_FILE}: ${rows} rows rewritten`);

if (args.includes('--table-only')) {
  console.log('  --table-only: no tiers written.');
  process.exit(0);
}

console.log(`\nwriting ${matched.size} portraits x 3 tiers…`);
const bytes = await writeTiers(matched);
const avg = (n) => (matched.size ? ` (${kb(n / matched.size)} avg)` : '');
console.log(`\n  full/  ${mb(bytes.full)}${avg(bytes.full)}   → R2, not git`);
console.log(`  print/ ${mb(bytes.print)}${avg(bytes.print)}   → R2, not git`);
console.log(`  web/   ${mb(bytes.web)}${avg(bytes.web)}   → git`);
if (matched.size) console.log(`\n  next: node scripts/publish-portraits.mjs   (dry run; --confirm to upload)`);
console.log(`\n  depth/ is untouched — portraits without a depth map still get the cover levensles,`);
console.log(`  level and at one size (coverLesson.js falls back on its own).`);
