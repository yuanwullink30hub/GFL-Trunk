/**
 * R6 — fail-closed configuration.
 *
 * The boot tests start the REAL server.js in a child process with NODE_ENV=production and a
 * hand-built environment. They run from the repo root, where there is no .env, and set MONGODB_URI to
 * nothing, so a child that did start would have no database to reach — let alone production's.
 */
require('./helpers'); // disables dotenv for this process as well
const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const REPO = path.resolve(__dirname, '..', '..', '..');
const SERVER = path.join(REPO, 'apps', 'backend', 'server.js');
const GOOD_KEY = Buffer.alloc(32, 9).toString('base64');
const GOOD_JWT = 'a-properly-long-random-production-secret-0123456789';

test('the repo root has no .env, so a booted child cannot pick up real credentials', () => {
  assert.equal(fs.existsSync(path.join(REPO, '.env')), false);
});

/** Boot server.js; resolve when it exits, or when it prints that it is listening. */
function boot(env, port) {
  return new Promise((resolve) => {
    const base = { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, NODE_ENV: 'production', PORT: String(port), MONGODB_URI: '' };
    const child = spawn(process.execPath, [SERVER], { cwd: REPO, env: { ...base, ...env } });
    let out = '';
    const done = (r) => { clearTimeout(t); if (child.exitCode === null) child.kill(); resolve({ ...r, out }); };
    child.stdout.on('data', (d) => { out += d; if (/Running on/.test(out)) done({ listening: true }); });
    child.stderr.on('data', (d) => { out += d; });
    child.on('exit', (code) => done({ listening: false, code }));
    const t = setTimeout(() => done({ listening: false, timedOut: true }), 20000);
  });
}

test('production refuses to start without JWT_SECRET', async () => {
  const r = await boot({ ENCRYPTION_KEY: GOOD_KEY }, 18101);
  assert.equal(r.listening, false);
  assert.equal(r.code, 1);
  assert.match(r.out, /JWT_SECRET is not set/);
});

test('production refuses to start with the placeholder JWT_SECRET', async () => {
  const r = await boot({ JWT_SECRET: 'dev-secret-change-me', ENCRYPTION_KEY: GOOD_KEY }, 18102);
  assert.equal(r.listening, false);
  assert.match(r.out, /known placeholder/);
});

test('production refuses to start without ENCRYPTION_KEY, and with a malformed one', async () => {
  const missing = await boot({ JWT_SECRET: GOOD_JWT }, 18103);
  assert.equal(missing.listening, false);
  assert.match(missing.out, /ENCRYPTION_KEY is not set/);
  const short = await boot({ JWT_SECRET: GOOD_JWT, ENCRYPTION_KEY: Buffer.alloc(16).toString('base64') }, 18104);
  assert.equal(short.listening, false);
  assert.match(short.out, /must be 32 bytes/);
});

test('production refuses a plain-http API_PUBLIC_URL', async () => {
  const r = await boot({ JWT_SECRET: GOOD_JWT, ENCRYPTION_KEY: GOOD_KEY, API_PUBLIC_URL: 'http://api.example.test' }, 18105);
  assert.equal(r.listening, false);
  assert.match(r.out, /API_PUBLIC_URL must be an https/);
});

test('the refusal never prints a secret value', async () => {
  const r = await boot({ JWT_SECRET: 'dev-secret-change-me', ENCRYPTION_KEY: 'bm90LTMyLWJ5dGVz' }, 18106);
  assert.equal(r.listening, false);
  assert.doesNotMatch(r.out, /dev-secret-change-me/);
  assert.doesNotMatch(r.out, /bm90LTMyLWJ5dGVz/);
});

test('a sound production configuration starts, and /api/status still reports encryption', async () => {
  const port = 18107;
  const env = { JWT_SECRET: GOOD_JWT, ENCRYPTION_KEY: GOOD_KEY };
  const base = { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, NODE_ENV: 'production', PORT: String(port), MONGODB_URI: '' };
  const child = spawn(process.execPath, [SERVER], { cwd: REPO, env: { ...base, ...env } });
  try {
    let status = null;
    for (let i = 0; i < 60 && !status; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try { status = await (await fetch(`http://127.0.0.1:${port}/api/status`)).json(); } catch { /* not up yet */ }
    }
    assert.ok(status, 'the server should be listening');
    assert.equal(status.encryption, 'AES-256-GCM');

    // Body limits per route (server.js): a real report PDF must get through to /api/orb/login, while
    // an ordinary public route refuses anything over 1 MB. (Regression: R4 first set 1 MB everywhere.)
    const post = (path, mb) => fetch(`http://127.0.0.1:${port}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64: 'A'.repeat(mb * 1024 * 1024) }),
    }).then((r) => r.status);
    assert.notEqual(await post('/api/orb/login', 8), 413, 'an 8 MB report PDF must reach /api/orb/login');
    assert.equal(await post('/api/orb/login', 26), 413);
    assert.equal(await post('/api/contact', 2), 413);
  } finally {
    child.kill();
  }
});

// ── the pieces, directly ──

test('productionConfigProblems: warnings for weak-but-working, fatal for broken', () => {
  const { productionConfigProblems } = require('../config/secure');
  const ok = productionConfigProblems({ apiPublicUrl: 'https://api.gardenforlife.nl' }, { JWT_SECRET: GOOD_JWT, ENCRYPTION_KEY: GOOD_KEY });
  assert.deepEqual(ok.fatal, []);
  const short = productionConfigProblems({ apiPublicUrl: 'https://api.gardenforlife.nl' }, { JWT_SECRET: 'shortbutset', ENCRYPTION_KEY: GOOD_KEY });
  assert.deepEqual(short.fatal, []);
  assert.equal(short.warnings.length, 1, 'a short secret warns but does not stop a running site');
});

test('encryption never falls back to plaintext in production', () => {
  const enc = require('../services/encryption');
  const cfg = require('../config');
  const saved = { key: cfg.encryptionKey, env: process.env.NODE_ENV };
  // A fresh module instance, so the key cached by other tests is not reused.
  delete require.cache[require.resolve('../services/encryption')];
  cfg.encryptionKey = '';
  process.env.NODE_ENV = 'production';
  try {
    const fresh = require('../services/encryption');
    assert.throws(() => fresh.encrypt('someone@example.com'), /refusing to handle personal data unencrypted/);
    assert.equal(fresh.isEnabled(), false, 'the status query answers instead of throwing');
  } finally {
    cfg.encryptionKey = saved.key;
    process.env.NODE_ENV = saved.env;
    delete require.cache[require.resolve('../services/encryption')];
    void enc;
  }
});

test('no route builds a URL from the request Host header', () => {
  const routes = path.join(__dirname, '..', 'routes');
  const offenders = [];
  for (const f of fs.readdirSync(routes)) {
    const src = fs.readFileSync(path.join(routes, f), 'utf8');
    if (/req\.get\(\s*['"]host['"]\s*\)|req\.headers\.host|req\.hostname/.test(src)) offenders.push(f);
  }
  assert.deepEqual(offenders, []);
});

test('the API URL used in emails and OAuth redirects comes from configuration', () => {
  const cfg = require('../config');
  assert.match(cfg.apiPublicUrl, /^https?:\/\/[^/]+$/);
});
