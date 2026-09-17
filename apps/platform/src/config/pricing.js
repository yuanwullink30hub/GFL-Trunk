/**
 * Pricing for the paid full report.
 *
 * The short report is free; the full report costs a one-off amount per report, set EXCLUSIVE
 * of VAT:
 *   - launch price € 12,00 excl. btw (€ 14,52 incl. 21%) from launch (27-09-2026) until the
 *     spring equinox,
 *   - regular price € 30,00 excl. btw (€ 36,30 incl. 21%) from the equinox instant:
 *     20-03-2027 20:25 UTC.
 *
 * What the client pays (and Stripe charges) is the amount INCLUDING VAT. Dutch consumer price
 * rules require that incl.-VAT amount to be the price shown; the excl. amount is shown next to
 * it. formatPrice() therefore formats incl. VAT, formatNetPrice() excl. VAT.
 *
 * DISPLAY FALLBACK ONLY. The backend charges the amount of the active Stripe Price, chosen by
 * its own clock and runtime config (GET /api/payments/config, apps/backend/services/paymentConfig.js).
 * The paywall shows that server price and disables paying when it can't load it; these constants
 * only label the results-card button and match the defaults (same equinox instant), so they can
 * never show the launch price after the flip. Keep in sync with the terms (art. 3.6, NL + EN).
 */
export const VAT_RATE = 21;
export const LAUNCH_PRICE = { netCents: 1200, currency: 'EUR' };
export const REGULAR_PRICE = { netCents: 3000, currency: 'EUR' };

/** The amount incl. VAT — what is charged: 1200 → 1452, 3000 → 3630. */
export function grossCents(price) {
  return Math.round((price.netCents * (100 + VAT_RATE)) / 100);
}

/** First moment the regular price applies: the March 2027 equinox, 20-03-2027 20:25 UTC
 *  (21:25 Amsterdam). One instant worldwide; each user sees it in their own timezone. */
export const LAUNCH_PRICE_ENDS_AT = new Date('2027-03-20T20:25:00Z');

export function isLaunchPricing(now = new Date()) {
  return now < LAUNCH_PRICE_ENDS_AT;
}

/** The price that applies right now. */
export function currentPrice(now = new Date()) {
  return isLaunchPricing(now) ? LAUNCH_PRICE : REGULAR_PRICE;
}

/**
 * The terms version the paywall's consent refers to. Sent with every payment and checked by the
 * backend (apps/backend/services/paymentConfig.js TERMS_VERSION) — bump BOTH when the terms change.
 */
export const TERMS_VERSION = 'av-2.2-2026-09-27';

/** Money from cents in a given currency, in the page language: "€ 14,52" / "€14.52". */
export function formatCents(language = 'nl', cents, currency = 'EUR') {
  return money(language, currency, cents);
}

/** Excl.-VAT amount for an incl.-VAT amount at VAT_RATE: 1452 → 1200. */
export function netFromGross(cents) {
  return Math.round((cents * 100) / (100 + VAT_RATE));
}

const money = (language, currency, cents) => new Intl.NumberFormat(language === 'en' ? 'en-IE' : 'nl-NL', {
  style: 'currency',
  currency,
}).format(cents / 100);

/** Price incl. VAT — the price shown to and paid by the client: "€ 14,52" (nl) / "€14.52" (en). */
export function formatPrice(language = 'nl', price = currentPrice()) {
  return money(language, price.currency, grossCents(price));
}

/** Price excl. VAT: "€ 12,00" (nl) / "€12.00" (en). */
export function formatNetPrice(language = 'nl', price = currentPrice()) {
  return money(language, price.currency, price.netCents);
}

/** Launch-price end as month + year only: "maart 2027" (nl) / "March 2027" (en). */
export function formatLaunchPriceEnd(language = 'nl') {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'nl-NL', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(LAUNCH_PRICE_ENDS_AT);
}

/** Launch-price end as month-number + two-digit year: "3-27". */
export function formatLaunchPriceEndShort() {
  return `${LAUNCH_PRICE_ENDS_AT.getUTCMonth() + 1}-${String(LAUNCH_PRICE_ENDS_AT.getUTCFullYear()).slice(-2)}`;
}
