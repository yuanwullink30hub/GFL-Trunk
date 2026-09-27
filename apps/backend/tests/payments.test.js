/**
 * R3 — payment single-flight: at most one live payment, and one charge, per report.
 *
 * Stripe is replaced by a fake that records every PaymentIntent it is asked to create. It never touches
 * the network — no test key, no live key. Its tax call takes 60 ms, which reproduces the real shape of
 * the race: payFullReport checks for a payment in flight (step 5), then makes Stripe calls before it
 * inserts (step 8), so concurrent requests all clear the check while the first is still at Stripe.
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const created = []; // every PaymentIntent the fake Stripe was asked to create
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fakeStripe = {
  confirmationTokens: {
    retrieve: async () => ({ payment_method_preview: { type: 'ideal', billing_details: { address: { country: 'NL' } } } }),
  },
  tax: {
    calculations: {
      create: async () => {
        await sleep(60);
        return { id: `taxcalc_${created.length}`, amount_total: 1452, tax_amount_inclusive: 252, tax_amount_exclusive: 0, tax_breakdown: [] };
      },
    },
  },
  paymentIntents: {
    create: async (params) => {
      const pi = { id: `pi_${created.length + 1}`, status: 'requires_action', livemode: false, next_action: null, metadata: params.metadata };
      created.push(pi);
      return pi;
    },
    retrieve: async (id) => created.find((p) => p.id === id) || { id, status: 'requires_action' },
    cancel: async (id) => { const p = created.find((x) => x.id === id); if (p) p.status = 'canceled'; return p; },
  },
};

let pay;
before(async () => {
  await h.start();
  // payments.js destructures these at load, so they are swapped in BEFORE it is first required.
  require('../services/stripe').getStripe = () => fakeStripe;
  const cfg = require('../services/paymentConfig');
  cfg.resolvePaymentConfig = async () => ({ enabled: true, allowedCountries: ['NL'], priceId: 'price_test', priceKey: 'launch' });
  cfg.priceInfo = async () => ({ unitAmount: 1452, taxCode: null });
  pay = require('../services/payments');
});
after(h.stop);

const { sealCode } = require('../services/sealedCode');
const { TERMS_VERSION } = require('../services/paymentConfig');

function request(orbCode) {
  return {
    confirmationTokenId: 'ctoken_test123',
    sealedOrbCode: sealCode(orbCode),
    email: 'buyer@example.com',
    country: 'NL',
    consent: true,
    consentText: 'Ik ga akkoord en zie af van mijn herroepingsrecht.',
    termsVersion: TERMS_VERSION,
    language: 'nl',
    origin: 'https://gardenforlife.nl',
  };
}

test('two concurrent payments for one report: one charge, one ref', async () => {
  const before = created.length;
  const orbCode = `LC_ORB3_race-${Date.now()}`;
  const results = await Promise.allSettled([pay.payFullReport(request(orbCode)), pay.payFullReport(request(orbCode))]);

  assert.equal(created.length - before, 1, 'exactly one PaymentIntent may be created');
  const ok = results.filter((r) => r.status === 'fulfilled');
  const refused = results.filter((r) => r.status === 'rejected');
  assert.equal(ok.length, 1);
  assert.equal(refused.length, 1);
  assert.equal(refused[0].reason.code, 'in_progress');
  assert.equal(refused[0].reason.status, 409);

  const docs = await require('../db').collections.payments().find({ codeHash: require('../services/reportAccess').codeHashFor(orbCode) }).toArray();
  assert.equal(docs.length, 1, 'one payments doc, so one ref');
});

test('ten concurrent payments for one report still produce exactly one charge', async () => {
  const before = created.length;
  const orbCode = `LC_ORB3_storm-${Date.now()}`;
  await Promise.allSettled(Array.from({ length: 10 }, () => pay.payFullReport(request(orbCode))));
  assert.equal(created.length - before, 1);
});

test('different reports are not serialised against each other', async () => {
  const before = created.length;
  const t = Date.now();
  const results = await Promise.all([
    pay.payFullReport(request(`LC_ORB3_a-${t}`)),
    pay.payFullReport(request(`LC_ORB3_b-${t}`)),
  ]);
  assert.equal(created.length - before, 2);
  assert.equal(results.length, 2);
});

test('a payment that has left the live states releases the slot for a new attempt', async () => {
  const orbCode = `LC_ORB3_retry-${Date.now()}`;
  const first = await pay.payFullReport(request(orbCode));
  const payments = require('../db').collections.payments();
  // The buyer abandons it: Stripe cancels, and the doc moves to a final state through toStatus().
  const doc = await payments.findOne({ ref: first.ref });
  assert.equal(doc.liveCodeHash, doc.codeHash, 'a live payment holds the slot');
  await payments.updateOne({ _id: doc._id }, { $set: { status: 'failed' }, $unset: { liveCodeHash: '' } });

  const before = created.length;
  const second = await pay.payFullReport(request(orbCode));
  assert.notEqual(second.ref, first.ref);
  assert.equal(created.length - before, 1, 'a fresh attempt is charged once');
});

test('a stale slot left by a write that bypassed toStatus() heals instead of blocking the report forever', async () => {
  const orbCode = `LC_ORB3_stale-${Date.now()}`;
  const codeHash = require('../services/reportAccess').codeHashFor(orbCode);
  // A final-state doc that still (wrongly) holds the slot.
  await require('../db').collections.payments().insertOne({
    ref: `stale-${Date.now()}`, codeHash, liveCodeHash: codeHash, status: 'canceled', createdAt: new Date(),
  });
  const before = created.length;
  const res = await pay.payFullReport(request(orbCode));
  assert.ok(res.ref);
  assert.equal(created.length - before, 1);
});

test('every status write that leaves the live states drops the slot (toStatus)', async () => {
  const src = require('fs').readFileSync(require('path').join(h.root, 'services/payments.js'), 'utf8');
  // No raw $set of a non-live status may remain: each must go through toStatus(), or it would keep the slot.
  const raw = src.match(/status:\s*'(failed|canceled|refunded|rejected_country)'/g) || [];
  assert.deepEqual(raw, [], `raw non-live status writes found: ${raw.join(', ')}`);
});
