/**
 * Garden For Life — Stripe webhook.
 *
 * POST /api/payments/webhook
 * Mounted in server.js BEFORE express.json: signature verification needs the exact raw bytes.
 * Verify → dedupe on the event id → handle (services/payments.js handleWebhook). A duplicate or an
 * event we don't handle answers 200; only a processing failure answers 5xx so Stripe retries.
 */
const express = require('express');
const { handleWebhook } = require('../services/payments');

const router = express.Router();

router.post('/', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  try {
    const { status, body } = await handleWebhook(req.body, req.headers['stripe-signature']);
    res.status(status).json(body);
  } catch (err) {
    console.error('[StripeWebhook] error:', err.message);
    res.status(500).json({ error: 'processing_failed' });
  }
});

module.exports = router;
