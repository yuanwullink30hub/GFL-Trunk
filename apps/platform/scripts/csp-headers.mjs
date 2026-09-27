/**
 * Post-build: pin the page's inline scripts in the Content-Security-Policy (dist/_headers).
 *
 * script-src no longer allows 'unsafe-inline' or 'unsafe-eval' — together they let any injected script
 * run, which is most of what a CSP is for. index.html still has two small inline scripts that must run
 * before the bundle (the language choice, the loading overlay), so each is allowed by the SHA-256 of its
 * exact text, computed here from the BUILT index.html. Change a script and its hash changes with it;
 * any other inline code stays blocked. Same approach as the desktop app (apps/desktop/src/csp.js), which
 * already runs this same UI under a policy with neither keyword.
 *
 * public/_headers carries the placeholder '__INLINE_SCRIPT_HASHES__'. This step must replace it, and fails
 * the build otherwise: shipping the placeholder would block the boot scripts, and silently falling back to
 * a permissive policy would undo the point.
 *
 *   node scripts/csp-headers.mjs        (run by `build`, after vite build)
 */
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PLACEHOLDER = "'__INLINE_SCRIPT_HASHES__'";

const html = await readFile(path.join(DIST, 'index.html'), 'utf8');
// Inline = no src attribute. The same pattern apps/desktop/scripts/sync-ui.js uses.
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => m[2]);

// The HTML parser turns every CRLF (and lone CR) into LF before a script is hashed, so the text must be
// normalised the same way first. Hashing the raw bytes matched only where the file happened to have LF
// endings (Cloudflare's Linux builders) and blocked both boot scripts on a Windows checkout — caught by
// loading the built site in Chromium under this very header.
const normalise = (text) => text.replace(/\r\n?/g, '\n');
const hashes = inline.map((body) => `'sha256-${createHash('sha256').update(normalise(body), 'utf8').digest('base64')}'`);
if (!hashes.length) throw new Error('[csp] no inline scripts found in dist/index.html — refusing to guess the policy');

const headersPath = path.join(DIST, '_headers');
const headers = await readFile(headersPath, 'utf8');
if (!headers.includes(PLACEHOLDER)) {
  throw new Error(`[csp] ${PLACEHOLDER} not found in dist/_headers — was public/_headers changed?`);
}
const out = headers.replace(PLACEHOLDER, hashes.join(' '));
if (/'unsafe-(inline|eval)'/.test(out.match(/script-src[^;]*/)?.[0] || '')) {
  throw new Error("[csp] script-src must not allow 'unsafe-inline' or 'unsafe-eval'");
}
await writeFile(headersPath, out);
console.log(`[csp] script-src pinned to ${hashes.length} inline script hash(es) in dist/_headers`);
