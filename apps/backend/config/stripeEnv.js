/**
 * Garden For Life — Stripe key set for the active mode.
 *
 * Both key sets can live in the environment at once; STRIPE_MODE picks one (default: test).
 * Going live is changing STRIPE_MODE to `live` — no other variable has to move.
 *
 * Accepted names per value, first match wins (MODE = TEST | LIVE):
 *   STRIPE_MODE_SECRET_KEY · STRIPE_SECRET_KEY_MODE · STRIPE_SECRET_KEY (only when its prefix is sk_/rk_<mode>_)
 *   STRIPE_MODE_PUBLISHABLE_KEY · STRIPE_PUBLISHABLE_KEY_MODE · STRIPE_PUBLISHABLE_KEY (only pk_<mode>_)
 *   STRIPE_MODE_WEBHOOK_SECRET · STRIPE_WEBHOOK_SECRET_MODE · STRIPE_WEBHOOK_SECRET
 *   STRIPE_MODE_PRICE_LAUNCH · STRIPE_PRICE_LAUNCH_MODE · STRIPE_PRICE_LAUNCH   (same for PRICE_NORMAL)
 *
 * PAYMENTS_TEST_TOKEN: in production, TEST mode is locked to requests carrying this token
 * (header X-GFL-Payments-Test) — otherwise anyone could unlock a real report with Stripe's test cards.
 */
function resolveStripeEnv(env = process.env) {
  const mode = String(env.STRIPE_MODE || '').trim().toLowerCase() === 'live' ? 'live' : 'test';
  const M = mode.toUpperCase();
  const clean = (v) => String(v || '').trim();
  const pick = (base, genericRe) => {
    const specific = [env[`STRIPE_${M}_${base}`], env[`STRIPE_${base}_${M}`]].map(clean).find(Boolean);
    if (specific) return specific;
    const generic = clean(env[`STRIPE_${base}`]);
    return generic && (!genericRe || genericRe.test(generic)) ? generic : '';
  };
  return {
    mode,
    secretKey: pick('SECRET_KEY', new RegExp(`^(sk|rk)_${mode}_`)),
    publishableKey: pick('PUBLISHABLE_KEY', new RegExp(`^pk_${mode}_`)),
    webhookSecret: pick('WEBHOOK_SECRET'),
    priceLaunch: pick('PRICE_LAUNCH'),
    priceNormal: pick('PRICE_NORMAL'),
    testAccessToken: clean(env.PAYMENTS_TEST_TOKEN),
  };
}

module.exports = { resolveStripeEnv };
