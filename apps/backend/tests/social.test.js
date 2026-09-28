/**
 * Social-handle verification (routes/social.js) — the OAuth `state`.
 *
 * The state travels through the browser, the provider and back, in URLs that end up in history and logs.
 * It used to be a signed but readable JWT that carried the PKCE code verifier right alongside the code,
 * which is what PKCE exists to keep apart, and it could be replayed for ten minutes. These tests pin the
 * replacement: an opaque random state, the verifier kept server-side, each state good for exactly one
 * callback. X's endpoints are faked in-process; nothing leaves the machine.
 */
const h = require('./helpers');
process.env.SOCIAL_X_CLIENT_ID = 'test-client';
process.env.SOCIAL_X_CLIENT_SECRET = 'test-secret';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

// The provider, faked: the token exchange records what it was sent; the profile answers one handle.
const realFetch = global.fetch;
const exchanges = [];
global.fetch = async (url, init) => {
  const u = String(url);
  if (u === 'https://api.x.com/2/oauth2/token') {
    exchanges.push(Object.fromEntries(new URLSearchParams(String(init.body))));
    return new Response(JSON.stringify({ access_token: 'at-test' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (u === 'https://api.x.com/2/users/me') {
    return new Response(JSON.stringify({ data: { username: 'gfl_tester' } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return realFetch(url, init);
};

let base;
before(async () => {
  await h.start();
  base = await h.serve([
    ['/api/auth', require('../routes/auth')],
    ['/api/social', require('../routes/social')],
  ]);
});
after(async () => { global.fetch = realFetch; await h.stop(); });

let seq = 0;
async function account() {
  const email = `social${Date.now()}-${++seq}@example.com`;
  const r = await h.post(`${base}/api/auth/register`, { email, password: 'kerkklok-vlieger-47-regenboog', displayName: `s${Date.now()}${seq}` },
    { 'cf-connecting-ip': `203.0.113.${(seq % 250) + 1}` });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  return { token: r.body.token, id: String(r.body.user.id) };
}

async function startFlow(token) {
  const r = await h.post(`${base}/api/social/start`, { platform: 'x' }, { Authorization: `Bearer ${token}` });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return new URL(r.body.url);
}

const callback = (state, code = 'code-from-x') =>
  realFetch(`${base}/api/social/callback/x?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);

test('the state is opaque: no token, no verifier, nothing about the user in the URL', async () => {
  const { token, id } = await account();
  const url = await startFlow(token);
  const state = url.searchParams.get('state');
  assert.match(state, /^[A-Za-z0-9_-]{43}$/, 'a random base64url value, not a JWT');
  assert.equal(state.includes('.'), false);
  assert.equal(url.searchParams.get('code_verifier'), null);
  assert.equal(url.toString().includes(id), false, 'the user id must not travel');

  // The verifier lives server-side, and the challenge that did travel is its S256.
  const row = await require('../db').collections.oauthStates().findOne({ state });
  assert.ok(row && row.codeVerifier);
  assert.equal(url.searchParams.get('code_challenge'), crypto.createHash('sha256').update(row.codeVerifier).digest('base64url'));
  assert.equal(url.toString().includes(row.codeVerifier), false);
});

test('the callback completes with the stored verifier and stamps the handle', async () => {
  const { token, id } = await account();
  const state = (await startFlow(token)).searchParams.get('state');
  const row = await require('../db').collections.oauthStates().findOne({ state });

  const res = await callback(state);
  assert.equal(res.status, 200, await res.text());
  const sent = exchanges[exchanges.length - 1];
  assert.equal(sent.code_verifier, row.codeVerifier, 'the token exchange must carry the server-held verifier');
  assert.equal(sent.code, 'code-from-x');

  const { ObjectId } = require('mongodb');
  const user = await require('../db').collections.users().findOne({ _id: new ObjectId(id) });
  assert.equal(user.socials.x.handle, 'gfl_tester');
  assert.equal(user.socials.x.verified, true);
});

test('a state works once: a replayed callback is refused', async () => {
  const { token } = await account();
  const state = (await startFlow(token)).searchParams.get('state');
  assert.equal((await callback(state)).status, 200);
  const before = exchanges.length;
  assert.equal((await callback(state)).status, 400);
  assert.equal(exchanges.length, before, 'a replay must not reach the provider');
});

test('an unknown, expired or other-platform state is refused before the provider is asked', async () => {
  const { token } = await account();
  const before = exchanges.length;
  assert.equal((await callback('x'.repeat(43))).status, 400);

  const states = require('../db').collections.oauthStates();
  const expired = (await startFlow(token)).searchParams.get('state');
  await states.updateOne({ state: expired }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await callback(expired)).status, 400);

  const other = (await startFlow(token)).searchParams.get('state');
  await states.updateOne({ state: other }, { $set: { platform: 'youtube' } });
  assert.equal((await callback(other)).status, 400);
  assert.equal(exchanges.length, before);
});

test('an old JWT-style state (the previous format) is refused', async () => {
  const jwt = require('jsonwebtoken');
  const { id } = await account();
  const legacy = jwt.sign({ uid: id, platform: 'x', cv: 'v', purpose: 'social-verify' }, require('../config').jwtSecret, { expiresIn: '10m' });
  assert.equal((await callback(legacy)).status, 400);
});
