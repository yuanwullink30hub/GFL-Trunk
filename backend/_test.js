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
  // settings.text is admin-controlled content — render as HTML directly (supports <br/> etc.)
  const bodyText = settings.text ||
    'Hoogachtende Meester,<br><br>' +
    'Jouw feedback is uiterst waardevol en in principe is dit jouw gift aan ons project, toch kan ik mijn gretigheid niet ' +
    'bedwingen en vraag ik je bij deze om onze assessment te delen met anderen — weet wie je vraagt!<br><br>' +
    'Zolang de beta-fase loopt is alleen het meester niveau toegankelijk.<br><br>' +
    'Anyway — pionier, hartelijk dank voor de tijd en attentie.';

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
    <tr>
      <td class="body-cell" style="padding:28px 30px;line-height:1.7;color:#333;font-size:15px;">
        <p style="margin:0 0 16px;">${bodyText}</p>
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
