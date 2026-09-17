/**
 * The header logo the site shows (public/images/landingpage/logo.webp, 512 px) is made from the brand
 * artwork in public/images/Import ready/Website logo.png. Replace that file and the next build (or
 * `node scripts/sync-logo.mjs`) regenerates the web copy — nobody has to remember a manual step.
 *
 * The source's SHA-256 is kept next to this script (logo.source.sha256), so a build whose logo did not
 * change needs no image library at all. When the logo did change but sharp is not available (a build
 * machine without it), the build continues with the committed copy and says so.
 *
 * Emails, invoices and PDF headers keep images/landingpage/logo.png (not every mail client shows WebP).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(HERE, '..', 'public', 'images', 'Import ready', 'Website logo.png');
const TARGET = resolve(HERE, '..', 'public', 'images', 'landingpage', 'logo.webp');
const STAMP = resolve(HERE, 'logo.source.sha256');
const SIZE = 512; // shown at most ~170 CSS px; 512 stays sharp on 2×/3× screens

async function main() {
  if (!existsSync(SOURCE)) {
    console.warn(`! No website logo at ${SOURCE} — keeping the current logo.webp`);
    return;
  }
  const digest = createHash('sha256').update(readFileSync(SOURCE)).digest('hex');
  const stamped = existsSync(STAMP) ? readFileSync(STAMP, 'utf8').trim() : '';
  if (stamped === digest && existsSync(TARGET)) {
    console.log('✓ Website logo up to date (images/landingpage/logo.webp)');
    return;
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default; // root devDependency
  } catch {
    console.warn('! Website logo changed but sharp is not installed — keeping the committed logo.webp.');
    console.warn('  Run `corepack pnpm@9.0.0 install` at the repo root, then build again.');
    return;
  }

  const webp = await sharp(SOURCE)
    .resize(SIZE, SIZE, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 90, effort: 6 })
    .toBuffer();
  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, webp);
  writeFileSync(STAMP, `${digest}\n`);
  console.log(`✓ Website logo regenerated → images/landingpage/logo.webp (${SIZE}×${SIZE}, ${Math.round(webp.length / 1024)} KB)`);
}

main().catch((err) => {
  console.warn(`! Website logo not regenerated (${err.message}) — keeping the current logo.webp`);
});
