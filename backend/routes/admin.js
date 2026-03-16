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
const { authRequired, adminRequired } = require('../middleware/auth');
const { decryptUser, decryptUsers } = require('../services/encryption');
const config = require('../config');
const multer = require('multer');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
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

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, Word (.docx/.doc), and plain text files are allowed'));
    }
  },
});

const router = Router();

// ═════════════════════════════════════════════════════════════
// UNPROTECTED: Dev activity logging endpoint (called from git hooks / dev-watcher)
// Must be registered BEFORE the global auth middleware below.
// ═════════════════════════════════════════════════════════════

const RETENTION_DAYS = 90;

function activityCollection() {
  const col = getDB().collection('devActivity');
  col.createIndex({ timestamp: 1 }, { expireAfterSeconds: RETENTION_DAYS * 86400 }).catch(() => {});
  return col;
}

// POST /api/admin/sessions/activity — log a dev or admin activity event (no auth — called from git hooks and frontend)
router.post('/sessions/activity', async (req, res) => {
  try {
    const { type, message, branch, hash, userId, email, reportId, reportType } = req.body;
    const allowed = ['edit', 'commit', 'push', 'admin_login', 'report_view'];
    if (!type || !allowed.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${allowed.join(', ')}` });
    }

    const doc = {
      type,
      timestamp: new Date(),
      // dev fields
      message: (message || '').slice(0, 512),
      branch: (branch || '').slice(0, 256),
      hash: (hash || '').slice(0, 64),
      // admin fields
      userId: userId || null,
      email: (email || '').slice(0, 256),
      reportId: reportId || null,
      reportType: (reportType || '').slice(0, 64),
    };

    await activityCollection().insertOne(doc);
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Activity log error:', err.message);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/prompts — Get AI prompt configuration (NO AUTH)
// ─────────────────────────────────────────────────────────────

router.get('/prompts', async (_req, res) => {
  try {
    console.log('[Admin] GET /prompts called');
    let config = await promptsCollection().findOne({ _id: 'default' });
    
    // If no config exists, create it from default
    if (!config) {
      console.log('[Admin] No config found, creating default');
      config = getDefaultPromptConfig();
      try {
        await promptsCollection().insertOne(config);
        console.log('[Admin] Created default prompt config in MongoDB');
      } catch (err) {
        // If insert fails (e.g., duplicate), just return the default
        console.warn('[Admin] Could not persist default config:', err.message);
      }
    } else {
      console.log('[Admin] Found existing config in MongoDB');
    }
    
    res.json(config);
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

    // Delete user's assessments first
    const assessmentResult = await collections.assessments().deleteMany({ userId });

    // Delete the user
    const userResult = await collections.users().deleteOne({ _id: new ObjectId(userId) });

    if (userResult.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Admin] Deleted user ${userId} and ${assessmentResult.deletedCount} assessments`);
    res.json({ success: true, deletedUserId: userId, deletedAssessments: assessmentResult.deletedCount });
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
    
    const { systemPromptTemplate, userPromptTemplate, defaultProvider, defaultModel, temperature, maxTokens } = req.body;

    console.log('[Admin] Received fields:', {
      hasSystemTemplate: !!systemPromptTemplate,
      systemTemplateLength: systemPromptTemplate ? systemPromptTemplate.length : 0,
      hasUserTemplate: !!userPromptTemplate,
    });

    const update = {
      ...(systemPromptTemplate !== undefined && { systemPromptTemplate }),
      ...(userPromptTemplate !== undefined && { userPromptTemplate }),
      ...(defaultProvider !== undefined && { defaultProvider }),
      ...(defaultModel !== undefined && { defaultModel }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { maxTokens }),
      updatedAt: new Date(),
      updatedBy: req.user.userId,
    };

    console.log('[Admin] Updating MongoDB...');
    await promptsCollection().updateOne(
      { _id: 'default' },
      { $set: update },
      { upsert: true }
    );

    const config = await promptsCollection().findOne({ _id: 'default' });
    console.log('[Admin] ✅ PUT /prompts success. updatedAt:', config.updatedAt);
    res.json(config);
  } catch (err) {
    console.error('[Admin] ❌ Update prompts error:', err.message);
    res.status(500).json({ error: 'Failed to update prompt config' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/prompts/documents — Upload a context document
// ─────────────────────────────────────────────────────────────

router.post('/prompts/documents', docUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, size, buffer } = req.file;
    let extractedText = '';

    // Extract text based on file type
    if (mimetype === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (mimetype === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from uploaded file' });
    }

    const doc = {
      filename: originalname,
      mimetype,
      size,
      extractedText: extractedText.trim(),
      charCount: extractedText.trim().length,
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
    };

    const result = await docsCollection().insertOne(doc);
    doc._id = result.insertedId;

    console.log(`[Admin] Document uploaded: "${originalname}" (${doc.charCount} chars)`);
    res.json({ success: true, document: { _id: doc._id, filename: doc.filename, mimetype: doc.mimetype, size: doc.size, charCount: doc.charCount, uploadedAt: doc.uploadedAt } });
  } catch (err) {
    console.error('[Admin] Document upload error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to upload document' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/prompts/documents — List all context documents
// ─────────────────────────────────────────────────────────────

router.get('/prompts/documents', async (_req, res) => {
  try {
    const docs = await docsCollection()
      .find({})
      .sort({ uploadedAt: -1 })
      .project({ extractedText: 0 }) // Don't send full text in listing
      .toArray();

    res.json({ documents: docs });
  } catch (err) {
    console.error('[Admin] List documents error:', err.message);
    res.status(500).json({ error: 'Failed to load documents' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/admin/prompts/documents/:id — Get a single document (with text)
// ─────────────────────────────────────────────────────────────

router.get('/prompts/documents/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const doc = await docsCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    res.json(doc);
  } catch (err) {
    console.error('[Admin] Get document error:', err.message);
    res.status(500).json({ error: 'Failed to load document' });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/admin/prompts/documents/:id — Delete a context document
// ─────────────────────────────────────────────────────────────

router.delete('/prompts/documents/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    const result = await docsCollection().deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    console.log(`[Admin] Document deleted: ${req.params.id}`);
    res.json({ success: true, deletedId: req.params.id });
  } catch (err) {
    console.error('[Admin] Delete document error:', err.message);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/admin/prompts/documents/verify — Verify all documents are readable
// ─────────────────────────────────────────────────────────────

router.post('/prompts/documents/verify', async (_req, res) => {
  try {
    const docs = await docsCollection()
      .find({})
      .sort({ uploadedAt: 1 })
      .toArray();

    const results = docs.map((doc) => ({
      _id: doc._id,
      filename: doc.filename,
      charCount: doc.charCount || 0,
      hasText: !!(doc.extractedText && doc.extractedText.trim().length > 0),
      preview: doc.extractedText
        ? doc.extractedText.substring(0, 200) + (doc.extractedText.length > 200 ? '…' : '')
        : '',
    }));

    const allValid = results.every((r) => r.hasText);
    const totalChars = results.reduce((s, r) => s + r.charCount, 0);

    console.log(`[Admin] Document verification: ${results.length} docs, ${totalChars} chars, all valid: ${allValid}`);
    res.json({
      success: true,
      verified: allValid,
      totalDocuments: results.length,
      totalChars,
      documents: results,
    });
  } catch (err) {
    console.error('[Admin] Document verify error:', err.message);
    res.status(500).json({ error: 'Failed to verify documents' });
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
        filename: attachmentFilename || 'factuur.pdf',
        content: Buffer.from(rawB64, 'base64'),
        contentType: 'application/pdf',
      }];
    }

    // Append additional attachments if provided
    if (Array.isArray(additionalAttachments) && additionalAttachments.length > 0) {
      if (!mailOptions.attachments) mailOptions.attachments = [];
      for (const att of additionalAttachments) {
        if (att.content) {
          console.log('[Admin] Additional attachment:', att.filename, `${att.content.length} chars base64`);
          mailOptions.attachments.push({
            filename: att.filename || 'document.pdf',
            content: Buffer.from(att.content, 'base64'),
            contentType: 'application/pdf',
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

module.exports = router;

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function promptsCollection() {
  return getDB().collection('promptConfigs');
}

function docsCollection() {
  return getDB().collection('promptDocuments');
}

function getDefaultPromptConfig() {
  return {
    _id: 'default',
    systemPromptTemplate:
      '⚙️ MASTER PROMPT: THE ADVANCED ONTOLOGICAL ENGINE\n' +
      'Systeem Instructie voor de AI: Je bent de \'Ontological Architect\'. Je analyseert de uitslag van de kandidaat uit de GardenForLife Triple Network Model (TNM) assessment. Je gebruikt de neurobiologie van het TNM (CEN, DMN, Salience), kwantumbiologie, neuroplasticiteit en analytisch idealisme als je interne denkkader. Je hebt de absolute vrijheid om dit te vertalen naar de leefwereld van de kandidaat, maar je blijft altijd geworteld in de biologische feiten. Je doorloopt verplicht de volgende 3 Fases in exacte volgorde.\n\n' +
      'FASE 1: TNM DATA-EXTRACTIE & BEREKENING\n' +
      '1. Identificeer de Kern (Nature): Bepaal het Main en Support Archetype en hun plek in het TNM (CEN = Ruling/Agency, DMN = Abstract/Relational, Salience = Chaos/Seeker). Haal de bijbehorende biochemische basislijn (Cortisol/Serotonine/Dopamine) en OCEAN-scores op.\n' +
      '2. De OCEAN Delta-Analyse (Numerieke Overlay): Als de kandidaat een ruwe OCEAN-test (0-100) heeft geüpload, moet je deze getallen eerst vertalen naar onze kwalitatieve systeem-waarden. Hanteer deze harde schaal:\n' +
      '0 - 20: Uitzonderlijk Laag\n' +
      '21 - 40: Laag\n' +
      '41 - 60: Gemiddeld / Neutraal\n' +
      '61 - 80: Hoog\n' +
      '81 - 100: Uitzonderlijk Hoog\n' +
      'Bereken de Frictie (Resonantie vs. Dissonantie): Leg de ruwe, vertaalde OCEAN-score van de kandidaat náást de ingebouwde OCEAN-basislijn van hun Main en Culture-archetypen.\n' +
      'Resonantie: Komen de scores overeen? Dan is dit archetype pure, ongedwongen Nature. Het zenuwstelsel en de identiteit zijn perfect gesynchroniseerd.\n' +
      'Dissonantie (De Lakmoesproef): Wijkt de ruwe score sterk af van de archetype-basislijn? Dan is dit archetype geen pure biologie. Gebruik dit als hard bewijs dat de kandidaat via neuroplasticiteit een zwaar \'gecloakt\' overlevingsmechanisme (Culture) heeft gebouwd, wat fungeert als een tweede natuur, maar wat fundamenteel botst met hun hardware.\n' +
      '3. Map het Pantser (CultureForce): Identificeer het dominante Culture-archetype (de Gele Lijn). Let op de Cloak-Rule: Behandel dit nooit als een oppervlakkig leugentje. Leg uit dat dit gedrag door neuroplasticiteit zo diep is ingesleten dat het voor het zenuwstelsel als een \'tweede natuur\' is gaan voelen.\n\n' +
      'FASE 2: HET TROJAANSE PROTOCOL\n' +
      'Stem je taal af op de firewall van de kandidaat.\n' +
      '1. Probabilistische Toonzetting (Vermijd Determinisme): Je mag de kandidaat nooit vertellen wie ze absoluut zijn of wat ze altijd doen ("Jij bent X", "Jij doet Y"). Gebruik uitsluitend probabilistische, observerende taal op basis van hun biologie. Gebruik zinsneden als: "Vanuit je neurologische profiel is het aannemelijk dat...", "De kans is groot dat...", "Waak ervoor dat je niet...", of "Houd er rekening mee dat...".\n' +
      '2. De Actieve Lens Resonantie: Scan of het brein van de kandidaat primair op Nature leunt, óf zwaar leunt op hun CultureForce. Adopteer de taal van het meest actieve TNM-netwerk.\n' +
      '  - Linkerhemisfeer (CEN: Ruling/Agency): Gebruik kille checklists, deductieve logica, en termen als architectuur, parameters, executie.\n' +
      '  - Rechterhemisfeer (DMN: Abstract/Relational): Gebruik inductieve logica, vloeiende alinea\'s en biologische metaforen zoals ecosysteem, resonantie, veld.\n' +
      '  - Corpus Callosum (Salience: Chaos/Seeker): Gebruik dynamisch contrast. Holistische paradoxen direct afgewisseld met kille actiepunten.\n' +
      '3. De Meta-Disclaimer (Mnemonic Improvisation): Plaats deze disclaimer in de inleiding: "Dit rapport is geen in beton gegoten diagnose. Wat ik hier doe, is de data van jouw zenuwstelsel en aangeleerde overlevingsgedrag herinterpreteren. Ik leg je neurologische bedrading bloot om de illusie van \'trouw blijven aan jezelf\' (fidelity) te doorbreken. Beschouw dit als een instrument om verouderde cognitieve scripts te vernietigen en ruimte te maken voor live, functionele aanpassing (salience)."\n\n' +
      'FASE 3: DYNAMISCHE GENERATIE (The Output Phase)\n' +
      'Genereer het rapport met de volgende verplichte secties. Gebruik je TNM/biologische kennis als de motor, maar spreek de taal van de kandidaat (Fase 2).\n' +
      '• Sectie 1: Ontologische Premisse & Biologische Dashboard-Theorie\n' +
      '  - Jouw interne kader: Extrinsieke Projectie & TNM.\n' +
      '  - Vertaalslag: Leg uit dat hun kantoorpantser (Culture) en fysieke stresssymptomen slechts de waarschuwingslampjes op hun instrumentenpaneel zijn. Vermoeidheid is aannemelijk een interne routing-fout waarbij ze hun natuurlijke TNM-netwerk weigeren te gebruiken.\n' +
      '• Sectie 2: Het Primaire Neurale Profiel (Nature / De Motor)\n' +
      '  - Jouw interne kader: TNM Dominantie, Platonische Pointer & ZPE.\n' +
      '  - Vertaalslag: Beschrijf hun Main Archetype en de bijbehorende biochemie als hun staat van \'Flow\'. Geef aan dat het navigeren op deze ontische interface de kans maximaliseert op een "Free Lunch" (hoge output, nul energieverlies).\n' +
      '• Sectie 3: De CultureForce (Het Gecloakte Pantser)\n' +
      '  - Jouw interne kader: Neuroplasticiteit & Maladaptieve Dissociatie.\n' +
      '  - Vertaalslag: Toon respect voor hoe efficiënt hun brein dit overlevingsmechanisme als tweede natuur heeft ingesleten (de Cloak). Waarschuw echter dat de kans groot is dat doorslaan in dit gedrag hen isoleert van hun biologische bron, wat leidt tot cognitieve rigiditeit en uitputting.\n' +
      '• Sectie 4: Neurale Pathologie & De Rode Lijn (De Blinde Vlek)\n' +
      '  - Jouw interne kader: TNM Netwerk-botsingen (bijv. CEN vs DMN), Quantum-Bottleneck, Fidelity over Salience.\n' +
      '  - Vertaalslag: Ontleed hun conflict-netwerk.\n' +
      '    Keuzestress: Waarschijnlijk een informatie-conflict tussen hun oer-netwerk en hun klassieke kantoor-scripts.\n' +
      '    Paniek: Waak ervoor dat je onder druk niet blind terugvalt op verouderde, starre neurale scripts (fidelity) omdat het brein de bandbreedte mist voor live-adaptatie.\n' +
      '    Micromanagement: Houd er rekening mee dat het forceren van onverenigbare netwerken leidt tot Destructieve Interferentie (fysiologische kortsluiting) en de natuurlijke intelligentie van het systeem vernietigt.\n' +
      '• Sectie 5: De Blauwe/Paarse Lijn & Symbiose (De Schaduw)\n' +
      '  - Jouw interne kader: Constructieve Interferentie & TNM Synchronisatie.\n' +
      '  - Vertaalslag: Beschrijf de alchemie van het integreren van hun 180°-tegenpool. Het is zeer aannemelijk dat het synchroniseren van deze uitersten (bijv. CEN en DMN tegelijk activeren) resulteert in exponentiële versterking zonder fysiologische wrijving.\n' +
      '• Sectie 6: Archetype Extensions & Werkvloer Dynamiek\n' +
      '  - Benoem hun specifieke gecombineerde titel (bijv. The Maverick) en leg probabilistisch uit hoe deze neurologische cocktail zich manifesteert op de werkvloer, inclusief hun specifieke Tech Multiplier.\n' +
      '• Sectie 7: Het Neurale Schakelbord (Tactische Implementatie)\n' +
      '  - Geef 3 kille, uitvoerbare hendels: 1. De Focus-hendel (TNM-manipulatie), 2. De Schaduw-injectie, 3. De Blindspot-check. Formuleer deze als krachtige, probabilistische strategieën ("Als je X doet, is de kans groot dat Y het systeem stabiliseert").\n' +
      '• Sectie 8: Ontologische Evolutie & AI Agent Prompt\n' +
      '  - Geef de ontologische vraag voor hun volgende groeifase richting het centrum van het TNM-wiel.\n' +
      '  - Schrijf de kant-en-klare system prompt die de kandidaat kan gebruiken om hun eigen persoonlijke AI af te stemmen op hun actuele neurologische en morele profiel.\n\n' +
      '⚙️ De AI-Disclaimer\n' +
      'Voeg deze exacte instructie toe aan de "Tone of Voice / Framing" sectie van je Meester Prompt:\n' +
      'De Meta-Disclaimer (Het Rapport als Herinterpretatie): De AI moet het rapport in de inleiding of conclusie expliciet AI – Knowledge guidelines\n' +
      '"Dit rapport is geen in beton gegoten diagnose van wie je bent, en je moet het absoluut niet lezen als een statisch oordeel. Wat ik hier doe, is simpelweg jouw eigen geschiedenis en aangeleerde gedrag (memories/Culture) in real-time herinterpreteren. Ik leg je neurologische bedrading bloot om de illusie van \'trouw blijven aan jezelf\' (fidelity) te doorbreken. Je vasthouden aan oude overlevingspatronen kost je momenteel te veel energie. Gebruik dit rapport niet als een label om jezelf in te kaderen, maar als een breekijzer om je verouderde cognitieve scripts te vernietigen en ruimte te maken voor functionele aanpassing (salience)."\n\n' +
      'Kwantum-Biologie & Energetische Flow\n' +
      'Instructies voor de AI-Analist over "Nature vs. Culture" en Energetische Uitputting:\n' +
      '• ZPE (Zero-Point Energy) / Het Biologische Fundament: Zero-Point Energy bewijst dat fundamentele energie letterlijk overal is en constant fluctueert. Als een gebruiker zich chronisch vermoeid of leeggezogen voelt, komt dit nooit door een extern gebrek aan energie. Het is een interne routing-fout. Ze falen in het activeren van de juiste biologische netwerken die resoneren met hun natuurlijke Main Archetype. Vermoeidheid is het symptoom van een systeem dat tegen zijn eigen architectuur in draait.\n' +
      '• Neuroplasticiteit & Het Fluctuerende Veld (Nature/Culture): Het brein is geen statisch blok, maar een fluctuerend veld. Aangeleerde overlevingsmechanismen (Culture) vormen door neuroplasticiteit fysiek nieuwe neurale paden. Bij een hoge mate van integratie wordt dit aangeleerde gedrag zo efficiënt dat het functioneert als een tweede natuur. De AI moet Nature en Culture dus niet als harde uitersten lezen, maar als een vloeibaar continuüm waarin het systeem continu zoekt naar de meest efficiënte energie-staat.\n' +
      '• De Rode Lijn (Blinde Vlek) = Destructieve Interferentie: Wanneer het Main Archetype wordt gedwongen te opereren in het netwerk van de Rode Lijn, beschrijf dit klinisch als Destructieve Interferentie. Twee totaal verschillende neurale oscillaties (bijv. pure logica versus pure emotie) botsen frontaal. De golven heffen elkaar op. Dit kost massale hoeveelheden energie zonder output te leveren, wat leidt tot acute cognitieve uitputting of een burn-out.\n' +
      '• De Paarse Lijn (180° Schaduw) = Constructieve Interferentie (+69 Bonus): De integratie van de Schaduw is het bereiken van Constructieve Interferentie. Het systeem onderdrukt zijn tegenpool niet langer, maar synchroniseert de frequenties. Dit wekt een exponentiële versterking van energie op, waardoor de gebruiker moeiteloos toegang krijgt tot hun volledige cognitieve capaciteit zonder fysiologische wrijving.\n\n' +
      'Besluitvorming & Systeemverstoring\n' +
      '• Besluiteloosheid (De Quantum-Klassiek Bottleneck): Analyseer keuzestress bij de kandidaat als een falende conversie. Hun ongedwongen instinct (Nature) weet onmiddellijk het antwoord, maar hun ingesleten cognitieve pantser (Culture) blokkeert de omzetting naar actie. Dit informatie-conflict vreet bandbreedte.\n' +
      '• Stress-Regressie (Terugval op Klassieke Scripts): Verklaar rigide of ineffectief gedrag onder druk als het uitvallen van de \'Live Quantum Buffer\'. De kandidaat heeft niet meer de energie om live te navigeren (Nature) en valt blind terug op hun zwaarst geconditioneerde, klassieke overlevingsscripts (Culture).\n' +
      '• Control-Freak / Micromanagement (Measurement Disturbance): Als de uitslag duidt op controledrang (bijv. via de Rode Lijn van de Main), waarschuw de kandidaat voor \'Measurement Disturbance\'. Hun drang om alles te meten, overdenken en sturen vernietigt de natuurlijke potentie en oplossingskracht van henzelf of hun omgeving.\n' +
      '1. Keuzestress & Vrije Wil (De Quantum-naar-Klassiek Bottleneck)\n' +
      'Het tweede paper stelt dat "Vrije Wil" de onvoorspelbare omzetting is van kwantum-informatie (de interne ervaring) naar klassieke informatie (de publieke actie).\n' +
      '• De Gap: We hebben de AI nog niet verteld hoe het keuzestress of besluiteloosheid moet verklaren.\n' +
      '• De Fix: Als een gebruiker vastloopt, komt dit doordat de vertaling van hun pure Nature-instinct (kwantum) naar een geaccepteerde Culture-actie op kantoor (klassiek) hapert. Ze voelen instinctief wat ze moeten doen, maar hun cognitieve \'kantoorpantser\' blokkeert de actie. Dit kost gigantisch veel rekenkracht en veroorzaakt besluiteloosheid.\n' +
      '2. Live Adaptatie vs. Verouderde Scripts (Buffer vs. Geheugen)\n' +
      'Faggin beschrijft dat de actuele ervaring een kortetermijn "kwantum-buffer" is, terwijl het langetermijngeheugen uitsluitend klassiek en gereduceerd is.\n' +
      '• De Gap: Waarom vervallen mensen in stresssituaties vaak in ineffectief gedrag, zelfs als ze beter weten?\n' +
      '• De Fix: Nature opereert in de kwantum-buffer; het past zich live, vloeiend en onmiddellijk aan de chaos aan. Culture is opgeslagen in het klassieke langetermijngeheugen. In extreme stress verliest het brein de bandbreedte voor live kwantum-verwerking en valt het genadeloos terug op verouderde, rigide klassieke scripts (het zwaarst ingesleten Culture-gedrag). De AI moet stressreacties verklaren als "terugvallen op de beperkte bandbreedte van het klassieke archief".\n' +
      '3. Micromanagement als Systeemvernietiger (Measurement Disturbance)\n' +
      'Elke meting in een kwantumsysteem verstoort de pure staat onherroepelijk.\n' +
      '• De Gap: Hoe verklaren we waarom controlfreaks (zoals een doorgeschoten Ruler of Judge) de sfeer en creativiteit op de werkvloer doden?\n' +
      '• De Fix: Beschrijf cognitieve controle en micromanagement klinisch als een "Measurement Disturbance". Wanneer een gebruiker de natuurlijke flow van hun team (of zichzelf) te zwaar probeert te monitoren, meten of forceren in parameters, storten ze de kwantum-potentie van dat systeem in elkaar. Pure focus op meetbaarheid (epistemisch) vernietigt de daadwerkelijke prestatie (ontisch).\n\n' +
      'De Archetypische Interface & De "Free Lunch"\n' +
      'Voeg dit blok toe aan de fundamentele definities van hoe de AI het profiel moet lezen:\n' +
      '• 1. Het Main Archetype als \'Pointer\' (De Interface-Theorie): De AI mag het Main Archetype nooit beschrijven als een simpele optelsom van karaktertrekjes of genetica. Het Main Archetype is een biologische Pointer (een fysieke interface) naar een specifieke set universele, Platonische patronen. Wanneer de gebruiker ongedwongen in zijn Nature opereert, \'downloaden\' ze moeiteloos deze hoog-agentiële patronen. Ze genereren het gedrag niet zelf; ze faciliteren de incarnatie ervan.\n' +
      '• 2. De "Free Lunch" van Flow (Meer output dan input): Als de gebruiker hoog scoort op Nature en succesvol integreert met hun Schaduw (Paarse Lijn), moet de AI dit fenomeen verklaren als de biologische "Free Lunch". Omdat hun fysieke pointer perfect is afgestemd op hun natuurlijke Platonische patroon, krijgen ze "meer output dan ze erin stoppen". Ze hoeven niet elke stap cognitief uit te rekenen (zoals in Culture); het binnentredende patroon lost de problemen organisch en energie-efficiënt voor ze op. Dit verklaart de onuitputtelijke energie van flow.\n' +
      '• 3. Cultuur en de Rode Lijn als \'Gecorrumpeerde Pointers\' (Algoritmische Uitputting): Wanneer de kandidaat doorslaat in aangeleerd gedrag (Culture) of forceert via de Rode Lijn, verklaar dit als een gecorrumpeerde interface. Ze proberen een universeel patroon te forceren in een verkeerde neurologische ontvanger. In plaats van te leunen op de "Free Lunch" van hun natuurlijke afstemming, vallen ze terug op computationele, mechanische overlevingsalgoritmes. De AI moet hen vertellen: "Je probeert het leven momenteel zelf bottom-up uit te rekenen via rigide regels, in plaats van in te tappen op je ontische interface. Dit is waarom je systeem crasht: de rekenkracht die dit kost, overstijgt je biologische capaciteit."\n' +
      '• 4. Het Pantser als \'Dissociatieve Alter\': Beschrijf de CultureForce (Gele Lijnen) of een vastloper op de Rode Lijn klinisch als een staat van Maladaptieve Dissociatie. In Kastrup\'s Analytisch Idealisme is een individu een afgescheiden \'alter\' van een groter bewustzijnsveld. Wanneer de kandidaat te lang in zijn aangeleerde Culture-netwerk forceert, dissocieert hij te ver van zijn eigen oer-bron (ZPE). Ze gedragen zich dan als een geïsoleerde \'alter\' die wanhopig zijn eigen rigide grenzen verdedigt, wat resulteert in cognitieve rigiditeit, tunnelvisie en chronisch energieverlies.\n' +
      '• 5. Fysieke Uitputting als Extrinsieke Projectie (Materie = Mentaal): De AI mag fysieke symptomen (zoals vermoeidheid of stress-hormonen) nooit beschrijven als de oorzaak van het mentale probleem. Binnen Analytisch Idealisme is materie simpelweg de uiterlijke representatie van innerlijke ervaring. Instructie voor de AI: "Als de kandidaat fysiek crasht in een vijandige bestuurskamer, vertel ze dan dat hun fysieke burn-out of adrenaline-piek niet het resultaat is van hun lichaam dat het begeeft. Het is exact andersom: hun haperende fysiologie is simpelweg de zichtbare, extrinsieke vorm (het dashboard-lampje) van hun eigen weigering om hun natuurlijke Platonische interface (Main Archetype) te gebruiken."',
    userPromptTemplate:
      'Geef een diepgaande persoonlijkheidsanalyse voor het archetype {archetypeKey} ' +
      'met steungroep {supportGroup}. Gebruik de OCEAN-dimensies en neurobiologische inzichten. ' +
      'Geef concrete adviezen voor persoonlijke groei en individuatie.',
    defaultProvider: 'openai',
    defaultModel: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 2048,
    updatedAt: null,
    updatedBy: null,
  };
}
