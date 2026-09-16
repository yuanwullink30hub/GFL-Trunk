/**
 * Garden For Life — Report unlocks, the 14-day money-back guarantee and what a refund revokes.
 *
 * A crystal code only works as an account key when its report was UNLOCKED: paid, or opened
 * with an activation code. Every unlock is recorded in `reportUnlocks`, bound to the hash of
 * that report's code (the raw code is never stored; see services/sealedCode.js):
 *
 *   { unlockId, method: 'payment' | 'activation_code' | 'legacy', reference, referenceHint,
 *     codeHash | null, amountCents, currency, unlockedAt, refundableUntil | null,
 *     email? (encrypted), emailHash?,            ← paid reports only, removed when the window closes
 *     status: 'active' | 'refunded', refundedAt?, refundedBy?, refundChannel?,
 *     moderatorReviews?: [{ decision: 'refunded' | 'declined', answers, notes, by, at }], accountEffect? }
 *
 * ACTIVATION: account creation and linking accept a code only when an active unlock exists for
 * it (isCodeActivatable). A code the browser derives itself therefore opens nothing. Codes that
 * were already linked to an account before this rule keep working through that link; beta
 * reports are registered as 'legacy' unlocks by scripts/backfill-legacy-unlocks.js.
 *
 * GUARANTEE: a paid report is fully refundable for REFUND_WINDOW_DAYS. On refund:
 *   - the code is blocked everywhere (PDF login, account creation, linking);
 *   - if an account claimed it: that reading's content is deleted (the slot stays, see below)
 *     and its access is taken off. Readings from OTHER reports keep their full access. When it
 *     was the account's only reading — the account existed because of this report — the
 *     account is deleted;
 *   - the payer's email goes on the grey list (refundGreylist), whether or not an account
 *     exists. For a grey-listed email the moderator asks the review questions and then decides:
 *     refund or decline (moderatorReviews on the ledger row);
 *   - a refund record (PDF) is issued next to the payment record (services/paymentRecords.js).
 *
 * orbHistory is APPEND-ONLY and positional (readingId = userId + index, snapshots are written
 * by index), so a refunded entry keeps its slot as a bare stub { codeHash, at, refundedAt } —
 * everything the reading contained is deleted. Every consumer goes through visibleHistory().
 */
const crypto = require('crypto');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const { hash, encrypt, decrypt } = require('./encryption');
const { issuePaymentRecord, issueRefundRecord } = require('./paymentRecords');

const REFUND_WINDOW_DAYS = 14;
const GREYLIST_YEARS = 2;
const ACCESS_MONTHS = 3; // must match routes/orb.js and the register path in routes/auth.js
const DAY_MS = 24 * 60 * 60 * 1000;
// The payment ↔ report link outlives the refund window by one day (unlink on day 15), and a hold
// keeps it while a refund is still being processed (human ruling 2026-09-16).
const UNLINK_GRACE_DAYS = 1;
const LINK_HOLD_DAYS = 30;

const ORB_CODE_RE = /^LC_ORB[23]?_/;
const addMonths = (date, n) => { const d = new Date(date); d.setMonth(d.getMonth() + n); return d; };
const normEmail = (email) => String(email || '').trim().toLowerCase();
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail(email));

/** Hash of a raw crystal code, or null when there is no usable code (geometry incomplete). */
function codeHashFor(orbCode) {
  return orbCode && ORB_CODE_RE.test(String(orbCode)) ? hash(String(orbCode)) : null;
}

/** orbHistory entries that still count, each with its STORED index. */
function visibleHistory(hist) {
  return (Array.isArray(hist) ? hist : [])
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry && !entry.refundedAt);
}

/**
 * Record an unlock. Called on the internal `payment.confirmed` event (services/payments.js) and
 * when an activation code is redeemed. The email is kept for paid reports only — it is what
 * a refund request is matched on and what the grey list needs — and only for the refund window.
 *
 * Paid unlocks also carry the tax Stripe Tax calculated (taxCents, vatRate — the payment record
 * prints these) and the consent evidence from the paywall ({ consentAt, termsVersion,
 * consentTextHash }). The ledger has no TTL, so that evidence outlives any dispute window.
 */
async function recordUnlock({ unlockId, method, reference, referenceHint = '', orbCode, codeHash, email, amountCents = 0, currency = 'EUR', taxCents, vatRate, consent, testmode = false }) {
  const now = new Date();
  const paid = method === 'payment';
  const doc = {
    unlockId,
    method,
    reference: reference != null ? String(reference) : '',
    referenceHint,
    codeHash: codeHash || codeHashFor(orbCode),
    amountCents,
    currency,
    ...(paid && Number.isFinite(taxCents) ? { taxCents } : {}),
    ...(paid && Number.isFinite(vatRate) ? { vatRate } : {}),
    ...(paid && consent ? { consent } : {}),
    ...(paid && testmode ? { testmode: true } : {}),
    unlockedAt: now,
    refundableUntil: paid ? new Date(now.getTime() + REFUND_WINDOW_DAYS * DAY_MS) : null,
    ...(paid && isEmail(email) ? { email: encrypt(normEmail(email)), emailHash: hash(normEmail(email)) } : {}),
    status: 'active',
  };
  const r = await collections.reportUnlocks().insertOne(doc);
  if (paid) {
    // The payment is recorded either way; a missing PDF is re-issued by ensureRecords().
    await issuePaymentRecord({ ...doc, _id: r.insertedId })
      .catch((e) => console.error('[reportAccess] payment record PDF failed:', e.message));
  }
  return doc;
}

/**
 * Is this crystal code blocked? True when the report behind it was refunded and no other,
 * still-active unlock exists for the same code (someone who paid twice and got one payment
 * back still owns the report).
 */
async function isCodeBlocked(codeHash) {
  if (!codeHash) return false;
  const unlocks = await collections.reportUnlocks()
    .find({ codeHash }, { projection: { status: 1 } }).toArray();
  return unlocks.some((u) => u.status === 'refunded') && !unlocks.some((u) => u.status === 'active');
}

/** May this code open or extend an account? Only when its report was unlocked (and not refunded). */
async function isCodeActivatable(codeHash) {
  if (!codeHash) return false;
  // Stripe TEST-mode unlocks (the payment gates run against production) never open a real account there.
  const filter = { codeHash, status: 'active', ...(process.env.NODE_ENV === 'production' ? { testmode: { $ne: true } } : {}) };
  return !!(await collections.reportUnlocks().findOne(filter, { projection: { _id: 1 } }));
}

/** Grey-list entry for an email hash, or null. */
async function greylistEntry(emailHash) {
  if (!emailHash) return null;
  return collections.refundGreylist().findOne({ emailHash });
}

/**
 * Recompute an account's access window from the readings that still count, the same way it
 * was built: each code adds ACCESS_MONTHS on top of the running expiry (or from its own date
 * once the window had lapsed). Never extends beyond what the account already had.
 */
function recomputeAccessUntil(hist, currentAccessUntil, now) {
  const entries = visibleHistory(hist)
    .map(({ entry }) => entry)
    .filter((e) => e.at)
    .sort((a, b) => new Date(a.at) - new Date(b.at));
  let until = null;
  for (const e of entries) {
    const at = new Date(e.at);
    until = addMonths(until && until > at ? until : at, ACCESS_MONTHS);
  }
  if (!until) return now; // nothing left that grants access → expired as of the refund
  return currentAccessUntil && new Date(currentAccessUntil) < until ? new Date(currentAccessUntil) : until;
}

/**
 * Take a refunded code off the account that claimed it (if any). When it was the account's
 * only reading, the account is deleted; otherwise that reading and its access are revoked.
 */
async function revokeFromAccount(codeHash, now) {
  const link = await collections.orbCodes().findOne({ codeHash });
  if (!link) return null; // never claimed: blocking the code is all there is to do

  const userId = String(link.userId);
  let userObjectId;
  try { userObjectId = new ObjectId(userId); } catch { return { accountMissing: true }; }
  const user = await collections.users().findOne({ _id: userObjectId });
  if (!user) return { accountMissing: true };

  const hist = Array.isArray(user.orbHistory)
    ? user.orbHistory.map((h) => (h && h.codeHash === codeHash && !h.refundedAt ? { ...h, refundedAt: now } : h))
    : [];
  const remaining = visibleHistory(hist);

  if (remaining.length === 0) {
    // The account was opened by (only) this report. Required lazily: routes/auth.js requires this module.
    const { eraseAccountData } = require('../routes/auth');
    await eraseAccountData(userId, user);
    return { accountDeleted: true, accessUntilBefore: user.accessUntil || null };
  }

  await collections.orbCodes().updateOne({ _id: link._id }, { $set: { blockedAt: now } });
  const accessUntil = recomputeAccessUntil(hist, user.accessUntil, now);
  const latest = remaining[remaining.length - 1].entry;
  const set = { accessUntil, updatedAt: now, publicOrb: latest.orb || null };
  if (latest.archetypeName) set.archetypeName = latest.archetypeName;
  // Delete the refunded reading's content; keep only the stub that holds its slot.
  hist.forEach((h, i) => {
    if (h && h.codeHash === codeHash && h.refundedAt === now) set[`orbHistory.${i}`] = { codeHash, at: h.at || null, refundedAt: now };
  });
  await collections.users().updateOne({ _id: userObjectId }, { $set: set });
  return {
    accountDeleted: false,
    accessUntilBefore: user.accessUntil || null,
    accessUntilAfter: accessUntil,
    readingsLeft: remaining.length,
  };
}

class RefundError extends Error {
  constructor(code, message, extra = {}) { super(message); this.code = code; Object.assign(this, extra); }
}

/** The review questions a moderator asks before a grey-listed email gets a second refund. */
const REVIEW_QUESTIONS = ['reason', 'readFully', 'expected'];

function cleanReview(review) {
  const answers = {};
  for (const k of REVIEW_QUESTIONS) {
    const v = String(review?.answers?.[k] || '').trim().slice(0, 1000);
    if (v) answers[k] = v;
  }
  const notes = String(review?.notes || '').trim().slice(0, 2000);
  return Object.keys(answers).length === REVIEW_QUESTIONS.length ? { answers, notes } : null;
}

/**
 * The checks refundUnlock makes before it changes anything, without changing anything. The admin
 * refund route runs this BEFORE asking Stripe to send money back, so a refund that the ledger
 * would refuse (window closed, grey list without review) never leaves the account.
 * Returns { current, moderatorReview, grey }; throws RefundError.
 */
async function precheckRefund({ id, by, review, external = false, now = new Date() }) {
  let _id;
  try { _id = new ObjectId(String(id)); } catch { throw new RefundError('not_found', 'Unlock not found'); }

  const current = await collections.reportUnlocks().findOne({ _id });
  if (!current) throw new RefundError('not_found', 'Unlock not found');
  if (current.method !== 'payment') throw new RefundError('not_refundable', 'Only paid reports can be refunded');
  if (current.status !== 'active') throw new RefundError('already_refunded', 'This report has already been refunded');

  // A provider-initiated refund (Stripe Dashboard, dispute) already returned the money: the window
  // and the moderator review no longer apply — the ledger only has to follow reality.
  const grey = await greylistEntry(current.emailHash);
  if (external) return { current, moderatorReview: null, grey };

  if (!current.refundableUntil || new Date(current.refundableUntil) < now) {
    throw new RefundError('window_closed', `The ${REFUND_WINDOW_DAYS}-day refund window has closed`);
  }
  // Grey-listed email: the moderator asks the review questions first.
  let moderatorReview = null;
  if (grey) {
    const cleaned = cleanReview(review);
    if (!cleaned) {
      throw new RefundError('greylisted', 'This email is on the grey list: complete the moderator review first', {
        previousRefunds: (grey.refunds || []).map((r) => r.refundedAt),
      });
    }
    moderatorReview = { decision: 'refunded', ...cleaned, by, at: now };
  }
  return { current, moderatorReview, grey };
}

/**
 * Refund one unlock under the guarantee. Atomic on the ledger entry (active → refunded), so
 * a double click, two admins or an admin plus the refund webhook cannot refund twice.
 *
 * @param {object} opts
 * @param {string} opts.id          reportUnlocks _id
 * @param {string} opts.by          admin userId, or 'stripe' for provider-initiated refunds
 * @param {object} [opts.review]    { answers: {reason, readFully, expected}, notes } — required when grey-listed
 * @param {string} [opts.channel]   'stripe' (money returned via the Stripe API) | 'manual'
 * @param {boolean} [opts.external] the money was already returned outside the admin (Stripe
 *                                  Dashboard): skip the window and review checks
 * @param {Date}   [opts.now]
 */
async function refundUnlock({ id, by, review, channel = 'manual', external = false, now = new Date() }) {
  const { current, moderatorReview, grey } = await precheckRefund({ id, by, review, external, now });
  const _id = current._id;

  const claimed = await collections.reportUnlocks().findOneAndUpdate(
    { _id, status: 'active' },
    {
      // The refund still has to be processed (Stripe, bank): hold the payment ↔ report link so the
      // day-15 unlink cannot cut it mid-way. The admin can release or renew the hold.
      $set: { status: 'refunded', refundedAt: now, refundedBy: by, refundChannel: channel, linkHeldUntil: new Date(now.getTime() + LINK_HOLD_DAYS * DAY_MS), linkHeldBy: by },
      ...(moderatorReview ? { $push: { moderatorReviews: moderatorReview } } : {}),
    },
    { returnDocument: 'after' },
  );
  if (!claimed) throw new RefundError('already_refunded', 'This report has already been refunded');

  // Grey list: kept GREYLIST_YEARS after the latest refund (TTL index on expiresAt).
  if (claimed.emailHash) {
    await collections.refundGreylist().updateOne(
      { emailHash: claimed.emailHash },
      {
        $set: { email: claimed.email, lastRefundAt: now, expiresAt: addMonths(now, GREYLIST_YEARS * 12) },
        $push: { refunds: { refundedAt: now, reference: claimed.reference } },
        $setOnInsert: { emailHash: claimed.emailHash, createdAt: now },
      },
      { upsert: true },
    );
  }

  let accountEffect = null;
  const codeBlocked = !!claimed.codeHash && await isCodeBlocked(claimed.codeHash);
  if (codeBlocked) {
    accountEffect = await revokeFromAccount(claimed.codeHash, now);
    if (accountEffect) await collections.reportUnlocks().updateOne({ _id }, { $set: { accountEffect } });
    // A card draft for a refunded, never-claimed report has no purpose left.
    await collections.kaartDrafts().deleteOne({ codeHash: claimed.codeHash })
      .catch((e) => console.warn('[reportAccess] kaart-draft cleanup failed:', e.message));
  }
  const refundRecord = await issueRefundRecord(claimed)
    .catch((e) => { console.error('[reportAccess] refund record PDF failed:', e.message); return null; });
  return { ...claimed, accountEffect, codeBlocked, secondRefund: !!grey, refundRecord };
}

/**
 * The moderator's other choice: decline a refund request after the review. Nothing changes
 * for the client's report or account; the decision and the answers are kept on the ledger row.
 */
async function declineRefund({ id, by, review, now = new Date() }) {
  let _id;
  try { _id = new ObjectId(String(id)); } catch { throw new RefundError('not_found', 'Unlock not found'); }
  const cleaned = cleanReview(review);
  if (!cleaned) throw new RefundError('review_incomplete', 'Answer all review questions before deciding');
  const r = await collections.reportUnlocks().findOneAndUpdate(
    { _id, method: 'payment', status: 'active' },
    { $push: { moderatorReviews: { decision: 'declined', ...cleaned, by, at: now } } },
    { returnDocument: 'after', projection: { moderatorReviews: 1 } },
  );
  if (!r) throw new RefundError('not_found', 'No active paid report found');
  return r;
}

/**
 * Data minimisation, run nightly: once the refund window has closed, a paid unlock no longer
 * needs the payer's email. The payment record itself (reference, amount, date, code hash) stays.
 */
async function stripExpiredUnlockEmails(now = new Date()) {
  const r = await collections.reportUnlocks().updateMany(
    { status: 'active', refundableUntil: { $lt: now }, emailHash: { $exists: true } },
    { $unset: { email: '', emailHash: '' } },
  );
  return r.modifiedCount || 0;
}

/** The first day of the month, UTC — the only date an unlinked unlock keeps. */
const monthOf = (d) => {
  const x = new Date(d || Date.now());
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), 1));
};

/**
 * Unlink the payment from the report, run nightly (human ruling 2026-09-16: "unlink the Stripe
 * payment from the orb after the 14 days").
 *
 * During the refund window a paid unlock has to connect money and report: a refund blocks the
 * report's code. Once the window has closed that connection is no longer needed, and it is the one
 * path from a PDF to a real person — the Stripe payment id (card holder's name and email at Stripe)
 * sat next to the code's hash. After unlinking:
 *
 *   report side  (reportUnlocks)   keeps unlockId, method, codeHash, status, testmode, refund effect,
 *                                  and a date rounded to the month — enough for "may this code open an
 *                                  account" and "is it blocked", nothing that points at a payment.
 *   payment side (paymentRecords)  keeps the bookkeeping: number, Stripe id, amount, VAT, date, and the
 *                                  paywall consent evidence (moved here, for disputes) — under a new,
 *                                  opaque unlockRef, so the record can no longer be joined to the report.
 *   payments                       the working document (Stripe id + code hash + email) is deleted.
 *
 * Exact timestamps go too: a payment record's issue time equal to an unlock time would re-link them.
 * Consequence, by design: a chargeback or a Stripe-Dashboard refund AFTER the window can no longer be
 * traced to a report, so it no longer blocks that report's code.
 */
async function unlinkExpiredPayments(now = new Date()) {
  const due = await collections.reportUnlocks().find({
    method: 'payment',
    // The window is 14 days; the link goes on day 15, not the moment the window closes.
    refundableUntil: { $lt: new Date(now.getTime() - UNLINK_GRACE_DAYS * DAY_MS) },
    paymentUnlinked: { $ne: true },
    // A held link stays until the hold runs out (a refund still being processed).
    $or: [{ linkHeldUntil: { $exists: false } }, { linkHeldUntil: null }, { linkHeldUntil: { $lt: now } }],
  }).toArray();

  let unlinked = 0;
  for (const u of due) {
    // Make sure the bookkeeping exists before the link that re-issues it disappears.
    await issuePaymentRecord(u);
    if (u.status === 'refunded') await issueRefundRecord(u);

    const opaqueRef = new ObjectId();
    await collections.paymentRecords().updateMany(
      { unlockRef: u._id },
      { $set: { unlockRef: opaqueRef, ...(u.consent ? { consent: u.consent } : {}) } },
    );
    if (u.reference) await collections.payments().deleteMany({ paymentIntentId: u.reference });

    await collections.reportUnlocks().updateOne(
      { _id: u._id, paymentUnlinked: { $ne: true } },
      {
        $set: {
          paymentUnlinked: true,
          // A random placeholder, not an empty field: the unique payment-reference index
          // (db/index.js, partial on method 'payment') would reject a second row without one.
          reference: `unlinked:${crypto.randomBytes(8).toString('hex')}`,
          unlockedAt: monthOf(u.unlockedAt),
          ...(u.refundedAt ? { refundedAt: monthOf(u.refundedAt) } : {}),
        },
        $unset: {
          referenceHint: '', amountCents: '', currency: '', taxCents: '', vatRate: '',
          consent: '', refundableUntil: '', deliveredAt: '', email: '', emailHash: '',
          disputedAt: '', disputeStatus: '', disputeReason: '', moderatorReviews: '', refundedBy: '',
          linkHeldUntil: '', linkHeldBy: '',
        },
      },
    );
    unlinked += 1;
  }
  return unlinked;
}

/**
 * Keep (or stop keeping) the payment ↔ report link past day 15 — for a refund made late in the
 * window that is still being processed. A hold lasts LINK_HOLD_DAYS from now and can be renewed;
 * releasing it lets the next nightly run unlink as usual. An already-unlinked payment cannot be held.
 * Returns the new linkHeldUntil (null when released), or throws 'not_found' / 'already_unlinked'.
 */
async function holdPaymentLink({ id, hold = true, by = null, now = new Date() }) {
  let _id;
  try { _id = new ObjectId(String(id)); } catch { throw new RefundError('not_found', 'Unlock not found'); }
  const current = await collections.reportUnlocks().findOne({ _id }, { projection: { method: 1, paymentUnlinked: 1 } });
  if (!current || current.method !== 'payment') throw new RefundError('not_found', 'Unlock not found');
  if (current.paymentUnlinked) throw new RefundError('already_unlinked', 'This payment is already unlinked from its report');
  const until = hold ? new Date(now.getTime() + LINK_HOLD_DAYS * DAY_MS) : null;
  await collections.reportUnlocks().updateOne(
    { _id, paymentUnlinked: { $ne: true } },
    hold ? { $set: { linkHeldUntil: until, linkHeldBy: by } } : { $unset: { linkHeldUntil: '', linkHeldBy: '' } },
  );
  return until;
}

/**
 * The download log: when the unlocked PDF was saved (first time only). A timestamp, nothing of the
 * report. The admin uses it to spot paid reports that never reached the client. Never written on an
 * unlinked unlock — an exact time there would point back at the payment.
 */
async function markUnlockDelivered(unlockId, at = new Date()) {
  if (!unlockId) return false;
  const r = await collections.reportUnlocks().updateOne(
    { unlockId, deliveredAt: { $exists: false }, paymentUnlinked: { $ne: true } },
    { $set: { deliveredAt: at } },
  );
  return r.modifiedCount > 0;
}

/** Decrypted email for admin display (null when absent or unreadable). */
function readEmail(stored) {
  if (!stored) return null;
  try { return decrypt(stored) || null; } catch { return null; }
}

/** Message shown by the entry points when a code is blocked. */
const BLOCKED_MESSAGE = 'Deze kristal-code is niet meer geldig: het rapport is terugbetaald.';
/** Message shown when a code was never unlocked (not paid, or not authored by Garden For Life). */
const NOT_UNLOCKED_MESSAGE = 'Deze kristal-code is niet geactiveerd. Alleen een betaald volledig rapport bevat een geldige code.';

const newUnlockId = (prefix) => `${prefix}_${crypto.randomBytes(12).toString('hex')}`;

module.exports = {
  REFUND_WINDOW_DAYS,
  GREYLIST_YEARS,
  REVIEW_QUESTIONS,
  BLOCKED_MESSAGE,
  NOT_UNLOCKED_MESSAGE,
  RefundError,
  codeHashFor,
  visibleHistory,
  recordUnlock,
  isCodeBlocked,
  isCodeActivatable,
  greylistEntry,
  recomputeAccessUntil,
  precheckRefund,
  refundUnlock,
  declineRefund,
  stripExpiredUnlockEmails,
  unlinkExpiredPayments,
  holdPaymentLink,
  UNLINK_GRACE_DAYS,
  LINK_HOLD_DAYS,
  markUnlockDelivered,
  readEmail,
  newUnlockId,
};
