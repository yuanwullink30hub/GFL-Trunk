/**
 * Garden For Life — Auth Routes
 *
 * POST /api/auth/register  — Create account (email + password)
 * POST /api/auth/login     — Login, returns JWT
 * GET  /api/auth/me        — Get current user (auth required)
 */
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { ObjectId } = require('mongodb');
const config = require('../config');
const { collections, getDB, nameKey } = require('../db');
const { authRequired } = require('../middleware/auth');
const { encrypt, decrypt, hash, decryptUser } = require('../services/encryption');
const { decodeOrb3 } = require('@gfl/orb-engine');
const { sanitizeReading } = require('../services/readingExtract');

// Email verification is ENFORCED only when SMTP is configured (so local dev without mail still
// works — those accounts are created pre-verified). Token is single-use, 24h.
const EMAIL_CONFIGURED = !!(config.email && config.email.user && config.email.pass);
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

async function sendVerificationEmail(toEmail, token, req) {
  const base = process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const link = `${base}/api/auth/verify?token=${encodeURIComponent(token)}`;
  const transporter = nodemailer.createTransport({
    host: config.email.host, port: config.email.port, secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  await transporter.sendMail({
    from: `"Garden For Life" <${config.email.from}>`,
    to: toEmail,
    subject: 'Bevestig je account — Garden For Life',
    html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;color:#222">
      <h2 style="color:#7c3aed;margin-bottom:8px">Bevestig je account</h2>
      <p style="line-height:1.6">Welkom bij Garden For Life. Klik op de knop om je e-mailadres te bevestigen en je profiel te activeren.</p>
      <p style="margin:26px 0"><a href="${link}" style="background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">E-mail bevestigen</a></p>
      <p style="color:#888;font-size:13px;line-height:1.5">Werkt de knop niet? Kopieer deze link:<br><span style="word-break:break-all">${link}</span></p>
      <p style="color:#aaa;font-size:12px;margin-top:22px">De link verloopt over 24 uur. Heb je dit niet aangevraagd? Negeer deze e-mail.</p>
    </div>`,
  });
}

// Password changes are gated behind an email confirmation: this sends the click-to-confirm link.
// Shorter-lived than account verification (a sensitive change). Old password stays valid until confirmed.
const PW_CHANGE_TTL_MS = 60 * 60 * 1000; // 1h
async function sendPasswordChangeEmail(toEmail, token) {
  // Land on the deployed FRONTEND (config.siteUrl), which reads ?pwverify and calls the API to
  // apply the change — never the request host (localhost in dev / the API host in prod).
  const link = `${config.siteUrl}/?pwverify=${encodeURIComponent(token)}`;
  const transporter = nodemailer.createTransport({
    host: config.email.host, port: config.email.port, secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  await transporter.sendMail({
    from: `"Garden For Life" <${config.email.from}>`,
    to: toEmail,
    subject: 'Bevestig je nieuwe wachtwoord — Garden For Life',
    html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;color:#222">
      <h2 style="color:#7c3aed;margin-bottom:8px">Bevestig je nieuwe wachtwoord</h2>
      <p style="line-height:1.6">Je hebt gevraagd om je wachtwoord te wijzigen. Klik op de knop om het nieuwe wachtwoord te activeren. Tot dat moment blijft je huidige wachtwoord geldig.</p>
      <p style="margin:26px 0"><a href="${link}" style="background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">Nieuw wachtwoord bevestigen</a></p>
      <p style="color:#888;font-size:13px;line-height:1.5">Werkt de knop niet? Kopieer deze link:<br><span style="word-break:break-all">${link}</span></p>
      <p style="color:#aaa;font-size:12px;margin-top:22px">De link verloopt over 1 uur. Heb je dit niet aangevraagd? Negeer deze e-mail — je wachtwoord blijft ongewijzigd.</p>
    </div>`,
  });
}

// Email changes are gated behind a confirmation click on the NEW address (proves ownership of it).
// Until confirmed, the current email stays active. Same short TTL as the password change.
const EMAIL_CHANGE_TTL_MS = 60 * 60 * 1000; // 1h
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function sendEmailChangeEmail(toNewEmail, token) {
  // Land on the deployed FRONTEND (config.siteUrl); it reads ?emailverify and calls the API.
  const link = `${config.siteUrl}/?emailverify=${encodeURIComponent(token)}`;
  const transporter = nodemailer.createTransport({
    host: config.email.host, port: config.email.port, secure: config.email.secure,
    auth: { user: config.email.user, pass: config.email.pass },
  });
  await transporter.sendMail({
    from: `"Garden For Life" <${config.email.from}>`,
    to: toNewEmail,
    subject: 'Bevestig je nieuwe e-mailadres — Garden For Life',
    html: `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;color:#222">
      <h2 style="color:#7c3aed;margin-bottom:8px">Bevestig je nieuwe e-mailadres</h2>
      <p style="line-height:1.6">Je hebt gevraagd om het e-mailadres van je Garden For Life-account te wijzigen naar dit adres. Klik op de knop om het te activeren. Tot dat moment blijft je huidige e-mailadres geldig.</p>
      <p style="margin:26px 0"><a href="${link}" style="background:linear-gradient(135deg,#a855f7,#7c3aed);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;display:inline-block">Nieuw e-mailadres bevestigen</a></p>
      <p style="color:#888;font-size:13px;line-height:1.5">Werkt de knop niet? Kopieer deze link:<br><span style="word-break:break-all">${link}</span></p>
      <p style="color:#aaa;font-size:12px;margin-top:22px">De link verloopt over 1 uur. Heb je dit niet aangevraagd? Negeer deze e-mail — je e-mailadres blijft ongewijzigd.</p>
    </div>`,
  });
}

const router = Router();

// Render-only public orb config from a raw LC_ORB code. The RAW code is a login
// credential and is never stored/returned — only the decoded (visual) lever config,
// which cannot be used to authenticate.
function publicOrbFromCode(orbCode) {
  if (!orbCode) return null;
  try { return decodeOrb3(String(orbCode)) || null; } catch { return null; }
}

// Public-safe view of a user's orb history (the "crystal timeline"): render-only configs +
// archetype + timestamp, oldest→newest. Strips codeHash — never expose the credential surface.
function publicOrbHistory(u) {
  if (!u || !Array.isArray(u.orbHistory)) return [];
  // baskets12 rides along per entry: /me is OWNER-ONLY, so the 5-mandje stays off the
  // public card (§3) — the dashboard uses it for the chip-hover full-colour radar.
  return u.orbHistory.map((h) => ({
    orb: h.orb || null, archetypeName: h.archetypeName || '', at: h.at || null, image: h.image || null,
    baskets12: Array.isArray(h.baskets12) && h.baskets12.length === 12 ? h.baskets12 : null,
  }));
}

// ─────────────────────────────────────────────────────────────
// cardPayload.v1 — profile-card projection (profile_card_extraction_spec.md)
// ALLOWLIST-ONLY: everything the card renderers may ever see. Two channels:
//   derived  — instrument register (readings/orb/archetype), written only by the
//              orb-link/register path (never by profile edits)
//   declared — self-write register, written only by PATCH /profile & /name
// Renderers (owner Openbaar tab + public ?u= card) consume THIS payload and
// nothing else — owner preview is byte-identical to the third-party response
// (SR-5). Fields not named here do not exist on the card side (SR-8).
// v1 assembles the projection on read from the user doc; a stored card-payload
// collection + extraction-on-event job can replace this without changing renderers.
// ─────────────────────────────────────────────────────────────
const INSTRUMENT_VERSION = '0.9';
const PROVISIONAL = true; // drops at calibration — drives "— VOORLOPIG" strip segments

// Preset-question sections (cardPayload v1.1, declared channel): the user's ANSWERS to
// the fixed §6b kernel questions — a separate readable block next to their free text.
// The free text itself is always self-written; nothing is ever pre-filled.
const SECTION_KEYS = {
  description: ['richting', 'praktijk', 'zelfkennis', 'waarden', 'prijs', 'vrij'],
  intention: ['zoeken', 'bieden', 'vorm', 'nu', 'vrij'],
};
function cleanSections(input, block) {
  if (!Array.isArray(input)) return [];
  const allowed = SECTION_KEYS[block] || [];
  const seen = new Set();
  const out = [];
  for (const s of input) {
    const key = s && String(s.key || '').trim();
    const text = s && String(s.text || '').trim().slice(0, 600);
    if (!key || !text || !allowed.includes(key) || seen.has(key)) continue;
    seen.add(key);
    out.push({ key, text });
  }
  // Fixed §6b order (WAARDEN precedes PRIJS — the "daarvoor" coupling)
  out.sort((a, b) => allowed.indexOf(a.key) - allowed.indexOf(b.key));
  return out;
}

// Socials: fixed key set; each entry is { handle, verified } (verified = platform-OAuth
// ownership proof via /api/social). Legacy docs stored plain handle strings — normalize.
const SOCIAL_KEYS = ['instagram', 'youtube', 'tiktok', 'x', 'linkedin'];
function normSocial(v) {
  if (!v) return null;
  if (typeof v === 'string') return v.trim() ? { handle: v.trim(), verified: false } : null;
  if (typeof v === 'object' && v.handle) return { handle: String(v.handle), verified: !!v.verified };
  return null;
}
function publicSocials(u) {
  const out = {};
  for (const k of SOCIAL_KEYS) {
    const s = normSocial(u && u.socials && u.socials[k]);
    if (s) out[k] = s;
  }
  return out;
}

function buildCardPayload(u) {
  const hist = Array.isArray(u.orbHistory) ? u.orbHistory : [];
  // readingId: stable per entry (userId + index) — orbHistory is append-only.
  const readings = hist.map((h, i) => ({
    readingId: `${u._id}-r${i}`,
    readingDate: h.at || null,
    archetypePrimaryId: h.archetypeName || '', // per-reading (§2.1) — drives the chip-hover microcopy
    archetypeMainId: h.archetypeMainId || null,       // canonical-12 main (extracted)
    archetypeSupportId: h.archetypeSupportId || null, // canonical-12 support (extracted)
    shapeVector12: Array.isArray(h.shapeVector12) && h.shapeVector12.length === 12 ? h.shapeVector12 : null,
    // 5-mandje decomposition — CARD-PUBLIC since 2026-07-08 (user resolved the §3 basket
    // denial: the full-colour wheel shows on every public card). Curse/trigger stays denied.
    baskets12: Array.isArray(h.baskets12) && h.baskets12.length === 12 ? h.baskets12 : null,
    // Reading texts (extracted from the report). levensles + gift + AI card fields are
    // card-public; curse/trigger is DENIED on the public card (§3), owner-side only.
    levensles: h.levensles || null,
    gift: h.gift || null,
    giftMicro: h.giftMicro || null,     // AI-authored in-depth gift description (tendens slot)
    geomSummary: h.geomSummary || null, // AI-authored geometry summary in canon language (expressieprofiel)
    // Opaque render ref (OD-6 interfaced): render-only orb config + optional stored thumb.
    orbRenderRef: { orb: h.orb || null, image: h.image || null },
  }));
  const last = readings.length ? readings[readings.length - 1] : null;
  let nextReadingAvailableAt = null;
  if (last && last.readingDate) {
    const d = new Date(last.readingDate);
    d.setMonth(d.getMonth() + 1);
    nextReadingAvailableAt = d;
  }
  return {
    schemaVersion: 'cardPayload.v1.1', // v1.1: declared description/intention → {text, sections}
    derived: {
      latest: last ? {
        readingId: last.readingId,
        readingDate: last.readingDate,
        archetypePrimaryId: u.archetypeName || '',
        archetypeMainId: last.archetypeMainId,       // extracted at reading-ingestion (PDF/register/link)
        archetypeSupportId: last.archetypeSupportId,
        shapeVector12: last.shapeVector12,           // normalized wheel vector → the radar's real shape
        baskets12: last.baskets12,                   // 5-mandje → full-colour wheel (card-public since 2026-07-08)
        levensles: last.levensles,                   // the reading's own quote → tendens fallback
        gift: last.gift,                             // one-liner fallback (curse stays owner-side)
        giftMicro: last.giftMicro,                   // AI in-depth gift → tendens slot
        geomSummary: last.geomSummary,               // AI geometry summary → expressieprofiel body
        orbRenderRef: { orb: u.publicOrb || last.orbRenderRef.orb, image: last.orbRenderRef.image },
      } : null,
      readings,
      readingCount: readings.length,
      nextReadingAvailableAt,
      instrumentVersion: INSTRUMENT_VERSION,
      provisionalFlag: PROVISIONAL,
    },
    declared: {
      displayName: (u.visibleName && String(u.visibleName).trim()) || decrypt(u.displayName),
      roleLine: u.roleLine || '',
      age: u.age != null ? u.age : null,
      country: u.country || '',
      languages: Array.isArray(u.languages) ? u.languages : [],
      memberSince: u.createdAt || null,
      lastSeen: u.lastSeen || null,
      links: u.link ? [u.link] : [],
      socials: publicSocials(u),
      // v1.1: {text, sections} — text = the always-self-written story; sections = the
      // user's answers to the §6b kernel questions (separate readable block on the card).
      description: { text: u.story || '', sections: cleanSections(u.descriptionSections, 'description') },
      intention: { text: u.intention || '', sections: cleanSections(u.intentionSections, 'intention') },
    },
  };
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, age, country, orbCode, archetypeName, reading } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase();
    const emailHash = hash(normalizedEmail);

    // Check for existing user by deterministic hash (encrypted email can't be searched)
    const existing = await collections.users().findOne({ emailHash });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    // First user ever gets admin role; all others are clients
    const userCount = await collections.users().countDocuments();
    const role = userCount === 0 ? 'admin' : 'client';

    const resolvedDisplayName = displayName || normalizedEmail.split('@')[0];

    // Visual name must be globally unique (case-insensitive, via deterministic nameHash).
    const nameHash = hash(nameKey(resolvedDisplayName));
    const nameTaken = await collections.users().findOne({ nameHash });
    if (nameTaken) {
      return res.status(409).json({ error: 'Deze naam is al in gebruik. Kies een andere.' });
    }

    // The orb-code links to at most ONE account. Reject up front if it's already linked, so we don't
    // create an orphan account whose code silently failed to bind. A concurrent race is still caught
    // after insert below (the unique codeHash index is the real guard).
    const hasOrbCode = orbCode && /^LC_ORB[23]?_/.test(String(orbCode));
    const orbCodeHash = hasOrbCode ? hash(String(orbCode)) : null;
    if (hasOrbCode) {
      const alreadyLinked = await collections.orbCodes().findOne({ codeHash: orbCodeHash });
      if (alreadyLinked) {
        return res.status(409).json({ error: 'Deze kristal-code is al aan een ander account gekoppeld.' });
      }
    }

    const ageNum = Number(age);
    // Public, render-only identity (name is chosen for public display; archetype + orb visual
    // are non-PII by design). Stored so others can view this profile via GET /public/:handle.
    const publicOrb = publicOrbFromCode(orbCode);
    // First crystal-timeline entry (the account's initial code). Later codes are appended via /link.
    // Extraction fields (main/support archetype + shape vector) ride along, allowlist-sanitized.
    // The server-authored kaart-microcopy draft (stored at generation, keyed by code hash) is
    // merged in — those fields never travel through the client.
    let kaartDraft = null;
    if (hasOrbCode) { try { kaartDraft = await collections.kaartDrafts().findOne({ codeHash: orbCodeHash }); } catch { /* ignore */ } }
    const registerReading = sanitizeReading({
      ...(reading || {}),
      ...(kaartDraft && kaartDraft.giftMicro ? { giftMicro: kaartDraft.giftMicro } : {}),
      ...(kaartDraft && kaartDraft.geomSummary ? { geomSummary: kaartDraft.geomSummary } : {}),
    });
    const historyEntry = hasOrbCode ? { codeHash: orbCodeHash, orb: publicOrb, archetypeName: archetypeName ? String(archetypeName) : '', at: now, ...(registerReading || {}) } : null;
    // Email verification: when SMTP is configured the account starts UNVERIFIED (login blocked
    // until the emailed link is clicked); without SMTP it's created pre-verified so dev still works.
    const verifyToken = EMAIL_CONFIGURED ? crypto.randomBytes(32).toString('hex') : null;
    const result = await collections.users().insertOne({
      emailHash,                             // deterministic — for lookups
      email: encrypt(normalizedEmail),       // encrypted PII
      displayName: encrypt(resolvedDisplayName), // encrypted PII
      nameHash,                              // deterministic — unique visual-name lookup
      passwordHash,
      role,
      emailVerified: !EMAIL_CONFIGURED,
      ...(verifyToken ? { verifyToken, verifyExpires: new Date(now.getTime() + VERIFY_TTL_MS) } : {}),
      ...(Number.isFinite(ageNum) ? { age: ageNum } : {}),
      ...(country ? { country: String(country) } : {}),
      ...(archetypeName ? { archetypeName: String(archetypeName) } : {}),
      ...(publicOrb ? { publicOrb } : {}),
      ...(historyEntry ? { orbHistory: [historyEntry] } : {}),
      // Access model: the first code opens a 3-month window; each later code (POST /orb/link)
      // appends 3 more to the expiry.
      ...(hasOrbCode ? { accessUntil: (() => { const d = new Date(now); d.setMonth(d.getMonth() + 3); return d; })() } : {}),
      createdAt: now,
      updatedAt: now,
    });

    // Link the orb-code to this new account (the code = login). $setOnInsert never steals an
    // already-linked code; the unique codeHash index is the real guard. If the link didn't land on
    // THIS user (lost a race with a concurrent register), undo the just-created account and 409.
    if (hasOrbCode) {
      try {
        await collections.orbCodes().updateOne(
          { codeHash: orbCodeHash },
          { $setOnInsert: { codeHash: orbCodeHash, userId: String(result.insertedId), linkedAt: now } },
          { upsert: true }
        );
      } catch (e) { console.warn('[Auth] orb-code link on register failed:', e.message); }
      const linked = await collections.orbCodes().findOne({ codeHash: orbCodeHash });
      if (!linked || String(linked.userId) !== String(result.insertedId)) {
        await collections.users().deleteOne({ _id: result.insertedId }); // roll back the orphan account
        return res.status(409).json({ error: 'Deze kristal-code is al aan een ander account gekoppeld.' });
      }
    }

    // Verification path: no session is issued until the email is confirmed. Send the mail and tell
    // the client to wait. The client polls /login (which stays blocked until verified).
    if (EMAIL_CONFIGURED) {
      try { await sendVerificationEmail(normalizedEmail, verifyToken, req); }
      catch (e) { console.warn('[Auth] verification email send failed:', e.message); }
      return res.status(201).json({ needsVerification: true, email: normalizedEmail });
    }

    // No SMTP (dev): account is pre-verified — behave as before and log straight in.
    const token = signToken(result.insertedId, normalizedEmail, role);
    res.status(201).json({
      token,
      needsVerification: false,
      user: {
        id: result.insertedId,
        email: normalizedEmail,
        displayName: resolvedDisplayName,
        role,
      },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/verify?token=…  (PUBLIC) — click target from the verification email.
// Flips emailVerified; the tab where the user registered polls /login and proceeds automatically.
// ─────────────────────────────────────────────────────────────

router.get('/verify', async (req, res) => {
  const page = (title, msg, ok) => `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="margin:0;min-height:100vh;background:#0a0510;color:#eee;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center"><div style="text-align:center;max-width:440px;padding:2.5rem"><h1 style="color:${ok ? '#a855f7' : '#f87171'};margin:0 0 1rem">${title}</h1><p style="color:#bbb;line-height:1.6;margin:0">${msg}</p></div></body></html>`;
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).send(page('Ongeldige link', 'Er ontbreekt een token.', false));
    const user = await collections.users().findOne({ verifyToken: token });
    if (!user) return res.status(404).send(page('Link ongeldig of al gebruikt', 'Deze bevestigingslink is niet meer geldig — mogelijk is je account al bevestigd.', false));
    if (user.verifyExpires && new Date(user.verifyExpires) < new Date()) {
      return res.status(410).send(page('Link verlopen', 'Deze bevestigingslink is verlopen. Maak opnieuw een account aan of vraag een nieuwe link.', false));
    }
    await collections.users().updateOne(
      { _id: user._id },
      { $set: { emailVerified: true, updatedAt: new Date() }, $unset: { verifyToken: '', verifyExpires: '' } }
    );
    return res.send(page('E-mail bevestigd ✓', 'Je account is geactiveerd. Ga terug naar het tabblad waar je je aanmeldde — dat gaat automatisch verder.', true));
  } catch (e) {
    console.error('[Auth] verify error:', e.message);
    return res.status(500).send(page('Serverfout', 'Er ging iets mis. Probeer het later opnieuw.', false));
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/public/:handle  (PUBLIC, no auth)
// A shareable read-only profile: visual name + archetype + render-only orb.
// Deliberately excludes all PII (email, age, password, raw orb-code).
// ─────────────────────────────────────────────────────────────

router.get('/public/:handle', async (req, res) => {
  try {
    const handle = String(req.params.handle || '').trim();
    if (!handle) return res.status(400).json({ error: 'Geen naam opgegeven.' });
    const u = await collections.users().findOne({ nameHash: hash(nameKey(handle)) });
    // listed === false → openbaar staat UIT: the profile is invisible to the public
    // (same response as non-existent, so the flag can't be probed).
    if (!u || u.listed === false) return res.status(404).json({ error: 'Profiel niet gevonden.' });
    return res.json({
      displayName: (u.visibleName && String(u.visibleName).trim()) || decrypt(u.displayName),
      archetypeName: u.archetypeName || '',
      orb: u.publicOrb || null,
      orbHistory: publicOrbHistory(u),
      country: u.country || '',
      story: u.story || '',
      link: u.link || '',
    });
  } catch (err) {
    console.error('[Auth] Public profile error:', err.message);
    return res.status(500).json({ error: 'Profiel ophalen mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/card            (auth) — the owner's own card payload
// GET /api/auth/card/:handle    (PUBLIC) — anyone's card payload by handle
// Both return the SAME cardPayload.v1 (SR-5 owner symmetry): what the owner
// previews is exactly what others receive.
// ─────────────────────────────────────────────────────────────

router.get('/card', authRequired, async (req, res) => {
  try {
    const u = await collections.users().findOne({ _id: new ObjectId(req.user.userId) });
    if (!u) return res.status(404).json({ error: 'Gebruiker niet gevonden.' });
    return res.json(buildCardPayload(u));
  } catch (err) {
    console.error('[Auth] Card payload error:', err.message);
    return res.status(500).json({ error: 'Kaart ophalen mislukt.' });
  }
});

router.get('/card/:handle', async (req, res) => {
  try {
    const handle = String(req.params.handle || '').trim();
    if (!handle) return res.status(400).json({ error: 'Geen naam opgegeven.' });
    const u = await collections.users().findOne({ nameHash: hash(nameKey(handle)) });
    // listed === false → openbaar UIT (404 identical to unknown handle — not probeable)
    if (!u || u.listed === false) return res.status(404).json({ error: 'Profiel niet gevonden.' });
    return res.json(buildCardPayload(u));
  } catch (err) {
    console.error('[Auth] Public card error:', err.message);
    return res.status(500).json({ error: 'Kaart ophalen mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/profiles (PUBLIC) — the directory of all PUBLIC profiles
// (openbaar aan; `listed === false` excluded). Lean summaries only — the full
// card stays behind GET /card/:handle. Newest members first, capped.
// ─────────────────────────────────────────────────────────────

// Canonical-12 → biological (hardware) group. Matches the Dutch or English
// archetype id extracted from the reading (e.g. "De Heerser" → Ruling).
const HARDWARE_GROUPS = [
  { group: 'Ruling', re: /heerser|ruler|rechter|judge/i },
  { group: 'Relational', re: /minnaar|lover|verzorger|caregiver/i },
  { group: 'Seeker', re: /onschuldige|innocent|ontdekk|explorer/i },
  { group: 'Chaos', re: /rebel|outlaw|\bnar\b|trickster/i },
  { group: 'Abstract', re: /wijze|sage|kunstenaar|artist/i },
  { group: 'Agency', re: /magi[eë]r|magician|held|hero/i },
];
function hardwareGroupFor(archetypeId) {
  const s = String(archetypeId || '');
  const hit = HARDWARE_GROUPS.find((g) => g.re.test(s));
  return hit ? hit.group : null;
}

router.get('/profiles', async (_req, res) => {
  try {
    const users = await collections.users()
      // Exclude admin/dev accounts (the first user is admin) — they're never public profiles.
      .find({ listed: { $ne: false }, role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(200)
      .project({ visibleName: 1, displayName: 1, archetypeName: 1, roleLine: 1, country: 1, createdAt: 1, orbHistory: 1, publicOrb: 1, lastSeen: 1 })
      .toArray();
    const profiles = users.map((u) => {
      let name = (u.visibleName && String(u.visibleName).trim()) || '';
      if (!name) { try { name = decrypt(u.displayName); } catch { name = ''; } }
      if (!name) return null;
      const latest = Array.isArray(u.orbHistory) && u.orbHistory.length
        ? u.orbHistory[u.orbHistory.length - 1] : null;
      return {
        name, // the shown profile name — also the ?u= handle for the full card
        archetypeName: (latest && latest.archetypeName) || u.archetypeName || '',
        roleLine: u.roleLine || '',
        country: u.country || '',
        memberSince: u.createdAt || null,
        // Lookup facets (Verbonden search): activity, hardware group of the latest
        // reading's MAIN archetype, main+support combination, schaduw-profielen count.
        lastSeen: u.lastSeen || null,
        hardwareGroup: hardwareGroupFor(latest && latest.archetypeMainId),
        mainId: (latest && latest.archetypeMainId) || null,
        supportId: (latest && latest.archetypeSupportId) || null,
        readingCount: Array.isArray(u.orbHistory) ? u.orbHistory.length : 0,
        orb: u.publicOrb || null, // render-only config (never a raw code)
      };
    }).filter(Boolean);
    return res.json({ profiles });
  } catch (err) {
    console.error('[Auth] Profiles directory error:', err.message);
    return res.status(500).json({ error: 'Profielen ophalen mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();
    const emailHash = hash(normalizedEmail);

    // Lookup by deterministic hash (encrypted email can't be searched)
    const user = await collections.users().findOne({ emailHash });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Gate: an unverified account (emailVerified === false) cannot log in until the emailed link is
    // clicked. Legacy accounts (field absent) are treated as verified.
    if (user.emailVerified === false) {
      return res.status(403).json({ error: 'Bevestig eerst je e-mailadres via de link in je inbox.', needsVerification: true });
    }

    // Decrypt PII for the response
    const decryptedEmail = decrypt(user.email);
    const decryptedDisplayName = decrypt(user.displayName);
    const token = signToken(user._id, decryptedEmail, user.role || 'client');

    // Update lastLogin timestamp for all users (fire-and-forget)
    collections.users().updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    ).catch((err) => console.warn('[Auth] lastLogin update failed:', err.message));

    // Audit log: record admin logins asynchronously (fire-and-forget)
    if (user.role === 'admin') {
      getDB().collection('devActivity').insertOne({
        type: 'admin_login',
        timestamp: new Date(),
        userId: String(user._id),
        email: decryptedEmail,
        message: '', branch: '', hash: '', reportId: null, reportType: '',
        userAgent: req.get('user-agent') || '',
      }).catch((err) => console.warn('[Auth] Audit log failed:', err.message));
    }

    res.json({
      token,
      user: {
        id: user._id,
        email: decryptedEmail,
        displayName: decryptedDisplayName,
        role: user.role || 'client',
      },
      // Render-only client identity so email/password login can boot straight into the client
      // interface (the raw orb-code stays secret; only the decoded visual config is returned).
      orb: user.publicOrb || null,
      archetypeName: user.archetypeName || '',
      country: user.country || '',
      age: user.age != null ? user.age : null,
      story: user.story || '',
      link: user.link || '',
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me  (auth required)
// ─────────────────────────────────────────────────────────────

router.get('/me', authRequired, async (req, res) => {
  try {
    const user = await collections.users().findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Decrypt PII fields before sending to client
    const decrypted = decryptUser(user);

    // Membership activity: return when they were PREVIOUSLY seen, then stamp now for next time.
    const lastSeen = user.lastSeen || null;
    collections.users().updateOne({ _id: user._id }, { $set: { lastSeen: new Date() } }).catch(() => {});

    res.json({
      id: decrypted._id,
      email: decrypted.email,
      // Pending (unconfirmed) email change — the account email stays put until the link is clicked.
      pendingEmail: user.pendingEmail ? decrypt(user.pendingEmail) : null,
      displayName: decrypted.displayName,   // the unique login name (Inlognaam) — also the ?u= handle
      visibleName: user.visibleName || '',  // the public card name (Zichtbare naam) — edited separately
      role: decrypted.role || 'client',
      createdAt: decrypted.createdAt,
      lastSeen,
      age: user.age != null ? user.age : null,
      country: user.country || '',
      orb: user.publicOrb || null,
      archetypeName: user.archetypeName || '',
      orbHistory: publicOrbHistory(user),
      // Access model: platform-access expiry + when the next code may be attached (2 months
      // after the last one). The Privé upload button disables itself on this date.
      accessUntil: user.accessUntil || null,
      nextUploadAvailableAt: (() => {
        const h = Array.isArray(user.orbHistory) ? user.orbHistory[user.orbHistory.length - 1] : null;
        if (!h || !h.at) return null;
        const d = new Date(h.at); d.setMonth(d.getMonth() + 2); return d;
      })(),
      story: user.story || '',
      link: user.link || '',
      roleLine: user.roleLine || '',
      languages: Array.isArray(user.languages) ? user.languages : [],
      intention: user.intention || '',
      // Openbaar aan/uit — absent means aan (public); only explicit false hides the card.
      listed: user.listed !== false,
      descriptionSections: cleanSections(user.descriptionSections, 'description'),
      intentionSections: cleanSections(user.intentionSections, 'intention'),
      socials: publicSocials(user),
      // 5-mandje wheel colours of the ACTIVE reading — OWNER-ONLY (denied on the public
      // card per extraction-spec §3; the public shape is shapeVector12).
      readingBaskets: (() => {
        const h = Array.isArray(user.orbHistory) ? user.orbHistory[user.orbHistory.length - 1] : null;
        return h && Array.isArray(h.baskets12) ? h.baskets12 : null;
      })(),
    });
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/auth/name  (auth required)
// Edit the VISUAL NAME — editable anytime, must stay globally unique (case-insensitive).
// ─────────────────────────────────────────────────────────────

router.patch('/name', authRequired, async (req, res) => {
  try {
    const trimmed = String(req.body?.name || '').trim().replace(/\s+/g, ' ');
    if (trimmed.length < 2) return res.status(400).json({ error: 'Naam is te kort (min. 2 tekens).' });
    if (trimmed.length > 40) return res.status(400).json({ error: 'Naam is te lang (max. 40 tekens).' });

    const userId = new ObjectId(req.user.userId);
    const nameHash = hash(nameKey(trimmed));
    const clash = await collections.users().findOne({ nameHash, _id: { $ne: userId } });
    if (clash) return res.status(409).json({ error: 'Deze naam is al in gebruik. Kies een andere.' });

    try {
      await collections.users().updateOne(
        { _id: userId },
        { $set: { displayName: encrypt(trimmed), nameHash, updatedAt: new Date() } }
      );
    } catch (e) {
      // Unique-index race: someone claimed the name between the check and the write.
      if (e && e.code === 11000) return res.status(409).json({ error: 'Deze naam is al in gebruik. Kies een andere.' });
      throw e;
    }
    return res.json({ displayName: trimmed });
  } catch (err) {
    console.error('[Auth] Name update error:', err.message);
    return res.status(500).json({ error: 'Naam bijwerken mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/auth/profile  (auth required) — edit age + country.
// ─────────────────────────────────────────────────────────────

router.patch('/profile', authRequired, async (req, res) => {
  try {
    const { age, country, story, link, roleLine, languages, intention, socials, visibleName, descriptionSections, intentionSections, listed } = req.body || {};
    const set = { updatedAt: new Date() };
    // Openbaar aan/uit — false hides the public card + directory entry (404 as if absent).
    // Absent/true = openbaar (the default for every existing account).
    if (listed !== undefined) set.listed = !!listed;
    // Zichtbare naam — the public card name (declared channel). Entirely separate from the unique
    // login name (displayName / Inlognaam): editing one never touches the other. Empty → card falls
    // back to the login name.
    if (visibleName !== undefined) set.visibleName = String(visibleName || '').trim().slice(0, 40);
    if (age !== undefined) {
      if (age === '' || age === null) set.age = null;
      else {
        const n = Number(age);
        if (!Number.isFinite(n) || n < 0 || n > 149) return res.status(400).json({ error: 'Ongeldige leeftijd.' });
        set.age = Math.round(n);
      }
    }
    if (country !== undefined) set.country = String(country || '').trim().slice(0, 60);
    // Short story / bio — public, render-only text (non-PII by choice; shown on the public profile).
    if (story !== undefined) set.story = String(story || '').slice(0, 2000);
    // Public link the user places on their Openbaar card (non-PII by choice).
    if (link !== undefined) set.link = String(link || '').trim().slice(0, 200);
    // Declared-channel card fields (cardPayload.v1): self-declared, optional, non-PII by choice.
    if (roleLine !== undefined) set.roleLine = String(roleLine || '').trim().slice(0, 80);
    if (languages !== undefined) {
      const arr = Array.isArray(languages) ? languages : String(languages || '').split(/[,/]/);
      set.languages = arr.map((l) => String(l || '').trim().toUpperCase().slice(0, 12)).filter(Boolean).slice(0, 6);
    }
    if (intention !== undefined) set.intention = String(intention || '').slice(0, 2000);
    // §6b preset-question answers (v1.1 sections) — allowlisted keys, fixed order, ≤600 chars each.
    if (descriptionSections !== undefined) set.descriptionSections = cleanSections(descriptionSections, 'description');
    if (intentionSections !== undefined) set.intentionSections = cleanSections(intentionSections, 'intention');
    // Social handles/URLs — fixed key allowlist; empty values drop the key. A verified
    // badge only ever covers the exact handle it verified: editing the handle resets
    // verified=false, while an unchanged handle keeps its OAuth proof.
    if (socials !== undefined) {
      const cur = await collections.users().findOne(
        { _id: new ObjectId(req.user.userId) },
        { projection: { socials: 1 } }
      );
      const clean = {};
      for (const k of SOCIAL_KEYS) {
        const raw = socials && socials[k];
        const handle = raw == null ? '' : String(typeof raw === 'object' ? (raw.handle || '') : raw).trim().slice(0, 200);
        if (!handle) continue;
        const prev = normSocial(cur && cur.socials && cur.socials[k]);
        clean[k] = prev && prev.handle === handle && prev.verified
          ? { handle, verified: true, verifiedAt: (cur.socials[k] && cur.socials[k].verifiedAt) || null }
          : { handle, verified: false };
      }
      set.socials = clean;
    }
    await collections.users().updateOne({ _id: new ObjectId(req.user.userId) }, { $set: set });
    return res.json({ age: set.age !== undefined ? set.age : undefined, country: set.country, story: set.story, link: set.link, roleLine: set.roleLine, languages: set.languages, intention: set.intention, socials: set.socials, visibleName: set.visibleName, listed: set.listed });
  } catch (err) {
    console.error('[Auth] Profile update error:', err.message);
    return res.status(500).json({ error: 'Profiel bijwerken mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/orb-snapshot  (auth required)
// Client captures a colour still of an orb and posts it; attached to the orbHistory entry
// at `readingIndex` (default: the active/most recent) if it doesn't have one yet. EVERY
// reading carries its screenshot for the individuatiepad chips — including the first.
// ─────────────────────────────────────────────────────────────

router.post('/orb-snapshot', authRequired, async (req, res) => {
  try {
    const { image, readingIndex, force } = req.body || {};
    if (!image || typeof image !== 'string' || !/^data:image\/(png|jpe?g|webp);base64,/.test(image) || image.length > 500000) {
      return res.status(400).json({ error: 'Ongeldige afbeelding.' });
    }
    const user = await collections.users().findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { orbHistory: 1 } }
    );
    const hist = Array.isArray(user?.orbHistory) ? user.orbHistory : [];
    if (!hist.length) return res.json({ ok: true, skipped: 'no-history' });
    let idx = hist.length - 1;                         // default: the active (most recent) orb
    if (readingIndex !== undefined) {
      const n = Number(readingIndex);
      if (!Number.isInteger(n) || n < 0 || n >= hist.length) return res.status(400).json({ error: 'Ongeldige lezing.' });
      idx = n;
    }
    // force=true replaces an existing still (repair path: a too-early capture stored a black frame)
    if (hist[idx].image && !force) return res.json({ ok: true, skipped: 'exists' });
    await collections.users().updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: { [`orbHistory.${idx}.image`]: image, updatedAt: new Date() } }
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[Auth] orb-snapshot error:', err.message);
    return res.status(500).json({ error: 'Snapshot opslaan mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/auth/password  (auth required) — change password.
// Requires the current password; new password min 6 chars.
// ─────────────────────────────────────────────────────────────

router.patch('/password', authRequired, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'Nieuw wachtwoord moet minstens 6 tekens zijn.' });
    }
    const user = await collections.users().findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) return res.status(404).json({ error: 'Account niet gevonden.' });
    const ok = await bcrypt.compare(String(currentPassword || ''), user.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'Huidig wachtwoord is onjuist.' });

    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    // No SMTP (local dev): apply immediately, same fallback as pre-verified account creation.
    if (!EMAIL_CONFIGURED) {
      await collections.users().updateOne({ _id: user._id }, { $set: { passwordHash, updatedAt: new Date() } });
      return res.json({ ok: true, pending: false });
    }

    // Gated: stash the NEW hash + a single-use token and email a confirmation link. The change is
    // only applied when the link is clicked (GET /password/verify) — until then the old password holds.
    const token = crypto.randomBytes(32).toString('hex');
    await collections.users().updateOne(
      { _id: user._id },
      { $set: { pwChangeToken: token, pwChangeHash: passwordHash, pwChangeExpires: new Date(Date.now() + PW_CHANGE_TTL_MS), updatedAt: new Date() } }
    );
    try {
      await sendPasswordChangeEmail(decrypt(user.email), token);
    } catch (mailErr) {
      console.error('[Auth] Password-change email failed:', mailErr.message);
      // Roll back the pending change so a failed send doesn't leave a dangling token.
      await collections.users().updateOne({ _id: user._id }, { $unset: { pwChangeToken: '', pwChangeHash: '', pwChangeExpires: '' } });
      return res.status(502).json({ error: 'Kon de bevestigingsmail niet verzenden. Probeer het later opnieuw.' });
    }
    return res.json({ ok: true, pending: true });
  } catch (err) {
    console.error('[Auth] Password update error:', err.message);
    return res.status(500).json({ error: 'Wachtwoord bijwerken mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/password/verify?token=…  (PUBLIC) — called by the frontend (www.gardenforlife.nl
// /?pwverify=<token>) from the confirmation email. Applies the pending change; returns JSON.
// ─────────────────────────────────────────────────────────────

router.get('/password/verify', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ error: 'Ongeldige of ontbrekende link.' });
    const user = await collections.users().findOne({ pwChangeToken: token });
    if (!user || !user.pwChangeHash) return res.status(404).json({ error: 'Deze wijzigingslink is niet meer geldig — mogelijk is je wachtwoord al bevestigd.' });
    if (user.pwChangeExpires && new Date(user.pwChangeExpires) < new Date()) {
      await collections.users().updateOne({ _id: user._id }, { $unset: { pwChangeToken: '', pwChangeHash: '', pwChangeExpires: '' } });
      return res.status(410).json({ error: 'Deze wijzigingslink is verlopen. Vraag de wachtwoordwijziging opnieuw aan.' });
    }
    await collections.users().updateOne(
      { _id: user._id },
      { $set: { passwordHash: user.pwChangeHash, updatedAt: new Date() }, $unset: { pwChangeToken: '', pwChangeHash: '', pwChangeExpires: '' } }
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('[Auth] password verify error:', e.message);
    return res.status(500).json({ error: 'Er ging iets mis. Probeer het later opnieuw.' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/auth/email  (auth required) — change the account email.
// Requires the current password. Gated behind a confirmation click on the NEW address; the
// current email stays active until then (nothing on the account changes until GET /email/verify).
// ─────────────────────────────────────────────────────────────

router.patch('/email', authRequired, async (req, res) => {
  try {
    const { newEmail, currentPassword } = req.body || {};
    const normalized = String(newEmail || '').trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) return res.status(400).json({ error: 'Voer een geldig e-mailadres in.' });

    const user = await collections.users().findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) return res.status(404).json({ error: 'Account niet gevonden.' });
    const ok = await bcrypt.compare(String(currentPassword || ''), user.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'Huidig wachtwoord is onjuist.' });

    const newHash = hash(normalized);
    if (newHash === user.emailHash) return res.status(400).json({ error: 'Dit is al je huidige e-mailadres.' });
    const taken = await collections.users().findOne({ emailHash: newHash });
    if (taken) return res.status(409).json({ error: 'Dit e-mailadres is al in gebruik.' });

    // No SMTP (local dev): apply immediately, same fallback as pre-verified account creation.
    if (!EMAIL_CONFIGURED) {
      await collections.users().updateOne({ _id: user._id }, { $set: { email: encrypt(normalized), emailHash: newHash, updatedAt: new Date() } });
      return res.json({ ok: true, pending: false, email: normalized });
    }

    // Gated: stash the pending (encrypted) email + a single-use token, and email a confirmation link
    // to the NEW address. Applied only when that link is clicked — until then the old email holds.
    const token = crypto.randomBytes(32).toString('hex');
    await collections.users().updateOne(
      { _id: user._id },
      { $set: { emailChangeToken: token, pendingEmail: encrypt(normalized), pendingEmailHash: newHash, emailChangeExpires: new Date(Date.now() + EMAIL_CHANGE_TTL_MS), updatedAt: new Date() } }
    );
    try {
      await sendEmailChangeEmail(normalized, token);
    } catch (mailErr) {
      console.error('[Auth] Email-change email failed:', mailErr.message);
      await collections.users().updateOne({ _id: user._id }, { $unset: { emailChangeToken: '', pendingEmail: '', pendingEmailHash: '', emailChangeExpires: '' } });
      return res.status(502).json({ error: 'Kon de bevestigingsmail niet verzenden. Probeer het later opnieuw.' });
    }
    return res.json({ ok: true, pending: true, pendingEmail: normalized });
  } catch (err) {
    console.error('[Auth] Email update error:', err.message);
    return res.status(500).json({ error: 'E-mailadres bijwerken mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/email/verify?token=…  (PUBLIC) — called by the frontend (config.siteUrl
// /?emailverify=<token>) from the confirmation email. Applies the pending email; returns JSON.
// ─────────────────────────────────────────────────────────────

router.get('/email/verify', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).json({ error: 'Ongeldige of ontbrekende link.' });
    const user = await collections.users().findOne({ emailChangeToken: token });
    if (!user || !user.pendingEmail || !user.pendingEmailHash) return res.status(404).json({ error: 'Deze wijzigingslink is niet meer geldig — mogelijk is je e-mailadres al bevestigd.' });
    if (user.emailChangeExpires && new Date(user.emailChangeExpires) < new Date()) {
      await collections.users().updateOne({ _id: user._id }, { $unset: { emailChangeToken: '', pendingEmail: '', pendingEmailHash: '', emailChangeExpires: '' } });
      return res.status(410).json({ error: 'Deze wijzigingslink is verlopen. Vraag de e-mailwijziging opnieuw aan.' });
    }
    // Re-check uniqueness at confirm time (someone may have claimed the address in the meantime).
    const taken = await collections.users().findOne({ emailHash: user.pendingEmailHash, _id: { $ne: user._id } });
    if (taken) {
      await collections.users().updateOne({ _id: user._id }, { $unset: { emailChangeToken: '', pendingEmail: '', pendingEmailHash: '', emailChangeExpires: '' } });
      return res.status(409).json({ error: 'Dit e-mailadres is inmiddels door een ander account in gebruik genomen.' });
    }
    await collections.users().updateOne(
      { _id: user._id },
      { $set: { email: user.pendingEmail, emailHash: user.pendingEmailHash, emailVerified: true, updatedAt: new Date() }, $unset: { emailChangeToken: '', pendingEmail: '', pendingEmailHash: '', emailChangeExpires: '' } }
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('[Auth] email verify error:', e.message);
    return res.status(500).json({ error: 'Er ging iets mis. Probeer het later opnieuw.' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/auth/account  (auth required)
// GDPR right-to-erasure: deletes the authenticated user's account,
// all their assessments, and all their assessment reviews.
// ─────────────────────────────────────────────────────────────

router.delete('/account', authRequired, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Prevent the sole admin from deleting themselves
    const user = await collections.users().findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin') {
      const adminCount = await collections.users().countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the only admin account' });
      }
    }

    // Delete all associated data
    const [assessmentResult, reviewResult] = await Promise.all([
      collections.assessments().deleteMany({ userId }),
      getDB().collection('assessmentReviews').deleteMany({ userId }),
    ]);

    // Delete the user record last
    await collections.users().deleteOne({ _id: new ObjectId(userId) });

    console.log(`[Auth] Account deleted: ${userId} — ${assessmentResult.deletedCount} assessments, ${reviewResult.deletedCount} reviews`);

    res.json({
      success: true,
      deletedAssessments: assessmentResult.deletedCount,
      deletedReviews: reviewResult.deletedCount,
    });
  } catch (err) {
    console.error('[Auth] Delete account error:', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
module.exports.signToken = signToken;

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────

function signToken(userId, email, role) {
  return jwt.sign(
    { sub: userId.toString(), email, role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}
