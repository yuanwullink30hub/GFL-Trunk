// Cloudflare Pages middleware — sets the starting language from the visitor's IP country.
//
// Cloudflare already resolves the country for every request it serves (request.cf.country),
// so no extra lookup, third party or delay is involved. Only the resulting language code is
// written into the page as <html data-geo-lang="nl|en">; the country itself never reaches
// the browser and nothing is stored. The platform's head script (apps/platform/index.html)
// and @gfl/i18n's LanguageProvider read it; a language picked with the NL/EN toggle still
// wins. _routes.json keeps static files out of this function, so it runs on page loads only.
//
// It also guards the management phone app (owner, 23 Oct 2026; apps/backend/services/adminAppLinks.js):
//   /<30 characters>  a one-time install link: on a phone, a page whose button posts the token to the API,
//                     which spends it and sets the signed device grant; elsewhere "open it on your phone".
//   /beheer/*         the app itself, served only with a valid grant — anyone else gets the normal site.
//                     The manifest, icons and service worker stay open: the browser fetches those without
//                     cookies when it installs the app.

const DUTCH_COUNTRIES = ['NL'];

const APP_PATH = '/beheer';
const LINK_RE = /^\/[A-Za-z0-9_-]{30}$/;
const REDEEM_URL = 'https://api.gardenforlife.nl/api/app-link/redeem';
const OPEN_FILES = new Set(['manifest.webmanifest', 'sw.js', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']
  .map((f) => `${APP_PATH}/${f}`));
// Public half of ADMIN_APP_GATE_KEY (Render env). A new key pair revokes every installed app at once.
const GATE_JWK = { kty: 'EC', crv: 'P-256', x: 'RxmlM2Q8I_SsSDnt6FVAiXgrWtTL9ODdO1MmdVFf4Og', y: 'FneLfPsSwkRzguGvjnl_A5TR3Qs9SxsCF280AFbnD7k' };

let gateKey = null;
function verifyKey() {
  if (!gateKey) gateKey = crypto.subtle.importKey('jwk', GATE_JWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  return gateKey;
}

function b64urlBytes(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hasGrant(request) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/(?:^|;\s*)gfl_beheer=(v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
  if (!m) return false;
  const [, payload, signature] = m[1].split('.');
  try {
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, await verifyKey(),
      b64urlBytes(signature), new TextEncoder().encode(`v1.${payload}`));
  } catch {
    return false;
  }
}

const isPhone = (request) => /Android|iPhone|iPad|iPod|Mobile/i.test(request.headers.get('User-Agent') || '');

// The install page, in the house style (dark glass, Lexend Mega chrome, Figtree body). Nothing in it is spent
// until the button is pressed, so link previews in chat apps cannot use the link up.
function linkPage(token, phone) {
  const body = phone
    ? `<p>Je bent uitgenodigd voor de beheer-app van Garden For Life. De link werkt één keer: tik op de knop, log in en installeer de app.</p>
       <form method="post" action="${REDEEM_URL}"><input type="hidden" name="t" value="${token}"><button type="submit">Open de beheer-app</button></form>`
    : '<p>Deze link werkt alleen op een telefoon. Open hem daar; hij is nog niet gebruikt.</p>';
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Admin GFL</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&family=Lexend+Mega:wght@700&display=swap" rel="stylesheet">
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:0 1rem;background:#0a0510;color:#FFFEF0;font-family:'Figtree',sans-serif}
main{position:relative;width:100%;max-width:26rem;padding:1.5rem;border-radius:.5rem;background:rgba(2,0,3,.3);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
box-shadow:0 6px 30px rgba(0,0,0,.7),0 12px 60px rgba(0,0,0,.5),inset 0 0 12px rgba(168,85,247,.06)}
main:before,main:after{content:'';position:absolute;width:12px;height:12px;border-color:#f97316;border-style:solid}
main:before{top:0;left:0;border-width:2px 0 0 2px}main:after{bottom:0;right:0;border-width:0 2px 2px 0}
h1{margin:0 0 1rem;font-family:'Lexend Mega',sans-serif;font-size:max(16px,.9vw);letter-spacing:.16em;text-transform:uppercase;color:#f97316}
p{margin:0 0 1.2rem;font-size:max(14px,.75vw);line-height:1.6}
button{font-family:'Lexend Mega',sans-serif;font-weight:700;font-size:max(11px,.6vw);letter-spacing:.14em;text-transform:uppercase;color:#f97316;background:rgba(249,115,22,.08);
border:1px solid rgba(249,115,22,.5);border-radius:.15rem;padding:.8rem 1.2rem;cursor:pointer;transition:all .2s ease}
button:hover,button:active{background:#f97316;color:#000;box-shadow:0 0 20px rgba(249,115,22,.5)}
</style></head><body><main><h1>Admin GFL</h1>${body}</main></body></html>`;
}

const LINK_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; form-action https://api.gardenforlife.nl https://gardenforlife.nl; base-uri 'none'; frame-ancestors 'none'",
};

async function guarded({ request, next, env }) {
  const { pathname } = new URL(request.url);
  if (request.method === 'GET' && LINK_RE.test(pathname)) {
    return new Response(linkPage(pathname.slice(1), isPhone(request)), { headers: LINK_HEADERS });
  }
  if (pathname === APP_PATH || pathname.startsWith(`${APP_PATH}/`)) {
    if (OPEN_FILES.has(pathname) || await hasGrant(request)) return next();
    return env.ASSETS.fetch(new URL('/', request.url));
  }
  return next();
}

export async function onRequest(context) {
  const { request } = context;
  const response = await guarded(context);

  const country = request.cf && request.cf.country;
  const contentType = response.headers.get('Content-Type') || '';
  if (!country || !contentType.includes('text/html')) return response;

  const geoLang = DUTCH_COUNTRIES.includes(country) ? 'nl' : 'en';

  // The HTML now differs per visitor, so no cache may hand one visitor's copy to another.
  const headers = new Headers(response.headers);
  headers.delete('ETag');
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

  return new HTMLRewriter()
    .on('html', { element(el) { el.setAttribute('data-geo-lang', geoLang); } })
    .transform(new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    }));
}
