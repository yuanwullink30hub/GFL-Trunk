/**
 * N1 — refusal free text (Backend Instruction Privacy & Consent v0.1.1, §3, §4.2, §4.7, §5).
 *
 * After the test, a user who left at least one Layer-2 card empty may write, in their own words, what they
 * would have answered. With their explicit opt-in the texts are kept for at most 12 months, only to improve
 * the questions. They never enter scores or the report.
 *
 * What one stored entry is — and nothing else (privacy acceptance test 2):
 *   { _id: random, question_id, text: encrypted, consent_version, month: 'YYYY-MM', scope: 'refusal_text_quality' }
 * question_id (owner, 13 Oct): a text is only useful next to the question it answers. It names a question
 * of the bank, never a person, and only ids the bank holds are accepted, so the field cannot carry anything
 * else. No session, account, request, device or sequence id; no IP; no level; no position (the rotation
 * sequence would turn it back into a quarter); no time finer than the month. The _id is random because
 * MongoDB's default ObjectId embeds a creation timestamp.
 *
 * Guardrails:
 *   §4.2  obvious direct identifiers (e-mail addresses, phone numbers, URLs) are stripped before storage
 *   §5.2  writes go through the anonymous queue (batched, shuffled, randomised flush): write time cannot be
 *         matched to a session in any log
 *   §5.3  nothing here logs a text, an entry or a request body
 *   §5.4  a separate store with its own credentials: REFUSAL_TEXT_MONGODB_URI. Without it N1 is OFF and the
 *         endpoint says so (503), so the platform never asks for consent it cannot honour
 *   §5.5  encrypted at rest, same standard as e-mail and display name (services/encryption.js)
 *   §5.6  every consent text has a version id; an entry stores the version that was shown
 *   §4.7  the retention job deletes entries 12 months after their month
 */

'use strict';

const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { createAnonQueue } = require('./anonQueue');
const { encrypt } = require('./encryption');

const SCOPE = 'refusal_text_quality';
const RETENTION_MONTHS = 12;
const MAX_CARDS = 5;
const MAX_TEXT = 2000;
const COLLECTION = 'refusal_texts';

/**
 * The consent texts, by version id (§5.6). A changed text is a new version; the old one stays here, because
 * stored entries reference it. DRAFT: the wording is §4.2's, to be approved by the privacy adviser (D4). There
 * is no English text yet: an English report gets no N1 step until one is approved.
 */
const CONSENT_TEXTS = {
  'n1-nl-v0.1-draft': {
    lang: 'nl',
    title: 'Help ons de test verbeteren (optioneel)',
    body: [
      'Bij een paar vragen koos je geen van de precieze antwoorden. Wil je in je eigen woorden schrijven wat je wél had geantwoord? Dat helpt ons de antwoorden beter te maken.',
      'Wat je schrijft wordt los van jou en je rapport bewaard: zonder naam, account of datum, en het komt niet in je rapport. Daardoor kunnen we het later niet meer aan jou koppelen of op verzoek terugvinden. Schrijf daarom geen namen of andere gegevens waaraan je herkend kunt worden. We bewaren de teksten maximaal 12 maanden.',
    ],
    checkbox: 'Ik geef toestemming om mijn antwoorden hiervoor te gebruiken.',
    skip: 'Overslaan',
  },
};
/** The version shown today, per language. */
const CURRENT_CONSENT = { nl: 'n1-nl-v0.1-draft' };

class RefusalTextInputError extends Error {}

// ── §4.2: strip obvious direct identifiers; no heavier rewriting ──
const EMAIL = /[^\s@<>()[\]",;:]+@[^\s@<>()[\]",;:]+\.[a-z]{2,}/gi;
const URL = /\b(?:https?:\/\/|www\.)[^\s<>"]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:nl|be|com|org|net|eu|de|io|info|me)\b(?:\/[^\s<>"]*)?/gi;
// A phone number: 9 or more digits, optionally led by + or 00, with the usual separators in between.
const PHONE = /(?:\+|\b00)?\d[\d\s\-./()]{7,}\d/g;

function stripIdentifiers(text) {
  return String(text)
    .replace(EMAIL, '[e-mail]')
    .replace(URL, '[link]')
    .replace(PHONE, (m) => (m.replace(/\D/g, '').length >= 9 ? '[telefoon]' : m));
}

/** 'YYYY-MM' in Europe/Amsterdam — the finest time an entry may carry. */
function monthOf(date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit' }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}`;
}

/** The month n months before `month` ('YYYY-MM'). */
function monthsBefore(month, n) {
  const [y, m] = month.split('-').map(Number);
  const i = y * 12 + (m - 1) - n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
}

/**
 * The question ids a text may name: the two-layer bank's (the same file services/twoLayerBank.js serves, the
 * ratified Leerling bank v1.0).
 */
let bankIds = null;
function knownQuestionIds() {
  if (!bankIds) bankIds = new Set(require('../engine/data/question_bank_leerling_v1_0.json').questions.map((q) => q.question_id));
  return bankIds;
}

/**
 * Validate a submission and turn it into the entries to store. Throws RefusalTextInputError on anything
 * malformed — never coerces. Empty (skipped) cards are dropped; a submission of only skipped cards yields [].
 * @param {{ consent: boolean, consentVersion: string, cards: { question_id: string, text: string }[] }} body
 * @param {Date} [now]
 * @param {Set<string>} [questionIds]  the bank's ids (tests may pass their own)
 */
function buildEntries(body, now = new Date(), questionIds = knownQuestionIds()) {
  if (!body || typeof body !== 'object') throw new RefusalTextInputError('no submission');
  if (body.consent !== true) throw new RefusalTextInputError('consent is required');
  if (!Object.prototype.hasOwnProperty.call(CONSENT_TEXTS, body.consentVersion)) throw new RefusalTextInputError('unknown consent version');
  const { cards } = body;
  if (!Array.isArray(cards) || cards.length < 1 || cards.length > MAX_CARDS) throw new RefusalTextInputError(`1–${MAX_CARDS} cards`);
  for (const c of cards) {
    if (!c || typeof c !== 'object' || Object.keys(c).sort().join() !== 'question_id,text') throw new RefusalTextInputError('a card is { question_id, text }');
    if (typeof c.text !== 'string') throw new RefusalTextInputError('a text must be a string');
    if (c.text.length > MAX_TEXT) throw new RefusalTextInputError(`a text is longer than ${MAX_TEXT} characters`);
    if (!questionIds.has(c.question_id)) throw new RefusalTextInputError('unknown question');
  }
  if (new Set(cards.map((c) => c.question_id)).size !== cards.length) throw new RefusalTextInputError('one card per question');
  const month = monthOf(now);
  return cards
    .map((c) => ({ question_id: c.question_id, text: stripIdentifiers(c.text.trim()).trim() }))
    .filter((c) => c.text)
    .map((c) => ({ question_id: c.question_id, text: c.text, consent_version: body.consentVersion, month, scope: SCOPE }));
}

const FIELDS = ['consent_version', 'month', 'question_id', 'scope', 'text'];

/** The stored document: exactly the five fields, the text encrypted, plus a random key. Anything else throws. */
function storedDoc(entry, enc = encrypt) {
  if (Object.keys(entry).sort().join() !== FIELDS.join()) throw new Error(`a refusal-text entry carries exactly ${FIELDS.join(', ')}`);
  const text = enc(entry.text);
  if (!text || text === entry.text) throw new Error('refusal texts are stored encrypted (ENCRYPTION_KEY)');
  return {
    _id: crypto.randomBytes(12).toString('hex'), question_id: entry.question_id, text,
    consent_version: entry.consent_version, month: entry.month, scope: SCOPE,
  };
}

// ── the separate store ──
let client = null;
async function collection() {
  if (!client) {
    client = new MongoClient(process.env.REFUSAL_TEXT_MONGODB_URI);
    await client.connect();
  }
  return client.db().collection(COLLECTION);
}

const enabled = () => Boolean(process.env.REFUSAL_TEXT_MONGODB_URI);

const queue = createAnonQueue({
  sink: async (rows) => { await (await collection()).insertMany(rows.map((r) => storedDoc(r)), { ordered: false }); },
});

/** Queue validated entries for storage. Encrypts once now as a check, so a missing key fails the request, not the flush. */
function queueEntries(entries) {
  if (!enabled()) throw new Error('refusal-text store not configured');
  for (const e of entries) storedDoc(e);
  for (const e of entries) queue.push(e);
}

/**
 * §4.7: delete every entry whose month lies 12 or more months back, so no text is kept longer than 12 months.
 * @returns {Promise<number>} how many were deleted
 */
async function purgeExpired(now = new Date(), coll = null) {
  const c = coll || (enabled() ? await collection() : null);
  if (!c) return 0;
  const cutoff = monthsBefore(monthOf(now), RETENTION_MONTHS);
  const r = await c.deleteMany({ month: { $lte: cutoff } });
  return r.deletedCount || 0;
}

/** Run the retention job now and then once a day (never keeps the process alive). */
function startRetentionJob() {
  if (!enabled()) return null;
  const run = () => purgeExpired().then((n) => { if (n) console.log(`[N1] retention: ${n} refusal texts past 12 months deleted`); })
    .catch((e) => console.error('[N1] retention job failed:', e.message));
  run();
  const t = setInterval(run, 24 * 60 * 60e3);
  if (typeof t.unref === 'function') t.unref();
  return t;
}

/** The consent text to show, with its version id; null when this language has none approved. */
function consentText(lang) {
  const version = CURRENT_CONSENT[lang === 'en' ? 'en' : 'nl'];
  return version ? { version, scope: SCOPE, maxCards: MAX_CARDS, retentionMonths: RETENTION_MONTHS, ...CONSENT_TEXTS[version] } : null;
}

module.exports = {
  SCOPE, RETENTION_MONTHS, MAX_CARDS, MAX_TEXT, CONSENT_TEXTS, CURRENT_CONSENT, RefusalTextInputError,
  stripIdentifiers, monthOf, monthsBefore, buildEntries, storedDoc, queueEntries, purgeExpired, startRetentionJob,
  consentText, enabled,
  /** Tests only: write the waiting batch now instead of at the random moment. */
  flushQueue: () => queue.flush(),
  /** Tests only: drop the store connection. */
  close: async () => { if (client) { await client.close(); client = null; } },
};
