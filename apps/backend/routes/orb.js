const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const { authRequired } = require('../middleware/auth');
const { hash, decrypt } = require('../services/encryption');
const { signToken } = require('./auth');
const { decodeOrb3 } = require('@gfl/orb-engine');
const { extractReading, sanitizeReading } = require('../services/readingExtract');

// ── Access model (spec 2026-07-07): every code grants ACCESS_MONTHS of platform access,
// cumulative on the current expiry (3→6, 6→9 — never "3 from redemption"). A new code can
// only be attached UPLOAD_GATE_MONTHS after the previous one. Codes claim once, globally.
const ACCESS_MONTHS = 3;
const UPLOAD_GATE_MONTHS = 2;
const addMonths = (date, n) => { const d = new Date(date); d.setMonth(d.getMonth() + n); return d; };

/**
 * POST /api/orb/login
 * Body: { pdfBase64 }
 * Reads ONLY the LC_ORB_ profile code out of the uploaded report, returns it,
 * and discards the PDF immediately — nothing is stored. The code is the login.
 *
 * The code is printed on the report wrapped as  ORB::LC_ORB_…::ORB  so it can be
 * recovered even if pdf text-extraction inserts whitespace mid-string.
 *
 * GATE: a code that has already been LINKED to an account (see POST /link) is DENIED
 * here — once claimed, the account is the credential, so the raw PDF no longer opens it.
 */
router.post('/login', async (req, res) => {
  try {
    const { pdfBase64 } = req.body || {};
    if (!pdfBase64) return res.status(400).json({ error: 'Geen PDF ontvangen.' });

    let text = '';
    try {
      const { PDFParse } = require('pdf-parse');
      const raw = String(pdfBase64).replace(/^data:[^;]+;[^,]*,/, '');
      const buffer = Buffer.from(raw, 'base64');
      const parser = new PDFParse({ data: buffer });
      const parsed = await parser.getText();
      text = parsed.text || '';
      await parser.destroy();
      // buffer + parser go out of scope here — the PDF is never persisted.
    } catch (err) {
      console.error('[orb/login] PDF parse error:', err.message);
      return res.status(422).json({ error: 'PDF kon niet gelezen worden.' });
    }

    const stripped = text.replace(/\s+/g, '');
    // Preferred: explicit ORB::…::ORB marker. Fallback: a bare token.
    // Accept LC_ORB3_ (3D orb), LC_ORB2_ (2D radial) and the legacy LC_ORB_ prefixes.
    const marked = stripped.match(/ORB::(LC_ORB[23]?_[A-Za-z0-9+/=]+?)::ORB/);
    const bare = stripped.match(/LC_ORB[23]?_[A-Za-z0-9+/=]{24,}/);
    const code = marked ? marked[1] : (bare ? bare[0] : null);
    if (!code) return res.status(404).json({ error: 'Geen kristal-code gevonden in deze PDF.' });

    // Extended archetype name — wrapped as ARCH::<base64(UTF-8)>::ARCH on the report so it
    // survives whitespace-stripping. Optional (older reports won't carry it).
    let archetypeName = '';
    const archMatch = stripped.match(/ARCH::([A-Za-z0-9+/=]+)::ARCH/);
    if (archMatch) {
      try { archetypeName = Buffer.from(archMatch[1], 'base64').toString('utf8'); } catch (_) { /* ignore */ }
    }

    // Reading extraction (cardPayload §2.1): main/support archetype + normalized 12-point
    // shape vector from the PROFIEL DATA block. Allowlist-only; `text` is discarded below.
    const reading = extractReading(text);

    // The code IS the login (product decision). A code already LINKED to an account →
    // recognise it and issue a session (skip onboarding). An UNLINKED code (first-time) →
    // { linked:false } so the client runs the account-creation onboarding.
    try {
      const linked = await collections.orbCodes().findOne({ codeHash: hash(code) });
      if (linked) {
        const u = await collections.users().findOne({ _id: new ObjectId(String(linked.userId)) });
        if (u) {
          const email = decrypt(u.email);
          const displayName = decrypt(u.displayName);
          const token = signToken(u._id, email, u.role || 'client');
          return res.json({ code, archetypeName, reading, linked: true, token, user: { id: u._id, email, displayName, role: u.role || 'client', country: u.country || '', age: (u.age != null ? u.age : '') } });
        }
        // linked record but the user is gone → treat as unlinked (allow re-onboarding).
      }
    } catch (e) {
      console.warn('[orb/login] link-check failed (treating as unlinked):', e.message);
    }

    return res.json({ code, archetypeName, reading, linked: false });
  } catch (e) {
    console.error('[orb/login] error:', e.message);
    return res.status(500).json({ error: 'Serverfout bij het lezen van de PDF.' });
  }
});

/**
 * POST /api/orb/link   (auth required)
 * Body: { code }
 * Links an LC_ORB code to the authenticated account — ONCE, globally. After this the
 * code's PDF-upload login is denied (POST /login), so the account becomes the credential.
 *   - already linked to THIS user → ok (idempotent)
 *   - already linked to ANOTHER user → 409 (a code belongs to one account)
 */
router.post('/link', authRequired, async (req, res) => {
  try {
    const { code, archetypeName, reading } = req.body || {};
    if (!code || !/^LC_ORB[23]?_/.test(String(code))) {
      return res.status(400).json({ error: 'Geen geldige kristal-code.' });
    }
    const userId = String(req.user.userId);
    const codeHash = hash(String(code));
    // Server-authored kaart-microcopy draft (stored at generation, keyed by code hash) rides
    // along with whatever the PDF extraction delivered — the draft wins (it never left the server).
    let kaartDraft = null;
    try { kaartDraft = await collections.kaartDrafts().findOne({ codeHash }); } catch { /* ignore */ }
    const cleanReading = sanitizeReading({
      ...(reading || {}),
      ...(kaartDraft && kaartDraft.giftMicro ? { giftMicro: kaartDraft.giftMicro } : {}),
      ...(kaartDraft && kaartDraft.geomSummary ? { geomSummary: kaartDraft.geomSummary } : {}),
    });

    // ── Upload gate: a NEW code can only be attached UPLOAD_GATE_MONTHS after the previous
    // one (idempotent re-links of an owned code bypass this — handled below). Server-side
    // twin of the disabled upload button in the Privé tab.
    const userDoc = await collections.users().findOne(
      { _id: new ObjectId(userId) },
      { projection: { orbHistory: 1, accessUntil: 1 } }
    );
    if (!userDoc) return res.status(404).json({ error: 'Account niet gevonden.' });
    const lastEntry = Array.isArray(userDoc.orbHistory) && userDoc.orbHistory.length
      ? userDoc.orbHistory[userDoc.orbHistory.length - 1] : null;
    const gateOpensAt = lastEntry && lastEntry.at ? addMonths(lastEntry.at, UPLOAD_GATE_MONTHS) : null;
    const gateClosed = gateOpensAt && gateOpensAt > new Date();

    const existing = await collections.orbCodes().findOne({ codeHash });
    if (existing) {
      if (String(existing.userId) === userId) {
        // Idempotent re-link — BACKFILL: an already-owned code re-synced with reading data
        // (e.g. re-uploading the report) fills the extraction fields its history entry lacks.
        if (cleanReading) {
          const setFields = {};
          for (const [k, v] of Object.entries(cleanReading)) setFields[`orbHistory.$.${k}`] = v;
          await collections.users().updateOne(
            { _id: new ObjectId(userId), 'orbHistory.codeHash': codeHash },
            { $set: { ...setFields, updatedAt: new Date() } }
          ).catch((e) => console.warn('[orb/link] reading backfill failed:', e.message));
        }
        return res.json({ linked: true, alreadyOwned: true, backfilled: !!cleanReading });
      }
      return res.status(409).json({ error: 'Deze kristal-code is al aan een ander account gekoppeld.' });
    }

    if (gateClosed) {
      return res.status(403).json({
        error: `Een nieuwe kristal-code kan pas gekoppeld worden vanaf ${gateOpensAt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        nextUploadAvailableAt: gateOpensAt,
      });
    }

    const at = new Date();
    try {
      await collections.orbCodes().insertOne({ codeHash, userId, linkedAt: at });
    } catch (e) {
      // Unique-index race: someone linked it between the check and the insert.
      if (e && e.code === 11000) {
        const now = await collections.orbCodes().findOne({ codeHash });
        if (now && String(now.userId) === userId) return res.json({ linked: true, alreadyOwned: true });
        return res.status(409).json({ error: 'Deze kristal-code is al aan een ander account gekoppeld.' });
      }
      throw e;
    }

    // Crystal timeline: append this code's render-only orb and promote it to the ACTIVE profile orb
    // (most recent = the shown one). Older entries stay in orbHistory for the public/private archive.
    let orb = null; try { orb = decodeOrb3(String(code)) || null; } catch { /* ignore */ }
    const entry = { codeHash, orb, archetypeName: archetypeName ? String(archetypeName) : '', at, ...(cleanReading || {}) };
    // Access extension: cumulative on the current expiry (never from the redemption moment).
    const accessBase = userDoc.accessUntil && new Date(userDoc.accessUntil) > at ? new Date(userDoc.accessUntil) : at;
    const accessUntil = addMonths(accessBase, ACCESS_MONTHS);
    await collections.users().updateOne(
      { _id: new ObjectId(userId) },
      {
        $push: { orbHistory: entry },
        $set: { publicOrb: orb, accessUntil, updatedAt: at, ...(entry.archetypeName ? { archetypeName: entry.archetypeName } : {}) },
      }
    ).catch((e) => console.warn('[orb/link] history update failed:', e.message));

    return res.json({ linked: true, accessUntil });
  } catch (e) {
    console.error('[orb/link] error:', e.message);
    return res.status(500).json({ error: 'Serverfout bij het koppelen van de code.' });
  }
});

module.exports = router;
