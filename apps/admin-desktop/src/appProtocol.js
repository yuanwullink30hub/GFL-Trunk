/**
 * app://gflbeheer — the address the bundled management UI is served from: a real, fixed origin the
 * backend allowlists (a file:// page sends `Origin: null`), its own localStorage, and the CSP as a
 * response header. Files only from the active UI directory — the installer's ui/, or a verified newer build
 * (uiUpdates.js → setActiveUi, chosen once at start); anything resolving outside it is refused.
 */
const { protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { buildCsp } = require('./csp');

const SCHEME = 'app';
const HOST = 'gflbeheer';
const APP_ORIGIN = `${SCHEME}://${HOST}`;
const UI_ROOT = path.join(__dirname, '..', 'ui');

let activeRoot = UI_ROOT;
/** Choose the UI directory for this run (before the first window loads). */
function setActiveUi(ui) { activeRoot = ui && ui.root ? ui.root : UI_ROOT; }

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

    const root = activeRoot;
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const target = path.normalize(path.join(root, rel));
    if (target !== root && !target.startsWith(root + path.sep)) return new Response('Forbidden', { status: 403 });

    const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(root, 'index.html');
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

module.exports = { registerAppScheme, handleAppScheme, setActiveUi, APP_ORIGIN, UI_ROOT };
