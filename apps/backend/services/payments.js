/**
 * Garden For Life — Payments (Stripe) for the full report ("Essentie").
 *
 * Payment Element inside the paywall, confirmed on the SERVER with a ConfirmationToken:
 *
 *   paywall: elements.submit() → stripe.createConfirmationToken() → POST /api/payments/full-report
 *   server : payFullReport()   → preconditions → Stripe Tax calculation → PaymentIntent (create+confirm)
 *   result : paid | requires_action (3DS in-page, or iDEAL: redirectUrl opened in a separate window,
 *            because a same-tab redirect would destroy the report that only lives in the tab) | processing
 *   then   : webhook payment_intent.succeeded AND/OR the paywall's status poll → confirmFromIntent()
 *
 * The join between Stripe and the product is an opaque `ref` ↔ the report's crystal-code hash.
 * Stripe only ever sees `ref`; never the hash, the seal, the raw code or the email.
 *
 * Double-fire proof (a webhook replay, a concurrent resend and the status poll racing each other):
 *   1. stripeEvents: one row per Stripe event id (processing → done; a stale 'processing' is retried)
 *   2. payments: an atomic claim (confirmState) before `payment.confirmed` is emitted
 *   3. reportUnlocks: unique `unlockId` and a unique partial index on the PaymentIntent reference
 *
 * Product side (bottom of this file): `payment.confirmed` → recordUnlock, `payment.revoked` →
 * refundUnlock. Nothing else in the product touches Stripe.
 */
const crypto = require('crypto');
const { collections } = require('../db');
const config = require('../config');
const { getStripe, webhooks } = require('./stripe');
const { resolvePaymentConfig, priceInfo, normCountry, TERMS_VERSION } = require('./paymentConfig');
const paymentEvents = require('./paymentEvents');
const { unsealCode, SealError } = require('./sealedCode');
const { encrypt, hash } = require('./encryption');
const {
  REFUND_WINDOW_DAYS, RefundError, codeHashFor, isCodeActivatable, recordUnlock, precheckRefund,
  refundUnlock, markUnlockDelivered, readEmail, newUnlockId,
} = require('./reportAccess');

const DAY_MS = 24 * 60 * 60 * 1000;
const UNPAID_TTL_MS = 30 * DAY_MS;
const PAID_TTL_MS = (REFUND_WINDOW_DAYS + 1) * DAY_MS;
const EVENT_TTL_MS = 30 * DAY_MS;
const CLAIM_STALE_MS = 2 * 60 * 1000;   // a claim whose listener crashed is retried after this
const EVENT_STALE_MS = 5 * 60 * 1000;   // an event row stuck in 'processing' is retried after this
const CREATING_STALE_MS = 2 * 60 * 1000;
const ADMIN_REFUND_GUARD_MS = 2 * 60 * 1000; // the admin route records its own refund; the webhook echo steps aside
const DESCRIPTION = 'Garden For Life — Essentie (volledig rapport)';

// Payment methods the country gate can vouch for, whatever the Dashboard enables: a card carries its
// issuing country (Apple Pay / Google Pay are cards), iDEAL is the Dutch bank scheme. Bancontact,
// Klarna, MB WAY, EPS… say nothing about where the payer is, so they are refused before charging
// and, should one slip through, refunded like any other payment from outside the gate.
const ALLOWED_METHOD_TYPES = new Set(['card', 'ideal']);

// Statuses of a payments doc. 'creating' = doc written, PaymentIntent not created yet.
const LIVE = ['creating', 'requires_action', 'processing', 'paid'];
const FINAL = ['paid', 'failed', 'canceled', 'rejected_country', 'refunded'];

const PRIVATE_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;
const PAGES_PREVIEW_RE = /^https:\/\/[a-z0-9][a-z0-9-]*\.gfl-trunk\.pages\.dev$/;

class PaymentError extends Error {
  constructor(code, status, extra = {}) { super(code); this.code = code; this.status = status; this.extra = extra; }
}

const newRef = () => `pay_${crypto.randomBytes(16).toString('hex')}`;
const sha256 = (s) => crypto.createHash('sha256').update(String(s), 'utf8').digest('hex');
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
const countriesOf = (card, billing) => [card?.country, billing?.address?.country].filter(Boolean).map(normCountry);

/** PaymentIntent status → payments doc status (succeeded is handled by confirmFromIntent). */
function statusFromIntent(pi) {
  switch (pi?.status) {
    case 'succeeded': return 'paid';
    case 'requires_action': return 'requires_action';
    case 'canceled': return 'canceled';
    case 'requires_payment_method': return 'failed';
    default: return 'processing'; // processing, requires_confirmation, requires_capture
  }
}

/** Where the iDEAL window returns to: the requesting site when it is ours, else SITE_URL. */
function returnBase(origin) {
  const o = String(origin || '').replace(/\/+$/, '');
  if (o && (config.corsOrigins.includes(o) || PRIVATE_ORIGIN_RE.test(o) || PAGES_PREVIEW_RE.test(o))) return o;
  return config.siteUrl;
}

/** Open the seal and prove it belongs to this payment. Expired seals still identify a report here. */
function openSealFor(doc, sealedOrbCode) {
  let code;
  try { code = unsealCode(sealedOrbCode, Date.now(), { allowExpired: true }); } catch { throw new PaymentError('not_found', 404); }
  if (!doc || codeHashFor(code) !== doc.codeHash) throw new PaymentError('not_found', 404);
  return code;
}

async function findPaymentForIntent(pi) {
  const ref = pi?.metadata?.paymentRef;
  if (ref) {
    const byRef = await collections.payments().findOne({ ref });
    if (byRef) return byRef;
  }
  return pi?.id ? collections.payments().findOne({ paymentIntentId: pi.id }) : null;
}

/** What the paywall needs to continue after a create/confirm. */
async function clientResponse(ref, pi) {
  const doc = await collections.payments().findOne({ ref });
  const base = { ref, status: doc?.status === 'creating' ? 'processing' : doc?.status };
  if (doc?.status === 'paid' && doc.confirmState !== 'done') base.status = 'processing';
  if (doc?.status === 'requires_action' && pi?.next_action) {
    if (pi.next_action.type === 'redirect_to_url' && pi.next_action.redirect_to_url?.url) {
      return { ...base, redirectUrl: pi.next_action.redirect_to_url.url };
    }
    return { ...base, clientSecret: pi.client_secret, nextAction: 'sdk' };
  }
  return base;
}

// ─────────────────────────────────────────────────────────────
// Pay
// ─────────────────────────────────────────────────────────────

/**
 * Preconditions, in order: report (seal) → not already unlocked → declared country → consent →
 * no payment in flight → payment-method country (pre-charge) → tax → charge.
 */
async function payFullReport({ confirmationTokenId, sealedOrbCode, email, country, consent, consentText, termsVersion, language, origin, testAccess = false }) {
  const cfg = await resolvePaymentConfig(new Date(), { testAccess });
  const stripe = getStripe();
  if (!cfg.enabled || !stripe) throw new PaymentError('unavailable', 503);

  // 1. The report: only the holder of the seal can pay for it. An expired seal can't be unlocked.
  let orbCode;
  try { orbCode = unsealCode(sealedOrbCode); } catch (e) {
    if (e instanceof SealError && e.code === 'expired') throw new PaymentError('report_expired', 410);
    throw new PaymentError('malformed', 400);
  }
  const codeHash = codeHashFor(orbCode);
  if (!codeHash) throw new PaymentError('malformed', 400);

  // 2. Already unlocked. Paid earlier (e.g. the tab lost track of an iDEAL payment)? Hand back that
  //    payment's ref — the status call with the same seal then releases the code. Unlocked another
  //    way (activation code) → 409.
  if (await isCodeActivatable(codeHash)) {
    const paidBefore = await collections.payments()
      .find({ codeHash, status: 'paid', confirmState: 'done' }).sort({ createdAt: -1 }).limit(1).next();
    if (paidBefore) return { ref: paidBefore.ref, status: 'paid' };
    throw new PaymentError('already_unlocked', 409);
  }

  // 3. Gate, stage 1: the declared country. The server decides; the UI only explains.
  const declared = normCountry(country);
  if (!cfg.allowedCountries.includes(declared)) {
    throw new PaymentError('country_not_allowed', 403, { stage: 'declared', allowedCountries: cfg.allowedCountries });
  }

  // 4. Consent (herroepingsrecht waiver + guarantee), version-pinned and evidenced.
  const text = String(consentText || '').trim();
  if (consent !== true || termsVersion !== TERMS_VERSION || !text || text.length > 4000) {
    throw new PaymentError('consent_required', 400, { termsVersion: TERMS_VERSION });
  }

  // 5. Never charge twice: one payment in flight per report.
  const inflight = await collections.payments()
    .find({ codeHash, status: { $in: LIVE } }).sort({ createdAt: -1 }).limit(1).next();
  if (inflight) {
    if (inflight.status === 'paid') return clientResponse(inflight.ref, null);
    if (inflight.status === 'creating') {
      if (Date.now() - new Date(inflight.createdAt).getTime() < CREATING_STALE_MS) throw new PaymentError('in_progress', 409);
      await collections.payments().updateOne({ _id: inflight._id, status: 'creating' }, { $set: { status: 'failed', lastError: 'stale_creating', updatedAt: new Date() } });
    } else if (inflight.paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(inflight.paymentIntentId);
      if (pi.status === 'succeeded' || pi.status === 'processing') {
        await confirmFromIntent(pi, 'pay-inflight');
        return clientResponse(inflight.ref, pi);
      }
      if (pi.status === 'requires_action' || pi.status === 'requires_payment_method' || pi.status === 'requires_confirmation') {
        // The client abandoned that attempt (closed the bank window, switched method). Cancel it
        // BEFORE charging anew; if the bank completed it in the meantime the cancel fails and the
        // existing payment wins.
        try {
          await stripe.paymentIntents.cancel(pi.id, {}, { idempotencyKey: `cancel-${inflight.ref}` });
          await collections.payments().updateOne({ _id: inflight._id }, { $set: { status: 'canceled', updatedAt: new Date() } });
        } catch (e) {
          const fresh = await stripe.paymentIntents.retrieve(pi.id);
          await confirmFromIntent(fresh, 'pay-inflight');
          return clientResponse(inflight.ref, fresh);
        }
      } else {
        await syncStatus(inflight, pi);
      }
    }
  }

  // 6. Gate, stage 2 (pre-charge): the actual payment method's card / billing country.
  if (!/^ctoken_[A-Za-z0-9]+$/.test(String(confirmationTokenId || ''))) throw new PaymentError('malformed', 400);
  const token = await stripe.confirmationTokens.retrieve(confirmationTokenId);
  const preview = token?.payment_method_preview || {};
  if (!ALLOWED_METHOD_TYPES.has(preview.type)) {
    throw new PaymentError('method_not_allowed', 403, { stage: 'payment_method' });
  }
  const methodCountries = countriesOf(preview.card, preview.billing_details);
  if (methodCountries.some((c) => !cfg.allowedCountries.includes(c))) {
    throw new PaymentError('country_not_allowed', 403, { stage: 'payment_method', allowedCountries: cfg.allowedCountries });
  }

  // 7. Tax: Stripe Tax on the active (tax-inclusive) Price, for the declared country.
  const price = await priceInfo(cfg.priceId);
  let calc;
  try {
    calc = await stripe.tax.calculations.create({
      currency: 'eur',
      line_items: [{ amount: price.unitAmount, reference: 'essentie', tax_behavior: 'inclusive', ...(price.taxCode ? { tax_code: price.taxCode } : {}) }],
      customer_details: { address: { country: declared }, address_source: 'billing' },
    });
  } catch (e) {
    console.error('[Payments] Stripe Tax calculation failed:', e.message);
    throw new PaymentError('tax_unavailable', 503);
  }
  let taxCents = (calc.tax_amount_inclusive || 0) + (calc.tax_amount_exclusive || 0);
  let vatRate = parseFloat(calc.tax_breakdown?.[0]?.tax_rate_details?.percentage_decimal || '');
  let taxSource = 'stripe_tax';
  if (!taxCents && declared === 'NL') {
    // A Dutch consumer sale always carries 21% BTW; zero means the NL registration is missing in
    // Stripe Tax. The record must still be right — flag it loudly.
    console.error('[Payments] ❌ Stripe Tax returned 0 tax for NL — check the NL registration in the Stripe Dashboard');
    taxCents = Math.round((calc.amount_total * 21) / 121);
    vatRate = 21;
    taxSource = 'fallback_nl_21';
  }

  // 8. The payments doc exists BEFORE the charge, so a webhook can always find it.
  const now = new Date();
  const ref = newRef();
  const cleanEmail = String(email || '').trim().toLowerCase();
  await collections.payments().insertOne({
    ref,
    codeHash,
    status: 'creating',
    priceKey: cfg.priceKey,
    priceId: cfg.priceId,
    amountCents: calc.amount_total,
    currency: 'EUR',
    taxCents,
    ...(Number.isFinite(vatRate) ? { vatRate } : {}),
    taxSource,
    taxCalculationId: calc.id,
    declaredCountry: declared,
    allowedCountries: cfg.allowedCountries,
    consent: { consentAt: now, termsVersion, consentTextHash: sha256(text) },
    ...(isEmail(cleanEmail) ? { email: encrypt(cleanEmail), emailHash: hash(cleanEmail) } : {}),
    language: language === 'en' ? 'en' : 'nl',
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + UNPAID_TTL_MS),
  });

  // 9. Create + confirm the PaymentIntent, linked to the tax calculation (Stripe records the tax
  //    transaction on success and the reversal on refunds).
  let pi;
  try {
    pi = await stripe.paymentIntents.create({
      amount: calc.amount_total,
      currency: 'eur',
      confirm: true,
      confirmation_token: confirmationTokenId,
      return_url: `${returnBase(origin)}/?betaling=terug&ref=${ref}`,
      description: DESCRIPTION,
      metadata: { paymentRef: ref },
      hooks: { inputs: { tax: { calculation: calc.id } } },
    }, { idempotencyKey: `pi-create-${ref}` });
  } catch (e) {
    const failedPi = e?.raw?.payment_intent;
    await collections.payments().updateOne({ ref }, { $set: {
      status: 'failed',
      ...(failedPi?.id ? { paymentIntentId: failedPi.id } : {}),
      lastError: e?.code || e?.type || 'error',
      updatedAt: new Date(),
    } });
    if (e?.type === 'StripeCardError' || failedPi) {
      throw new PaymentError('payment_failed', 402, { declineCode: e?.decline_code || e?.code || null });
    }
    console.error('[Payments] PaymentIntent create failed:', e?.message);
    throw new PaymentError('provider_error', 502);
  }

  await collections.payments().updateOne({ ref }, { $set: {
    paymentIntentId: pi.id,
    status: statusFromIntent(pi) === 'paid' ? 'processing' : statusFromIntent(pi),
    ...(typeof pi.livemode === 'boolean' ? { livemode: pi.livemode } : {}),
    updatedAt: new Date(),
  } });
  if (pi.status === 'succeeded') await confirmFromIntent(pi, 'pay');
  return clientResponse(ref, pi);
}

// ─────────────────────────────────────────────────────────────
// Confirm (webhook, status poll, pay — all the same idempotent path)
// ─────────────────────────────────────────────────────────────

async function syncStatus(doc, pi) {
  if (!doc || FINAL.includes(doc.status)) return doc;
  const status = statusFromIntent(pi);
  if (status === 'paid') return doc; // only confirmFromIntent may set paid
  const r = await collections.payments().findOneAndUpdate(
    { _id: doc._id, status: { $nin: FINAL } },
    { $set: { status, ...(pi?.id && !doc.paymentIntentId ? { paymentIntentId: pi.id } : {}), updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  return r || doc;
}

/** What was actually charged behind a PaymentIntent: method type and card / billing country. */
async function chargeOrigin(pi) {
  let charge = pi?.latest_charge;
  if (charge && typeof charge === 'string') charge = await getStripe().charges.retrieve(charge);
  if (!charge || typeof charge !== 'object') return { type: '', countries: [] };
  const details = charge.payment_method_details || {};
  return { type: details.type || '', countries: countriesOf(details.card, charge.billing_details) };
}

/** Gate backstop: paid from outside the allowed countries → refund, never unlock. */
async function rejectForCountry(doc, pi, countries) {
  const payments = collections.payments();
  const claimed = await payments.findOneAndUpdate(
    { _id: doc._id, rejectState: { $nin: ['refunding', 'refunded'] } },
    { $set: { status: 'rejected_country', rejectState: 'refunding', rejectedCountries: countries, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  if (!claimed) return payments.findOne({ _id: doc._id });
  try {
    await getStripe().refunds.create(
      { payment_intent: pi.id, reason: 'requested_by_customer', metadata: { paymentRef: doc.ref, reason: 'country_gate' } },
      { idempotencyKey: `gate-refund-${doc.ref}` },
    );
  } catch (e) {
    await payments.updateOne({ _id: doc._id }, { $set: { rejectState: 'refund_failed', updatedAt: new Date() } });
    throw e;
  }
  console.warn(`[Payments] Payment ${doc.ref} refused by the country gate (${countries.join(',')}) and refunded`);
  return payments.findOneAndUpdate({ _id: doc._id }, { $set: { rejectState: 'refunded', refundedAt: new Date(), updatedAt: new Date() } }, { returnDocument: 'after' });
}

/**
 * The single confirm path. Safe to call any number of times, concurrently, from anywhere:
 * `payment.confirmed` is emitted at most once per payment (layer 2), and its listener tolerates a
 * repeat anyway (layer 3).
 */
async function confirmFromIntent(pi, source = 'webhook') {
  const payments = collections.payments();
  const doc = await findPaymentForIntent(pi);
  if (!doc) { console.warn(`[Payments] ${source}: no payment for PaymentIntent ${pi?.id}`); return null; }
  if (!doc.paymentIntentId && pi?.id) await payments.updateOne({ _id: doc._id, paymentIntentId: { $exists: false } }, { $set: { paymentIntentId: pi.id } });
  if (pi.status !== 'succeeded') return syncStatus(doc, pi);

  if (doc.status === 'refunded') return doc;
  if (doc.status === 'rejected_country') return doc.rejectState === 'refunded' ? doc : rejectForCountry(doc, pi, doc.rejectedCountries || []);
  if (doc.status === 'paid' && doc.confirmState === 'done') return doc;

  // Gate, stage 3 (backstop): what was actually charged.
  const charged = await chargeOrigin(pi);
  if (charged.type && !ALLOWED_METHOD_TYPES.has(charged.type)) return rejectForCountry(doc, pi, [`method:${charged.type}`]);
  const allowed = Array.isArray(doc.allowedCountries) && doc.allowedCountries.length
    ? doc.allowedCountries
    : (await resolvePaymentConfig(new Date(doc.createdAt))).allowedCountries;
  if (charged.countries.some((c) => !allowed.includes(c))) return rejectForCountry(doc, pi, charged.countries);

  const now = new Date();
  const claimed = await payments.findOneAndUpdate(
    {
      _id: doc._id,
      $or: [{ confirmState: { $exists: false } }, { confirmState: 'claiming', claimedAt: { $lt: new Date(now.getTime() - CLAIM_STALE_MS) } }],
    },
    [{ $set: {
      unlockId: { $ifNull: ['$unlockId', newUnlockId('pay')] },
      confirmState: 'claiming',
      claimedAt: now,
      status: 'paid',
      paidAt: { $ifNull: ['$paidAt', now] },
      updatedAt: now,
      expiresAt: new Date(now.getTime() + PAID_TTL_MS),
    } }],
    { returnDocument: 'after' },
  );
  if (!claimed) return payments.findOne({ _id: doc._id }); // someone else holds (or finished) the claim

  await paymentEvents.emit('payment.confirmed', { paymentRef: claimed.ref, codeHash: claimed.codeHash, priceId: claimed.priceId, idempotencyKey: pi.id });
  return payments.findOneAndUpdate({ _id: claimed._id }, { $set: { confirmState: 'done', updatedAt: new Date() } }, { returnDocument: 'after' });
}

// ─────────────────────────────────────────────────────────────
// Status + delivery (called by the paywall with the seal)
// ─────────────────────────────────────────────────────────────

async function statusForClient(ref, sealedOrbCode) {
  const payments = collections.payments();
  const doc = await payments.findOne({ ref: String(ref || '') });
  if (!doc) throw new PaymentError('not_found', 404);
  const orbCode = openSealFor(doc, sealedOrbCode);

  const unsettled = !FINAL.includes(doc.status)
    || (doc.status === 'paid' && doc.confirmState !== 'done')
    || (doc.status === 'rejected_country' && doc.rejectState !== 'refunded');
  const stripe = getStripe();
  if (unsettled && stripe && doc.paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(doc.paymentIntentId);
      await confirmFromIntent(pi, 'poll');
    } catch (e) {
      console.warn('[Payments] status refresh failed:', e.message);
    }
  }

  const current = await payments.findOne({ _id: doc._id });
  // The raw code leaves the server here, once the unlock is on the ledger — exactly like a
  // redeemed activation code.
  if (current.status === 'paid' && current.confirmState === 'done') return { status: 'paid', orbCode };
  if (current.status === 'paid' || current.status === 'creating') return { status: 'processing' };
  return { status: current.status };
}

/** Download log: the unlocked PDF was saved. A timestamp only. */
async function markDelivered(ref, sealedOrbCode) {
  const payments = collections.payments();
  const doc = await payments.findOne({ ref: String(ref || '') });
  if (!doc) throw new PaymentError('not_found', 404);
  openSealFor(doc, sealedOrbCode);
  if (doc.status !== 'paid' || !doc.unlockId) throw new PaymentError('not_paid', 409);
  const at = new Date();
  await payments.updateOne({ _id: doc._id, deliveredAt: { $exists: false } }, { $set: { deliveredAt: at } });
  await markUnlockDelivered(doc.unlockId, at);
  return { delivered: true };
}

/** A payment for this report is still under way or done: its card draft must survive a discard. */
async function hasLivePayment(codeHash) {
  if (!codeHash) return false;
  return !!(await collections.payments().findOne({ codeHash, status: { $in: LIVE } }, { projection: { _id: 1 } }));
}

/** Subset of the given hashes that have a live payment (nightly sweep). */
async function codeHashesWithLivePayment(hashes) {
  if (!hashes?.length) return new Set();
  const rows = await collections.payments().find({ codeHash: { $in: hashes }, status: { $in: LIVE } }, { projection: { codeHash: 1 } }).toArray();
  return new Set(rows.map((r) => r.codeHash));
}

// ─────────────────────────────────────────────────────────────
// Webhook
// ─────────────────────────────────────────────────────────────

async function beginEvent(event) {
  const now = new Date();
  try {
    await collections.stripeEvents().insertOne({ eventId: event.id, type: event.type, status: 'processing', receivedAt: now, expiresAt: new Date(now.getTime() + EVENT_TTL_MS) });
    return true;
  } catch (e) {
    if (e?.code !== 11000) throw e;
    const reclaimed = await collections.stripeEvents().findOneAndUpdate(
      { eventId: event.id, status: 'processing', receivedAt: { $lt: new Date(now.getTime() - EVENT_STALE_MS) } },
      { $set: { receivedAt: now } },
      { returnDocument: 'after' },
    );
    return !!reclaimed;
  }
}
const finishEvent = (id) => collections.stripeEvents().updateOne({ eventId: id }, { $set: { status: 'done', doneAt: new Date() } });
const abandonEvent = (id) => collections.stripeEvents().deleteOne({ eventId: id, status: 'processing' });

async function handleChargeRefunded(charge) {
  if (!charge?.refunded) return; // partial refunds don't revoke the report
  const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!piId) return;
  const doc = await collections.payments().findOne({ paymentIntentId: piId });
  if (doc?.status === 'rejected_country') return; // our own gate refund: nothing was unlocked
  if (doc?.refundInitiatedAt && Date.now() - new Date(doc.refundInitiatedAt).getTime() < ADMIN_REFUND_GUARD_MS) return;
  await paymentEvents.emit('payment.revoked', { paymentRef: doc?.ref || null, paymentIntentId: piId, reason: 'refund', by: 'stripe' });
}

async function handleDispute(dispute) {
  const piId = typeof dispute?.payment_intent === 'string' ? dispute.payment_intent : dispute?.payment_intent?.id;
  if (!piId) return;
  const at = new Date();
  const set = { disputedAt: at, disputeStatus: dispute.status || null, disputeReason: dispute.reason || null };
  await collections.payments().updateOne({ paymentIntentId: piId }, { $set: set });
  await collections.reportUnlocks().updateOne({ method: 'payment', reference: piId }, { $set: set });
  console.warn(`[Payments] ⚠ Dispute opened for ${piId} (${dispute.reason || 'no reason'})`);
}

async function handleStripeEvent(event) {
  const obj = event?.data?.object;
  switch (event.type) {
    case 'payment_intent.succeeded':
      await confirmFromIntent(obj, 'webhook');
      break;
    case 'payment_intent.processing':
    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled':
    case 'payment_intent.requires_action': {
      const doc = await findPaymentForIntent(obj);
      if (doc) await syncStatus(doc, obj);
      break;
    }
    case 'charge.refunded':
      await handleChargeRefunded(obj);
      break;
    case 'charge.dispute.created':
      await handleDispute(obj);
      break;
    default:
      break; // not ours to handle
  }
}

/** Verify, dedupe, handle. Returns { status, body } for the route. */
async function handleWebhook(rawBody, signature) {
  const secret = config.stripe.webhookSecret;
  if (!secret) return { status: 503, body: { error: 'webhook_not_configured' } };
  let event;
  try {
    event = webhooks().constructEvent(rawBody, signature, secret);
  } catch {
    return { status: 400, body: { error: 'invalid_signature' } };
  }
  if (!(await beginEvent(event))) {
    console.log(`[Payments] duplicate event ${event.id} (${event.type}) ignored`);
    return { status: 200, body: { received: true, duplicate: true } };
  }
  try {
    await handleStripeEvent(event);
    await finishEvent(event.id);
    return { status: 200, body: { received: true } };
  } catch (e) {
    console.error(`[Payments] ❌ event ${event.id} (${event.type}) failed:`, e.message);
    await abandonEvent(event.id).catch(() => {});
    return { status: 500, body: { error: 'processing_failed' } };
  }
}

// ─────────────────────────────────────────────────────────────
// Admin refund (guarantee) — the money goes back through Stripe first
// ─────────────────────────────────────────────────────────────

async function adminRefund({ id, by, review }) {
  const { current } = await precheckRefund({ id, by, review });
  const viaStripe = /^pi_/.test(String(current.reference || ''));
  if (viaStripe) {
    const stripe = getStripe();
    if (!stripe) throw new PaymentError('unavailable', 503);
    await collections.payments().updateOne({ paymentIntentId: current.reference }, { $set: { refundInitiatedAt: new Date() } });
    await stripe.refunds.create(
      { payment_intent: current.reference, reason: 'requested_by_customer', metadata: { reason: 'guarantee' } },
      { idempotencyKey: `guarantee-refund-${current.unlockId}` },
    );
  }
  try {
    const result = await refundUnlock({ id, by, review, channel: viaStripe ? 'stripe' : 'manual' });
    if (viaStripe) await collections.payments().updateOne({ paymentIntentId: current.reference }, { $set: { status: 'refunded', refundedAt: new Date(), updatedAt: new Date() } });
    return result;
  } catch (e) {
    // The webhook echo beat us to the ledger: the refund is recorded either way.
    if (viaStripe && e instanceof RefundError && e.code === 'already_refunded') {
      return { ...(await collections.reportUnlocks().findOne({ _id: current._id })), codeBlocked: true, accountEffect: null, secondRefund: false };
    }
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────
// Product-side listeners — the only place the product reacts to payments
// ─────────────────────────────────────────────────────────────

async function onPaymentConfirmed({ paymentRef }) {
  const doc = await collections.payments().findOne({ ref: paymentRef });
  if (!doc?.unlockId) throw new Error(`payment ${paymentRef} has no claimed unlock`);
  try {
    await recordUnlock({
      unlockId: doc.unlockId,
      method: 'payment',
      reference: doc.paymentIntentId,
      referenceHint: doc.ref,
      codeHash: doc.codeHash,
      email: readEmail(doc.email),
      amountCents: doc.amountCents,
      currency: doc.currency || 'EUR',
      taxCents: doc.taxCents,
      vatRate: doc.vatRate,
      consent: doc.consent,
      // Stripe TEST-mode payments stay out of the real bookkeeping sequence (TEST- numbers).
      testmode: doc.livemode === false,
    });
  } catch (e) {
    if (e?.code !== 11000) throw e; // already on the ledger — a repeat is a no-op
  }
}

async function onPaymentRevoked({ paymentIntentId, by }) {
  const unlock = await collections.reportUnlocks().findOne({ method: 'payment', reference: paymentIntentId });
  if (!unlock || unlock.status !== 'active') return;
  try {
    await refundUnlock({ id: unlock._id, by: by || 'stripe', channel: 'stripe', external: true });
  } catch (e) {
    if (e instanceof RefundError && e.code === 'already_refunded') return;
    throw e;
  }
  await collections.payments().updateOne({ paymentIntentId }, { $set: { status: 'refunded', refundedAt: new Date(), updatedAt: new Date() } });
}

paymentEvents.on('payment.confirmed', onPaymentConfirmed);
paymentEvents.on('payment.revoked', onPaymentRevoked);

module.exports = {
  PaymentError,
  payFullReport,
  confirmFromIntent,
  statusForClient,
  markDelivered,
  hasLivePayment,
  codeHashesWithLivePayment,
  handleWebhook,
  adminRefund,
};
