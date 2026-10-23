/**
 * Garden For Life — Admin Routes
 *
 * All routes require admin role.
 * Manages: users, assessment overview, AI prompt configuration.
 *
 * GET    /api/admin/users            — List all users
 * PATCH  /api/admin/users/:id/role   — Change user role
 * DELETE /api/admin/users/:id        — Delete a user and their assessments
 * GET    /api/admin/assessments      — List all assessments (any user)
 * GET    /api/admin/assessments/:id  — Get full assessment detail (any user)
 * DELETE /api/admin/assessments/:id  — Delete an assessment
 * GET    /api/admin/stats            — Dashboard stats
 * GET    /api/admin/prompts          — Get AI prompt config
 * PUT    /api/admin/prompts          — Update AI prompt config
 */
const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { collections, getDB } = require('../db');
const { authRequired, adminRequired, verifySession, forgetAccount } = require('../middleware/auth');
const { activityCollection, activityDoc } = require('../services/activityLog');
const { findFile, sendFile } = require('../services/adminAppReleases');
const { decryptUser, decryptUsers } = require('../services/encryption');
const { generateCode, hashCode, formatCode } = require('../services/activationCodes');
const { createLink: createAppLink, listLinks, revokeLink } = require('../services/adminAppLinks');
const { declineRefund, holdPaymentLink, RefundError, REFUND_WINDOW_DAYS, UNLINK_GRACE_DAYS, LINK_HOLD_DAYS, readEmail } = require('../services/reportAccess');
const { adminRefund, PaymentError } = require('../services/payments');
const { loadSettings, updateSettings, resolvePaymentConfig, paymentDiagnostics } = require('../services/paymentConfig');
const { ensureRecords, buildZip, archivePath, yearOf } = require('../services/paymentRecords');
const { SLOTS: PROMPT_SLOTS, promptRecordId } = require('../services/promptRouting');
const config = require('../config');
const nodemailer = require('nodemailer');

// ─── Shared SMTP transporter ───
function createSMTPTransport() {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
  });
}

// ─── Shared email HTML builder with professional signature ───
function buildEmailHTML(templateLabel, bodyContent) {
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body, table, td { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .header-cell { padding: 20px 16px !important; }
      .header-logo { height: 60px !important; }
      .header-title { font-size: 20px !important; letter-spacing: 1px !important; }
      .body-cell { padding: 20px 16px !important; font-size: 14px !important; }
      .footer-cell { padding: 0 16px 20px !important; }
      .footer-text { font-size: 11px !important; }
      .copyright { font-size: 10px !important; }
      .disclaimer { font-size: 9px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;width:100%;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ffffff;">
<tr><td align="left" style="padding:0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="width:600px;max-width:600px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

    <!-- Header -->
    <tr>
      <td class="header-cell" style="background:#121212;padding:28px 30px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td width="80" valign="middle" style="padding-right:16px;">
              <img src="https://gfl-trunk.pages.dev/images/landingpage/logo.png" alt="Garden For Life" class="header-logo" style="height:80px;width:auto;display:block;" />
            </td>
            <td valign="middle">
              <h1 class="header-title" style="color:#bc13fe;margin:0;font-size:26px;font-weight:700;letter-spacing:1.5px;font-family:'Rajdhani','Segoe UI',Tahoma,sans-serif;text-transform:uppercase;">Garden For Life</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td class="body-cell" style="padding:28px 30px;line-height:1.7;color:#333;font-size:15px;white-space:pre-wrap;">${bodyContent}</td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="footer-cell" style="padding:0 30px 24px;">
        <div style="border-top:2px solid #bc13fe;padding-top:20px;margin-top:12px;">
          <div class="footer-text" style="font-size:12px;line-height:1.6;color:#555;">
            <div>\u2709 <a href="mailto:yuanwullink30@gfl.community" style="color:#1a73e8;text-decoration:none;">yuanwullink30@gfl.community</a></div>
            <div>\ud83c\udf10 <a href="https://gardenforlife.nl/" style="color:#1a73e8;text-decoration:none;">www.gardenforlife.nl</a></div>
            <div style="margin-top:4px;font-size:11px;color:#888;">KVK: 85125245</div>
          </div>
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
            <p class="copyright" style="margin:0;font-size:11px;color:#999;">
              \u00a9 ${new Date().getFullYear()} Garden For Life \u00b7 Alle rechten voorbehouden
            </p>
            <p class="disclaimer" style="margin:4px 0 0;font-size:10px;color:#bbb;">
              Dit bericht is verstuurd vanuit het Garden For Life Verbindingscentrum
            </p>
          </div>
        </div>
      </td>
    </tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}
const router = Router();

// ═════════════════════════════════════════════════════════════
// NOT FOUND FOR EVERYONE BUT AN ADMIN
// This router answers only a valid admin token. Anything else — no token, a client token, a bad
// token — leaves the router (next('router')) and gets the server's ordinary 404, exactly like a
// path that does not exist. The admin API cannot be discovered by probing it. (The public
// activity log that used to sit here moved to routes/activity.js → POST /api/activity.)
// ═════════════════════════════════════════════════════════════

// verifySession (middleware/auth.js) takes the role from the DATABASE: a token claiming role:admin is
// no longer enough, and a revoked or demoted admin is out at once.
router.use(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next('router');
  const user = await verifySession(header.slice(7));
  if (!user || user.role !== 'admin') return next('router');
  req.user = user;
  return next();
});

// POST /api/admin/sessions/report-view — the admin opened a stored report (access log)
router.post('/sessions/report-view', async (req, res) => {
  try {
    const { reportId, reportType } = req.body || {};
    await activityCollection().insertOne(activityDoc('report_view', { userId: req.user.userId, email: req.user.email, reportId, reportType }, req));
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] report-view log error:', err.message);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// GET /api/admin/app/update/:file — the management app's PRIVATE update feed (latest.yml + installer).
// The app sends its session token with every request (apps/admin-desktop/src/updater.js).
router.get('/app/update/:file', async (req, res) => {
  try {
    const file = await findFile(req.params.file);
    if (!file) return res.status(404).json({ error: 'not_found' });
    return sendFile(req, res, file);
  } catch (err) {
    console.error('[Admin] app update feed error:', err.message);
    return res.status(500).json({ error: 'feed_failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/prompts — Get AI prompt configuration (admin only)
// The prompt config is the instruction layer that applies the Deltawerken corpus —
// proprietary, and previously served unauthenticated because this route sits above the
// router-level auth on line ~226. Guarded inline rather than moved, so route order stays put.
// ─────────────────────────────────────────────────────────────

router.get('/prompts', authRequired, adminRequired, async (req, res) => {
  try {
    // One Master Prompt per slot (?slot=beginner|intermediate|advanced; absent → advanced),
    // each in its own promptConfigs record (services/promptRouting.js). A missing record stays missing —
    // nothing is seeded; the report route refuses a level without a prompt.
    const id = promptIdOf(req, res);
    if (!id) return;
    console.log(`[Admin] GET /prompts (${id})`);
    const config = await promptsCollection().findOne({ _id: id });
    res.json(config || { _id: id, systemPromptTemplate: '' });
  } catch (err) {
    console.error('[Admin] Get prompts error:', err.message);
    res.status(500).json({ error: 'Failed to load prompt config' });
  }
});

// All other admin routes need auth + admin
router.use(authRequired, adminRequired);

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats — Dashboard overview
// ─────────────────────────────────────────────────────────────

router.get('/stats', async (_req, res) => {
  try {
    const [userCount, assessmentCount, recentAssessments] = await Promise.all([
      collections.users().countDocuments(),
      collections.assessments().countDocuments(),
      collections.assessments()
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .project({ archetypeKey: 1, extendedArchetypeName: 1, userId: 1, createdAt: 1 })
        .toArray(),
    ]);

    res.json({ userCount, assessmentCount, recentAssessments });
  } catch (err) {
    console.error('[Admin] Stats error:', err.message);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users — List all users
// ─────────────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;

    const users = await collections.users()
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({ passwordHash: 0 })
      .toArray();

    const total = await collections.users().countDocuments();

    // Decrypt PII fields before sending to admin
    res.json({ users: decryptUsers(users), total, limit, skip });
  } catch (err) {
    console.error('[Admin] Users error:', err.message);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/role — Change user role
// ─────────────────────────────────────────────────────────────

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['client', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "client" or "admin"' });
    }

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent removing your own admin
    if (req.params.id === req.user.userId && role !== 'admin') {
      return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    const result = await collections.users().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    forgetAccount(req.params.id); // the new role applies to that account's very next request
    res.json({ success: true, userId: req.params.id, role });
  } catch (err) {
    console.error('[Admin] Role change error:', err.message);
    res.status(500).json({ error: 'Failed to change role' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id — Delete a user and their assessments
// ─────────────────────────────────────────────────────────────

router.delete('/users/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent deleting yourself
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userId = req.params.id;

    // An admin-initiated deletion must erase exactly as much as a user-initiated one —
    // same shared helper, so the two can never drift apart on what erasure means.
    const user = await collections.users().findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { eraseAccountData } = require('./auth');
    const counts = await eraseAccountData(userId, user);

    console.log(
      `[Admin] Erased user ${userId} — ${counts.assessments} assessments, ${counts.reviews} reviews, ` +
      `${counts.orbCodes} orb-codes, ${counts.messages} messages, ${counts.verbonden} verbonden, ` +
      `${counts.kaartDrafts} kaart-drafts, ${counts.consentRecords} consent records`
    );
    forgetAccount(userId); // its tokens stop working at once
    res.json({ success: true, deletedUserId: userId, ...counts });
  } catch (err) {
    console.error('[Admin] Delete user error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/assessments — List all assessments
// ─────────────────────────────────────────────────────────────

router.get('/assessments', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;

    const assessments = await collections.assessments()
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({
        userId: 1,
        archetypeKey: 1,
        supportGroup: 1,
        extendedArchetypeName: 1,
        aiProvider: 1,
        aiModel: 1,
        createdAt: 1,
      })
      .toArray();

    const total = await collections.assessments().countDocuments();

    res.json({ assessments, total, limit, skip });
  } catch (err) {
    console.error('[Admin] Assessments error:', err.message);
    res.status(500).json({ error: 'Failed to load assessments' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/assessments/:id — Get full assessment detail
// ─────────────────────────────────────────────────────────────

router.get('/assessments/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    const assessment = await collections.assessments().findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Lookup user display name
    const user = await collections.users().findOne(
      { _id: new ObjectId(assessment.userId) },
      { projection: { displayName: 1, email: 1 } }
    );

    // Decrypt user PII
    const decryptedUser = user ? decryptUser(user) : null;

    res.json({ ...assessment, userDisplayName: decryptedUser?.displayName, userEmail: decryptedUser?.email });
  } catch (err) {
    console.error('[Admin] Assessment detail error:', err.message);
    res.status(500).json({ error: 'Failed to load assessment detail' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/assessments/:id — Delete an assessment
// ─────────────────────────────────────────────────────────────

router.delete('/assessments/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    const result = await collections.assessments().deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    console.log(`[Admin] Deleted assessment ${req.params.id}`);
    res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    console.error('[Admin] Delete assessment error:', err.message);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// PUT /api/admin/prompts — Update AI prompt configuration
// ─────────────────────────────────────────────────────────────

router.put('/prompts', async (req, res) => {
  try {
    console.log('[Admin] PUT /prompts called');
    console.log('[Admin] User:', req.user ? `${req.user.userId} (role: ${req.user.role})` : 'NO USER - AUTH FAILED!');
    
    if (!req.user) {
      console.error('[Admin] ❌ PUT /prompts rejected: No authenticated user (authRequired middleware failed)');
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const id = promptIdOf(req, res);
    if (!id) return;
    // Only what the report route reads: the Master Prompt and the temperature (routes/ai.js).
    const { systemPromptTemplate, temperature } = req.body;

    console.log('[Admin] Received fields:', {
      hasSystemTemplate: !!systemPromptTemplate,
      systemTemplateLength: systemPromptTemplate ? systemPromptTemplate.length : 0,
    });

    const update = {
      ...(systemPromptTemplate !== undefined && { systemPromptTemplate }),
      ...(temperature !== undefined && { temperature }),
      updatedAt: new Date(),
      updatedBy: req.user.userId,
    };

    console.log(`[Admin] Updating promptConfigs/${id}...`);
    await promptsCollection().updateOne(
      { _id: id },
      { $set: update },
      { upsert: true }
    );

    const config = await promptsCollection().findOne({ _id: id });
    console.log(`[Admin] ✅ PUT /prompts (${id}) success. updatedAt:`, config.updatedAt);
    res.json(config);
  } catch (err) {
    console.error('[Admin] ❌ Update prompts error:', err.message);
    res.status(500).json({ error: 'Failed to update prompt config' });
  }
});


// ═════════════════════════════════════════════════════════════
// Form Email — send forms instantly, no data saved to DB
// ═════════════════════════════════════════════════════════════

// POST /api/admin/forms/send-direct — send a form email instantly
// Supports optional pdfAttachment (data URI) for invoice emails
router.post('/forms/send-direct', authRequired, adminRequired, async (req, res) => {
  try {
    const { templateLabel, content, recipientEmail, subject, pdfAttachment, pdfBase64, attachmentFilename, additionalAttachments } = req.body;
    if (!recipientEmail) return res.status(400).json({ error: 'recipientEmail required' });
    if (!content) return res.status(400).json({ error: 'content required' });

    // Check SMTP config
    if (!config.email.user || !config.email.pass) {
      return res.status(503).json({ error: 'Email not configured. Set SMTP_USER and SMTP_PASS in environment variables.' });
    }

    // Send email directly — no DB storage
    const transporter = createSMTPTransport();

    // Build mail options
    const mailOptions = {
      from: `"Garden For Life" <${config.email.from}>`,
      to: recipientEmail,
      subject: subject || `Garden For Life — ${templateLabel || 'Document'}`,
      html: buildEmailHTML(templateLabel || 'Document', content),
    };

    // If PDF attachment provided, decode and attach
    // Accepts either raw base64 (pdfBase64) or data URI (pdfAttachment)
    const rawB64 = pdfBase64 || (pdfAttachment ? pdfAttachment.replace(/^data:[^;]+;[^,]*,/, '') : null);
    console.log('[Admin] PDF attachment:', rawB64 ? `${rawB64.length} chars base64` : 'NONE');
    if (rawB64) {
      mailOptions.attachments = [{
        filename: attachmentFilename || 'document',
        content: Buffer.from(rawB64, 'base64'),
      }];
    }

    // Append additional attachments if provided
    if (Array.isArray(additionalAttachments) && additionalAttachments.length > 0) {
      if (!mailOptions.attachments) mailOptions.attachments = [];
      for (const att of additionalAttachments) {
        if (att.content) {
          console.log('[Admin] Additional attachment:', att.filename, `${att.content.length} chars base64`);
          mailOptions.attachments.push({
            filename: att.filename || 'document',
            content: Buffer.from(att.content, 'base64'),
          });
        }
      }
    }
    console.log('[Admin] Total attachments:', mailOptions.attachments?.length || 0);

    await transporter.sendMail(mailOptions);

    res.json({ success: true, sentTo: recipientEmail });
  } catch (err) {
    console.error('[Admin] Direct send error:', err.message);
    res.status(500).json({ error: `Failed to send: ${err.message}` });
  }
});

// GET /api/admin/email/status — check SMTP configuration status
router.get('/email/status', authRequired, adminRequired, (_req, res) => {
  const configured = !!(config.email.user && config.email.pass);
  res.json({
    configured,
    from: configured ? config.email.from : null,
    host: config.email.host,
  });
});

// ═════════════════════════════════════════════════════════════
// Dev Session Audit Log — session computation & protected read/clear endpoints
// Sessions are computed by grouping events with < 30 min gaps.
// (The POST activity endpoint is registered above, before auth middleware.)
// ═════════════════════════════════════════════════════════════

const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Compute sessions from a list of activity events.
 * Events must be sorted by timestamp ascending.
 * A session breaks when two consecutive events are > 30 min apart.
 */
function computeSessions(events) {
  if (!events.length) return [];
  const sessions = [];
  let current = { startedAt: events[0].timestamp, endedAt: events[0].timestamp, events: [events[0]] };

  for (let i = 1; i < events.length; i++) {
    const gap = new Date(events[i].timestamp).getTime() - new Date(current.endedAt).getTime();
    if (gap > SESSION_GAP_MS) {
      current.durationMs = new Date(current.endedAt).getTime() - new Date(current.startedAt).getTime();
      sessions.push(current);
      current = { startedAt: events[i].timestamp, endedAt: events[i].timestamp, events: [events[i]] };
    } else {
      current.endedAt = events[i].timestamp;
      current.events.push(events[i]);
    }
  }
  current.durationMs = new Date(current.endedAt).getTime() - new Date(current.startedAt).getTime();
  sessions.push(current);
  return sessions;
}

// GET /api/admin/sessions — get computed dev sessions (admin only)
// GET /api/admin/sessions/access — direct access log (report views + admin logins, newest first)
router.get('/sessions/access', authRequired, adminRequired, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);
    const events = await activityCollection()
      .find({ type: { $in: ['report_view', 'admin_login'] } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    res.json({ events, total: events.length });
  } catch (err) {
    console.error('[Admin] Access log error:', err.message);
    res.status(500).json({ error: 'Failed to load access log' });
  }
});

// GET /api/admin/sessions/consent — consent audit log (consent_given events, newest first)
router.get('/sessions/consent', authRequired, adminRequired, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);
    const events = await activityCollection()
      .find({ type: 'consent_given' })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    res.json({ events, total: events.length });
  } catch (err) {
    console.error('[Admin] Consent log error:', err.message);
    res.status(500).json({ error: 'Failed to load consent log' });
  }
});

// GET /api/admin/sessions/dev — development activity log (edit/commit/push events, newest first)
router.get('/sessions/dev', authRequired, adminRequired, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 500, 2000);
    const events = await activityCollection()
      .find({ type: { $in: ['edit', 'commit', 'push'] } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    res.json({ events, total: events.length });
  } catch (err) {
    console.error('[Admin] Dev log error:', err.message);
    res.status(500).json({ error: 'Failed to load dev log' });
  }
});

router.get('/sessions', authRequired, adminRequired, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
    // Fetch all events sorted ascending by timestamp
    const events = await activityCollection()
      .find({})
      .sort({ timestamp: 1 })
      .toArray();

    const allSessions = computeSessions(events);
    // Return newest sessions first, limited
    const sessions = allSessions.reverse().slice(0, limit);

    res.json({ sessions, totalEvents: events.length });
  } catch (err) {
    console.error('[Admin] Session list error:', err.message);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// DELETE /api/admin/sessions — DISABLED: audit log is immutable, deletion not permitted
router.delete('/sessions', (_req, res) => {
  res.status(405).json({ error: 'Audit log deletion is not permitted.' });
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/reviews — List all assessment reviews with full context
// ─────────────────────────────────────────────────────────────

router.get('/reviews', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = parseInt(req.query.skip) || 0;
    const includeAssessment = req.query.includeAssessment === 'true';

    console.log('[Admin] GET /reviews called');

    // Fetch reviews
    const reviews = await collections.assessmentReviews()
      .find({})
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // If requested, fetch full assessment data for each review
    let reviewsWithContext = reviews;
    if (includeAssessment) {
      reviewsWithContext = await Promise.all(
        reviews.map(async (review) => {
          let assessment = null;
          if (review.assessmentId && review.assessmentId !== 'anonymous' && ObjectId.isValid(review.assessmentId)) {
            try {
              assessment = await collections.assessments().findOne({
                _id: new ObjectId(review.assessmentId),
              });
            } catch (err) {
              console.warn(`[Admin] Could not fetch assessment ${review.assessmentId}:`, err.message);
            }
          }
          return { ...review, assessment };
        })
      );
    }

    const total = await collections.assessmentReviews().countDocuments();

    console.log(`[Admin] Returning ${reviews.length} reviews (total: ${total})`);
    res.json({ reviews: reviewsWithContext, total, limit, skip });
  } catch (err) {
    console.error('[Admin] Get reviews error:', err.message);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/reviews/:id — Get single review detail with assessment
// ─────────────────────────────────────────────────────────────

router.get('/reviews/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid review ID' });
    }

    console.log('[Admin] GET /reviews/:id called for', req.params.id);

    const review = await collections.assessmentReviews().findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Fetch associated assessment
    let assessment = null;
    if (review.assessmentId && review.assessmentId !== 'anonymous' && ObjectId.isValid(review.assessmentId)) {
      try {
        assessment = await collections.assessments().findOne({
          _id: new ObjectId(review.assessmentId),
        });
      } catch (err) {
        console.warn(`[Admin] Could not fetch assessment ${review.assessmentId}:`, err.message);
      }
    }

    // Fetch user data if available
    let user = null;
    if (review.userId && ObjectId.isValid(review.userId)) {
      try {
        user = await collections.users().findOne(
          { _id: new ObjectId(review.userId) },
          { projection: { passwordHash: 0 } }
        );
        if (user) {
          user = decryptUser(user);
        }
      } catch (err) {
        console.warn(`[Admin] Could not fetch user ${review.userId}:`, err.message);
      }
    }

    res.json({
      review,
      assessment,
      user,
    });
  } catch (err) {
    console.error('[Admin] Get review detail error:', err.message);
    res.status(500).json({ error: 'Failed to load review' });
  }
});

// ─────────────────────────────────────────────────────────────
// Helpers — site settings collection
// ─────────────────────────────────────────────────────────────

function siteSettingsCollection() {
  return getDB().collection('siteSettings');
}

// ─────────────────────────────────────────────────────────────
// GET  /api/admin/settings/feedback-email  — load settings
// PUT  /api/admin/settings/feedback-email  — save settings
// Both require admin auth (already applied via router.use above)
// ─────────────────────────────────────────────────────────────

router.get('/settings/feedback-email', async (_req, res) => {
  try {
    const settings = await siteSettingsCollection().findOne({ _id: 'feedback-email' });
    res.json({ text: settings?.text || '' });
  } catch (err) {
    console.error('[Admin] Get feedback-email settings error:', err.message);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/settings/feedback-email', async (req, res) => {
  try {
    const text = (req.body.text || '').slice(0, 2000);

    // Text only. The donation QR image (and its uploader) was removed; any legacy image
    // still on the document is dropped on save so it cannot linger.
    await siteSettingsCollection().updateOne(
      { _id: 'feedback-email' },
      { $set: { text, updatedAt: new Date() }, $unset: { imageBase64: '', imageMimeType: '' } },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Update feedback-email settings error:', err.message);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ─────────────────────────────────────────────────────────────
// Activation Codes (admin only — already behind authRequired + adminRequired)
// One-time vouchers for a full report. Stored hashed; the plaintext is returned exactly
// once, by the POST that creates it. Used/revoked codes remain as the logbook.
// ─────────────────────────────────────────────────────────────

// ─── Install links for the management phone app (services/adminAppLinks.js) ───
// The plain link is in the POST response only; the list shows the last four characters.
router.get('/app-links', async (_req, res) => {
  try { res.json({ links: await listLinks() }); } catch (err) {
    console.error('[Admin] app links list failed:', err.message);
    res.status(500).json({ error: 'Could not load the install links' });
  }
});
router.post('/app-links', async (req, res) => {
  try { res.status(201).json(await createAppLink(req.user.userId, req.body && req.body.label)); } catch (err) {
    console.error('[Admin] app link create failed:', err.message);
    res.status(500).json({ error: 'Could not create an install link' });
  }
});
router.delete('/app-links/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try { res.json({ revoked: await revokeLink(new ObjectId(req.params.id)) }); } catch (err) {
    console.error('[Admin] app link revoke failed:', err.message);
    res.status(500).json({ error: 'Could not revoke the install link' });
  }
});

const MAX_CODES_PER_BATCH = 50;
const CODE_PUBLIC_FIELDS = { codeHash: 0, unlockId: 0 };

// GET /api/admin/activation-codes — active codes + logbook (used and revoked)
router.get('/activation-codes', async (_req, res) => {
  try {
    const col = collections.activationCodes();
    const [active, logbook] = await Promise.all([
      col.find({ status: 'active' }, { projection: CODE_PUBLIC_FIELDS }).sort({ createdAt: -1 }).toArray(),
      col.find({ status: { $in: ['used', 'revoked'] } }, { projection: CODE_PUBLIC_FIELDS }).toArray(),
    ]);
    // Newest event first, whichever kind it was.
    logbook.sort((x, y) => new Date(y.usedAt || y.revokedAt) - new Date(x.usedAt || x.revokedAt));
    res.json({ active, logbook });
  } catch (err) {
    console.error('[Admin] List activation codes error:', err.message);
    res.status(500).json({ error: 'Failed to load activation codes' });
  }
});

// POST /api/admin/activation-codes — generate { count, label } codes; plaintext returned once
router.post('/activation-codes', async (req, res) => {
  const count = Number.parseInt(req.body?.count, 10) || 1;
  if (count < 1 || count > MAX_CODES_PER_BATCH) {
    return res.status(400).json({ error: `count must be 1-${MAX_CODES_PER_BATCH}` });
  }
  const label = String(req.body?.label || '').trim().slice(0, 80);
  try {
    const now = new Date();
    const created = [];
    for (let i = 0; i < count; i++) {
      // A collision on a 59-bit code is practically impossible; retry anyway rather than
      // fail the whole batch on the unique index.
      for (let attempt = 0; attempt < 3; attempt++) {
        const raw = generateCode();
        const doc = {
          codeHash: hashCode(raw), hint: raw.slice(-4), label,
          status: 'active', createdAt: now, createdBy: req.user.userId,
        };
        try {
          const r = await collections.activationCodes().insertOne(doc);
          created.push({ _id: r.insertedId, code: formatCode(raw), hint: doc.hint, label, createdAt: now });
          break;
        } catch (e) {
          if (e.code !== 11000 || attempt === 2) throw e;
        }
      }
    }
    res.status(201).json({ codes: created });
  } catch (err) {
    console.error('[Admin] Create activation codes error:', err.message);
    res.status(500).json({ error: 'Failed to create activation codes' });
  }
});

// PATCH /api/admin/activation-codes/:id/revoke — stop an unused code; it moves to the logbook
router.patch('/activation-codes/:id/revoke', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid activation code ID' });
    }
    const r = await collections.activationCodes().updateOne(
      { _id: new ObjectId(req.params.id), status: 'active' },
      { $set: { status: 'revoked', revokedAt: new Date(), revokedBy: req.user.userId } },
    );
    if (r.matchedCount === 0) {
      return res.status(409).json({ error: 'Code is not active (already used or revoked)' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Revoke activation code error:', err.message);
    res.status(500).json({ error: 'Failed to revoke activation code' });
  }
});

// ─────────────────────────────────────────────────────────────
// Report unlocks + 14-day money-back guarantee (admin only)
// A refund blocks the report's crystal code and takes its access off the account that
// claimed it (services/reportAccess.js). Irreversible.
// ─────────────────────────────────────────────────────────────

// GET /api/admin/report-unlocks — newest first
router.get('/report-unlocks', async (_req, res) => {
  try {
    const unlocks = await collections.reportUnlocks()
      .find({}, { projection: { codeHash: 0 } })
      .sort({ unlockedAt: -1 }).limit(500).toArray();
    const emailHashes = [...new Set(unlocks.map((x) => x.emailHash).filter(Boolean))];
    const grey = new Map((await collections.refundGreylist()
      .find({ emailHash: { $in: emailHashes } }, { projection: { emailHash: 1, refunds: 1 } }).toArray())
      .map((g) => [g.emailHash, g]));
    // Whether the report's code has been claimed by an account (without exposing the hash).
    const withHash = await collections.reportUnlocks()
      .find({ _id: { $in: unlocks.map((x) => x._id) }, codeHash: { $ne: null } }, { projection: { codeHash: 1 } }).toArray();
    const linked = new Set((await collections.orbCodes()
      .find({ codeHash: { $in: withHash.map((x) => x.codeHash) } }, { projection: { codeHash: 1 } }).toArray())
      .map((x) => x.codeHash));
    const hashById = new Map(withHash.map((x) => [String(x._id), x.codeHash]));
    res.json({
      refundWindowDays: REFUND_WINDOW_DAYS,
      unlinkAfterDays: REFUND_WINDOW_DAYS + UNLINK_GRACE_DAYS,
      linkHoldDays: LINK_HOLD_DAYS,
      unlocks: unlocks.map((x) => {
        const h = hashById.get(String(x._id));
        const g = x.emailHash ? grey.get(x.emailHash) : null;
        // A refunded row is itself on the grey list; what matters for the button is an EARLIER refund.
        const earlier = g ? (g.refunds || []).filter((r) => !x.refundedAt || new Date(r.refundedAt) < new Date(x.refundedAt)) : [];
        return {
          ...x,
          email: readEmail(x.email),
          emailHash: undefined,
          unlockId: undefined,
          hasCode: !!h,
          accountLinked: !!h && linked.has(h),
          greylisted: earlier.length > 0,
          previousRefunds: earlier.map((r) => r.refundedAt),
          moderatorReviews: (x.moderatorReviews || []).map((v) => ({ decision: v.decision, at: v.at })),
        };
      }),
    });
  } catch (err) {
    console.error('[Admin] List report unlocks error:', err.message);
    res.status(500).json({ error: 'Failed to load report unlocks' });
  }
});

// POST /api/admin/report-unlocks/:id/refund — refund under the guarantee
router.post('/report-unlocks/:id/refund', async (req, res) => {
  try {
    // Stripe payments: the ledger checks run first (nothing moves if the refund would be refused),
    // then Stripe sends the money back, then the ledger records it (services/payments.js adminRefund).
    // Unlocks without a Stripe reference are still recorded as a manual refund.
    const result = await adminRefund({ id: req.params.id, by: req.user.userId, review: req.body?.review });
    res.json({
      success: true,
      codeBlocked: result.codeBlocked,
      secondRefund: result.secondRefund,
      accountEffect: result.accountEffect ? {
        accountDeleted: !!result.accountEffect.accountDeleted,
        accessUntilBefore: result.accountEffect.accessUntilBefore,
        accessUntilAfter: result.accountEffect.accessUntilAfter || null,
        readingsLeft: result.accountEffect.readingsLeft ?? 0,
        accountMissing: !!result.accountEffect.accountMissing,
      } : null,
    });
  } catch (err) {
    if (err instanceof RefundError) {
      const status = { not_found: 404, not_refundable: 400, already_refunded: 409, window_closed: 409, greylisted: 409, review_incomplete: 400 }[err.code] || 400;
      return res.status(status).json({ error: err.message, code: err.code, ...(err.previousRefunds ? { previousRefunds: err.previousRefunds } : {}) });
    }
    if (err instanceof PaymentError) {
      return res.status(err.status).json({ error: 'Stripe is not configured — the refund was not sent', code: err.code });
    }
    console.error('[Admin] Refund error:', err.message);
    // A Stripe error means the money did NOT go back and the ledger was not touched.
    res.status(502).json({ error: `Refund failed at Stripe: ${err.message}`, code: 'provider_error' });
  }
});

// GET /api/admin/payment-config — the flip schedule and country gate (stored + what applies now)
router.get('/payment-config', async (_req, res) => {
  try {
    // The admin sees the config as the gates see it (test token applied) plus what is missing.
    const [stored, effective] = await Promise.all([loadSettings(), resolvePaymentConfig(new Date(), { testAccess: true })]);
    res.json({ stored, effective: { ...effective, publishableKey: undefined }, diagnostics: paymentDiagnostics() });
  } catch (err) {
    console.error('[Admin] Payment config error:', err.message);
    res.status(500).json({ error: 'Failed to load payment config' });
  }
});

// PUT /api/admin/payment-config — body { flipAt?, gate?: { launchCountries?, openCountries?, openAtFlip? } }
// Takes effect within seconds, no deploy. openAtFlip = the OSS registration is active.
router.put('/payment-config', async (req, res) => {
  try {
    const stored = await updateSettings(req.body || {}, req.user.userId);
    const effective = await resolvePaymentConfig(new Date(), { testAccess: true });
    res.json({ stored, effective: { ...effective, publishableKey: undefined }, diagnostics: paymentDiagnostics() });
  } catch (err) {
    if (err.code === 'invalid') return res.status(400).json({ error: err.message });
    console.error('[Admin] Update payment config error:', err.message);
    res.status(500).json({ error: 'Failed to update payment config' });
  }
});

// POST /api/admin/report-unlocks/:id/decline — moderator declines a refund request after the review
router.post('/report-unlocks/:id/decline', async (req, res) => {
  try {
    const r = await declineRefund({ id: req.params.id, by: req.user.userId, review: req.body?.review });
    res.json({ success: true, reviews: (r.moderatorReviews || []).length });
  } catch (err) {
    if (err instanceof RefundError) {
      return res.status(err.code === 'not_found' ? 404 : 400).json({ error: err.message, code: err.code });
    }
    console.error('[Admin] Decline refund error:', err.message);
    res.status(500).json({ error: 'Decline failed' });
  }
});

// POST /api/admin/report-unlocks/:id/hold — keep the payment ↔ report link past day 15 while a
// refund is being processed ({ hold: true } renews for LINK_HOLD_DAYS), or release it ({ hold: false })
router.post('/report-unlocks/:id/hold', async (req, res) => {
  try {
    const until = await holdPaymentLink({ id: req.params.id, hold: req.body?.hold !== false, by: req.user.userId });
    res.json({ success: true, linkHeldUntil: until });
  } catch (err) {
    if (err instanceof RefundError) {
      return res.status(err.code === 'not_found' ? 404 : 409).json({ error: err.message, code: err.code });
    }
    console.error('[Admin] Hold payment link error:', err.message);
    res.status(500).json({ error: 'Hold failed' });
  }
});

// ─────────────────────────────────────────────────────────────
// Payment records (admin only) — the stored PDF per payment and per refund.
// Individually downloadable, and as one ZIP folder (all, or one year).
// ─────────────────────────────────────────────────────────────

const RECORD_META = { pdf: 0 };

// GET /api/admin/payment-records — metadata of every record, newest first (re-issues any missing PDF)
router.get('/payment-records', async (_req, res) => {
  try {
    const issued = await ensureRecords().catch((e) => { console.error('[Admin] ensureRecords:', e.message); return 0; });
    const records = await collections.paymentRecords().find({}, { projection: RECORD_META }).sort({ issuedAt: -1 }).toArray();
    res.json({ records: records.map((r) => ({ ...r, year: yearOf(r.issuedAt) })), issued });
  } catch (err) {
    console.error('[Admin] List payment records error:', err.message);
    res.status(500).json({ error: 'Failed to load payment records' });
  }
});

// GET /api/admin/payment-records/archive.zip?year=2026 — the folder (all years when omitted)
router.get('/payment-records/archive.zip', async (req, res) => {
  try {
    const year = req.query.year ? Number(req.query.year) : null;
    if (req.query.year && !Number.isInteger(year)) return res.status(400).json({ error: 'Invalid year' });
    await ensureRecords().catch(() => 0);
    const filter = year
      ? { issuedAt: { $gte: new Date(`${year - 1}-12-31T00:00:00Z`), $lt: new Date(`${year + 1}-01-02T00:00:00Z`) } }
      : {};
    const records = (await collections.paymentRecords().find(filter).sort({ issuedAt: 1 }).toArray())
      .filter((r) => !year || yearOf(r.issuedAt) === year);
    const zip = buildZip(records.map((r) => ({ name: archivePath(r), data: Buffer.from(r.pdf.buffer), date: r.issuedAt })));
    const name = `Betaalbewijzen${year ? `_${year}` : ''}.zip`;
    res.set({ 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${name}"`, 'Content-Length': zip.length });
    res.end(zip);
  } catch (err) {
    console.error('[Admin] Payment records zip error:', err.message);
    res.status(500).json({ error: 'Failed to build archive' });
  }
});

// GET /api/admin/payment-records/:id/pdf — one record
router.get('/payment-records/:id/pdf', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid record ID' });
    const r = await collections.paymentRecords().findOne({ _id: new ObjectId(req.params.id) });
    if (!r) return res.status(404).json({ error: 'Record not found' });
    const buf = Buffer.from(r.pdf.buffer);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${r.filename}"`, 'Content-Length': buf.length });
    res.end(buf);
  } catch (err) {
    console.error('[Admin] Payment record pdf error:', err.message);
    res.status(500).json({ error: 'Failed to load record' });
  }
});

// ─────────────────────────────────────────────────────────────
// Invoice Management (admin only — database-linked, not device-linked)
// ─────────────────────────────────────────────────────────────

function invoicesCollection() {
  return getDB().collection('invoices');
}

// POST /api/admin/invoices — save an invoice
router.post('/invoices', async (req, res) => {
  try {
    const { invoiceNumber, clientName, data } = req.body;
    if (!invoiceNumber || !clientName || !data) {
      return res.status(400).json({ error: 'Missing required fields: invoiceNumber, clientName, data' });
    }

    const entry = {
      userId: req.user.id,
      invoiceNumber,
      clientName,
      data,
      savedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await invoicesCollection().insertOne(entry);
    res.json({
      _id: result.insertedId,
      ...entry,
    });
  } catch (err) {
    console.error('[Admin] Save invoice error:', err.message);
    res.status(500).json({ error: 'Failed to save invoice' });
  }
});

// GET /api/admin/invoices — get all invoices for current user
router.get('/invoices', async (req, res) => {
  try {
    const invoices = await invoicesCollection()
      .find({ userId: req.user.id })
      .sort({ savedAt: -1 })
      .toArray();
    res.json(invoices);
  } catch (err) {
    console.error('[Admin] Get invoices error:', err.message);
    res.status(500).json({ error: 'Failed to load invoices' });
  }
});

// DELETE /api/admin/invoices/:id — delete an invoice
router.delete('/invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ObjectId = require('mongodb').ObjectId;

    const result = await invoicesCollection().deleteOne({
      _id: new ObjectId(id),
      userId: req.user.id,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Delete invoice error:', err.message);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** The promptConfigs record id for ?slot= (absent → advanced); answers 400 and returns null when unknown. */
function promptIdOf(req, res) {
  const slot = req.query.slot === undefined ? 'advanced' : String(req.query.slot);
  if (!PROMPT_SLOTS.includes(slot)) {
    res.status(400).json({ error: `unknown prompt slot ${JSON.stringify(slot)}` });
    return null;
  }
  return promptRecordId(slot);
}

function promptsCollection() {
  return getDB().collection('promptConfigs');
}
