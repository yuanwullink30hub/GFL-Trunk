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

// All admin routes need auth + admin
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

// ─────────────────────────────────────────────────────────────
// GET /api/admin/prompts — Get AI prompt configuration
// ─────────────────────────────────────────────────────────────

router.get('/prompts', async (_req, res) => {
  try {
    const config = await promptsCollection().findOne({ _id: 'default' });
    res.json(config || getDefaultPromptConfig());
  } catch (err) {
    console.error('[Admin] Get prompts error:', err.message);
    res.status(500).json({ error: 'Failed to load prompt config' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/prompts — Update AI prompt configuration
// ─────────────────────────────────────────────────────────────

router.put('/prompts', async (req, res) => {
  try {
    const { systemPromptTemplate, userPromptTemplate, defaultProvider, defaultModel, temperature, maxTokens } = req.body;

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

    await promptsCollection().updateOne(
      { _id: 'default' },
      { $set: update },
      { upsert: true }
    );

    const config = await promptsCollection().findOne({ _id: 'default' });
    res.json(config);
  } catch (err) {
    console.error('[Admin] Update prompts error:', err.message);
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
// Form Documents — save, list, retrieve, send via email
// ═════════════════════════════════════════════════════════════

function formsCollection() {
  return getDB().collection('formDocuments');
}

// POST /api/admin/forms — save a form document
router.post('/forms', authRequired, adminRequired, async (req, res) => {
  try {
    const { templateId, templateLabel, type, content, recipientEmail, recipientName, status } = req.body;
    if (!templateId || !templateLabel) {
      return res.status(400).json({ error: 'templateId and templateLabel required' });
    }

    const doc = {
      templateId,
      templateLabel,
      type: type || 'word',
      content: content || '',
      recipientEmail: recipientEmail || null,
      recipientName: recipientName || null,
      status: status || 'concept',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: req.user?.id || 'admin',
    };

    const result = await formsCollection().insertOne(doc);
    res.json({ success: true, id: result.insertedId, ...doc });
  } catch (err) {
    console.error('[Admin] Form save error:', err.message);
    res.status(500).json({ error: 'Failed to save form' });
  }
});

// GET /api/admin/forms — list all saved form documents
router.get('/forms', authRequired, adminRequired, async (req, res) => {
  try {
    const docs = await formsCollection()
      .find({})
      .sort({ updatedAt: -1 })
      .project({ content: 0 }) // exclude large content field from list
      .toArray();
    res.json({ forms: docs });
  } catch (err) {
    console.error('[Admin] Form list error:', err.message);
    res.status(500).json({ error: 'Failed to list forms' });
  }
});

// GET /api/admin/forms/:id — get full form document
router.get('/forms/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const doc = await formsCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: 'Form not found' });
    res.json(doc);
  } catch (err) {
    console.error('[Admin] Form get error:', err.message);
    res.status(500).json({ error: 'Failed to get form' });
  }
});

// PUT /api/admin/forms/:id — update a form document
router.put('/forms/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const { content, recipientEmail, recipientName, status } = req.body;
    const update = {
      ...(content !== undefined && { content }),
      ...(recipientEmail !== undefined && { recipientEmail }),
      ...(recipientName !== undefined && { recipientName }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    };
    const result = await formsCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );
    if (result.matchedCount === 0) return res.status(404).json({ error: 'Form not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Form update error:', err.message);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// DELETE /api/admin/forms/:id — delete a form document
router.delete('/forms/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const result = await formsCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Form not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('[Admin] Form delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// POST /api/admin/forms/:id/send — send form via email + save to DB
router.post('/forms/:id/send', authRequired, adminRequired, async (req, res) => {
  try {
    const doc = await formsCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (!doc) return res.status(404).json({ error: 'Form not found' });

    const { recipientEmail, subject } = req.body;
    const toEmail = recipientEmail || doc.recipientEmail;
    if (!toEmail) return res.status(400).json({ error: 'No recipient email specified' });

    // Check SMTP config
    if (!config.email.user || !config.email.pass) {
      return res.status(503).json({ error: 'Email not configured. Set SMTP_USER and SMTP_PASS in environment variables.' });
    }

    const transporter = createSMTPTransport();

    const emailSubject = subject || `Garden For Life — ${doc.templateLabel}`;

    await transporter.sendMail({
      from: `"Garden For Life" <${config.email.from}>`,
      to: toEmail,
      subject: emailSubject,
      html: buildEmailHTML(doc.templateLabel, doc.content),
    });

    // Update status to 'verstuurd' in DB
    await formsCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      {
        $set: {
          status: 'verstuurd',
          sentAt: new Date(),
          sentTo: toEmail,
          updatedAt: new Date(),
        },
      }
    );

    res.json({ success: true, sentTo: toEmail });
  } catch (err) {
    console.error('[Admin] Form send error:', err.message);
    res.status(500).json({ error: `Failed to send email: ${err.message}` });
  }
});

// POST /api/admin/forms/send-direct — send a form without saving first (quick send)
// Supports optional pdfAttachment (data URI) for invoice emails
router.post('/forms/send-direct', authRequired, adminRequired, async (req, res) => {
  try {
    const { templateId, templateLabel, type, content, recipientEmail, recipientName, subject, pdfAttachment, pdfBase64, attachmentFilename } = req.body;
    if (!recipientEmail) return res.status(400).json({ error: 'recipientEmail required' });
    if (!content) return res.status(400).json({ error: 'content required' });

    // Check SMTP config
    if (!config.email.user || !config.email.pass) {
      return res.status(503).json({ error: 'Email not configured. Set SMTP_USER and SMTP_PASS in environment variables.' });
    }

    // Save to DB first
    const doc = {
      templateId: templateId || 'custom',
      templateLabel: templateLabel || 'Direct bericht',
      type: type || 'word',
      content,
      recipientEmail,
      recipientName: recipientName || null,
      status: 'verstuurd',
      createdAt: new Date(),
      updatedAt: new Date(),
      sentAt: new Date(),
      sentTo: recipientEmail,
      createdBy: req.user?.id || 'admin',
    };
    const saved = await formsCollection().insertOne(doc);

    // Send email
    const transporter = createSMTPTransport();

    // Build mail options
    const mailOptions = {
      from: `"Garden For Life" <${config.email.from}>`,
      to: recipientEmail,
      subject: subject || `Garden For Life — ${doc.templateLabel}`,
      html: buildEmailHTML(doc.templateLabel, content),
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

    await transporter.sendMail(mailOptions);

    res.json({ success: true, id: saved.insertedId, sentTo: recipientEmail });
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
      'Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen, ' +
      'het OCEAN (Big Five) persoonlijkheidsmodel, en neurobiologische persoonlijkheidstheorie. ' +
      'Je werkt voor Garden For Life, een bewustzijnsplatform.\n\n' +
      'Antwoord altijd in het Nederlands tenzij de gebruiker in het Engels schrijft. ' +
      'Wees empathisch, genuanceerd en concreet. Vermijd vage algemeenheden.',
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
