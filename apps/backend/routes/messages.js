/**
 * Garden For Life — Internal messaging (client ↔ client)
 *
 * POST /api/messages/send   (auth) { to, title, body } — send to another user
 * GET  /api/messages/inbox  (auth)                     — own inbox, newest first
 * POST /api/messages/read   (auth) { id }              — mark one of MY messages read
 *
 * Message content (title + body) is encrypted at rest like other user text.
 * Self-send is allowed (handy for testing). No delete/threads in v1.
 */
const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { collections, getDB, nameKey } = require('../db');
const { authRequired } = require('../middleware/auth');
const { encrypt, decrypt, hash } = require('../services/encryption');

const messagesCol = () => getDB().collection('messages');

/**
 * Recipient resolution — THE single seam for the addressing scheme.
 * v1: users are addressed by their shown profile name (visual name → nameHash, the same
 * mechanism as the public ?u= cards). If addressing later changes (ids, @handles, e-mail,
 * QR), only THIS function changes — every route resolves through it.
 * @param {string} address  whatever the sender typed in the "Aan" field
 * @returns {Promise<{ _id: ObjectId } | null>} the recipient user doc (minimal projection)
 */
async function resolveRecipient(address) {
  const key = nameKey(String(address || ''));
  if (!key) return null;
  return collections.users().findOne({ nameHash: hash(key) }, { projection: { _id: 1 } });
}

// ─────────────────────────────────────────────────────────────
// POST /api/messages/send  (auth)
// ─────────────────────────────────────────────────────────────
router.post('/send', authRequired, async (req, res) => {
  try {
    const { to, title, body } = req.body || {};
    const cleanTitle = String(title || '').trim().slice(0, 120);
    const cleanBody = String(body || '').trim().slice(0, 4000);
    if (!cleanBody) return res.status(400).json({ error: 'Bericht is leeg.' });

    const recipient = await resolveRecipient(to);
    if (!recipient) return res.status(404).json({ error: 'Ontvanger niet gevonden — controleer de profielnaam.' });

    const doc = {
      fromUserId: String(req.user.userId),
      toUserId: String(recipient._id),
      title: encrypt(cleanTitle),
      body: encrypt(cleanBody),
      at: new Date(),
      read: false,
    };
    const r = await messagesCol().insertOne(doc);
    return res.json({ ok: true, id: r.insertedId });
  } catch (e) {
    console.error('[messages/send] error:', e.message);
    return res.status(500).json({ error: 'Versturen mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/messages/inbox  (auth) — newest first, capped at 100
// ─────────────────────────────────────────────────────────────
router.get('/inbox', authRequired, async (req, res) => {
  try {
    const me = String(req.user.userId);
    const docs = await messagesCol().find({ toUserId: me }).sort({ at: -1 }).limit(100).toArray();

    // Resolve sender display names in one batch (names are encrypted — no join possible).
    const senderIds = [...new Set(docs.map((d) => d.fromUserId))];
    const senders = senderIds.length
      ? await collections.users().find(
          { _id: { $in: senderIds.map((id) => new ObjectId(id)) } },
          { projection: { displayName: 1 } }
        ).toArray()
      : [];
    const nameById = {};
    for (const s of senders) { try { nameById[String(s._id)] = decrypt(s.displayName) || 'Onbekend'; } catch { nameById[String(s._id)] = 'Onbekend'; } }

    return res.json({
      messages: docs.map((d) => ({
        id: String(d._id),
        from: nameById[d.fromUserId] || 'Onbekend',
        title: (() => { try { return decrypt(d.title) || ''; } catch { return ''; } })(),
        body: (() => { try { return decrypt(d.body) || ''; } catch { return ''; } })(),
        at: d.at,
        read: !!d.read,
      })),
    });
  } catch (e) {
    console.error('[messages/inbox] error:', e.message);
    return res.status(500).json({ error: 'Berichten ophalen mislukt.' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/messages/read  (auth) — only the RECIPIENT can mark read
// ─────────────────────────────────────────────────────────────
router.post('/read', authRequired, async (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id || !ObjectId.isValid(String(id))) return res.status(400).json({ error: 'Ongeldig bericht.' });
    await messagesCol().updateOne(
      { _id: new ObjectId(String(id)), toUserId: String(req.user.userId) },
      { $set: { read: true } }
    );
    return res.json({ ok: true });
  } catch (e) {
    console.error('[messages/read] error:', e.message);
    return res.status(500).json({ error: 'Bijwerken mislukt.' });
  }
});

module.exports = router;
