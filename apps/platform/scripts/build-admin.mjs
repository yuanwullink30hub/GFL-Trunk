/**
 * Post-build: the management app (apps/admin) at gardenforlife.nl/admin-dashboard (owner, 23 Oct 2026: the admin
 * must work on a phone). It is built in its live mode (the production API), under the /admin-dashboard/ base,
 * into dist/admin-dashboard, without source maps. The server's management API still answers only a valid
 * admin session (apps/backend/middleware/auth.js adminRequired); this page is the same app the desktop shell
 * (apps/admin-desktop) wraps, now also reachable in a browser.
 *
 *   node scripts/build-admin.mjs        (run by `build`, after vite build and the CSP step)
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ADMIN = path.resolve(HERE, '..', '..', 'admin');
const OUT = path.resolve(HERE, '..', 'dist', 'admin-dashboard');

// vite's bin is not an exported subpath; its package.json is.
const vite = path.join(path.dirname(createRequire(path.join(ADMIN, 'package.json')).resolve('vite/package.json')), 'bin', 'vite.js');
const run = spawnSync(process.execPath, [vite, 'build', '--mode', 'live', '--base', '/admin-dashboard/', '--outDir', OUT, '--emptyOutDir', '--sourcemap', 'false'], {
  cwd: ADMIN,
  stdio: 'inherit',
});
if (run.status !== 0) {
  console.error('\n✘ The management app did not build; the website build stops here.\n');
  process.exit(run.status || 1);
}
console.log(`✓ Management app built → dist/admin-dashboard`);
