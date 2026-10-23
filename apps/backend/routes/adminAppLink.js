/**
 * POST /api/app-link/redeem — the install page's button (functions/_middleware.js) posts a one-time link here as a
 * plain form. A valid token is spent and the phone gets the device grant cookie for /beheer, then goes there; any
 * other token goes to the home page without saying why. See services/adminAppLinks.js.
 */
const express = require('express');
const { rateLimit } = require('../middleware/rateLimit');
const { redeem, grantCookie, SITE } = require('../services/adminAppLinks');

const router = express.Router();

router.post('/redeem',
  rateLimit({ name: 'app-link', max: 10, windowMs: 15 * 60 * 1000 }),
  express.urlencoded({ extended: false, limit: '1kb' }),
  async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      const grant = await redeem(req.body && req.body.t);
      if (!grant) return res.redirect(303, `${SITE}/`);
      res.set('Set-Cookie', grantCookie(grant, { secure: req.secure || req.get('x-forwarded-proto') === 'https' }));
      return res.redirect(303, `${SITE}/beheer/`);
    } catch (err) {
      console.error('[AppLink] redeem failed:', err.message);
      return res.redirect(303, `${SITE}/`);
    }
  });

module.exports = router;
