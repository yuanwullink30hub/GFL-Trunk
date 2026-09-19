/**
 * app://gardenforlife — the address the packaged UI is served from.
 *
 * Loading the UI from file:// made every API request carry `Origin: null`, which the backend
 * (rightly) refuses. A privileged standard scheme gives the app a real, fixed origin
 * ("app://gardenforlife") that the backend allowlists, a stable home for localStorage (login,
 * tool tickets), and response headers — so the CSP is enforced as a header, not only a meta tag.
 *
 * Files are served only from the active UI directory — the installer's ui/, or a verified newer build
 * (uiBundle.js, chosen once at start via setActiveUi) — and any path that resolves outside it is refused.
 * Unknown paths fall back to index.html (the platform routes client-side). The CSP carries the active
 * build's own inline-script hashes.
 */
const { protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { buildCsp } = require('./csp');

const SCHEME = 'app';
const HOST = 'gardenforlife';
const APP_ORIGIN = `${SCHEME}://${HOST}`;
const BUNDLED_UI_ROOT = path.join(__dirname, '..', 'ui');

// The UI this run serves: { root, scripts } — the installer's copy until setActiveUi() picks otherwise.
let active = { root: BUNDLED_UI_ROOT, scripts: null };
/** Choose the UI for this run (before the first window loads). `scripts` = its CSP inline-script hashes. */
function setActiveUi(ui) { active = { root: ui.root, scripts: ui.scripts || null }; }

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

    const root = active.root;
    let rel = decodeURIComponent(url.pathname);
    if (rel === '/' || rel === '') rel = '/index.html';
    const target = path.normalize(path.join(root, rel));
    if (target !== root && !target.startsWith(root + path.sep)) return new Response('Forbidden', { status: 403 });

    const file = fs.existsSync(target) && fs.statSync(target).isFile() ? target : path.join(root, 'index.html');
    const res = await net.fetch(pathToFileURL(file).toString());
    const headers = new Headers(res.headers);
    if (file.endsWith('.html')) {
      headers.set('Content-Security-Policy', active.scripts ? buildCsp({ inlineHashes: active.scripts }) : buildCsp());
      headers.set('Cache-Control', 'no-cache');
    }
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(res.body, { status: res.status, headers });
  });
}

module.exports = { registerAppScheme, handleAppScheme, setActiveUi, APP_ORIGIN, BUNDLED_UI_ROOT };
