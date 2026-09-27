/**
 * /api/files — single-use download links for the management app installer.
 *
 * The website's management login shows a download folder; its button asks for a link here. The
 * installer itself is not in the web code and has no public address: it lives in the database
 * (services/adminAppReleases.js) and leaves only through a link that works once, within five minutes.
 *
 * Like the management API, this answers only a management token; anything else gets the server's
 * ordinary 404, so the route cannot be discovered by probing.
 */
const crypto = require('crypto');
const { Router } = require('express');
const { verifySession } = require('../middleware/auth');
const config = require('../config');
const { latestInstaller, sendFile } = require('../services/adminAppReleases');
const { getDB } = require('../db');

const router = Router();
const LINK_TTL_MS = 5 * 60 * 1000;
const links = new Map(); // token → { fileId, expiresAt }

setInterval(() => {
  const now = Date.now();
  for (const [t, l] of links) if (now > l.expiresAt) links.delete(t);
}, LINK_TTL_MS).unref();

/** An admin session, checked against the database (middleware/auth.js verifySession), not the token's claim. */
async function isManagement(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return false;
  const user = await verifySession(header.slice(7));
  return !!user && user.role === 'admin';
}

// POST /api/files/link → { url, name, version } (single use, 5 minutes)
router.post('/link', async (req, res, next) => {
  if (!(await isManagement(req))) return next();
  try {
    const file = await latestInstaller();
    if (!file) return res.status(404).json({ error: 'no_release' });
    const token = crypto.randomBytes(32).toString('base64url');
    links.set(token, { fileId: String(file._id), expiresAt: Date.now() + LINK_TTL_MS });
    return res.json({ url: `/api/files/${token}`, name: file.filename, version: (file.metadata && file.metadata.version) || '' });
  } catch (err) {
    console.error('[Files] link error:', err.message);
    return res.status(500).json({ error: 'link_failed' });
  }
});

// GET /api/files/:token → the installer, once
router.get('/:token', async (req, res, next) => {
  const link = links.get(req.params.token);
  if (!link || Date.now() > link.expiresAt) return next();
  links.delete(req.params.token);
  try {
    const { ObjectId } = require('mongodb');
    const file = await getDB().collection('adminAppReleases.files').findOne({ _id: new ObjectId(link.fileId) });
    if (!file) return next();
    return sendFile(req, res, file, { attachment: true });
  } catch (err) {
    console.error('[Files] download error:', err.message);
    return next();
  }
});

module.exports = router;
