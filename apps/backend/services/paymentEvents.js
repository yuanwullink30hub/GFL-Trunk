/**
 * Garden For Life — Internal payment events.
 *
 * The one boundary between the payment provider and the product. Provider code (webhook, status
 * poll) emits; product code (the report-unlock ledger) listens. Nothing on the product side ever
 * learns which provider or which webhook fired.
 *
 *   payment.confirmed  { paymentRef, codeHash, priceId, idempotencyKey }
 *   payment.revoked    { paymentRef, reason: 'refund' | …, by? }
 *
 * emit() awaits every listener in order and rethrows the first failure, so the caller can answer
 * the webhook with a 5xx and let Stripe retry. Listeners must be idempotent — double delivery is
 * prevented upstream (services/payments.js) AND tolerated here.
 */
const listeners = new Map();

function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, []);
  const list = listeners.get(name);
  if (!list.includes(fn)) list.push(fn);
}

async function emit(name, payload) {
  for (const fn of listeners.get(name) || []) await fn(payload);
}

module.exports = { on, emit };
