/**
 * Garden For Life — Verbonden (connection requests between public profiles)
 *
 * POST /api/verbond/request  (auth) { to }                  — request a verbond ("+ Verbond")
 * GET  /api/verbond/pending  (auth)                         — INCOMING pending requests (shown at Berichten)
 * POST /api/verbond/respond  (auth) { id, accept, message } — accept, or decline (message REQUIRED on decline)
 * GET  /api/verbond/contacts (auth)                         — accepted verbonden (both directions) → Contacten
 * GET  /api/verbond/with/:handle (auth)                     — my verbond status with one profile (button state)
 *
 * A decline is impossible without a message: the motivation is delivered to the
 * requester as a normal internal message (encrypted at rest like all user text).
 */
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { collections, getDB, nameKey } = require('../db');
const { authRequired } = require('../middleware/auth');
const { encrypt, decrypt, hash } = require('../services/encryption');

const verbondenCol = () => getDB().collection('verbonden');

// Same addressing seam as messages.js: shown profile name → nameHash.
async function resolveRecipient(address) {
  const key = nameKey(String(address || ''));
  if (!key) return null;
  return collections.users().findOne({ nameHash: hash(key) }, { projection: { _id: 1 } });
}

// Public display name for a user doc: Zichtbare naam wins, else the login name.
function shownName(u) {
  const vis = u && u.visibleName && String(u.visibleName).trim();
  if (vis) return vis;
  try { return decrypt(u.displayName) || 'Onbekend'; } catch { return 'Onbekend'; }
}

// The active verbond between two users, either direction (pending or accepted wins
// over old declines).
async function activePair(a, b) {
  return verbondenCol().findOne({
    status: { $in: ['pending', 'accepted'] },
    $or: [
      { fromUserId: a, toUserId: b },
      { fromUserId: b, toUserId: a },
    ],
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/verbond/request  (auth) { to }
// ─────────────────────────────────────────────────────────────
router.post('/request', authRequired, async (req, res) => {
  try {
    const me = String(req.user.userId);
    const recipient = await resolveRecipient(req.body && req.body.to);
    if (!recipient) return res.status(404).json({ error: 'Profiel niet gevonden.' });
    const other = String(recipient._id);
    if (other === me) return res.status(400).json({ error: 'Je kunt geen verbond met jezelf aangaan.' });

    const existing = await activePair(me, other);
    if (existing) {
      return res.status(409).json({
        error: existing.status === 'accepted' ? 'Jullie zijn al verbonden.' : 'Er staat al een verbond-verzoek open.',
        status: existing.status,
      });
    }

    const r = await verbondenCol().insertOne({
      fromUserId: me,
      toUserId: other,
      status: 'pending',
      at: new Date(),
    });
    return res.json({ ok: true, id: r.insertedId, status: 'pending' });
  } catch (e) {
    console.error('[verbond/request] error:', e.message);
    return res.status(500).json({ error: 'Verzoek versturen mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/verbond/pending  (auth) — incoming, newest first
// ─────────────────────────────────────────────────────────────
router.get('/pending', authRequired, async (req, res) => {
  try {
    const me = String(req.user.userId);
    const docs = await verbondenCol().find({ toUserId: me, status: 'pending' }).sort({ at: -1 }).limit(50).toArray();
    const ids = [...new Set(docs.map((d) => d.fromUserId))];
    const users = ids.length
      ? await collections.users().find(
          { _id: { $in: ids.map((id) => new ObjectId(id)) } },
          { projection: { displayName: 1, visibleName: 1 } }
        ).toArray()
      : [];
    const nameById = {};
    for (const u of users) nameById[String(u._id)] = shownName(u);
    return res.json({
      requests: docs.map((d) => ({ id: String(d._id), from: nameById[d.fromUserId] || 'Onbekend', at: d.at })),
    });
  } catch (e) {
    console.error('[verbond/pending] error:', e.message);
    return res.status(500).json({ error: 'Verzoeken ophalen mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/verbond/respond  (auth) { id, accept, message }
// Decline REQUIRES a message — delivered to the requester as an internal message.
// ─────────────────────────────────────────────────────────────
router.post('/respond', authRequired, async (req, res) => {
  try {
    const me = String(req.user.userId);
    const { id, accept, message } = req.body || {};
    if (!id || !ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Ongeldig verzoek.' });

    const doc = await verbondenCol().findOne({ _id: new ObjectId(String(id)), toUserId: me, status: 'pending' });
    if (!doc) return res.status(404).json({ error: 'Verzoek niet gevonden (of al beantwoord).' });

    if (accept) {
      await verbondenCol().updateOne({ _id: doc._id }, { $set: { status: 'accepted', respondedAt: new Date() } });
      return res.json({ ok: true, status: 'accepted' });
    }

    const cleanMessage = String(message || '').trim().slice(0, 4000);
    if (!cleanMessage) return res.status(400).json({ error: 'Afwijzen kan niet zonder bericht.' });

    await verbondenCol().updateOne({ _id: doc._id }, { $set: { status: 'declined', respondedAt: new Date() } });
    // The motivation lands in the requester's Berichten (normal internal message).
    const my = await collections.users().findOne({ _id: new ObjectId(me) }, { projection: { displayName: 1, visibleName: 1 } });
    await getDB().collection('messages').insertOne({
      fromUserId: me,
      toUserId: doc.fromUserId,
      title: encrypt(`Verbond afgewezen — ${shownName(my)}`),
      body: encrypt(cleanMessage),
      at: new Date(),
      read: false,
    });
    return res.json({ ok: true, status: 'declined' });
  } catch (e) {
    console.error('[verbond/respond] error:', e.message);
    return res.status(500).json({ error: 'Beantwoorden mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/verbond/contacts  (auth) — accepted, both directions → Contacten
// ─────────────────────────────────────────────────────────────
router.get('/contacts', authRequired, async (req, res) => {
  try {
    const me = String(req.user.userId);
    const docs = await verbondenCol()
      .find({ status: 'accepted', $or: [{ fromUserId: me }, { toUserId: me }] })
      .sort({ respondedAt: -1 })
      .limit(200)
      .toArray();
    const otherIds = [...new Set(docs.map((d) => (d.fromUserId === me ? d.toUserId : d.fromUserId)))];
    const users = otherIds.length
      ? await collections.users().find(
          { _id: { $in: otherIds.map((id) => new ObjectId(id)) } },
          { projection: { displayName: 1, visibleName: 1 } }
        ).toArray()
      : [];
    const nameById = {};
    for (const u of users) nameById[String(u._id)] = shownName(u);
    return res.json({
      contacts: docs.map((d) => {
        const otherId = d.fromUserId === me ? d.toUserId : d.fromUserId;
        const name = nameById[otherId] || 'Onbekend';
        return { id: String(d._id), name, handle: name, since: d.respondedAt || d.at };
      }),
    });
  } catch (e) {
    console.error('[verbond/contacts] error:', e.message);
    return res.status(500).json({ error: 'Contacten ophalen mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/verbond/with/:handle  (auth) — button state on a public profile
// ─────────────────────────────────────────────────────────────
router.get('/with/:handle', authRequired, async (req, res) => {
  try {
    const me = String(req.user.userId);
    const other = await resolveRecipient(req.params.handle);
    if (!other) return res.json({ status: 'none' });
    if (String(other._id) === me) return res.json({ status: 'self' });
    const doc = await activePair(me, String(other._id));
    if (!doc) return res.json({ status: 'none' });
    return res.json({
      status: doc.status, // 'pending' | 'accepted'
      direction: doc.fromUserId === me ? 'out' : 'in',
    });
  } catch (e) {
    console.error('[verbond/with] error:', e.message);
    return res.status(500).json({ error: 'Status ophalen mislukt.' });
  }
});

module.exports = router;
