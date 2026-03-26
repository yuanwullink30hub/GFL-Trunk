/**
 * Garden For Life — Assessment Routes
 *
 * POST /api/assessment          — Save assessment result (requires auth)
 * GET  /api/assessment/history  — List user's past assessments (requires auth)
 * POST /api/assessment/review   — Save assessment feedback (optional auth)
 * GET  /api/assessment/:id      — Get single assessment detail (requires auth)
 */
const { Router } = require('express');
const { ObjectId } = require('mongodb');
const { collections, getDB } = require('../db');
const { authRequired } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('../config');

// ─────────────────────────────────────────────────────────────
// Build HTML confirmation email (text + editable image from admin settings)
// ─────────────────────────────────────────────────────────────

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildFeedbackEmail(settings, review) {
  // Always use hardcoded text — ignoring any admin-saved override so deploys stay authoritative
  const bodyText =
    'Welkom bij de orde van 72,<br><br><br>' +
    'Jouw feedback is uiterst waardevol en alles wat dit project nog miste, toch kan ik mijn gretigheid niet bedwingen en reik ik nog één laatste keer uit voor jouw hulp.<br>' +
    'De sleutel die jij hebt ontvangen omwille je beheersing mag je delen met de mensen die je kent, maar let op: jouw sleutel- jouw verantwoording.<br><br>' +
    'Hoe meer juiste data hoe beter wij kunnen optimaliseren, daarom:<br>' +
    'zolang de beta fase loopt is alleen het leerling niveau toegankelijk.';
  const starsBlock =
    '<div style="margin:18px 0 20px;">' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#f97316;margin-bottom:8px;">FEEDBACK LINK</div>' +
    '<a href="https://gardenforlife.nl/?page=feedback" style="text-decoration:none;font-size:36px;letter-spacing:6px;">⭐⭐⭐</a>' +
    '</div>';
  const closingText =
    'Anyway- pionier, hartelijk dank voor de tijd en attentie!<br><br><br>' +
    'Met vriendelijke groet, Yuan Wullink';
  const imageBlock = '';
  const attachments = [];

  const ratingBlock = review.starRating
    ? `<div style="margin-top:12px;color:#f59e0b;font-size:15px;">⭐ Beoordeling: ${review.starRating}/9</div>` : '';

  const field = (label, color, value) => value
    ? `<div style="margin-top:14px;"><strong style="color:${color};">${label}</strong><br><span style="white-space:pre-wrap;font-size:13px;">${esc(value)}</span></div>` : '';

  const fieldsBlock = [
    field('✅ Accuraatheid', '#22c55e', review.whatWorked),
    field('❌ Niet overeenkomend', '#ef4444', review.whatDidntWork),
    field('💡 Suggesties', '#3b82f6', review.suggestions),
  ].join('');

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">
  <style>
    body,table,td{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
    @media only screen and (max-width:620px){
      .email-container{width:100%!important;}
      .body-cell{padding:20px 16px!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;width:100%;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ffffff;">
<tr><td align="left" style="padding:0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="width:600px;max-width:600px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <tr>
      <td style="background:#121212;padding:28px 30px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td width="80" valign="middle" style="padding-right:16px;">
              <img src="https://gfl-trunk.pages.dev/images/landingpage/logo.png" alt="Garden For Life" style="height:80px;width:auto;display:block;">
            </td>
            <td valign="middle">
              <h1 style="color:#bc13fe;margin:0;font-size:26px;font-weight:700;letter-spacing:1.5px;font-family:'Rajdhani','Segoe UI',Tahoma,sans-serif;text-transform:uppercase;">Garden For Life</h1>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${imageBlock}
    <tr>
      <td class="body-cell" style="padding:28px 30px;line-height:1.7;color:#333;font-size:15px;">
        <p style="margin:0 0 0;">${bodyText}</p>
        ${starsBlock}
        <p style="margin:0 0 16px;">${closingText}</p>
        ${ratingBlock}
        ${fieldsBlock}
      </td>
    </tr>
    <tr>
      <td style="padding:0 30px 24px;">
        <div style="border-top:2px solid #bc13fe;padding-top:20px;margin-top:12px;">
          <div style="font-size:12px;line-height:1.6;color:#555;">
            <div>✉ <a href="mailto:yuanwullink30@gfl.community" style="color:#1a73e8;text-decoration:none;">yuanwullink30@gfl.community</a></div>
            <div>🌐 <a href="https://gardenforlife.nl/" style="color:#1a73e8;text-decoration:none;">www.gardenforlife.nl</a></div>
            <div style="margin-top:4px;font-size:11px;color:#888;">KVK: 85125245</div>
          </div>
          <p style="margin:12px 0 0;font-size:11px;color:#999;">&copy; ${new Date().getFullYear()} Garden For Life · Alle rechten voorbehouden</p>
        </div>
      </td>
    </tr>
  </table>
</td></tr>
</table>
</body>
</html>`;

  return { html, attachments };
}
const router = Router();

/**
 * Optional auth middleware — attaches req.user if token is provided,
 * but doesn't fail if token is missing. Allows anonymous submissions.
 */
function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    // No token provided — continue as anonymous
    req.user = null;
    return next();
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { userId: payload.sub, email: payload.email, role: payload.role || 'client' };
  } catch (err) {
    // Invalid token — still continue as anonymous
    console.warn('[Assessment] Invalid token in review submission, continuing as anonymous');
    req.user = null;
  }
  next();
}

// ─────────────────────────────────────────────────────────────
// POST /api/assessment — Save an assessment result (requires auth)
// ─────────────────────────────────────────────────────────────

router.post('/', authRequired, async (req, res) => {
  try {
    const {
      clientId,
      archetypeKey,
      supportGroup,
      extendedArchetypeName,
      oceanScores,
      responses,
      subjectResults,
      scores,
      archetypeDetails,
      harmonyScore,
      consciousnessLevel,
      overallShadow,
      aiProvider,
      aiModel,
      analysis,
      promptTokens,
      completionTokens,
    } = req.body;

    if (!archetypeKey) {
      return res.status(400).json({ error: 'archetypeKey is required' });
    }

    const doc = {
      userId: req.user.userId,
      clientId: clientId || null,
      archetypeKey,
      supportGroup: supportGroup || null,
      extendedArchetypeName: extendedArchetypeName || null,
      oceanScores: oceanScores || null,
      responses: Array.isArray(responses) ? responses : [],
      subjectResults: Array.isArray(subjectResults) ? subjectResults : [],
      scores: scores || null,
      archetypeDetails: Array.isArray(archetypeDetails) ? archetypeDetails : null,
      harmonyScore: harmonyScore ?? null,
      consciousnessLevel: consciousnessLevel || null,
      overallShadow: overallShadow || null,
      aiProvider: aiProvider || null,
      aiModel: aiModel || null,
      analysis: analysis || null,
      promptTokens: promptTokens || 0,
      completionTokens: completionTokens || 0,
      pdfUrl: null,
      createdAt: new Date(),
    };

    const result = await collections.assessments().insertOne(doc);

    res.status(201).json({
      id: result.insertedId,
      ...doc,
    });
  } catch (err) {
    console.error('[Assessment] Save error:', err.message);
    res.status(500).json({ error: 'Failed to save assessment' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/assessment/history — List past assessments (requires auth)
// ─────────────────────────────────────────────────────────────

router.get('/history', authRequired, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = parseInt(req.query.skip) || 0;

    const assessments = await collections
      .assessments()
      .find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .project({
        archetypeKey: 1,
        supportGroup: 1,
        extendedArchetypeName: 1,
        aiProvider: 1,
        aiModel: 1,
        createdAt: 1,
      })
      .toArray();

    const total = await collections
      .assessments()
      .countDocuments({ userId: req.user.userId });

    res.json({ assessments, total, limit, skip });
  } catch (err) {
    console.error('[Assessment] History error:', err.message);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/assessment/site-banner — Public: PDF footer image from admin settings
// Returns { imageBase64, imageMimeType, text } — no auth required
// ─────────────────────────────────────────────────────────────
router.get('/site-banner', async (_req, res) => {
  try {
    const settings = await getDB().collection('siteSettings')
      .findOne({ _id: 'feedback-email' }).catch(() => null) || {};
    res.json({
      imageBase64: settings.imageBase64 || '',
      imageMimeType: settings.imageMimeType || '',
      text: settings.text || '',
    });
  } catch (err) {
    console.error('[Assessment] site-banner error:', err.message);
    res.json({ imageBase64: '', imageMimeType: '', text: '' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/assessment/review — Save assessment feedback (optional auth)
// ─────────────────────────────────────────────────────────────

router.post('/review', authOptional, async (req, res) => {
  console.log('[Assessment] POST /review received');
  try {
    const {
      assessmentId,
      email,
      whatWorked,
      whatDidntWork,
      suggestions,
      starRating,
      archetypeKey,
      timestamp,
    } = req.body;

    console.log('[Assessment] Review data:', { assessmentId, email: email?.slice(0, 30), archetypeKey });

    // Validate: email is required
    if (!email?.trim()) {
      console.log('[Assessment] ❌ Review validation failed — no email provided');
      return res.status(400).json({ error: 'Email is required' });
    }

    // Create review document
    const review = {
      userId: req.user?.userId || null,
      email: email?.trim() || null,
      assessmentId: assessmentId || 'anonymous',
      archetypeKey: archetypeKey || null,
      whatWorked: whatWorked?.trim() || '',
      whatDidntWork: whatDidntWork?.trim() || '',
      suggestions: suggestions?.trim() || '',
      starRating: (typeof starRating === 'number' && starRating >= 1 && starRating <= 9) ? starRating : null,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      userAgent: req.get('user-agent'),
    };

    const result = await collections.assessmentReviews().insertOne(review);
    console.log('[Assessment] ✅ Review saved:', result.insertedId);

    // ── Send emails (fire-and-forget, don't block response) ──
    if (config.email.user && config.email.pass) {
      (async () => {
        try {
          const transporter = nodemailer.createTransport({
            host: config.email.host,
            port: config.email.port,
            secure: config.email.secure,
            auth: { user: config.email.user, pass: config.email.pass },
          });

          // Load admin-configured email settings (text + image)
          const emailSettings = await getDB().collection('siteSettings')
            .findOne({ _id: 'feedback-email' }).catch(() => null) || {};

          const ratingLine = review.starRating ? `\n⭐ Beoordeling: ${review.starRating}/9` : '';
          const adminBody = `Nieuw assessment-feedback ontvangen.${ratingLine}\n\n📌 Archetype: ${review.archetypeKey || '—'}\n📧 E-mail: ${review.email || 'anoniem'}\n\n✅ Accuraatheid:\n${review.whatWorked || '—'}\n\n❌ Niet overeenkomend:\n${review.whatDidntWork || '—'}\n\n💡 Suggesties:\n${review.suggestions || '—'}\n\nTijdstip: ${review.timestamp.toLocaleString('nl-NL')}\nAssessment-ID: ${review.assessmentId}`;

          // Notify admin (plain text)
          await transporter.sendMail({
            from: `"Garden For Life" <${config.email.from}>`,
            to: config.email.user,
            subject: `Nieuwe Feedback — ${review.archetypeKey || 'Assessment'}${review.starRating ? ` (${review.starRating}/9 ⭐)` : ''}`,
            text: adminBody,
          });

          // HTML confirmation to submitter
          if (review.email) {
            const { html: confirmHtml, attachments: confirmAttachments } = buildFeedbackEmail(emailSettings, review);
            await transporter.sendMail({
              from: `"Garden For Life" <${config.email.from}>`,
              to: review.email,
              subject: 'Garden For Life — Bedankt voor je feedback',
              html: confirmHtml,
              attachments: confirmAttachments,
            });
          }
        } catch (err) {
          console.error('[Assessment] Email send error:', err.message);
        }
      })();
    } else {
      console.warn('[Assessment] SMTP not configured — emails skipped');
    }

    res.status(201).json({
      id: result.insertedId,
      ...review,
    });
  } catch (err) {
    console.error('[Assessment] ❌ Review save error:', err.message);
    res.status(500).json({ error: 'Failed to save review' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/assessment/:id — Get single assessment (requires auth)
// ─────────────────────────────────────────────────────────────

router.get('/:id', authRequired, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid assessment ID' });
    }

    const assessment = await collections.assessments().findOne({
      _id: new ObjectId(req.params.id),
      userId: req.user.userId, // ensure user owns it
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    res.json(assessment);
  } catch (err) {
    console.error('[Assessment] Get error:', err.message);
    res.status(500).json({ error: 'Failed to load assessment' });
  }
});

module.exports = router;
