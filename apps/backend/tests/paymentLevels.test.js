/**
 * Price per level (owner, 22 Oct 2026): the report's seal carries its level, and the payment config
 * picks the Beginner pair of Stripe Prices for it and the full pair (Leerling, Gevorderd) otherwise.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const config = require('../config');
const { sealCode, openSeal, unsealCode } = require('../services/sealedCode');
const { resolvePaymentConfig, tierFor, clearPaymentConfigCache } = require('../services/paymentConfig');

test('the seal carries the level; unsealCode still returns the bare code', () => {
  const s = sealCode('LC_ORB3_abc', Date.now(), { level: 'beginner' });
  assert.deepEqual(openSeal(s), { code: 'LC_ORB3_abc', level: 'beginner' });
  assert.equal(unsealCode(s), 'LC_ORB3_abc');
  assert.equal(openSeal(sealCode('LC_ORB3_abc')).level, 'advanced');
  assert.throws(() => sealCode('LC_ORB3_abc', Date.now(), { level: 'expert' }));
});

test('a seal from before the level (no l field) counts as advanced', () => {
  const key = crypto.createHash('sha256').update(`gfl-crystal-seal:${config.jwtSecret}`).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify({ c: 'LC_ORB3_old', e: Date.now() + 60000 }), 'utf8'), cipher.final()]);
  const old = `s1.${Buffer.concat([iv, cipher.getAuthTag(), body]).toString('base64url')}`;
  assert.deepEqual(openSeal(old), { code: 'LC_ORB3_old', level: 'advanced' });
});

test('tiers: Beginner its own, Gevorderd and Leerling the full price', () => {
  assert.equal(tierFor('beginner'), 'beginner');
  assert.equal(tierFor('intermediate'), 'full');
  assert.equal(tierFor('advanced'), 'full');
  assert.equal(tierFor(undefined), 'full');
});

test('the fallback amounts per level and period (payments not configured)', async () => {
  const saved = config.stripe;
  config.stripe = { ...saved, publishableKey: '' }; // → not enabled: no Stripe call, fallback amounts
  clearPaymentConfigCache();
  try {
    const launch = new Date('2026-10-22T12:00:00Z');
    const normal = new Date('2027-04-01T12:00:00Z');
    const cents = async (now, level) => (await resolvePaymentConfig(now, { level })).grossCents;
    assert.equal(await cents(launch, 'beginner'), 581);
    assert.equal(await cents(launch, 'intermediate'), 1452);
    assert.equal(await cents(launch, 'advanced'), 1452);
    assert.equal(await cents(normal, 'beginner'), 1452);
    assert.equal(await cents(normal, 'advanced'), 3630);
    assert.equal((await resolvePaymentConfig(launch, { level: 'beginner' })).priceTier, 'beginner');
  } finally {
    config.stripe = saved;
    clearPaymentConfigCache();
  }
});
