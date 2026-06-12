// One-off image compression for apps/platform/public/images (DEV_PATHGUIDE P8).
// Resizes oversized rasters to <=1600px and re-encodes in place (filenames kept,
// so /images/... refs are unchanged; git history holds the originals).
import sharp from 'sharp';
import { readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const ROOT = 'apps/platform/public/images';
const MAX_DIM = 1600;
const SIZE_THRESHOLD = 250 * 1024; // only touch files above 250 KB
const EXED = new Set(['.png', '.jpg', '.jpeg', '.webp']);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let beforeTotal = 0, afterTotal = 0, processed = 0, skipped = 0;

for await (const file of walk(ROOT)) {
  const ext = extname(file).toLowerCase();
  if (!EXED.has(ext)) continue;
  const { size } = await stat(file);
  beforeTotal += size;

  let meta;
  try { meta = await sharp(file).metadata(); } catch { afterTotal += size; skipped++; continue; }
  const oversized = (meta.width || 0) > MAX_DIM || (meta.height || 0) > MAX_DIM;

  if (size < SIZE_THRESHOLD && !oversized) { afterTotal += size; skipped++; continue; }

  try {
    let pipeline = sharp(await readFile(file)).resize({
      width: MAX_DIM, height: MAX_DIM, fit: 'inside', withoutEnlargement: true,
    });
    if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 9, effort: 8 });
    else if (ext === '.webp') pipeline = pipeline.webp({ quality: 82 });
    else pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });

    const out = await pipeline.toBuffer();
    if (out.length < size) {
      await writeFile(file, out);
      afterTotal += out.length;
      processed++;
    } else {
      afterTotal += size; // re-encode wasn't smaller — keep original
      skipped++;
    }
  } catch (err) {
    afterTotal += size; // locked/unreadable — leave it untouched
    skipped++;
    console.warn(`  skip (locked/error): ${file}`);
  }
}

const mb = (b) => (b / 1048576).toFixed(1);
console.log(`processed=${processed} skipped=${skipped}`);
console.log(`before=${mb(beforeTotal)} MB  after=${mb(afterTotal)} MB  saved=${mb(beforeTotal - afterTotal)} MB`);
