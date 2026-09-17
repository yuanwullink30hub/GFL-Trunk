/**
 * Regenerate the app icon (build/icon.png) from the brand logo the platform ships.
 *
 * electron-builder derives the .exe/.ico, installer and .icns icons from build/icon.png, and the
 * window icon reads it at runtime — so a replaced logo only reaches users when this copy is rebuilt
 * before packaging. sync-ui.js runs this on every start / dist, so nobody has to remember.
 *
 *   node scripts/sync-icon.js
 */
const fs = require('fs');
const path = require('path');

const SOURCE = path.resolve(__dirname, '..', '..', 'platform', 'public', 'images', 'Import ready', 'App logo.png');
const TARGET = path.resolve(__dirname, '..', 'build', 'icon.png');
const SIZE = 1024; // fills the largest (Retina) slot of the .icns; electron-builder needs ≥ 512 for macOS

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

  if (fs.existsSync(TARGET) && fs.readFileSync(TARGET).equals(png)) {
    console.log('✓ App icon up to date (build/icon.png)');
    return;
  }
  fs.mkdirSync(path.dirname(TARGET), { recursive: true });
  fs.writeFileSync(TARGET, png);
  console.log(`✓ App icon regenerated from the logo → build/icon.png (${SIZE}×${SIZE})`);
}

module.exports = { syncIcon };

if (require.main === module) {
  syncIcon().catch((err) => { console.error(`\n✘ ${err.message}\n`); process.exit(1); });
}
