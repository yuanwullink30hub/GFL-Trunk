/**
 * Content-Security-Policy of the management UI. Sent as a header by the app:// handler (appProtocol.js)
 * and written into ui/index.html as a meta tag by scripts/sync-ui.js.
 *
 * Only our own files run; the API is the only data origin; fonts from Google Fonts. No third parties.
 */
const API_ORIGIN = 'https://api.gardenforlife.nl';

function buildCsp({ forMeta = false } = {}) {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${API_ORIGIN}`,
    "frame-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    ...(forMeta ? [] : ["frame-ancestors 'none'"]),
  ].join('; ');
}

module.exports = { buildCsp, API_ORIGIN };
