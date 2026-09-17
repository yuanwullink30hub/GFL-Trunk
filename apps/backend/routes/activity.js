/**
 * POST /api/activity — the public activity log: consent records from the website and the app, and dev
 * events from the git hooks. No auth by design (a consent is given before any account exists).
 *
 * It used to live at /api/admin/sessions/activity, which advertised the admin API to every visitor.
 * Admin-side events (report views) are logged through the admin API instead.
 */
const { Router } = require('express');
const { activityCollection, activityDoc } = require('../services/activityLog');
const { rateLimit } = require('../middleware/rateLimit');

const router = Router();

const PUBLIC_TYPES = ['consent_given', 'edit', 'commit', 'push'];

// Generous for people (a consent is one call), tight enough that nobody fills the log.
router.post('/', rateLimit({ max: 60, windowMs: 15 * 60 * 1000 }), async (req, res) => {
  try {
    const type = req.body && req.body.type;
    if (!PUBLIC_TYPES.includes(type)) return res.status(400).json({ error: 'invalid_type' });
    await activityCollection().insertOne(activityDoc(type, req.body, req));
    res.json({ success: true });
  } catch (err) {
    console.error('[Activity] log error:', err.message);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

module.exports = router;
