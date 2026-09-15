/**
 * Garden For Life — Payments for the full report (public). See services/payments.js.
 *
 * GET  /api/payments/config
 *   200 { enabled, publishableKey, grossCents, currency, allowedCountries, launch, flipAt, locale, termsVersion }
 *
 * POST /api/payments/full-report
 *   body { confirmationTokenId, sealedOrbCode, email, country, consent, consentText, termsVersion, language }
 *   200 { ref, status: 'paid' | 'processing' | 'requires_action' | 'failed', redirectUrl? , clientSecret?, nextAction? }
 *   400 malformed | consent_required · 402 payment_failed · 403 country_not_allowed · 409 already_unlocked | in_progress
 *   410 report_expired · 429 rate_limited · 502 provider_error · 503 unavailable | tax_unavailable
 *
 * POST /api/payments/:ref/status     body { sealedOrbCode } → 200 { status, orbCode? } | 404
 *   orbCode only once the payment is on the ledger — the one moment the raw crystal code leaves the server.
 * POST /api/payments/:ref/delivered  body { sealedOrbCode } → 200 { delivered } | 404 | 409 not_paid
 *
 * The webhook lives in routes/stripeWebhook.js (raw body, mounted before express.json).
 */
const crypto = require('crypto');
const { Router } = require('express');
const config = require('../config');
const { sealCode } = require('../services/sealedCode');
const { resolvePaymentConfig, hasTestAccess } = require('../services/paymentConfig');

// Production TEST mode is locked to this header (config/stripeEnv.js PAYMENTS_TEST_TOKEN).
const testAccessOf = (req) => hasTestAccess(req.get('x-gfl-payments-test'));
const { PaymentError, payFullReport, statusForClient, markDelivered } = require('../services/payments');

const router = Router();

// ── In-memory limiters (per IP) ──
// Pay attempts cost a Stripe Tax calculation each, so every attempt counts, not only failures.
const WINDOW_MS = 15 * 60 * 1000;
function limiter(max) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, e] of hits) if (now > e.resetAt) hits.delete(ip);
  }, WINDOW_MS).unref();
  return (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    const e = hits.get(ip);
    if (!e || now > e.resetAt) hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    else if (e.count >= max) return res.status(429).json({ error: 'rate_limited' });
    else e.count += 1;
    return next();
  };
}
// PAYMENTS_PAY_LIMIT exists for scripts/test-payments.js, which makes far more attempts than a person.
const payLimiter = limiter(Number(process.env.PAYMENTS_PAY_LIMIT) || 20);
const pollLimiter = limiter(600); // the paywall polls every 2.5s while a payment is open

function sendError(res, err, label) {
  if (err instanceof PaymentError) return res.status(err.status).json({ error: err.code, ...err.extra });
  console.error(`[Payments] ${label} error:`, err?.message);
  return res.status(502).json({ error: 'provider_error' });
}

router.get('/config', async (req, res) => {
  try {
    const cfg = await resolvePaymentConfig(new Date(), { testAccess: testAccessOf(req) });
    res.json({
      enabled: cfg.enabled,
      publishableKey: cfg.publishableKey,
      grossCents: cfg.grossCents,
      currency: cfg.currency,
      allowedCountries: cfg.allowedCountries,
      launch: cfg.launch,
      flipAt: cfg.flipAt,
      locale: cfg.locale,
      termsVersion: cfg.termsVersion,
      mode: cfg.mode,
    });
  } catch (err) {
    console.error('[Payments] config error:', err.message);
    res.status(500).json({ error: 'server' });
  }
});

// POST /api/payments/dev-seal — Stripe TEST mode only (404 otherwise): outside production for
// anyone, in production only with the test token. A sealed throwaway test crystal code, so the
// report preview (which runs no AI and therefore has no seal) can take the real payment flow
// through Stripe test mode. Never available in live mode.
router.post('/dev-seal', (req, res) => {
  const testKeys = config.stripe.mode === 'test' && /^(sk|rk)_test_/.test(config.stripe.secretKey);
  if (!testKeys || (process.env.NODE_ENV === 'production' && !testAccessOf(req))) {
    return res.status(404).json({ error: 'not_found' });
  }
  const code = `LC_ORB3_DEVTEST_${crypto.randomBytes(12).toString('hex')}`;
  return res.json({ sealedOrbCode: sealCode(code) });
});

router.post('/full-report', payLimiter, async (req, res) => {
  try {
    const b = req.body || {};
    const result = await payFullReport({
      confirmationTokenId: b.confirmationTokenId,
      sealedOrbCode: b.sealedOrbCode,
      email: b.email,
      country: b.country,
      consent: b.consent,
      consentText: b.consentText,
      termsVersion: b.termsVersion,
      language: b.language,
      origin: req.headers.origin,
      testAccess: testAccessOf(req),
    });
    res.json(result);
  } catch (err) {
    sendError(res, err, 'pay');
  }
});

router.post('/:ref/status', pollLimiter, async (req, res) => {
  try {
    res.json(await statusForClient(req.params.ref, req.body?.sealedOrbCode));
  } catch (err) {
    sendError(res, err, 'status');
  }
});

router.post('/:ref/delivered', pollLimiter, async (req, res) => {
  try {
    res.json(await markDelivered(req.params.ref, req.body?.sealedOrbCode));
  } catch (err) {
    sendError(res, err, 'delivered');
  }
});

module.exports = router;
