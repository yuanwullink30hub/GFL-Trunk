/**
 * Regenerate the app icons (build/icon.png + build/icon.ico) from the brand logo the platform ships.
 *
 * electron-builder derives the installer and .icns icons from build/icon.png, and the window icon reads
 * it at runtime — so a replaced logo only reaches users when this copy is rebuilt before packaging.
 * sync-ui.js runs this on every start / dist, so nobody has to remember.
 *
 * The .ico is written here rather than left to electron-builder, which produced a single 256×256
 * PNG-compressed entry: Windows draws the small sizes (Explorer, the taskbar, a browser's download list)
 * from that one image and some of those paths cannot read a PNG entry, so the downloaded installer showed
 * as a black square (owner, 2026-09-17). This writes the classic sizes as uncompressed 32-bit BGRA with
 * their AND mask, and keeps PNG only for 256.
 *
 *   node scripts/sync-icon.js
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..', '..', 'platform', 'public', 'images', 'Import ready', 'App logo.png');
const TARGET = path.resolve(__dirname, '..', 'build', 'icon.png');
const ICO_TARGET = path.resolve(__dirname, '..', 'build', 'icon.ico');
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];
const SIZE = 1024; // fills the largest (Retina) slot of the .icns; electron-builder needs ≥ 512 for macOS

/** One ICO entry as an uncompressed 32-bit BMP: bottom-up BGRA rows plus the legacy AND mask. */
function bmpEntry(rgba, size) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(size, 4);
  header.writeInt32LE(size * 2, 8); // colour rows + mask rows
  header.writeUInt16LE(1, 12);
  header.writeUInt16LE(32, 14);
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const from = (y * size + x) * 4;
      const to = ((size - 1 - y) * size + x) * 4; // bottom-up
      pixels[to] = rgba[from + 2];
      pixels[to + 1] = rgba[from + 1];
      pixels[to + 2] = rgba[from];
      pixels[to + 3] = rgba[from + 3];
    }
  }
  const maskRow = Math.ceil(size / 32) * 4; // 1 bit per pixel, rows padded to 4 bytes
  const mask = Buffer.alloc(maskRow * size); // zeroed: alpha in the BGRA data decides
  return Buffer.concat([header, pixels, mask]);
}

async function writeIco(sharp, source) {
  const entries = [];
  for (const size of ICO_SIZES) {
    const img = sharp(source).resize(size, size, { kernel: 'lanczos3' });
    entries.push({
      size,
      // 256 stays PNG (that is how large entries are stored); the rest are BMP, which every Windows
      // shell path can draw.
      data: size === 256
        ? await img.png({ compressionLevel: 9 }).toBuffer()
        : bmpEntry(await img.ensureAlpha().raw().toBuffer(), size),
    });
  }
  const dir = Buffer.alloc(6 + entries.length * 16);
  dir.writeUInt16LE(0, 0);
  dir.writeUInt16LE(1, 2); // type: icon
  dir.writeUInt16LE(entries.length, 4);
  let offset = dir.length;
  entries.forEach((e, i) => {
    const o = 6 + i * 16;
    dir[o] = e.size === 256 ? 0 : e.size;
    dir[o + 1] = e.size === 256 ? 0 : e.size;
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(e.data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.data.length;
  });
  return Buffer.concat([dir, ...entries.map((e) => e.data)]);
}

async function syncIcon() {
  if (!fs.existsSync(SOURCE)) throw new Error(`No app logo at:\n  ${SOURCE}`);

  let sharp;
  try {
    sharp = require('sharp'); // root devDependency
  } catch {
    throw new Error('sharp is not installed — run `corepack pnpm@9.0.0 install` at the repo root.');
  }

  const { width, height } = await sharp(SOURCE).metadata();
  if (width !== height) throw new Error(`The app logo must be square (it is ${width}×${height}): ${SOURCE}`);

  const png = await sharp(SOURCE)
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toBuffer();

  const ico = await writeIco(sharp, SOURCE);
  const fresh = (file, data) => fs.existsSync(file) && fs.readFileSync(file).equals(data);
  if (fresh(TARGET, png) && fresh(ICO_TARGET, ico)) {
    console.log('✓ App icon up to date (build/icon.png + icon.ico)');
    return;
  }
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, png);
  fs.writeFileSync(ICO_TARGET, ico);
  console.log(`✓ App icon regenerated from the logo → build/icon.png (${SIZE}×${SIZE}) + icon.ico (${ICO_SIZES.join(', ')})`);
}

module.exports = { syncIcon };

if (require.main === module) {
  syncIcon().catch((err) => { console.error(`\n✘ ${err.message}\n`); process.exit(1); });
}
