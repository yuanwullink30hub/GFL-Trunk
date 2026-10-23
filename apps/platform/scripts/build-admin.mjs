/**
 * Post-build: the management phone app (apps/admin) at gardenforlife.nl/beheer (owner, 23 Oct 2026). It is built
 * in its live mode (the production API), under the /beheer/ base, into dist/beheer, without source maps. The
 * Pages function (functions/_middleware.js) serves it only to a phone that used a one-time install link, and the
 * server's management API still answers only a valid admin session (middleware/auth.js adminRequired). It is the
 * same app the desktop shell (apps/admin-desktop) wraps; the desktop build does not use this script.
 *
 *   node scripts/build-admin.mjs        (run by `build`, after vite build and the CSP step)
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ADMIN = path.resolve(HERE, '..', '..', 'admin');
const OUT = path.resolve(HERE, '..', 'dist', 'beheer');

// vite's bin is not an exported subpath; its package.json is.
const vite = path.join(path.dirname(createRequire(path.join(ADMIN, 'package.json')).resolve('vite/package.json')), 'bin', 'vite.js');
const run = spawnSync(process.execPath, [vite, 'build', '--mode', 'live', '--base', '/beheer/', '--outDir', OUT, '--emptyOutDir', '--sourcemap', 'false'], {
  cwd: ADMIN,
  stdio: 'inherit',
});
if (run.status !== 0) {
  console.error('\n✘ The management app did not build; the website build stops here.\n');
  process.exit(run.status || 1);
}
console.log(`✓ Management app built → dist/beheer`);
