/**
 * N1 — refusal free text (Backend Instruction Privacy & Consent v0.1.1 §4.2). Anonymous by design: these
 * handlers read no cookie, no token, no session and no account, and log no body.
 *
 *   GET  /api/refusal-text/consent?lang=nl   the consent text to show and its version id (404: none for this language)
 *   POST /api/refusal-text                   { consent: true, consentVersion, cards: [≤5 { question_id, text }] } → 204
 *
 * 503 while the separate store is not configured (REFUSAL_TEXT_MONGODB_URI): the platform then shows no N1 step.
 * Storage, identifier stripping, encryption, the anonymous queue and retention: services/refusalTextStore.js.
 */

'use strict';

const express = require('express');
const { rateLimit } = require('../middleware/rateLimit');
const N1 = require('../services/refusalTextStore');

const router = express.Router();

router.get('/consent', (req, res) => {
  if (!N1.enabled()) return res.status(503).json({ error: 'not available' });
  const text = N1.consentText(String(req.query.lang || 'nl').toLowerCase());
  if (!text) return res.status(404).json({ error: 'no consent text for this language' });
  res.set('Cache-Control', 'no-store');
  return res.json(text);
});

router.post('/', rateLimit({ name: 'refusal-text', max: 10, windowMs: 60 * 60 * 1000 }), (req, res) => {
  if (!N1.enabled()) return res.status(503).json({ error: 'not available' });
  let entries;
  try {
    entries = N1.buildEntries(req.body);
  } catch (e) {
    if (e instanceof N1.RefusalTextInputError) return res.status(400).json({ error: e.message });
    throw e;
  }
  try {
    N1.queueEntries(entries);
  } catch (e) {
    // the message names the cause (no key, no store) — never the text
    console.error('[N1] could not queue refusal texts:', e.message);
    return res.status(503).json({ error: 'not available' });
  }
  return res.status(204).end();
});

module.exports = router;
