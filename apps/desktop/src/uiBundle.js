/**
 * Live UI updates — the app follows the website without a reinstall.
 *
 * The installer carries a copy of the platform UI (ui/, see scripts/sync-ui.js), so the app works with no
 * connection. On every start it also asks the download server for the newest app build of the UI
 * (https://downloads.gardenforlife.nl/ui/latest.json, published with every website deploy by
 * scripts/publish-ui.js). A newer build is downloaded in the background — only the files that changed —
 * and the next start runs it. The installer's own copy stays as the fallback.
 *
 * The UI runs next to the local folder (the preload bridge), so nothing unsigned may ever run here:
 *   - latest.json carries the manifest (every file's path, SHA-256 and size, the page's inline-script
 *     hashes for the CSP, the shell API level it needs) as an exact string plus an Ed25519 signature.
 *     The public key is pinned in this build (uiKey.js); the private key never leaves the publisher.
 *   - every downloaded file must match its manifest hash; paths are strictly validated (no .., no
 *     absolute paths, a fixed character set);
 *   - no downgrades: a build only replaces an older one (builtAt), never the installer's newer copy;
 *   - a build that needs a newer shell (requiresApi > SHELL_API_LEVEL) waits for the app update;
 *   - files are hash-checked as they arrive and the finished build is swapped in whole (staging dir,
 *     renamed); at start its signature is verified again and every file's presence and size checked
 *     (hashing ~100 MB on every launch would stall it). Anything off → the installer's copy, and the
 *     broken build is removed.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCHEMA = 1;
const MAX_FILES = 5000;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 400 * 1024 * 1024;
const SEGMENT = /^[A-Za-z0-9._ -]{1,200}$/; // the longest name in the build today: 122 (an image)
const HEX64 = /^[0-9a-f]{64}$/;
const BUILD_ID = /^[0-9A-Za-z._-]{1,80}$/;

/** A manifest path: relative, forward slashes, each segment from a fixed character set, never . or .. */
function isSafeRelPath(p) {
  if (typeof p !== 'string' || !p || p.length > 400 || p.startsWith('/') || p.includes('\\')) return false;
  return p.split('/').every((s) => SEGMENT.test(s) && s !== '.' && s !== '..' && s.trim() === s);
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

/**
 * Verify a signed manifest and check its shape. Returns the parsed manifest; throws on anything off.
 * `signed` = { manifest: <exact JSON string>, signature: <base64 Ed25519 over its UTF-8 bytes> }.
 */
function verifySignedManifest(signed, publicKeyPem) {
  if (!signed || typeof signed.manifest !== 'string' || typeof signed.signature !== 'string') throw new Error('not a signed manifest');
  const ok = crypto.verify(null, Buffer.from(signed.manifest, 'utf8'), crypto.createPublicKey(publicKeyPem), Buffer.from(signed.signature, 'base64'));
  if (!ok) throw new Error('signature does not verify');
  const m = JSON.parse(signed.manifest);
  if (m.schema !== SCHEMA) throw new Error(`unknown manifest schema ${m.schema}`);
  if (!BUILD_ID.test(String(m.buildId || ''))) throw new Error('bad buildId');
  if (!Number.isFinite(Date.parse(m.builtAt))) throw new Error('bad builtAt');
  if (!Number.isInteger(m.requiresApi) || m.requiresApi < 1) throw new Error('bad requiresApi');
  const files = m.files && typeof m.files === 'object' ? Object.entries(m.files) : [];
  if (!files.length || files.length > MAX_FILES) throw new Error('bad file list');
  let total = 0;
  for (const [p, f] of files) {
    if (!isSafeRelPath(p)) throw new Error(`unsafe path ${JSON.stringify(p).slice(0, 80)}`);
    if (!f || !HEX64.test(String(f.sha256)) || !Number.isInteger(f.size) || f.size < 0 || f.size > MAX_FILE_BYTES) throw new Error(`bad entry ${p}`);
    total += f.size;
  }
  if (total > MAX_TOTAL_BYTES) throw new Error('bundle too large');
  if (!m.files['index.html']) throw new Error('no index.html');
  const scripts = m.csp && Array.isArray(m.csp.scripts) ? m.csp.scripts : null;
  if (!scripts || !scripts.every((h) => /^sha256-[A-Za-z0-9+/=]{43,44}$/.test(h))) throw new Error('bad csp hashes');
  return m;
}

/** Check an unpacked bundle against its manifest: every file present with its size, and — `{ hashes: true }` —
 *  its SHA-256 as well. Returns null when it matches, else what is off. */
function verifyFiles(root, manifest, { hashes = false } = {}) {
  for (const [rel, f] of Object.entries(manifest.files)) {
    const file = path.join(root, ...rel.split('/'));
    if (hashes) {
      let buf;
      try { buf = fs.readFileSync(file); } catch { return `missing ${rel}`; }
      if (buf.length !== f.size || sha256(buf) !== f.sha256) return `changed ${rel}`;
    } else {
      let st;
      try { st = fs.statSync(file); } catch { return `missing ${rel}`; }
      if (!st.isFile() || st.size !== f.size) return `changed ${rel}`;
    }
  }
  return null;
}

/** The installer's copy: its root, CSP hashes and builtAt (ui/ui-manifest.json, written by sync-ui). */
function readBundled(bundledRoot) {
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(path.join(bundledRoot, 'ui-manifest.json'), 'utf8')); } catch { /* an older installer */ }
  let scripts = manifest && manifest.csp ? manifest.csp.scripts : null;
  if (!scripts) {
    try { scripts = JSON.parse(fs.readFileSync(path.join(bundledRoot, 'csp-hashes.json'), 'utf8')).scripts || []; } catch { scripts = []; }
  }
  return { root: bundledRoot, source: 'bundled', buildId: manifest ? manifest.buildId : 'bundled', builtAt: manifest ? manifest.builtAt : '1970-01-01T00:00:00.000Z', manifest, scripts };
}

/**
 * Decide which UI this run serves: a verified downloaded build that is newer than the installer's copy
 * and fits this shell, else the installer's copy. Removes a build that fails verification.
 */
function resolveActiveUi({ bundledRoot, storeDir, publicKeyPem, shellApiLevel, log = () => {} }) {
  const bundled = readBundled(bundledRoot);
  let active = null;
  try { active = JSON.parse(fs.readFileSync(path.join(storeDir, 'active.json'), 'utf8')); } catch { return bundled; }
  const id = String((active && active.buildId) || '');
  if (!BUILD_ID.test(id)) return bundled;
  const dir = path.join(storeDir, id);
  try {
    const signed = JSON.parse(fs.readFileSync(path.join(dir, 'ui-signed-manifest.json'), 'utf8'));
    const m = verifySignedManifest(signed, publicKeyPem);
    if (m.buildId !== id) throw new Error('buildId mismatch');
    if (m.requiresApi > shellApiLevel) return bundled; // waits for the app update; kept on disk
    if (Date.parse(m.builtAt) <= Date.parse(bundled.builtAt)) return bundled; // the installer's copy is newer
    const bad = verifyFiles(dir, m);
    if (bad) throw new Error(bad);
    return { root: dir, source: 'update', buildId: m.buildId, builtAt: m.builtAt, manifest: m, scripts: m.csp.scripts };
  } catch (err) {
    log(`UI build ${id} not used: ${err.message}`);
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
    try { fs.rmSync(path.join(storeDir, 'active.json'), { force: true }); } catch { /* ignore */ }
    return bundled;
  }
}

/**
 * Look for a newer UI build and stage it for the next start. `fetchImpl(url)` resolves to a fetch
 * Response. Returns { state: 'current' | 'staged' | 'needs-app-update', buildId? }; throws on failure.
 */
async function checkForUiUpdate({ baseUrl, storeDir, current, publicKeyPem, shellApiLevel, fetchImpl, log = () => {} }) {
  const res = await fetchImpl(`${baseUrl}/latest.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`latest.json: HTTP ${res.status}`);
  const signed = await res.json();
  const m = verifySignedManifest(signed, publicKeyPem);

  const newest = [current.builtAt, readStagedBuiltAt(storeDir)].filter(Boolean).map((d) => Date.parse(d));
  if (Date.parse(m.builtAt) <= Math.max(...newest)) return { state: 'current', buildId: m.buildId };
  if (m.requiresApi > shellApiLevel) return { state: 'needs-app-update', buildId: m.buildId };

  // Reuse what is already on disk: the running build's (or installer's) files with the same hash.
  const have = new Map();
  if (current.manifest && current.manifest.files) {
    for (const [rel, f] of Object.entries(current.manifest.files)) have.set(f.sha256, path.join(current.root, ...rel.split('/')));
  }
  fs.mkdirSync(storeDir, { recursive: true });
  const staging = path.join(storeDir, `${m.buildId}.partial`);
  fs.rmSync(staging, { recursive: true, force: true });
  // Async file I/O, one file at a time: this runs in the background of a live app (main process).
  const fsp = fs.promises;
  let downloaded = 0;
  let reused = 0;
  for (const [rel, f] of Object.entries(m.files)) {
    let buf = null;
    const local = have.get(f.sha256);
    if (local) {
      try { const b = await fsp.readFile(local); if (b.length === f.size && sha256(b) === f.sha256) { buf = b; reused += 1; } } catch { /* download it */ }
    }
    if (!buf) {
      const r = await fetchImpl(`${baseUrl}/files/${f.sha256}`);
      if (!r.ok) throw new Error(`${rel}: HTTP ${r.status}`);
      buf = Buffer.from(await r.arrayBuffer());
      if (buf.length !== f.size || sha256(buf) !== f.sha256) throw new Error(`${rel}: content does not match the manifest`);
      downloaded += buf.length;
    }
    const target = path.join(staging, ...rel.split('/'));
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, buf);
  }
  await fsp.writeFile(path.join(staging, 'ui-signed-manifest.json'), JSON.stringify(signed));

  // Swap in: the finished directory under its build id, then active.json (written aside, renamed over).
  const finalDir = path.join(storeDir, m.buildId);
  fs.rmSync(finalDir, { recursive: true, force: true });
  fs.renameSync(staging, finalDir);
  const tmp = path.join(storeDir, 'active.json.tmp');
  fs.writeFileSync(tmp, JSON.stringify({ buildId: m.buildId, builtAt: m.builtAt }));
  fs.renameSync(tmp, path.join(storeDir, 'active.json'));

  // Keep the running build and the new one; everything else goes.
  for (const entry of fs.readdirSync(storeDir, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name !== m.buildId && entry.name !== current.buildId) {
      fs.rmSync(path.join(storeDir, entry.name), { recursive: true, force: true });
    }
  }
  log(`UI build ${m.buildId} staged for the next start (${(downloaded / 1e6).toFixed(1)} MB downloaded, ${reused} files reused)`);
  return { state: 'staged', buildId: m.buildId };
}

function readStagedBuiltAt(storeDir) {
  try { return JSON.parse(fs.readFileSync(path.join(storeDir, 'active.json'), 'utf8')).builtAt || null; } catch { return null; }
}

module.exports = { SCHEMA, isSafeRelPath, sha256, verifySignedManifest, verifyFiles, readBundled, resolveActiveUi, checkForUiUpdate };
