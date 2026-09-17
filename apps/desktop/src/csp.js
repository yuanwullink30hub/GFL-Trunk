/**
 * The Content-Security-Policy of the packaged UI — one definition, used twice:
 *   - src/appProtocol.js sends it as a response header on every app:// page
 *   - scripts/sync-ui.js also writes it into ui/index.html as a <meta> tag (belt and braces)
 *
 * Scripts stay self-hosted except Stripe.js (the paywall loads it on first use and it must come
 * from js.stripe.com). The API is the only data origin; images allow the decorative remote
 * earth textures the platform uses.
 */
const API_ORIGIN = 'https://api.gardenforlife.nl';

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://js.stripe.com https://*.js.stripe.com",
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
  "frame-ancestors 'none'",
].join('; ');

module.exports = { CSP, API_ORIGIN };
