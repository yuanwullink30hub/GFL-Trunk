/**
 * Garden For Life — Payment configuration, read at request time.
 *
 * Two flags on one schedule, changeable without a deploy (admin: GET/PUT /api/admin/payment-config):
 *
 *   flipAt                    the equinox instant. Before it the LAUNCH price applies, from it the NORMAL one.
 *   gate.launchCountries      who may buy before the flip (launch: ['NL']).
 *   gate.openCountries        who may buy once the gate opens (NL + EU-26).
 *   gate.openAtFlip           the gate opens at flipAt ONLY when this is true (= OSS registration
 *                             active). The price flips regardless — the flags are separable on purpose.
 *
 * Nothing mutates Stripe at the flip: both Prices exist from day one and the flag selects one per
 * request, so a payment created one second before flipAt charges the launch price and one second
 * after charges the normal price.
 *
 * Amounts come from the Stripe Price objects (scripts/stripe-setup.js), not from this file.
 * FALLBACK_CENTS is display-only for when Stripe is not configured (payments disabled then).
 *
 * TERMS_VERSION must equal the version the paywall sends with its consent
 * (apps/platform/src/config/pricing.js); a stale client is refused with consent_required.
 */
const crypto = require('crypto');
const { collections } = require('../db');
const config = require('../config');
const { getStripe } = require('./stripe');

const TERMS_VERSION = 'av-2.1-2026-09-27';
const EU_26 = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];
const DEFAULTS = {
  flipAt: '2027-03-20T20:25:00.000Z',
  gate: { launchCountries: ['NL'], openCountries: ['NL', ...EU_26], openAtFlip: false },
};
const FALLBACK_CENTS = { launch: 1452, normal: 3630 };
const SETTINGS_ID = 'payments';
const SETTINGS_TTL_MS = 15 * 1000;
const PRICE_TTL_MS = 10 * 60 * 1000;

const COUNTRY_RE = /^[A-Z]{2}$/;
const normCountry = (c) => String(c || '').trim().toUpperCase();

let settingsCache = null; // { value, at }
const priceCache = new Map(); // priceId -> { info, at }

function mergeSettings(stored) {
  const gate = { ...DEFAULTS.gate, ...(stored?.gate || {}) };
  return { flipAt: stored?.flipAt || DEFAULTS.flipAt, gate, updatedAt: stored?.updatedAt || null, updatedBy: stored?.updatedBy || null };
}

async function loadSettings() {
  if (settingsCache && Date.now() - settingsCache.at < SETTINGS_TTL_MS) return settingsCache.value;
  let stored = null;
  try { stored = await collections.paymentSettings().findOne({ _id: SETTINGS_ID }); } catch { /* db hiccup: defaults */ }
  const value = mergeSettings(stored);
  settingsCache = { value, at: Date.now() };
  return value;
}

/** Validate + store an admin change. Throws { code: 'invalid', message } on bad input. */
async function updateSettings(patch, by) {
  const current = await loadSettings();
  const next = { flipAt: current.flipAt, gate: { ...current.gate } };
  const bad = (message) => Object.assign(new Error(message), { code: 'invalid' });

  if (patch.flipAt !== undefined) {
    const d = new Date(patch.flipAt);
    if (Number.isNaN(d.getTime())) throw bad('flipAt is not a valid date');
    next.flipAt = d.toISOString();
  }
  for (const key of ['launchCountries', 'openCountries']) {
    if (patch.gate?.[key] !== undefined) {
      const list = [...new Set((Array.isArray(patch.gate[key]) ? patch.gate[key] : []).map(normCountry))];
      if (!list.length || !list.every((c) => COUNTRY_RE.test(c))) throw bad(`gate.${key} must be a non-empty list of ISO country codes`);
      next.gate[key] = list;
    }
  }
  if (patch.gate?.openAtFlip !== undefined) next.gate.openAtFlip = patch.gate.openAtFlip === true;

  await collections.paymentSettings().updateOne(
    { _id: SETTINGS_ID },
    { $set: { ...next, updatedAt: new Date(), updatedBy: by || null } },
    { upsert: true },
  );
  settingsCache = null;
  return loadSettings();
}

/** Amount + tax code of a Stripe Price (cached). */
async function priceInfo(priceId) {
  const hit = priceCache.get(priceId);
  if (hit && Date.now() - hit.at < PRICE_TTL_MS) return hit.info;
  const stripe = getStripe();
  const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
  const info = {
    id: price.id,
    unitAmount: price.unit_amount,
    currency: String(price.currency || 'eur').toUpperCase(),
    taxBehavior: price.tax_behavior,
    taxCode: (price.product && typeof price.product === 'object' && price.product.tax_code) || null,
  };
  priceCache.set(priceId, { info, at: Date.now() });
  return info;
}

/**
 * Does a request carry the production test token (header X-GFL-Payments-Test)? Timing-safe.
 * Only meaningful in production TEST mode: it unlocks paying with Stripe's test cards for the gates.
 */
function hasTestAccess(headerValue) {
  const expected = config.stripe.testAccessToken;
  const given = String(headerValue || '');
  if (!expected || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Which pieces are configured (never the values) — startup log and the admin view. */
function paymentDiagnostics() {
  const s = config.stripe;
  return {
    mode: s.mode,
    production: process.env.NODE_ENV === 'production',
    secretKey: !!s.secretKey,
    publishableKey: !!s.publishableKey,
    webhookSecret: !!s.webhookSecret,
    priceLaunch: !!s.priceLaunch,
    priceNormal: !!s.priceNormal,
    testAccessToken: !!s.testAccessToken,
  };
}

/**
 * The configuration that applies at `now`.
 * `testAccess`: the request carries the production test token (see hasTestAccess).
 * @returns {Promise<{ enabled, publishableKey, priceKey, priceId, grossCents, currency, locale,
 *   allowedCountries, launch, gateOpen, flipAt, termsVersion, mode, locked }>}
 */
async function resolvePaymentConfig(now = new Date(), { testAccess = false } = {}) {
  const settings = await loadSettings();
  const flipAt = new Date(settings.flipAt);
  const launch = now.getTime() < flipAt.getTime();
  const gateOpen = !launch && settings.gate.openAtFlip === true;
  const priceKey = launch ? 'launch' : 'normal';
  const priceId = launch ? config.stripe.priceLaunch : config.stripe.priceNormal;

  const production = process.env.NODE_ENV === 'production';
  // Production in TEST mode exists for the gates only. Open to everyone, Stripe's test cards would
  // unlock real reports for free — so it is locked to holders of PAYMENTS_TEST_TOKEN.
  const locked = production && config.stripe.mode === 'test' && !testAccess;
  let enabled = !locked && !!(getStripe() && config.stripe.publishableKey && priceId && (!production || config.stripe.webhookSecret));
  let grossCents = FALLBACK_CENTS[priceKey];
  let currency = 'EUR';
  if (enabled) {
    try {
      const info = await priceInfo(priceId);
      grossCents = info.unitAmount;
      currency = info.currency;
      if (info.taxBehavior !== 'inclusive' || currency !== 'EUR') {
        console.error(`[Payments] Price ${priceId} must be EUR and tax-inclusive (got ${currency}/${info.taxBehavior}) — payments disabled`);
        enabled = false;
      }
    } catch (e) {
      console.error('[Payments] Could not load the active Stripe Price — payments disabled:', e.message);
      enabled = false;
    }
  }

  return {
    enabled,
    publishableKey: enabled ? config.stripe.publishableKey : '',
    priceKey,
    priceId: enabled ? priceId : '',
    grossCents,
    currency,
    locale: launch ? 'nl' : 'auto',
    allowedCountries: gateOpen ? settings.gate.openCountries : settings.gate.launchCountries,
    launch,
    gateOpen,
    flipAt: flipAt.toISOString(),
    termsVersion: TERMS_VERSION,
    mode: config.stripe.mode,
    locked,
  };
}

/** Tests: forget cached settings and prices. */
function clearPaymentConfigCache() { settingsCache = null; priceCache.clear(); }

module.exports = {
  TERMS_VERSION,
  EU_26,
  DEFAULTS,
  normCountry,
  hasTestAccess,
  paymentDiagnostics,
  loadSettings,
  updateSettings,
  priceInfo,
  resolvePaymentConfig,
  clearPaymentConfigCache,
};
