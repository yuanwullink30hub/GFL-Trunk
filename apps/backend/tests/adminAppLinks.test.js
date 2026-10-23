/**
 * Install links for the management phone app (services/adminAppLinks.js): the token format, and that a grant the
 * server signs verifies with the public key the Pages function carries (functions/_middleware.js) — the way the
 * edge checks it, with WebCrypto.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIDDLEWARE = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'functions', '_middleware.js'), 'utf8');
const GATE_JWK = JSON.parse(MIDDLEWARE.match(/const GATE_JWK = ({[^}]+});/)[1]
  .replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));

const links = require('../services/adminAppLinks');

test('tokens are 30 URL-safe characters and differ every time', () => {
  const seen = new Set();
  for (let i = 0; i < 200; i++) {
    const tkn = links.generateToken();
    assert.match(tkn, links.TOKEN_RE);
    seen.add(tkn);
  }
  assert.equal(seen.size, 200);
});

test('a signed grant verifies with the edge public key; a tampered one does not', { skip: !process.env.ADMIN_APP_GATE_KEY && 'ADMIN_APP_GATE_KEY not set' }, async () => {
  const grant = links.signGrant('device123');
  assert.match(grant, /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  const key = await crypto.webcrypto.subtle.importKey('jwk', GATE_JWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  const verify = (g) => {
    const [, payload, sig] = g.split('.');
    return crypto.webcrypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key,
      Buffer.from(sig, 'base64url'), new TextEncoder().encode(`v1.${payload}`));
  };
  assert.equal(await verify(grant), true);
  const [, payload, sig] = grant.split('.');
  const forged = Buffer.from(JSON.stringify({ d: 'someone-else', iat: 1 })).toString('base64url');
  assert.equal(await verify(`v1.${forged}.${sig}`), false);
  assert.equal(JSON.parse(Buffer.from(payload, 'base64url')).d, 'device123');
});

test('the grant cookie is scoped to /beheer, HttpOnly and long-lived', () => {
  const c = links.grantCookie('v1.a.b');
  assert.match(c, /^gfl_beheer=v1\.a\.b; Path=\/beheer; Max-Age=\d+; HttpOnly; SameSite=Lax; Secure; Domain=gardenforlife\.nl$/);
});

test('redeem refuses anything that is not a token, without touching the database', async () => {
  assert.equal(await links.redeem('short'), null);
  assert.equal(await links.redeem('x'.repeat(29) + '&'), null);
  assert.equal(await links.redeem(undefined), null);
});
