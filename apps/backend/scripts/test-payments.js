/**
 * Payments — §1 verification without a Stripe account.
 *
 * Real code paths (routes, services, MongoDB with its unique indexes) against:
 *   - an in-memory MongoDB (mongodb-memory-server — nothing touches Atlas),
 *   - a stub Stripe client (scenario-driven PaymentIntents, charges, refunds, tax calculations),
 *   - webhook events signed with Stripe's own test-header generator (real signature verification).
 *
 * Usage (from apps/backend):  node scripts/test-payments.js
 * Exit code 0 = all checks passed.
 */
const crypto = require('crypto');

// ── Environment BEFORE anything reads config (dotenv never overrides what is already set) ──
// Blank the mode-specific Stripe names first: a developer's .env with real STRIPE_TEST_* keys would
// otherwise win over the stub values below (config/stripeEnv.js prefers the specific names).
for (const mode of ['TEST', 'LIVE']) {
  for (const base of ['SECRET_KEY', 'PUBLISHABLE_KEY', 'WEBHOOK_SECRET', 'PRICE_LAUNCH', 'PRICE_NORMAL']) {
    process.env[`STRIPE_${mode}_${base}`] = '';
    process.env[`STRIPE_${base}_${mode}`] = '';
  }
}
process.env.STRIPE_MODE = '';
process.env.PAYMENTS_TEST_TOKEN = '';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_stub';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_stub';
process.env.STRIPE_WEBHOOK_SECRET = `whsec_test_${crypto.randomBytes(12).toString('hex')}`;
process.env.STRIPE_PRICE_LAUNCH = 'price_launch_stub';
process.env.STRIPE_PRICE_NORMAL = 'price_normal_stub';
process.env.JWT_SECRET = `test-jwt-${crypto.randomBytes(8).toString('hex')}`;
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
process.env.SITE_URL = 'https://www.gardenforlife.nl';
process.env.PAYMENTS_PAY_LIMIT = '1000';

let passed = 0;
let failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); } else { failed++; console.log(`  ✗ ${name}${detail !== undefined ? ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`); }
}
const section = (t) => console.log(`\n${t}`);

// ── Stripe stub ──
function makeStripeStub() {
  let n = 0;
  const id = (p) => `${p}_${++n}${crypto.randomBytes(3).toString('hex')}`;
  const s = { calls: { piCreate: 0, taxCalc: 0, refunds: [], cancel: [] }, tokens: new Map(), intents: new Map(), chargeStore: new Map(), idem: new Map(), createParams: [] };
  const clone = (o) => JSON.parse(JSON.stringify(o));
  // A card charge carries its country; other methods (iDEAL, Klarna…) carry none, like Stripe's.
  const attachCharge = (pi, country, type = 'card') => {
    const details = type === 'card' ? { type, card: { country } } : { type, [type]: {} };
    const billing = type === 'card' ? { address: { country } } : { name: 'Test Persoon', address: null };
    const ch = { id: id('ch'), object: 'charge', payment_intent: pi.id, amount: pi.amount, refunded: false, payment_method_details: details, billing_details: billing };
    s.chargeStore.set(ch.id, ch);
    pi.latest_charge = ch.id;
    return ch;
  };
  s.prices = { retrieve: async (priceId) => ({ id: priceId, unit_amount: priceId === 'price_launch_stub' ? 1452 : 3630, currency: 'eur', tax_behavior: 'inclusive', active: true, product: { id: 'prod_stub', tax_code: 'txcd_10000000' } }) };
  s.confirmationTokens = { retrieve: async (tid) => { const t = s.tokens.get(tid); if (!t) throw Object.assign(new Error('No such token'), { type: 'StripeInvalidRequestError' }); return clone(t); } };
  s.tax = { calculations: { create: async (p) => {
    s.calls.taxCalc++;
    const amount = p.line_items[0].amount;
    const tax = Math.round((amount * 21) / 121);
    return { id: id('taxcalc'), amount_total: amount, tax_amount_inclusive: tax, tax_amount_exclusive: 0, tax_breakdown: [{ amount: tax, inclusive: true, tax_rate_details: { country: 'NL', percentage_decimal: '21.0' } }] };
  } } };
  s.paymentIntents = {
    create: async (params, opts) => {
      if (opts?.idempotencyKey && s.idem.has(opts.idempotencyKey)) return clone(s.idem.get(opts.idempotencyKey));
      s.calls.piCreate++;
      s.createParams.push(clone(params));
      const token = s.tokens.get(params.confirmation_token) || {};
      const scenario = token.scenario || 'succeeded';
      const pi = { id: id('pi'), object: 'payment_intent', amount: params.amount, currency: params.currency, metadata: params.metadata, client_secret: `${id('pi')}_secret`, status: scenario, latest_charge: null, next_action: null, ...(typeof token.livemode === 'boolean' ? { livemode: token.livemode } : {}) };
      if (scenario === 'decline') {
        pi.status = 'requires_payment_method';
        s.intents.set(pi.id, pi);
        throw Object.assign(new Error('Your card was declined.'), { type: 'StripeCardError', code: 'card_declined', decline_code: 'generic_decline', raw: { payment_intent: clone(pi) } });
      }
      if (scenario === 'requires_action_redirect') { pi.status = 'requires_action'; pi.next_action = { type: 'redirect_to_url', redirect_to_url: { url: 'https://stripe.test/ideal/authorize', return_url: params.return_url } }; }
      if (scenario === 'requires_action_sdk') { pi.status = 'requires_action'; pi.next_action = { type: 'use_stripe_sdk' }; }
      if (scenario === 'succeeded') attachCharge(pi, token.chargeCountry || 'NL', token.chargeMethod || token.payment_method_preview?.type);
      s.intents.set(pi.id, pi);
      if (opts?.idempotencyKey) s.idem.set(opts.idempotencyKey, pi);
      return clone(pi);
    },
    retrieve: async (pid) => { const pi = s.intents.get(pid); if (!pi) throw new Error(`No such PaymentIntent ${pid}`); return clone(pi); },
    cancel: async (pid) => {
      const pi = s.intents.get(pid);
      if (!pi || ['succeeded', 'processing', 'canceled'].includes(pi.status)) throw Object.assign(new Error('This PaymentIntent cannot be canceled'), { type: 'StripeInvalidRequestError' });
      pi.status = 'canceled'; s.calls.cancel.push(pid); return clone(pi);
    },
  };
  s.charges = { retrieve: async (cid) => clone(s.chargeStore.get(cid)) };
  s.refunds = { create: async (params, opts) => {
    if (opts?.idempotencyKey && s.idem.has(opts.idempotencyKey)) return s.idem.get(opts.idempotencyKey);
    const r = { id: id('re'), ...params, idempotencyKey: opts?.idempotencyKey };
    s.calls.refunds.push(r);
    if (opts?.idempotencyKey) s.idem.set(opts.idempotencyKey, r);
    return r;
  } };
  /** The bank / 3DS finished: the PaymentIntent succeeds with a charge from `country`. */
  s.succeed = (pid, country = 'NL', type = 'card') => { const pi = s.intents.get(pid); pi.status = 'succeeded'; pi.next_action = null; attachCharge(pi, country, type); return clone(pi); };
  s.chargeOf = (pid) => clone(s.chargeStore.get(s.intents.get(pid).latest_charge));
  return s;
}

(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('gfl_payments_test');

  const express = require('express');
  const { connectDB, closeDB, collections } = require('../db');
  const stripeSvc = require('../services/stripe');
  const stub = makeStripeStub();
  stripeSvc.setStripeForTests(stub);
  await connectDB();

  const { sealCode, SEAL_TTL_MS } = require('../services/sealedCode');
  const paymentConfig = require('../services/paymentConfig');
  const paymentEvents = require('../services/paymentEvents');
  const payments = require('../services/payments');
  const reportAccess = require('../services/reportAccess');

  const confirmedCount = new Map();
  paymentEvents.on('payment.confirmed', async ({ paymentRef }) => { confirmedCount.set(paymentRef, (confirmedCount.get(paymentRef) || 0) + 1); });

  const app = express();
  app.use('/api/payments/webhook', require('../routes/stripeWebhook'));
  app.use(express.json());
  app.use('/api/payments', require('../routes/payments'));
  const server = await new Promise((resolve) => { const srv = app.listen(0, () => resolve(srv)); });
  const base = `http://127.0.0.1:${server.address().port}`;

  const api = async (path, body) => {
    const r = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' }, body: body ? JSON.stringify(body) : undefined });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  };
  const newReport = () => { const code = `LC_ORB3_${crypto.randomBytes(10).toString('hex')}`; return { code, seal: sealCode(code), hash: reportAccess.codeHashFor(code) }; };
  const token = ({ type = 'card', previewCountry = 'NL', billingCountry, scenario = 'succeeded', chargeCountry, chargeMethod, livemode } = {}) => {
    const tid = `ctoken_${crypto.randomBytes(8).toString('hex')}`;
    const preview = type === 'card'
      ? { type, card: { country: previewCountry }, billing_details: { address: { country: billingCountry || previewCountry } } }
      : { type, billing_details: { name: 'Test Persoon', address: null } }; // iDEAL, Bancontact…: no country
    stub.tokens.set(tid, { id: tid, payment_method_preview: preview, scenario, chargeCountry, chargeMethod, livemode });
    return tid;
  };
  const CONSENT_TEXT = 'Ik stem ermee in dat ik 14-dagen garantie heb en daarna mijn wettelijke herroepingsrecht vervalt. Ik ga akkoord met de Algemene Voorwaarden';
  const payBody = (report, tid, extra = {}) => ({ confirmationTokenId: tid, sealedOrbCode: report.seal, email: 'koper@example.com', country: 'NL', language: 'nl', consent: true, consentText: CONSENT_TEXT, termsVersion: paymentConfig.TERMS_VERSION, ...extra });
  const { webhooks } = stripeSvc;
  const sendEvent = async (type, object, eventId = `evt_${crypto.randomBytes(8).toString('hex')}`, secret = process.env.STRIPE_WEBHOOK_SECRET) => {
    const payload = JSON.stringify({ id: eventId, object: 'event', type, data: { object } });
    const header = await webhooks().generateTestHeaderStringAsync({ payload, secret });
    const r = await fetch(`${base}/api/payments/webhook`, { method: 'POST', headers: { 'content-type': 'application/json', 'stripe-signature': header }, body: payload });
    return { status: r.status, body: await r.json().catch(() => ({})) };
  };
  const unlocksFor = (piId) => collections.reportUnlocks().find({ method: 'payment', reference: piId }).toArray();

  try {
    // ───────────────────────────────────────────────────────────
    section('A. Config, flip and gate (read at request time)');
    const flip = new Date(paymentConfig.DEFAULTS.flipAt);
    const before = await paymentConfig.resolvePaymentConfig(new Date(flip.getTime() - 1000));
    const after = await paymentConfig.resolvePaymentConfig(new Date(flip.getTime() + 1000));
    check('enabled with stub keys', before.enabled === true);
    check('flipAt pinned to 2027-03-20T20:25:00Z', before.flipAt === '2027-03-20T20:25:00.000Z');
    check('1s before flip: launch price 1452, gate NL', before.launch && before.grossCents === 1452 && JSON.stringify(before.allowedCountries) === '["NL"]');
    check('1s after flip: normal price 3630', !after.launch && after.grossCents === 3630 && after.priceId === 'price_normal_stub');
    check('after flip with openAtFlip=false: gate HOLDS at NL', JSON.stringify(after.allowedCountries) === '["NL"]' && after.gateOpen === false);
    await paymentConfig.updateSettings({ gate: { openAtFlip: true } }, 'test');
    const beforeOpen = await paymentConfig.resolvePaymentConfig(new Date(flip.getTime() - 1000));
    const afterOpen = await paymentConfig.resolvePaymentConfig(new Date(flip.getTime() + 1000));
    check('openAtFlip=true: still NL before the flip', JSON.stringify(beforeOpen.allowedCountries) === '["NL"]');
    check('openAtFlip=true: NL + EU-26 after the flip', afterOpen.allowedCountries.length === 27 && afterOpen.allowedCountries.includes('DE') && afterOpen.gateOpen);
    const rehearsal = new Date(Date.now() + 5 * 60 * 1000);
    await paymentConfig.updateSettings({ flipAt: rehearsal.toISOString(), gate: { openAtFlip: false } }, 'test');
    const rNow = await paymentConfig.resolvePaymentConfig(new Date());
    const rLater = await paymentConfig.resolvePaymentConfig(new Date(rehearsal.getTime() + 1000));
    check('rehearsal flipAt=now+5min: launch now, normal after', rNow.launch && rNow.grossCents === 1452 && !rLater.launch && rLater.grossCents === 3630);
    await paymentConfig.updateSettings({ flipAt: flip.toISOString(), gate: { openAtFlip: false } }, 'test');
    const restored = await paymentConfig.resolvePaymentConfig(new Date());
    check('rehearsal rolled back (both directions)', restored.launch && restored.flipAt === flip.toISOString());
    let invalid = null;
    try { await paymentConfig.updateSettings({ gate: { launchCountries: ['Netherlands'] } }, 'test'); } catch (e) { invalid = e.code; }
    check('invalid country list refused', invalid === 'invalid');
    const cfgRes = await api('/api/payments/config');
    check('GET /config → enabled, publishable key, 1452, NL, termsVersion', cfgRes.status === 200 && cfgRes.body.enabled && cfgRes.body.publishableKey === 'pk_test_stub' && cfgRes.body.grossCents === 1452 && cfgRes.body.termsVersion === paymentConfig.TERMS_VERSION, cfgRes.body);

    // ───────────────────────────────────────────────────────────
    section('B. Preconditions (server-enforced, nothing charged)');
    const pre = newReport();
    const piBefore = stub.calls.piCreate;
    const taxBefore = stub.calls.taxCalc;
    let r = await api('/api/payments/full-report', payBody(pre, token(), { consent: false }));
    check('consent:false → 400 consent_required', r.status === 400 && r.body.error === 'consent_required', r);
    r = await api('/api/payments/full-report', payBody(pre, token(), { termsVersion: 'av-1.0-old' }));
    check('stale termsVersion → 400 consent_required', r.status === 400 && r.body.error === 'consent_required', r);
    r = await api('/api/payments/full-report', payBody(pre, token(), { consentText: '' }));
    check('missing consent text → 400 consent_required', r.status === 400 && r.body.error === 'consent_required', r);
    r = await api('/api/payments/full-report', payBody(pre, token(), { country: 'DE' }));
    check('declared DE → 403 country_not_allowed (declared)', r.status === 403 && r.body.error === 'country_not_allowed' && r.body.stage === 'declared', r);
    r = await api('/api/payments/full-report', payBody(pre, token({ previewCountry: 'FR' })));
    check('declared NL + FR card → 403 pre-charge (payment_method)', r.status === 403 && r.body.error === 'country_not_allowed' && r.body.stage === 'payment_method', r);
    r = await api('/api/payments/full-report', payBody(pre, token({ previewCountry: 'NL', billingCountry: 'BE' })));
    check('NL card + BE billing → 403 pre-charge', r.status === 403 && r.body.stage === 'payment_method', r);
    for (const method of ['bancontact', 'klarna', 'mb_way', 'link']) {
      r = await api('/api/payments/full-report', payBody(pre, token({ type: method })));
      check(`declared NL + ${method} → 403 method_not_allowed pre-charge`, r.status === 403 && r.body.error === 'method_not_allowed', r);
    }
    r = await api('/api/payments/full-report', payBody({ seal: 's1.garbage' }, token()));
    check('garbage seal → 400 malformed', r.status === 400 && r.body.error === 'malformed', r);
    const expiredCode = `LC_ORB3_${crypto.randomBytes(10).toString('hex')}`;
    r = await api('/api/payments/full-report', payBody({ seal: sealCode(expiredCode, Date.now() - SEAL_TTL_MS - 60000) }, token()));
    check('expired seal → 410 report_expired', r.status === 410 && r.body.error === 'report_expired', r);
    r = await api('/api/payments/full-report', payBody(pre, 'not-a-token'));
    check('malformed confirmation token → 400', r.status === 400 && r.body.error === 'malformed', r);
    check('no PaymentIntent created by any refused attempt', stub.calls.piCreate === piBefore, { created: stub.calls.piCreate - piBefore });
    check('no tax calculation spent on refused attempts', stub.calls.taxCalc === taxBefore, { calcs: stub.calls.taxCalc - taxBefore });

    // ───────────────────────────────────────────────────────────
    section('C. Happy path (card, synchronous success)');
    const happy = newReport();
    r = await api('/api/payments/full-report', payBody(happy, token()));
    check('pay → 200 paid', r.status === 200 && r.body.status === 'paid' && /^pay_[0-9a-f]{32}$/.test(r.body.ref), r);
    const happyRef = r.body.ref;
    const happyDoc = await collections.payments().findOne({ ref: happyRef });
    const happyPi = happyDoc.paymentIntentId;
    const params = stub.createParams[stub.createParams.length - 1];
    check('PaymentIntent linked to the tax calculation (hooks)', !!params.hooks?.inputs?.tax?.calculation);
    check('amount = calculation total (1452 EUR)', params.amount === 1452 && params.currency === 'eur');
    check('Stripe receives only the opaque ref (no hash, email, code, seal)', JSON.stringify(params.metadata) === JSON.stringify({ paymentRef: happyRef })
      && !JSON.stringify(params).includes(happy.hash) && !JSON.stringify(params).includes('koper@example.com') && !JSON.stringify(params).includes(happy.code) && !JSON.stringify(params).includes(happy.seal));
    check('return_url → /?betaling=terug&ref on the requesting dev origin', params.return_url === `http://localhost:3000/?betaling=terug&ref=${happyRef}`, params.return_url);
    check('payments doc never stores the seal or raw code', !JSON.stringify(happyDoc).includes(happy.seal) && !JSON.stringify(happyDoc).includes(happy.code));
    check('payments doc: email encrypted, consent evidence pinned', happyDoc.email && happyDoc.email !== 'koper@example.com' && happyDoc.consent.termsVersion === paymentConfig.TERMS_VERSION
      && happyDoc.consent.consentTextHash === crypto.createHash('sha256').update(CONSENT_TEXT).digest('hex'));
    let unlocks = await unlocksFor(happyPi);
    check('exactly one ledger row, bound to the code hash', unlocks.length === 1 && unlocks[0].codeHash === happy.hash && unlocks[0].status === 'active');
    check('ledger carries Stripe tax (252 @ 21%) and consent evidence', unlocks[0].taxCents === 252 && unlocks[0].vatRate === 21 && unlocks[0].consent?.consentTextHash?.length === 64, unlocks[0]);
    let records = await collections.paymentRecords().find({ unlockRef: unlocks[0]._id }).toArray();
    check('exactly one betaalbewijs, with Stripe tax', records.length === 1 && records[0].kind === 'payment' && records[0].taxCents === 252);
    check('payment.confirmed emitted exactly once', confirmedCount.get(happyRef) === 1, confirmedCount.get(happyRef));
    r = await api(`/api/payments/${happyRef}/status`, { sealedOrbCode: happy.seal });
    check('status with the report seal → paid + raw code', r.status === 200 && r.body.status === 'paid' && r.body.orbCode === happy.code, r);
    const stranger = newReport();
    r = await api(`/api/payments/${happyRef}/status`, { sealedOrbCode: stranger.seal });
    check('status with another report\'s seal → 404, no code', r.status === 404 && !r.body.orbCode, r);
    r = await api(`/api/payments/${happyRef}/status`, { sealedOrbCode: 'garbage' });
    check('status with a garbage seal → 404', r.status === 404, r);
    const piCountBeforeRepay = stub.calls.piCreate;
    r = await api('/api/payments/full-report', payBody(happy, token()));
    check('pay again for a paid report → same ref, paid, nothing charged (recovery)', r.status === 200 && r.body.ref === happyRef && r.body.status === 'paid' && stub.calls.piCreate === piCountBeforeRepay, r);
    const coded = newReport();
    await reportAccess.recordUnlock({ unlockId: reportAccess.newUnlockId('code'), method: 'activation_code', reference: 'ac_test', codeHash: coded.hash });
    r = await api('/api/payments/full-report', payBody(coded, token()));
    check('pay for a report unlocked with an activation code → 409 already_unlocked', r.status === 409 && r.body.error === 'already_unlocked', r);
    r = await api(`/api/payments/${happyRef}/delivered`, { sealedOrbCode: stranger.seal });
    check('delivered with the wrong seal → 404', r.status === 404, r);
    r = await api(`/api/payments/${happyRef}/delivered`, { sealedOrbCode: happy.seal });
    const d1 = (await unlocksFor(happyPi))[0].deliveredAt;
    await api(`/api/payments/${happyRef}/delivered`, { sealedOrbCode: happy.seal });
    const d2 = (await unlocksFor(happyPi))[0].deliveredAt;
    check('delivered → deliveredAt logged once (first timestamp kept)', r.status === 200 && d1 && d2 && d1.getTime() === d2.getTime(), r);

    // ───────────────────────────────────────────────────────────
    section('D. Webhook: signature, replay, concurrent double-fire');
    const tampered = await sendEvent('payment_intent.succeeded', await stub.paymentIntents.retrieve(happyPi), undefined, 'whsec_wrong');
    check('wrong signature → 400', tampered.status === 400 && tampered.body.error === 'invalid_signature', tampered);
    const evtId = `evt_${crypto.randomBytes(8).toString('hex')}`;
    const first = await sendEvent('payment_intent.succeeded', await stub.paymentIntents.retrieve(happyPi), evtId);
    const replay = await sendEvent('payment_intent.succeeded', await stub.paymentIntents.retrieve(happyPi), evtId);
    check('first delivery 200, replay 200 duplicate (logged-ignored)', first.status === 200 && !first.body.duplicate && replay.status === 200 && replay.body.duplicate === true, { first, replay });
    unlocks = await unlocksFor(happyPi);
    records = await collections.paymentRecords().find({ unlockRef: unlocks[0]._id }).toArray();
    check('still one ledger row and one betaalbewijs', unlocks.length === 1 && records.length === 1);

    const ideal = newReport();
    r = await api('/api/payments/full-report', payBody(ideal, token({ type: 'ideal', scenario: 'requires_action_redirect' })));
    check('iDEAL → requires_action with redirectUrl (opened in a separate window)', r.status === 200 && r.body.status === 'requires_action' && r.body.redirectUrl === 'https://stripe.test/ideal/authorize', r);
    const idealRef = r.body.ref;
    const idealPi = (await collections.payments().findOne({ ref: idealRef })).paymentIntentId;
    r = await api(`/api/payments/${idealRef}/status`, { sealedOrbCode: ideal.seal });
    check('status while at the bank → requires_action, no code', r.body.status === 'requires_action' && !r.body.orbCode, r);
    const succeededPi = stub.succeed(idealPi, 'NL', 'ideal');
    const sameId = `evt_${crypto.randomBytes(8).toString('hex')}`;
    const storm = await Promise.all([
      ...Array.from({ length: 5 }, () => sendEvent('payment_intent.succeeded', succeededPi, sameId)),
      ...Array.from({ length: 5 }, () => sendEvent('payment_intent.succeeded', succeededPi)),
      ...Array.from({ length: 5 }, () => api(`/api/payments/${idealRef}/status`, { sealedOrbCode: ideal.seal })),
    ]);
    check('storm: every response 200', storm.every((x) => x.status === 200), storm.map((x) => x.status));
    const idealUnlocks = await unlocksFor(idealPi);
    const idealRecords = idealUnlocks[0] ? await collections.paymentRecords().find({ unlockRef: idealUnlocks[0]._id }).toArray() : [];
    check('storm (5× same event, 5× resends, 5× polls) → exactly one unlock', idealUnlocks.length === 1, idealUnlocks.length);
    check('storm → exactly one betaalbewijs', idealRecords.length === 1, idealRecords.length);
    check('storm → payment.confirmed emitted exactly once', confirmedCount.get(idealRef) === 1, confirmedCount.get(idealRef));
    r = await api(`/api/payments/${idealRef}/status`, { sealedOrbCode: ideal.seal });
    check('after the storm: poll → paid + code', r.body.status === 'paid' && r.body.orbCode === ideal.code, r);

    const sdk = newReport();
    r = await api('/api/payments/full-report', payBody(sdk, token({ scenario: 'requires_action_sdk' })));
    check('3DS → requires_action with clientSecret for in-page handleNextAction', r.body.status === 'requires_action' && r.body.nextAction === 'sdk' && !!r.body.clientSecret && !r.body.redirectUrl, r);

    // ───────────────────────────────────────────────────────────
    section('E. Gate backstop: charged from outside the gate');
    const foreign = newReport();
    const refundsBefore = stub.calls.refunds.length;
    r = await api('/api/payments/full-report', payBody(foreign, token({ previewCountry: 'NL', chargeCountry: 'FR' })));
    check('NL preview but FR charge → rejected_country', r.status === 200 && r.body.status === 'rejected_country', r);
    const foreignRef = r.body.ref;
    const foreignPi = (await collections.payments().findOne({ ref: foreignRef })).paymentIntentId;
    check('automatic refund issued (country_gate)', stub.calls.refunds.length === refundsBefore + 1 && stub.calls.refunds.at(-1).metadata?.reason === 'country_gate');
    check('never unlocked', (await unlocksFor(foreignPi)).length === 0);
    await sendEvent('payment_intent.succeeded', await stub.paymentIntents.retrieve(foreignPi));
    r = await api(`/api/payments/${foreignRef}/status`, { sealedOrbCode: foreign.seal });
    check('replayed success + poll: still rejected, no code, no second refund', r.body.status === 'rejected_country' && !r.body.orbCode
      && stub.calls.refunds.filter((x) => x.payment_intent === foreignPi).length === 1 && (await unlocksFor(foreignPi)).length === 0, r);
    const gateRefundEvt = await sendEvent('charge.refunded', { ...stub.chargeOf(foreignPi), refunded: true });
    check('charge.refunded for the gate refund → 200, nothing to revoke', gateRefundEvt.status === 200 && (await unlocksFor(foreignPi)).length === 0);
    const klarna = newReport();
    const refundsBeforeMethod = stub.calls.refunds.length;
    r = await api('/api/payments/full-report', payBody(klarna, token({ chargeMethod: 'klarna' })));
    const klarnaPi = (await collections.payments().findOne({ ref: r.body.ref }))?.paymentIntentId;
    check('charged with a method outside the gate (Klarna) → rejected + refunded, never unlocked', r.body.status === 'rejected_country'
      && stub.calls.refunds.length === refundsBeforeMethod + 1 && (await unlocksFor(klarnaPi)).length === 0, r);

    // ───────────────────────────────────────────────────────────
    section('F. Never charge twice: payments in flight');
    const switcher = newReport();
    r = await api('/api/payments/full-report', payBody(switcher, token({ scenario: 'requires_action_redirect' })));
    const abandonedRef = r.body.ref;
    const abandonedPi = (await collections.payments().findOne({ ref: abandonedRef })).paymentIntentId;
    r = await api('/api/payments/full-report', payBody(switcher, token()));
    check('switch iDEAL → card: old PaymentIntent canceled first, new one paid', r.body.status === 'paid' && stub.calls.cancel.includes(abandonedPi), r);
    check('abandoned attempt marked canceled', (await collections.payments().findOne({ ref: abandonedRef })).status === 'canceled');
    check('one unlock for that report', (await collections.reportUnlocks().countDocuments({ codeHash: switcher.hash })) === 1);
    const slow = newReport();
    r = await api('/api/payments/full-report', payBody(slow, token({ scenario: 'processing' })));
    check('async method → processing', r.body.status === 'processing', r);
    const piCount = stub.calls.piCreate;
    const again = await api('/api/payments/full-report', payBody(slow, token()));
    check('pay again while processing → same ref, no new PaymentIntent', again.body.ref === r.body.ref && again.body.status === 'processing' && stub.calls.piCreate === piCount, again);
    check('live payment protects the card draft (discard + nightly sweep)', await payments.hasLivePayment(slow.hash) && (await payments.codeHashesWithLivePayment([slow.hash, stranger.hash])).has(slow.hash)
      && !(await payments.hasLivePayment(stranger.hash)));

    // ───────────────────────────────────────────────────────────
    section('G. Declined card');
    const declined = newReport();
    r = await api('/api/payments/full-report', payBody(declined, token({ scenario: 'decline' })));
    check('decline → 402 payment_failed with decline code', r.status === 402 && r.body.error === 'payment_failed' && r.body.declineCode === 'generic_decline', r);
    r = await api('/api/payments/full-report', payBody(declined, token()));
    check('retry with another card → paid', r.body.status === 'paid', r);

    // ───────────────────────────────────────────────────────────
    section('H. Refunds → payment.revoked');
    const refundEvtId = `evt_${crypto.randomBytes(8).toString('hex')}`;
    const refundCharge = { ...stub.chargeOf(happyPi), refunded: true };
    const rf1 = await sendEvent('charge.refunded', refundCharge, refundEvtId);
    const rf2 = await sendEvent('charge.refunded', refundCharge, refundEvtId);
    const rf3 = await sendEvent('charge.refunded', refundCharge);
    unlocks = await unlocksFor(happyPi);
    check('Dashboard refund → ledger refunded via stripe, code blocked', rf1.status === 200 && unlocks[0].status === 'refunded' && unlocks[0].refundChannel === 'stripe' && unlocks[0].refundedBy === 'stripe'
      && await reportAccess.isCodeBlocked(happy.hash), unlocks[0]);
    check('replay + resend of the refund → no-op', rf2.body.duplicate === true && rf3.status === 200);
    check('exactly one terugbetalingsbewijs', (await collections.paymentRecords().countDocuments({ unlockRef: unlocks[0]._id, kind: 'refund' })) === 1);
    r = await api(`/api/payments/${happyRef}/status`, { sealedOrbCode: happy.seal });
    check('status after refund → refunded, no code', r.body.status === 'refunded' && !r.body.orbCode, r);

    const partial = newReport();
    r = await api('/api/payments/full-report', payBody(partial, token()));
    const partialPi = (await collections.payments().findOne({ ref: r.body.ref })).paymentIntentId;
    await sendEvent('charge.refunded', { ...stub.chargeOf(partialPi), refunded: false, amount_refunded: 500 });
    check('partial refund does not revoke the report', (await unlocksFor(partialPi))[0].status === 'active');

    const greyReport = newReport();
    r = await api('/api/payments/full-report', payBody(greyReport, token())); // koper@example.com is grey-listed by the refund above
    const greyUnlock = (await unlocksFor((await collections.payments().findOne({ ref: r.body.ref })).paymentIntentId))[0];
    const callsBeforeGrey = stub.calls.refunds.length;
    let greyErr = null;
    try { await payments.adminRefund({ id: greyUnlock._id, by: 'admin_1' }); } catch (e) { greyErr = e.code; }
    check('grey-listed email without moderator review → refused BEFORE any money moves', greyErr === 'greylisted' && stub.calls.refunds.length === callsBeforeGrey, greyErr);
    await payments.adminRefund({ id: greyUnlock._id, by: 'admin_1', review: { answers: { reason: 'r', readFully: 'ja', expected: 'e' }, notes: '' } });
    const greyAfter = await collections.reportUnlocks().findOne({ _id: greyUnlock._id });
    check('with the review answers → Stripe refund + ledger refunded, review stored', greyAfter.status === 'refunded' && stub.calls.refunds.length === callsBeforeGrey + 1 && greyAfter.moderatorReviews?.length === 1);

    const guaranteed = newReport();
    r = await api('/api/payments/full-report', payBody(guaranteed, token(), { email: 'tweede@example.com' }));
    const gPi = (await collections.payments().findOne({ ref: r.body.ref })).paymentIntentId;
    const gUnlock = (await unlocksFor(gPi))[0];
    const refundCalls = stub.calls.refunds.length;
    await payments.adminRefund({ id: gUnlock._id, by: 'admin_1' });
    const gAfter = (await unlocksFor(gPi))[0];
    check('admin refund → Stripe refund sent (idempotent key) then ledger refunded by the admin', stub.calls.refunds.length === refundCalls + 1
      && stub.calls.refunds.at(-1).idempotencyKey === `guarantee-refund-${gUnlock.unlockId}` && gAfter.status === 'refunded' && gAfter.refundedBy === 'admin_1' && gAfter.refundChannel === 'stripe', gAfter);
    await sendEvent('charge.refunded', { ...stub.chargeOf(gPi), refunded: true });
    const gEcho = (await unlocksFor(gPi))[0];
    check('webhook echo of the admin refund → no-op (still the admin\'s refund, one record)', gEcho.refundedBy === 'admin_1'
      && (await collections.paymentRecords().countDocuments({ unlockRef: gUnlock._id, kind: 'refund' })) === 1);

    const late = newReport();
    r = await api('/api/payments/full-report', payBody(late, token(), { email: 'derde@example.com' }));
    const lPi = (await collections.payments().findOne({ ref: r.body.ref })).paymentIntentId;
    const lUnlock = (await unlocksFor(lPi))[0];
    await collections.reportUnlocks().updateOne({ _id: lUnlock._id }, { $set: { refundableUntil: new Date(Date.now() - 1000) } });
    const callsBeforeLate = stub.calls.refunds.length;
    let lateErr = null;
    try { await payments.adminRefund({ id: lUnlock._id, by: 'admin_1' }); } catch (e) { lateErr = e.code; }
    check('admin refund after the window → refused BEFORE any money moves', lateErr === 'window_closed' && stub.calls.refunds.length === callsBeforeLate, lateErr);

    // ───────────────────────────────────────────────────────────
    section('I. Dispute');
    await sendEvent('charge.dispute.created', { id: 'dp_test', object: 'dispute', payment_intent: partialPi, status: 'needs_response', reason: 'fraudulent' });
    const disputed = (await unlocksFor(partialPi))[0];
    check('dispute flagged on the ledger (not auto-revoked)', !!disputed.disputedAt && disputed.disputeReason === 'fraudulent' && disputed.status === 'active', disputed);

    // ───────────────────────────────────────────────────────────
    section('K. Stripe TEST mode stays out of the real bookkeeping');
    const testPay = newReport();
    r = await api('/api/payments/full-report', payBody(testPay, token({ livemode: false }), { email: 'test@example.com' }));
    const testPi = (await collections.payments().findOne({ ref: r.body.ref })).paymentIntentId;
    const testUnlock = (await unlocksFor(testPi))[0];
    const testRecord = await collections.paymentRecords().findOne({ unlockRef: testUnlock._id, kind: 'payment' });
    const realRecord = await collections.paymentRecords().findOne({ kind: 'payment', testmode: { $exists: false } });
    check('test-mode payment → TEST- numbered betaalbewijs, own sequence', testUnlock.testmode === true && /^TEST-\d{4}-000001$/.test(testRecord.number) && /^\d{4}-\d{6}$/.test(realRecord.number), { test: testRecord.number, real: realRecord.number });
    const seal = await api('/api/payments/dev-seal', {});
    check('dev-seal with sk_test key outside production → a usable seal', seal.status === 200 && /^s1\./.test(seal.body.sealedOrbCode || ''), seal);
    process.env.NODE_ENV = 'production';
    const sealProd = await api('/api/payments/dev-seal', {});
    process.env.NODE_ENV = 'test';
    check('dev-seal in production → 404', sealProd.status === 404, sealProd);

    // ───────────────────────────────────────────────────────────
    section('L. Key sets per mode + production TEST lock');
    const { resolveStripeEnv } = require('../config/stripeEnv');
    const both = {
      STRIPE_TEST_SECRET_KEY: 'sk_test_a', STRIPE_TEST_PUBLISHABLE_KEY: 'pk_test_a', STRIPE_TEST_WEBHOOK_SECRET: 'whsec_t', STRIPE_TEST_PRICE_LAUNCH: 'price_tl', STRIPE_TEST_PRICE_NORMAL: 'price_tn',
      STRIPE_LIVE_SECRET_KEY: 'sk_live_b', STRIPE_LIVE_PUBLISHABLE_KEY: 'pk_live_b', STRIPE_LIVE_WEBHOOK_SECRET: 'whsec_l', STRIPE_LIVE_PRICE_LAUNCH: 'price_ll', STRIPE_LIVE_PRICE_NORMAL: 'price_ln',
    };
    const envTest = resolveStripeEnv(both);
    const envLive = resolveStripeEnv({ ...both, STRIPE_MODE: 'live' });
    check('both key sets present, no STRIPE_MODE → test set', envTest.mode === 'test' && envTest.secretKey === 'sk_test_a' && envTest.publishableKey === 'pk_test_a' && envTest.priceLaunch === 'price_tl' && envTest.webhookSecret === 'whsec_t');
    check('STRIPE_MODE=live → live set, one variable flips everything', envLive.mode === 'live' && envLive.secretKey === 'sk_live_b' && envLive.publishableKey === 'pk_live_b' && envLive.priceNormal === 'price_ln' && envLive.webhookSecret === 'whsec_l');
    const suffixed = resolveStripeEnv({ STRIPE_SECRET_KEY: 'sk_live_g', STRIPE_PUBLISHABLE_KEY: 'pk_live_g', STRIPE_SECRET_KEY_TEST: 'sk_test_s', STRIPE_PUBLISHABLE_KEY_TEST: 'pk_test_s' });
    check('generic live keys + _TEST suffix keys → test mode uses the suffixed test keys', suffixed.secretKey === 'sk_test_s' && suffixed.publishableKey === 'pk_test_s');
    const mismatch = resolveStripeEnv({ STRIPE_MODE: 'live', STRIPE_SECRET_KEY: 'sk_test_x', STRIPE_PUBLISHABLE_KEY: 'pk_test_x' });
    check('a generic TEST key is never used in live mode (prefix guard)', mismatch.secretKey === '' && mismatch.publishableKey === '');

    process.env.NODE_ENV = 'production';
    paymentConfig.clearPaymentConfigCache();
    const lockedCfg = await api('/api/payments/config');
    const lockedPay = await api('/api/payments/full-report', payBody(newReport(), token()));
    const lockedSeal = await api('/api/payments/dev-seal', {});
    const tokenValue = 'gates-token-0123456789abcdef';
    require('../config').stripe.testAccessToken = tokenValue;
    const withToken = async (path, body) => {
      const res = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json', 'x-gfl-payments-test': tokenValue }, body: body ? JSON.stringify(body) : undefined });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    };
    const openCfg = await withToken('/api/payments/config');
    const openSeal = await withToken('/api/payments/dev-seal', {});
    const gateReport = newReport();
    const openPay = await withToken('/api/payments/full-report', payBody(gateReport, token({ livemode: false }), { email: 'gate@example.com' }));
    const wrongToken = await fetch(`${base}/api/payments/config`, { headers: { 'x-gfl-payments-test': 'gates-token-0123456789abcdeX' } }).then((x) => x.json());
    check('production TEST mode without the token → config disabled, pay 503, dev-seal 404', lockedCfg.body.enabled === false && lockedCfg.body.mode === 'test' && lockedPay.status === 503 && lockedSeal.status === 404, { lockedCfg: lockedCfg.body, lockedPay: lockedPay.status, lockedSeal: lockedSeal.status });
    check('with the token → config enabled, dev-seal works, test payment goes through', openCfg.body.enabled === true && openSeal.status === 200 && openPay.body.status === 'paid', { openCfg: openCfg.body.enabled, openSeal: openSeal.status, openPay: openPay.body });
    check('a wrong token (same length) → still locked', wrongToken.enabled === false);
    check('in production a TEST-mode unlock never makes its code account-activatable', !(await reportAccess.isCodeActivatable(gateReport.hash)));
    require('../config').stripe.testAccessToken = '';
    process.env.NODE_ENV = 'test';
    paymentConfig.clearPaymentConfigCache();

    // ───────────────────────────────────────────────────────────
    section('J. Stripe not configured');
    stripeSvc.setStripeForTests(null);
    paymentConfig.clearPaymentConfigCache();
    const off = await api('/api/payments/config');
    const offPay = await api('/api/payments/full-report', payBody(newReport(), token()));
    check('no client → config enabled:false, no publishable key', off.body.enabled === false && !off.body.publishableKey, off.body);
    check('no client → pay 503 unavailable', offPay.status === 503 && offPay.body.error === 'unavailable', offPay);
    stripeSvc.setStripeForTests(stub);
    paymentConfig.clearPaymentConfigCache();
  } catch (e) {
    failed++;
    console.error('\nUnexpected error:', e);
  } finally {
    server.close();
    await closeDB();
    await mongod.stop();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
