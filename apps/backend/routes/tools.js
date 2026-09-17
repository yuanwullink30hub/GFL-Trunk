/**
 * Garden For Life — Tool gateway (docs/LOCAL_WORKSTATION_CONTRACT.md §7a, binding).
 *
 * GET  /api/tools/key               (public)  this month's ticket key
 * POST /api/tools/tickets           (auth)    sign blinded tickets — the ONLY account-bound step
 * POST /api/tools/run/:toolId       (ticket)  run a tool — anonymous: no token, no cookies
 *
 * The run route refuses any request that carries an account token or cookies, spends exactly one
 * blind-signed ticket, and hands the tool only its JSON input. Nothing here logs who, what or from
 * where: errors are logged without input, tool id + outcome at most.
 */
const express = require('express');
const { authRequired } = require('../middleware/auth');
const { collections } = require('../db');
const { ObjectId } = require('mongodb');
const tickets = require('../services/toolTickets');
const { getTool } = require('../services/toolRegistry');

const router = express.Router();

const sendTicketError = (res, e) => res.status(e.status || 400).json({ error: e.message, code: e.code });

router.get('/key', async (_req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=3600');
    return res.json(await tickets.publicKeyInfo());
  } catch (e) {
    console.error('[tools/key] error:', e.message);
    return res.status(500).json({ error: 'Key unavailable' });
  }
});

router.post('/tickets', authRequired, async (req, res) => {
  try {
    const user = await collections.users().findOne({ _id: new ObjectId(String(req.user.userId)) }, { projection: { accessUntil: 1 } });
    if (!user) return res.status(404).json({ error: 'Account not found' });
    const { epoch, blinded } = req.body || {};
    return res.json(await tickets.issueTickets({ user, epoch, blinded }));
  } catch (e) {
    if (e instanceof tickets.TicketError) return sendTicketError(res, e);
    console.error('[tools/tickets] error:', e.message);
    return res.status(500).json({ error: 'Issuing tickets failed' });
  }
});

/** A tool call carries no account: refuse anything that could say who sent it. */
function anonymousOnly(req, res, next) {
  if (req.headers.authorization || req.headers.cookie) {
    return res.status(400).json({ error: 'Tool calls must be anonymous: send no account token and no cookies', code: 'not_anonymous' });
  }
  return next();
}

router.post('/run/:toolId', anonymousOnly, async (req, res) => {
  const tool = getTool(req.params.toolId);
  if (!tool) return res.status(404).json({ error: 'Unknown tool', code: 'unknown_tool' });

  const input = req.body && typeof req.body === 'object' ? req.body.input : undefined;
  let size = 0;
  try { size = Buffer.byteLength(JSON.stringify(input === undefined ? null : input)); } catch { size = Infinity; }
  if (size > tool.maxInputBytes) return res.status(413).json({ error: 'Input too large', code: 'too_large' });

  try {
    await tickets.redeemTicket(req.headers['x-gfl-ticket']);
  } catch (e) {
    if (e instanceof tickets.TicketError) return sendTicketError(res, e);
    console.error('[tools/run] ticket check failed:', e.message);
    return res.status(500).json({ error: 'Ticket check failed' });
  }

  try {
    const result = await tool.handler(input === undefined ? null : input);
    res.set('Cache-Control', 'no-store');
    return res.json({ result });
  } catch (e) {
    console.error(`[tools/run] ${tool.id} failed:`, e && e.message ? e.message.slice(0, 120) : 'error');
    return res.status(500).json({ error: 'Tool failed', code: 'tool_failed' });
  }
});

module.exports = router;
