/**
 * Payment boundary for the full report (Stripe, server-enforced).
 *
 * The paywall talks only to these functions. The backend decides everything that matters — price,
 * country gate, consent version, whether a payment is paid — see apps/backend/services/payments.js.
 *
 *   GET  /api/payments/config                 → { enabled, publishableKey, grossCents, currency, allowedCountries, launch, flipAt, locale, termsVersion }
 *   POST /api/payments/full-report            → { ref, status, redirectUrl? | clientSecret + nextAction:'sdk' } | { error }
 *   POST /api/payments/:ref/status   {seal}   → { status, orbCode? }  (orbCode once the payment is on the ledger)
 *   POST /api/payments/:ref/delivered {seal}  → { delivered }         (download log: a timestamp only)
 *
 * The browser only ever holds the SEALED crystal code; it is sent with every call so the server can
 * prove the payment belongs to this report. The raw code comes back once, with status 'paid'.
 *
 * Alternative unlock — one-time activation code (independent of payments):
 *   POST /api/activation-codes/redeem   body { code, sealedOrbCode }
 *     -> 200 { unlockId, orbCode } | 410 report_expired | 400 malformed | 404 invalid | 409 used | 429 rate_limited
 */

// Resolved on call, not at import, so the module is safe to import outside a browser.
const apiBase = () => import.meta.env.VITE_API_URL
  || (window.location.hostname === 'localhost' ? 'http://localhost:8080/api' : 'https://api.gardenforlife.nl/api');

/** Terminal states that mean "not paid, the user can try again". */
export const UNSUCCESSFUL_STATUSES = ['failed', 'canceled'];

/**
 * DEV builds only: the token that unlocks Stripe TEST mode on the production backend for the
 * payment gates (backend PAYMENTS_TEST_TOKEN). Vite strips this from production builds.
 */
export const paymentTestHeaders = () => (import.meta.env.DEV && import.meta.env.VITE_PAYMENTS_TEST_TOKEN
  ? { 'X-GFL-Payments-Test': import.meta.env.VITE_PAYMENTS_TEST_TOKEN }
  : {});

async function postJson(path, body) {
  const res = await fetch(`${apiBase()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...paymentTestHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

let configPromise = null;
/**
 * Payment config from the server. A failed fetch resolves to { enabled: false, failed: true } so the
 * paywall disables paying instead of showing a price it can't vouch for. Not cached on failure.
 */
export function getPaymentConfig() {
  if (!configPromise) {
    configPromise = fetch(`${apiBase()}/payments/config`, { headers: paymentTestHeaders() })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`config ${res.status}`))))
      .catch(() => { configPromise = null; return { enabled: false, failed: true }; });
  }
  return configPromise;
}

/**
 * Pay for the full report with a ConfirmationToken from the Payment Element.
 * @returns {Promise<{ ref, status, redirectUrl?, clientSecret?, nextAction? } | { error, stage?, allowedCountries?, declineCode? }>}
 */
export async function payFullReport(params) {
  try {
    const { data } = await postJson('/payments/full-report', params);
    return data && (data.ref || data.error) ? data : { error: 'provider_error' };
  } catch {
    return { error: 'network' };
  }
}

/** Server-confirmed status of a payment; orbCode only once paid. */
export async function getPaymentStatus(ref, sealedOrbCode) {
  const { ok, data } = await postJson(`/payments/${encodeURIComponent(ref)}/status`, { sealedOrbCode });
  if (!ok) throw new Error(data?.error || 'status failed');
  return { status: data.status, orbCode: data.orbCode || '' };
}

/** Download log: the unlocked PDF was saved. Fire-and-forget. */
export function markPaymentDelivered(ref, sealedOrbCode) {
  if (!ref || !String(ref).startsWith('pay_')) return;
  postJson(`/payments/${encodeURIComponent(ref)}/delivered`, { sealedOrbCode }).catch(() => {});
}

/**
 * Redeem a one-time activation code instead of paying. `sealedOrbCode` is the report's sealed
 * crystal code (unreadable in the browser); the server records the unlock against it and hands
 * back the real code for the PDF.
 * @returns {Promise<{ unlockId: string, orbCode: string } | { error: 'malformed' | 'invalid' | 'used' | 'rate_limited' | 'report_expired' | 'server' | 'network' }>}
 */
export async function redeemActivationCode(code, sealedOrbCode = '') {
  let res;
  try {
    res = await fetch(`${apiBase()}/activation-codes/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, sealedOrbCode }),
    });
  } catch {
    return { error: 'network' };
  }
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.unlockId) return { unlockId: data.unlockId, orbCode: data.orbCode || '' };
  const known = ['malformed', 'invalid', 'used', 'rate_limited', 'report_expired'];
  return { error: known.includes(data.error) ? data.error : 'server' };
}
