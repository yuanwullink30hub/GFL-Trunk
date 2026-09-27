/**
 * R5 — sessions and accounts.
 *
 * Each test pins one way a session could outlive its legitimacy: a forged or stale role, a password or
 * email change, "log out everywhere", a deleted account, a token of another kind signed with the same
 * secret. Plus the account model: no one becomes admin by registering, and passwords meet the policy.
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

let base;
before(async () => {
  await h.start();
  base = await h.serve([
    ['/api/auth', require('../routes/auth')],
    ['/api/admin', require('../routes/admin')],
    ['/api/files', require('../routes/files')],
  ]);
});
after(h.stop);

const SECRET = () => require('../config').jwtSecret;
const STRONG = 'kerkklok-vlieger-47-regenboog';
let seq = 0;
const nextEmail = () => `user${Date.now()}-${++seq}@example.com`;

// Each request comes from its own address, so the per-visitor limits from R2 (register: 10 an hour) do not
// interfere; these tests are about sessions, not rate limits (tests/rateLimit.test.js covers those).
let addr = 0;
async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': `198.51.100.${(++addr % 250) + 1}`,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { /* HTML 404 from express */ }
  return { status: res.status, body: json, text };
}

async function register(extra = {}) {
  const email = nextEmail();
  const r = await call('POST', '/api/auth/register', { body: { email, password: STRONG, displayName: `n${Date.now()}${++seq}`, ...extra } });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { email, token: r.body.token, id: String(r.body.user.id) };
}

const users = () => require('../db').collections.users();
const { ObjectId } = require('mongodb');
const setRole = async (id, role) => {
  await users().updateOne({ _id: new ObjectId(id) }, { $set: { role } });
  require('../middleware/auth').forgetAccount(id);
};

// ── the role comes from the database ──

test('a token that CLAIMS role:admin grants nothing when the account is not an admin', async () => {
  const { id, email } = await register();
  const forged = jwt.sign({ sub: id, email, role: 'admin', iatMs: Date.now() }, SECRET(), { expiresIn: '1h' });
  const r = await call('GET', '/api/admin/users', { token: forged });
  assert.equal(r.status, 404, 'the admin API must stay invisible to a non-admin, whatever the token says');
});

test('demoting an admin takes effect on their very next request', async () => {
  const { id, token } = await register();
  await setRole(id, 'admin');
  assert.equal((await call('GET', '/api/admin/users', { token })).status, 200);
  await setRole(id, 'client');
  assert.equal((await call('GET', '/api/admin/users', { token })).status, 404);
});

test('the installer link is only for admins (an awaited check — a Promise is always truthy)', async () => {
  const client = await register();
  const r = await call('POST', '/api/files/link', { token: client.token });
  assert.equal(r.status, 404);
  assert.equal(r.body, null, 'a non-admin must fall through to the plain 404, never reach the handler');
  const admin = await register();
  await setRole(admin.id, 'admin');
  const a = await call('POST', '/api/files/link', { token: admin.token });
  assert.deepEqual(a.body, { error: 'no_release' }, 'an admin reaches the handler (no installer in the test DB)');
});

// ── revocation ──

test('changing the password ends every other session; this device gets a fresh token', async () => {
  const { email, token: first } = await register();
  const login = await call('POST', '/api/auth/login', { body: { email, password: STRONG } });
  const second = login.body.token;
  const r = await call('PATCH', '/api/auth/password', { token: first, body: { currentPassword: STRONG, newPassword: 'nieuw-wachtwoord-zeilboot-93' } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(r.body.token, 'the changing device gets a new token');
  assert.equal((await call('GET', '/api/auth/me', { token: first })).status, 401);
  assert.equal((await call('GET', '/api/auth/me', { token: second })).status, 401);
  assert.equal((await call('GET', '/api/auth/me', { token: r.body.token })).status, 200);
});

test('"log out everywhere" ends every session, including the one that asked', async () => {
  const { email, token: a } = await register();
  const b = (await call('POST', '/api/auth/login', { body: { email, password: STRONG } })).body.token;
  assert.equal((await call('POST', '/api/auth/logout-all', { token: a })).status, 200);
  assert.equal((await call('GET', '/api/auth/me', { token: a })).status, 401);
  assert.equal((await call('GET', '/api/auth/me', { token: b })).status, 401);
  // A fresh login afterwards works.
  const c = (await call('POST', '/api/auth/login', { body: { email, password: STRONG } })).body.token;
  assert.equal((await call('GET', '/api/auth/me', { token: c })).status, 200);
});

test('a token minted the same second as a revocation, just before it, is still refused (iatMs, not iat)', async () => {
  const { id, email } = await register();
  const justBefore = jwt.sign({ sub: id, email, role: 'client', iatMs: Date.now() }, SECRET(), { expiresIn: '1h' });
  await new Promise((r) => setTimeout(r, 5));
  await users().updateOne({ _id: new ObjectId(id) }, { $set: { tokensValidAfter: new Date() } });
  require('../middleware/auth').forgetAccount(id);
  assert.equal((await call('GET', '/api/auth/me', { token: justBefore })).status, 401);
});

test('tokens from before this change (no iatMs) keep working until a revocation, then stop', async () => {
  const { id, email } = await register();
  const legacy = jwt.sign({ sub: id, email, role: 'client' }, SECRET(), { expiresIn: '1h' }); // iat only
  assert.equal((await call('GET', '/api/auth/me', { token: legacy })).status, 200);
  await new Promise((r) => setTimeout(r, 1100)); // iat is whole seconds; step past it
  await call('POST', '/api/auth/logout-all', { token: legacy });
  assert.equal((await call('GET', '/api/auth/me', { token: legacy })).status, 401);
});

test('a deleted account\'s token stops working', async () => {
  const { id, token } = await register();
  await users().deleteOne({ _id: new ObjectId(id) });
  require('../middleware/auth').forgetAccount(id);
  assert.equal((await call('GET', '/api/auth/me', { token })).status, 401);
});

test('a token of another kind signed with the same secret is not a session', async () => {
  const { id } = await register();
  const state = jwt.sign({ uid: id, platform: 'x', cv: 'v', purpose: 'social-verify' }, SECRET(), { expiresIn: '10m' });
  assert.equal((await call('GET', '/api/auth/me', { token: state })).status, 401);
  const withSub = jwt.sign({ sub: id, purpose: 'social-verify' }, SECRET(), { expiresIn: '10m' });
  assert.equal((await call('GET', '/api/auth/me', { token: withSub })).status, 401);
});

// ── the account model ──

test('registration never grants admin — not even the first account in an empty database', async () => {
  await users().deleteMany({});
  const first = await register();
  const doc = await users().findOne({ _id: new ObjectId(first.id) });
  assert.equal(doc.role, 'client');
});

test('password policy: too short, too weak, over bcrypt\'s 72 bytes, built on the email — all refused', async () => {
  const email = nextEmail();
  const tryPw = (password) => call('POST', '/api/auth/register', { body: { email, password, displayName: `p${++seq}${Date.now()}` } });
  assert.equal((await tryPw('Kort1!')).body.code, 'too_short');
  assert.equal((await tryPw('password123')).body.code, 'too_weak');
  assert.equal((await tryPw('wachtwoord1')).body.code, 'too_weak');
  assert.equal((await tryPw('é'.repeat(40))).body.code, 'too_long', '40 × 2-byte characters = 80 bytes');
  const local = email.split('@')[0];
  assert.equal((await tryPw(`${local}!`)).body.code, 'too_weak', 'a password built on the email local part');
  assert.equal((await tryPw(STRONG)).status, 201);
});

test('new hashes use bcrypt cost 12, and a login upgrades an older cheaper hash', async () => {
  const { id, email } = await register();
  const doc = await users().findOne({ _id: new ObjectId(id) });
  assert.match(doc.passwordHash, /^\$2[aby]\$12\$/);
  // An account from before: cost 10.
  await users().updateOne({ _id: doc._id }, { $set: { passwordHash: await bcrypt.hash(STRONG, 10) } });
  assert.equal((await call('POST', '/api/auth/login', { body: { email, password: STRONG } })).status, 200);
  await new Promise((r) => setTimeout(r, 1500)); // the upgrade is written after the response
  const after = await users().findOne({ _id: doc._id });
  assert.match(after.passwordHash, /^\$2[aby]\$12\$/);
  assert.ok(await bcrypt.compare(STRONG, after.passwordHash));
});

test('an unknown address takes as long to refuse as a known one (no timing oracle)', async () => {
  const { email } = await register();
  const time = async (e) => { const t = Date.now(); await call('POST', '/api/auth/login', { body: { email: e, password: 'wrong-but-long-enough' } }); return Date.now() - t; };
  const known = [], unknown = [];
  for (let i = 0; i < 3; i++) { known.push(await time(email)); unknown.push(await time(nextEmail())); }
  const med = (a) => a.sort((x, y) => x - y)[1];
  assert.ok(med(unknown) > med(known) * 0.5, `unknown ${med(unknown)} ms vs known ${med(known)} ms`);
});
