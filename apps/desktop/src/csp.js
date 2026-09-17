/**
 * The Content-Security-Policy of the packaged UI — one definition, used twice:
 *   - src/appProtocol.js sends it as a response header on every app:// page
 *   - scripts/sync-ui.js also writes it into ui/index.html as a <meta> tag (without the
 *     directives a meta tag cannot carry)
 *
 * Scripts: our own files, the exact inline scripts of the bundled index.html (by SHA-256 hash,
 * computed by sync-ui.js into ui/csp-hashes.json — any other inline code stays blocked), blob:
 * (the 3D text library starts its workers from blob URLs; only code already running here can
 * create one) and Stripe.js. The API is the only data origin; images allow the remote earth textures.
 */
const fs = require('fs');
const path = require('path');

const API_ORIGIN = 'https://api.gardenforlife.nl';
const HASHES_FILE = path.join(__dirname, '..', 'ui', 'csp-hashes.json');

function readInlineHashes() {
  try { return JSON.parse(fs.readFileSync(HASHES_FILE, 'utf8')).scripts || []; } catch { return []; }
}

function buildCsp({ inlineHashes = readInlineHashes(), forMeta = false } = {}) {
  const hashes = inlineHashes.map((h) => `'${h}'`).join(' ');
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes} blob: https://js.stripe.com https://*.js.stripe.com`.replace(/\s+/g, ' '),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://raw.githubusercontent.com https://*.stripe.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    `connect-src 'self' ${API_ORIGIN} https://api.stripe.com https://*.stripe.com https://*.stripe.network`,
    "frame-src https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://*.stripe.network",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    // frame-ancestors is ignored (and logged as an error) in a meta tag — header only.
    ...(forMeta ? [] : ["frame-ancestors 'none'"]),
  ].join('; ');
}

module.exports = { buildCsp, API_ORIGIN, HASHES_FILE };
