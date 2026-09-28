/**
 * Registration must not tell anyone which email addresses have an account.
 *
 * It used to: POST /register answered 409 "Email already registered" for a taken address, and even with
 * that hidden, registering and then logging in with the same password gave it away — a new, unconfirmed
 * account answered 403 "confirm your email first", someone else's account 401. These tests run with email
 * verification ON (as in production) and outgoing mail captured in-process; nothing is sent.
 */
const h = require('./helpers');
// Email verification on, as in production. The transport is replaced below; no SMTP is ever contacted.
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASS = 'test-pass';
const mail = [];
require('nodemailer').createTransport = () => ({ sendMail: async (m) => { mail.push(m); return { messageId: 'test' }; } });

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

let base;
before(async () => {
  await h.start();
  base = await h.serve([['/api/auth', require('../routes/auth')]]);
});
after(h.stop);

const STRONG = 'kerkklok-vlieger-47-regenboog';
let seq = 0;
const nextEmail = () => `reg${Date.now()}-${++seq}@example.com`;
let addr = 0;
async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `192.0.2.${(++addr % 250) + 1}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch { /* not JSON */ }
  return { status: res.status, body: json };
}
const register = (email, password = STRONG) =>
  call('POST', '/api/auth/register', { email, password, displayName: `n${Date.now()}${++seq}` });
const mailTo = (email) => mail.filter((m) => m.to === email);
const settle = () => new Promise((r) => setTimeout(r, 50)); // mail goes out in the background

async function confirm(email) {
  await settle();
  const link = mailTo(email).map((m) => m.html.match(/verify\?token=([0-9a-f]+)/)).find(Boolean);
  assert.ok(link, `no confirmation mail for ${email}`);
  const res = await fetch(`${base}/api/auth/verify?token=${link[1]}`);
  assert.equal(res.status, 200);
}

/** Everything a caller can compare between two answers: status, keys, and every value but the ids. */
const shape = (r) => ({ status: r.status, keys: Object.keys(r.body || {}).sort(), needsVerification: r.body?.needsVerification });

test('a taken address gets the same answer as a free one', async () => {
  const taken = nextEmail();
  assert.equal((await register(taken)).status, 201);
  await confirm(taken);

  const again = await register(taken, 'een-heel-ander-wachtwoord-99');
  const fresh = await register(nextEmail());
  assert.deepEqual(shape(again), shape(fresh));
  assert.equal(again.status, 201);
  assert.equal(again.body.email, taken);
  assert.match(again.body.pollId, /^[A-Za-z0-9_-]{32}$/);
});

test('the owner of a taken address is told, and nothing about the account changes', async () => {
  const email = nextEmail();
  await register(email);
  await confirm(email);
  const { collections } = require('../db');
  const { hash } = require('../services/encryption');
  const beforeDoc = await collections.users().findOne({ emailHash: hash(email) });
  const mailsBefore = mailTo(email).length;

  await register(email, 'een-heel-ander-wachtwoord-99');
  await settle();
  const told = mailTo(email).slice(mailsBefore);
  assert.equal(told.length, 1);
  assert.match(told[0].subject, /al een account/);
  assert.doesNotMatch(told[0].html, /verify\?token=/, 'no confirmation link for an existing account');

  const afterDoc = await collections.users().findOne({ emailHash: hash(email) });
  assert.equal(afterDoc.passwordHash, beforeDoc.passwordHash, 'the password must not change');
  assert.equal(afterDoc.verifyPollHash, beforeDoc.verifyPollHash, 'the new pollId must not attach to the account');
  assert.equal(await collections.users().countDocuments({ emailHash: hash(email) }), 1);

  // …and the original password still logs in.
  assert.equal((await call('POST', '/api/auth/login', { email, password: STRONG })).status, 200);
});

test('registering then logging in tells a new account apart from a taken one no more', async () => {
  const taken = nextEmail();
  await register(taken);
  await confirm(taken);
  const attackerPw = 'een-heel-ander-wachtwoord-99';

  await register(taken, attackerPw);
  const onTaken = await call('POST', '/api/auth/login', { email: taken, password: attackerPw });
  const fresh = nextEmail();
  await register(fresh, attackerPw);
  const onFresh = await call('POST', '/api/auth/login', { email: fresh, password: attackerPw });

  assert.equal(onTaken.status, 401);
  assert.deepEqual(onFresh, onTaken, 'an unconfirmed new account must answer exactly like a wrong password');
  const unknown = await call('POST', '/api/auth/login', { email: nextEmail(), password: attackerPw });
  assert.deepEqual(unknown, onTaken);
});

test('the pollId: false until confirmed, then true; a taken address\'s id never turns true', async () => {
  const email = nextEmail();
  const { pollId } = (await register(email)).body;
  assert.deepEqual((await call('GET', `/api/auth/verify-status?id=${pollId}`)).body, { verified: false });
  await confirm(email);
  assert.deepEqual((await call('GET', `/api/auth/verify-status?id=${pollId}`)).body, { verified: true });
  assert.equal((await call('POST', '/api/auth/login', { email, password: STRONG })).status, 200);

  const second = (await register(email)).body.pollId;
  assert.deepEqual((await call('GET', `/api/auth/verify-status?id=${second}`)).body, { verified: false });
  assert.deepEqual((await call('GET', '/api/auth/verify-status?id=nonsense')).body, { verified: false });
});

test('the status poll can run for the whole wait: well past the old two-minute cut-off', async () => {
  const { pollId } = (await register(nextEmail())).body;
  // One visitor, polling every 3.5 s for ten minutes = ~170 requests.
  let limited = 0;
  for (let i = 0; i < 170; i++) {
    const res = await fetch(`${base}/api/auth/verify-status?id=${pollId}`, { headers: { 'cf-connecting-ip': '192.0.2.250' } });
    if (res.status === 429) limited++;
  }
  assert.equal(limited, 0);
});

test('an unconfirmed address registered again gets a fresh confirmation link, not a new password', async () => {
  const email = nextEmail();
  await register(email);
  await settle();
  const { collections } = require('../db');
  const { hash } = require('../services/encryption');
  const first = await collections.users().findOne({ emailHash: hash(email) });

  await register(email, 'een-heel-ander-wachtwoord-99');
  await settle();
  const second = await collections.users().findOne({ emailHash: hash(email) });
  assert.equal(second.passwordHash, first.passwordHash);
  assert.notEqual(second.verifyToken, first.verifyToken, 'a fresh link');
  const links = mailTo(email).filter((m) => /verify\?token=/.test(m.html));
  assert.equal(links.length, 2);
  assert.ok(links[1].html.includes(second.verifyToken));
});

test('the "already have an account" mail goes out at most once an hour per address', async () => {
  const email = nextEmail();
  await register(email);
  await confirm(email);
  const before = mailTo(email).length;
  for (let i = 0; i < 4; i++) await register(email, `ander-wachtwoord-${i}-regenboog-47`);
  await settle();
  assert.equal(mailTo(email).length - before, 1);
});
