/**
 * R2 — abuse-resistant rate limiting.
 *
 * The acceptance criterion this file exists for: rotating a forged CF-Connecting-IP no longer multiplies
 * a visitor's allowance. Plus: the persisted global ceiling survives a restart, and password guessing is
 * limited both per address and per account.
 */
const h = require('./helpers');
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

before(h.start);
after(h.stop);

const SECRET = 'edge-secret-for-tests-0123456789abcdef';
beforeEach(() => { delete process.env.EDGE_SECRET; });

/** A throwaway app with one limited route; returns a function that hits it as a given client. */
async function limitedRoute(opts) {
  const { rateLimit } = require('../middleware/rateLimit');
  const app = express();
  app.post('/x', rateLimit(opts), (_req, res) => res.json({ ok: true }));
  const srv = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const url = `http://127.0.0.1:${srv.address().port}/x`;
  const hit = (headers) => fetch(url, { method: 'POST', headers }).then((r) => r.status);
  return { hit, close: () => new Promise((r) => srv.close(r)) };
}

const spoof = (i, extra = {}) => ({ 'cf-connecting-ip': `203.0.113.${i}`, ...extra });

test('with EDGE_SECRET set, rotating a forged CF-Connecting-IP does not multiply the allowance', async () => {
  process.env.EDGE_SECRET = SECRET;
  const r = await limitedRoute({ name: 't-spoof', max: 3, windowMs: 60_000 });
  // No edge header: every request is "untrusted", however the address header varies.
  const statuses = [];
  for (let i = 0; i < 10; i++) statuses.push(await r.hit(spoof(i)));
  await r.close();
  assert.deepEqual(statuses.filter((s) => s === 200).length, 3, `expected 3 allowed, got ${statuses}`);
  assert.ok(statuses.slice(3).every((s) => s === 429));
});

test('a wrong edge secret is treated exactly like no secret', async () => {
  process.env.EDGE_SECRET = SECRET;
  const r = await limitedRoute({ name: 't-wrong', max: 2, windowMs: 60_000 });
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push(await r.hit(spoof(i, { 'x-gfl-edge': 'not-the-secret' })));
  await r.close();
  assert.equal(statuses.filter((s) => s === 200).length, 2);
});

test('requests vouched for by the edge are limited per real client', async () => {
  process.env.EDGE_SECRET = SECRET;
  const r = await limitedRoute({ name: 't-vouched', max: 2, windowMs: 60_000 });
  const edge = { 'x-gfl-edge': SECRET };
  // Two distinct genuine clients each get their own allowance...
  const a = [await r.hit(spoof(1, edge)), await r.hit(spoof(1, edge)), await r.hit(spoof(1, edge))];
  const b = [await r.hit(spoof(2, edge)), await r.hit(spoof(2, edge))];
  await r.close();
  assert.deepEqual(a, [200, 200, 429]);
  assert.deepEqual(b, [200, 200]);
});

test('without EDGE_SECRET the legacy header behaviour is kept (so deploying first cannot lock visitors together)', async () => {
  const r = await limitedRoute({ name: 't-legacy', max: 1, windowMs: 60_000 });
  const statuses = [await r.hit(spoof(1)), await r.hit(spoof(2)), await r.hit(spoof(1))];
  await r.close();
  assert.deepEqual(statuses, [200, 200, 429]);
});

test('a global ceiling caps all visitors combined', async () => {
  process.env.EDGE_SECRET = SECRET;
  const r = await limitedRoute({ name: 't-global', max: 5, windowMs: 60_000, global: { max: 4 } });
  const edge = { 'x-gfl-edge': SECRET };
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push(await r.hit(spoof(i, edge))); // 6 distinct genuine clients
  await r.close();
  assert.deepEqual(statuses, [200, 200, 200, 200, 429, 429]);
});

test('a persistent global ceiling survives a restart (a fresh counter continues the count)', async () => {
  const { createPersistentCounter } = require('../middleware/rateLimit');
  const opts = { name: 't-persist', max: 3, windowMs: 60 * 60 * 1000 };
  const first = createPersistentCounter(opts);
  assert.equal(await first.hit(), true);
  assert.equal(await first.hit(), true);
  const afterRestart = createPersistentCounter(opts); // same name, new process state
  assert.equal(await afterRestart.hit(), true);
  assert.equal(await afterRestart.hit(), false, 'the 4th hit in the window must be refused across the restart');
});

test('persisted counters hold no visitor data and expire with their window', async () => {
  const docs = await require('../db').getDB().collection('rateLimits').find({}).toArray();
  assert.ok(docs.length > 0);
  for (const d of docs) {
    assert.deepEqual(Object.keys(d).sort(), ['_id', 'count', 'expiresAt']);
    assert.match(d._id, /^[\w-]+:all:\d+$/, `unexpected key ${d._id}`);
    assert.ok(d.expiresAt instanceof Date);
  }
});

test('concurrent first hits on a persistent counter are all counted (upsert race)', async () => {
  const { createPersistentCounter } = require('../middleware/rateLimit');
  const c = createPersistentCounter({ name: 't-race', max: 10, windowMs: 60 * 60 * 1000 });
  const results = await Promise.all(Array.from({ length: 15 }, () => c.hit()));
  assert.equal(results.filter(Boolean).length, 10);
});

// ── Login: per address AND per account ──

async function loginApp() {
  const bcrypt = require('bcryptjs');
  const { hash, encrypt } = require('../services/encryption');
  const email = `guess-target-${Date.now()}@example.com`;
  await require('../db').collections.users().insertOne({
    email: encrypt(email), emailHash: hash(email), displayName: encrypt('Target'),
    passwordHash: await bcrypt.hash('the-real-password-123', 4), role: 'client', emailVerified: true,
  });
  const base = await h.serve([['/api/auth', require('../routes/auth')]]);
  return { email, url: `${base}/api/auth/login` };
}

test('one account cannot be guessed from many addresses: 10 failures lock it, even for the right password', async () => {
  process.env.EDGE_SECRET = SECRET;
  const { email, url } = await loginApp();
  for (let i = 0; i < 10; i++) {
    const r = await h.post(url, { email, password: `wrong-${i}` }, spoof(100 + i, { 'x-gfl-edge': SECRET }));
    assert.equal(r.status, 401);
  }
  const right = await h.post(url, { email, password: 'the-real-password-123' }, spoof(250, { 'x-gfl-edge': SECRET }));
  assert.equal(right.status, 429, 'the account must stay locked for the window, whichever address tries');
});

test('the lock answers the same for an address with no account (no enumeration through it)', async () => {
  process.env.EDGE_SECRET = SECRET;
  const base = `${new URL((await loginApp()).url).origin}/api/auth/login`;
  const ghost = `nobody-${Date.now()}@example.com`;
  for (let i = 0; i < 10; i++) {
    await h.post(base, { email: ghost, password: `x${i}` }, spoof(40 + i, { 'x-gfl-edge': SECRET }));
  }
  const r = await h.post(base, { email: ghost, password: 'anything' }, spoof(99, { 'x-gfl-edge': SECRET }));
  assert.equal(r.status, 429);
});
