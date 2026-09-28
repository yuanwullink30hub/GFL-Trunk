/**
 * "Forgot password": POST /password/forgot mails a one-hour, single-use link; POST /password/reset sets the
 * new password from it. The request must answer the same for every address (like /register), and the
 * link must not outlive its first use or its hour. Email verification on, mail captured in-process.
 */
const h = require('./helpers');
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
const NEW_PW = 'zonnewijzer-haven-83-lantaarn';
let seq = 0;
const nextEmail = () => `reset${Date.now()}-${++seq}@example.com`;
let addr = 0;
async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `198.18.0.${(++addr % 250) + 1}` },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = null;
  try { json = await res.json(); } catch { /* not JSON */ }
  return { status: res.status, body: json };
}
const settle = () => new Promise((r) => setTimeout(r, 50));
const mailTo = (email) => mail.filter((m) => m.to === email);
const resetTokenIn = (m) => (m.html.match(/\?pwreset=([0-9a-f]{64})/) || [])[1];

/** A confirmed account, ready to log in. */
async function account() {
  const email = nextEmail();
  await call('POST', '/api/auth/register', { email, password: STRONG, displayName: `r${Date.now()}${++seq}` });
  await settle();
  const link = mailTo(email).map((m) => m.html.match(/verify\?token=([0-9a-f]+)/)).find(Boolean);
  await fetch(`${base}/api/auth/verify?token=${link[1]}`);
  return email;
}
async function requestLink(email) {
  const before = mailTo(email).length;
  const r = await call('POST', '/api/auth/password/forgot', { email });
  await settle();
  return { r, token: mailTo(email).slice(before).map(resetTokenIn).find(Boolean) };
}

test('the request answers the same for any address; only a real account gets a mail', async () => {
  const email = await account();
  const known = await requestLink(email);
  const nobody = nextEmail();
  const unknown = await requestLink(nobody);
  assert.deepEqual(known.r, unknown.r);
  assert.deepEqual(known.r, { status: 200, body: { ok: true } });
  assert.ok(known.token, 'the account holder gets a link');
  assert.equal(mailTo(nobody).length, 0);
});

test('the link sets a new password: the old one stops working, the new one logs in, old sessions end', async () => {
  const email = await account();
  const session = (await call('POST', '/api/auth/login', { email, password: STRONG })).body.token;
  const { token } = await requestLink(email);

  assert.deepEqual(await call('POST', '/api/auth/password/reset', { token, password: NEW_PW }), { status: 200, body: { ok: true } });
  assert.equal((await call('POST', '/api/auth/login', { email, password: STRONG })).status, 401);
  assert.equal((await call('POST', '/api/auth/login', { email, password: NEW_PW })).status, 200);
  const me = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${session}` } });
  assert.equal(me.status, 401, 'a session from before the reset must end');
});

test('a link works once', async () => {
  const email = await account();
  const { token } = await requestLink(email);
  assert.equal((await call('POST', '/api/auth/password/reset', { token, password: NEW_PW })).status, 200);
  const again = await call('POST', '/api/auth/password/reset', { token, password: 'nog-een-ander-wachtwoord-12' });
  assert.equal(again.status, 400);
  assert.equal(again.body.code, 'bad_link');
});

test('an expired link is refused, and a weak new password is refused without spending the link', async () => {
  const email = await account();
  const { token } = await requestLink(email);
  const weak = await call('POST', '/api/auth/password/reset', { token, password: 'wachtwoord' });
  assert.equal(weak.status, 400);
  assert.notEqual(weak.body.code, 'bad_link');

  const { collections } = require('../db');
  const { hash } = require('../services/encryption');
  await collections.users().updateOne({ emailHash: hash(email) }, { $set: { pwResetExpires: new Date(Date.now() - 1000) } });
  const late = await call('POST', '/api/auth/password/reset', { token, password: NEW_PW });
  assert.equal(late.status, 400);
  assert.equal(late.body.code, 'bad_link');
  assert.equal((await call('POST', '/api/auth/login', { email, password: STRONG })).status, 200, 'the old password still holds');
});

test('only the token\'s hash is stored', async () => {
  const email = await account();
  const { token } = await requestLink(email);
  const { collections } = require('../db');
  const { hash } = require('../services/encryption');
  const doc = await collections.users().findOne({ emailHash: hash(email) });
  assert.ok(doc.pwResetHash);
  assert.equal(JSON.stringify(doc).includes(token), false);
});

test('a reset confirms an unconfirmed account (the link proves the inbox)', async () => {
  const email = nextEmail();
  await call('POST', '/api/auth/register', { email, password: STRONG, displayName: `u${Date.now()}${++seq}` });
  const { token } = await requestLink(email);
  assert.equal((await call('POST', '/api/auth/password/reset', { token, password: NEW_PW })).status, 200);
  assert.equal((await call('POST', '/api/auth/login', { email, password: NEW_PW })).status, 200);
});

test('at most one reset mail per address per few minutes', async () => {
  const email = await account();
  const before = mailTo(email).length;
  for (let i = 0; i < 3; i++) await call('POST', '/api/auth/password/forgot', { email });
  await settle();
  assert.equal(mailTo(email).length - before, 1);
});
