/**
 * app://gardenforlife — the address the packaged UI is served from.
 *
 * Loading the UI from file:// made every API request carry `Origin: null`, which the backend
 * (rightly) refuses. A privileged standard scheme gives the app a real, fixed origin
 * ("app://gardenforlife") that the backend allowlists, a stable home for localStorage (login,
 * tool tickets), and response headers — so the CSP is enforced as a header, not only a meta tag.
 *
 * Files are served only from the bundled ui/ directory; any path that resolves outside it is
 * refused. Unknown paths fall back to index.html (the platform routes client-side).
 */
const { protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { buildCsp } = require('./csp');

const SCHEME = 'app';
const HOST = 'gardenforlife';
const APP_ORIGIN = `${SCHEME}://${HOST}`;
const UI_ROOT = path.join(__dirname, '..', 'ui');

/** Must run before app 'ready'. */
function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([{
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, codeCache: true },
  }]);
}

/** Must run after app 'ready'. */
function handleAppScheme() {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url);
    if (url.host !== HOST) return new Response('Not found', { status: 404 });

    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const target = path.normalize(path.join(UI_ROOT, rel));
    if (target !== UI_ROOT && !target.startsWith(UI_ROOT + path.sep)) return new Response('Forbidden', { status: 403 });

    const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(UI_ROOT, 'index.html');
    const res = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(res.headers);
    if (file.endsWith('.html')) {
      headers.set('Content-Security-Policy', buildCsp());
      headers.set('Cache-Control', 'no-cache');
    }
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(res.body, { status: res.status, headers });
  });
}

module.exports = { registerAppScheme, handleAppScheme, APP_ORIGIN };
