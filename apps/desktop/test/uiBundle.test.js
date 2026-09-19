/**
 * Live UI update tests — run with: node test/uiBundle.test.js
 *
 * The downloaded UI runs next to the local folder, so these are written from the attacks: a tampered or
 * foreign-signed manifest, paths that climb out, a file swapped in transit, a downgrade, a build that needs
 * a newer shell, a build broken on disk. Plus the two things that must keep working: a good build is staged
 * and chosen, and unchanged files are reused instead of downloaded again. Pure Node; no Electron needed.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const ui = require('../src/uiBundle.js');

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ok    ${name}`); } else { fail += 1; console.log(`  FAIL  ${name} ${extra}`); }
};
const rejects = async (name, fn, match) => {
  try { await fn(); fail += 1; console.log(`  FAIL  ${name} (no error thrown)`); } catch (e) {
    if (match && !match.test(e.message)) { fail += 1; console.log(`  FAIL  ${name} (wrong error: ${e.message})`); } else { pass += 1; console.log(`  ok    ${name}`); }
  }
};

const keys = crypto.generateKeyPairSync('ed25519');
const PUB = keys.publicKey.export({ type: 'spki', format: 'pem' });
const other = crypto.generateKeyPairSync('ed25519');
const sign = (manifest, key = keys.privateKey) => {
  const text = JSON.stringify(manifest);
  return { manifest: text, signature: crypto.sign(null, Buffer.from(text, 'utf8'), key).toString('base64') };
};
const CSP = ['sha256-' + crypto.createHash('sha256').update('x').digest('base64')];
const fileEntry = (content) => ({ sha256: ui.sha256(Buffer.from(content)), size: Buffer.byteLength(content) });
const manifestOf = (buildId, builtAt, contents, extra = {}) => ({
  schema: 1, buildId, builtAt, commit: 'test', requiresApi: 1,
  files: Object.fromEntries(Object.entries(contents).map(([p, c]) => [p, fileEntry(c)])),
  csp: { scripts: CSP }, ...extra,
});

/** A fake download server: latest.json + files/<sha256>, counting what is fetched. */
function server(signed, contents, { swap = {} } = {}) {
  const byHash = new Map(Object.values(contents).map((c) => [ui.sha256(Buffer.from(c)), c]));
  const hits = [];
  const fetchImpl = async (url) => {
    hits.push(url);
    const respond = (body, status = 200) => ({
      ok: status === 200, status,
      json: async () => JSON.parse(body),
      arrayBuffer: async () => { const b = Buffer.from(body); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); },
    });
    if (url.endsWith('/latest.json')) return respond(JSON.stringify(signed));
    const hash = url.split('/files/')[1];
    if (swap[hash] != null) return respond(swap[hash]);
    return byHash.has(hash) ? respond(byHash.get(hash)) : respond('', 404);
  };
  return { fetchImpl, hits };
}

function bundledDir(root, builtAt, contents) {
  fs.mkdirSync(root, { recursive: true });
  for (const [p, c] of Object.entries(contents)) { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root, p), c); }
  const m = manifestOf('bundled-1', builtAt, contents);
  fs.writeFileSync(path.join(root, 'ui-manifest.json'), JSON.stringify(m));
  return m;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gfl-ui-test-'));
  const V1 = { 'index.html': '<html>v1</html>', 'assets/app-a.js': 'console.log(1)', 'images/big.webp': 'BIG-IMAGE-BYTES' };
  const V2 = { 'index.html': '<html>v2</html>', 'assets/app-b.js': 'console.log(2)', 'images/big.webp': 'BIG-IMAGE-BYTES' };
  const bundledRoot = path.join(tmp, 'app-ui');
  bundledDir(bundledRoot, '2026-09-19T10:00:00.000Z', V1);
  const common = { publicKeyPem: PUB, shellApiLevel: 1 };

  console.log('\nManifest checks');
  const good = sign(manifestOf('b2', '2026-09-19T12:00:00.000Z', V2));
  ok('a good manifest verifies', ui.verifySignedManifest(good, PUB).buildId === 'b2');
  const tampered = good.manifest.replace('"buildId":"b2"', '"buildId":"b9"');
  ok('(the tamper really changes the text)', tampered !== good.manifest);
  await rejects('a tampered manifest is refused', () => ui.verifySignedManifest({ ...good, manifest: tampered }, PUB), /signature/);
  await rejects('a manifest signed by another key is refused', () => ui.verifySignedManifest(sign(manifestOf('b2', '2026-09-19T12:00:00.000Z', V2), other.privateKey), PUB), /signature/);
  for (const bad of ['../evil.js', '/etc/passwd', 'a\\b.js', 'assets/../../x.js', 'C:x.js', 'a//b.js', ' lead.js', 'assets/./x.js']) {
    await rejects(`unsafe path ${JSON.stringify(bad)} is refused`, () => ui.verifySignedManifest(sign(manifestOf('b3', '2026-09-19T12:00:00.000Z', { 'index.html': 'x', [bad]: 'y' })), PUB), /unsafe path/);
  }
  await rejects('bad CSP hashes are refused', () => ui.verifySignedManifest(sign({ ...manifestOf('b4', '2026-09-19T12:00:00.000Z', V2), csp: { scripts: ["'unsafe-inline'"] } }), PUB), /csp/);
  await rejects('a manifest without index.html is refused', () => ui.verifySignedManifest(sign(manifestOf('b5', '2026-09-19T12:00:00.000Z', { 'a.js': 'x' })), PUB), /index\.html/);
  ok('spaces inside a name are fine ("Archetype imags/web/ronin male.webp")', ui.isSafeRelPath('Archetype imags/web/ronin male.webp'));

  console.log('\nDownload + staging');
  const current = ui.resolveActiveUi({ bundledRoot, storeDir: path.join(tmp, 'store-none'), ...common });
  ok('with nothing downloaded, the installer copy runs', current.source === 'bundled' && current.root === bundledRoot);

  const swapped = sign(manifestOf('b-swap', '2026-09-19T12:00:00.000Z', V2));
  const evil = server(swapped, V2, { swap: { [ui.sha256(Buffer.from(V2['assets/app-b.js']))]: 'fetch("https://evil")' } });
  const storeSwap = path.join(tmp, 'store-swap');
  await rejects('a file swapped in transit stops the update', () => ui.checkForUiUpdate({ baseUrl: 'https://x/ui', storeDir: storeSwap, current, fetchImpl: evil.fetchImpl, ...common }), /does not match/);
  ok('… and nothing was activated', !fs.existsSync(path.join(storeSwap, 'active.json')));

  const store = path.join(tmp, 'store');
  const srv = server(good, V2);
  const r = await ui.checkForUiUpdate({ baseUrl: 'https://x/ui', storeDir: store, current, fetchImpl: srv.fetchImpl, ...common });
  ok('a newer good build is staged', r.state === 'staged' && r.buildId === 'b2');
  const fileHits = srv.hits.filter((u) => u.includes('/files/'));
  ok('only changed files are downloaded (the unchanged image is reused)', fileHits.length === 2, `fetched ${fileHits.length}`);
  const next = ui.resolveActiveUi({ bundledRoot, storeDir: store, ...common });
  ok('the next start runs the new build', next.source === 'update' && next.buildId === 'b2' && fs.readFileSync(path.join(next.root, 'index.html'), 'utf8') === V2['index.html']);
  ok('… with its own CSP hashes', JSON.stringify(next.scripts) === JSON.stringify(CSP));

  const again = await ui.checkForUiUpdate({ baseUrl: 'https://x/ui', storeDir: store, current: next, fetchImpl: server(good, V2).fetchImpl, ...common });
  ok('the same build again → nothing to do', again.state === 'current');

  const older = sign(manifestOf('b-old', '2026-09-19T11:00:00.000Z', V1));
  const down = await ui.checkForUiUpdate({ baseUrl: 'https://x/ui', storeDir: store, current: next, fetchImpl: server(older, V1).fetchImpl, ...common });
  ok('an older build is never installed (no downgrade)', down.state === 'current' && ui.resolveActiveUi({ bundledRoot, storeDir: store, ...common }).buildId === 'b2');

  const needsShell = sign(manifestOf('b-api2', '2026-09-19T13:00:00.000Z', V2, { requiresApi: 2 }));
  const ns = await ui.checkForUiUpdate({ baseUrl: 'https://x/ui', storeDir: store, current: next, fetchImpl: server(needsShell, V2).fetchImpl, ...common });
  ok('a build that needs a newer shell waits for the app update', ns.state === 'needs-app-update');

  console.log('\nAt start');
  const broken = path.join(tmp, 'store-broken');
  await ui.checkForUiUpdate({ baseUrl: 'https://x/ui', storeDir: broken, current, fetchImpl: server(good, V2).fetchImpl, ...common });
  fs.writeFileSync(path.join(broken, 'b2', 'assets', 'app-b.js'), 'console.log(2); /* grown */');
  const fb = ui.resolveActiveUi({ bundledRoot, storeDir: broken, ...common });
  ok('a build changed on disk → the installer copy runs', fb.source === 'bundled');
  ok('… and the broken build is removed', !fs.existsSync(path.join(broken, 'b2')) && !fs.existsSync(path.join(broken, 'active.json')));

  const forged = path.join(tmp, 'store-forged');
  await ui.checkForUiUpdate({ baseUrl: 'https://x/ui', storeDir: forged, current, fetchImpl: server(good, V2).fetchImpl, ...common });
  const sm = JSON.parse(fs.readFileSync(path.join(forged, 'b2', 'ui-signed-manifest.json'), 'utf8'));
  fs.writeFileSync(path.join(forged, 'b2', 'ui-signed-manifest.json'), JSON.stringify({ ...sm, manifest: sm.manifest.replace('"requiresApi":1', '"requiresApi":1 ') }));
  ok('a stored manifest edited on disk → the installer copy runs', ui.resolveActiveUi({ bundledRoot, storeDir: forged, ...common }).source === 'bundled');

  const newerInstaller = path.join(tmp, 'app-ui-newer');
  bundledDir(newerInstaller, '2026-09-20T00:00:00.000Z', V1);
  ok('an installer copy newer than the downloaded build wins', ui.resolveActiveUi({ bundledRoot: newerInstaller, storeDir: store, ...common }).source === 'bundled');
  ok('a downloaded build that needs a newer shell is not run', ui.resolveActiveUi({ bundledRoot, storeDir: store, publicKeyPem: PUB, shellApiLevel: 0 }).source === 'bundled');

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
