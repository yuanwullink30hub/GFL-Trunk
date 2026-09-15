/**
 * Garden For Life — Stripe client.
 *
 * One lazily created client for the whole backend. No STRIPE_SECRET_KEY → getStripe() returns
 * null and every payment path reports `unavailable`; that is the safe default before the account
 * exists. Test and live keys use identical code.
 *
 * Webhook signatures are verified with a separate key-less instance, so verification (and the
 * signed test events in scripts/test-payments.js) never needs an API key.
 */
const Stripe = require('stripe');
const config = require('../config');

// Pinned so a Stripe-side default change can never alter behaviour silently.
const API_VERSION = '2026-08-26.dahlia';

let client = null;
let override; // tests only

function getStripe() {
  if (override !== undefined) return override;
  if (!config.stripe.secretKey) return null;
  if (!client) {
    client = new Stripe(config.stripe.secretKey, {
      apiVersion: API_VERSION,
      maxNetworkRetries: 2,
      appInfo: { name: 'Garden For Life' },
    });
  }
  return client;
}

/** Inject a stub client (scripts/test-payments.js). Pass undefined to restore. */
function setStripeForTests(stub) { override = stub; }

let verifier = null;
function webhooks() {
  if (!verifier) verifier = new Stripe('sk_signature_verification_only', { apiVersion: API_VERSION });
  return verifier.webhooks;
}

module.exports = { getStripe, setStripeForTests, webhooks, API_VERSION };
