/**
 * Garden For Life — AI Analysis Routes
 *
 * POST /api/ai/analyze       — Run assessment analysis via any AI provider
 * GET  /api/ai/providers     — List available (configured) providers
 */
const { Router } = require('express');
const { callAI, getAvailableProviders } = require('../services/aiProviders');
const { getDB } = require('../db');
const config = require('../config');
const nodemailer = require('nodemailer');

// Level-specific prompt builders
const promptBuilders = {
  beginner: require('../prompts/beginner'),
  intermediate: require('../prompts/intermediate'),
  advanced: require('../prompts/advanced'),
};

const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/ai/analyze
// ─────────────────────────────────────────────────────────────

/**
 * Body:
 * {
 *   provider: "openai" | "gemini" | "grok",   // optional, defaults to openai
 *   model: "gpt-4o",                           // optional, uses provider default
 *   archetypeKey: "JUDGE",                      // required
 *   supportArchetype: "RULER",                  // optional
 *   supportGroup: "RULING",                     // optional
 *   mainGroup: "RULING",                        // optional
 *   extendedArchetypeName: "The Arbiter",       // optional
 *   userQuestion: "...",                         // optional
 *   oceanScores: { O:4, C:9, E:4, A:3, N:3 },  // optional
 *   systemPrompt: "...",                         // optional full override
 *   maxTokens: 2048,                             // optional
 *   temperature: 0.7,                            // optional
 *
 *   // ── Advanced Ontology fields ──
 *   shadowArchetype: "TRICKSTER",               // 180° shadow of Main
 *   blindspotArchetype: "OUTLAW",               // 180° shadow of Support
 *   isIndividuated: false,                       // Main & Support are 180° opposites
 *   hasHarmonyBonus: true,                       // +69 bonus applied
 *   harmonyBonusApplied: 69,                     // actual bonus value
 *   polarizationIndex: 25,                       // Main - Shadow score gap
 *   polarizationLevel: "MODERATE",               // HIGH_POLARIZATION | MODERATE | HIGH_INDIVIDUATION
 *   authenticityIndex: 55,                       // Nature % of total
 *   authenticityLevel: "BALANCED",               // NATURE_DOMINANT | BALANCED | CULTURE_DOMINANT
 *   totalNaturePoints: 165,                      // total Nature sub-score
 *   totalCulturePoints: 135,                     // total CultureForce sub-score
 *   archetypeDetails: [...],                     // per-archetype breakdown with nature/culture
 *   scores: {...},                               // raw score object per archetype
 *
 *   // ── Full pipeline fields (sent after 60Q completion) ──
 *   responses: [...],                            // individual question answers
 *   subjectResults: [...],                       // per-layer scoring breakdown
 *   harmonyScore: 72,                            // overall percentage
 *   consciousnessLevel: "Transpersonal",         // derived level
 *   overallShadow: "...",                        // dominant shadow aspect
 *   uploadedFileContents: [{ name, text }]       // user-uploaded file text (OCEAN report etc.)
 * }
 *
 * NOTE: Knowledge context (archetype descriptions, OCEAN profiles, etc.)
 * is provided via admin-uploaded documents stored in MongoDB
 * (collection: promptDocuments). These are automatically included in every analysis.
 */
router.post('/analyze', async (req, res) => {
  // Set SSE headers — use res.set() so CORS middleware headers are preserved
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      provider,
      model,
      archetypeKey,
      supportArchetype,
      supportGroup,
      mainGroup,
      extendedArchetypeName,
      userQuestion,
      oceanScores,
      systemPrompt,
      maxTokens,
      temperature,
      // Advanced Ontology fields
      shadowArchetype,
      blindspotArchetype,
      isIndividuated,
      hasHarmonyBonus,
      harmonyBonusApplied,
      polarizationIndex,
      polarizationLevel,
      authenticityIndex,
      authenticityLevel,
      totalNaturePoints,
      totalCulturePoints,
      archetypeDetails,
      scores,
      // Full pipeline fields
      responses,
      subjectResults,
      harmonyScore,
      consciousnessLevel,
      overallShadow,
      uploadedFileContents,
      // Level selection
      level,
    } = req.body;

    if (!archetypeKey) {
      sendEvent('error', { error: 'archetypeKey is required' });
      return res.end();
    }

    // Fetch admin prompt config from MongoDB for defaults
    const adminConfig = await getAdminPromptConfig();

    // Extract text from any uploaded PDFs (sent as base64)
    if (uploadedFileContents && uploadedFileContents.length > 0) {
      const pdfParse = require('pdf-parse');
      for (let i = 0; i < uploadedFileContents.length; i++) {
        const item = uploadedFileContents[i];
        if (item.pdfBase64 && !item.text) {
          try {
            const buffer = Buffer.from(item.pdfBase64, 'base64');
            const parsed = await pdfParse(buffer);
            uploadedFileContents[i] = { name: item.name, text: parsed.text || '[Geen tekst gevonden in PDF]' };
          } catch (err) {
            console.error(`PDF parse error for ${item.name}:`, err.message);
            uploadedFileContents[i] = { name: item.name, text: `[PDF kon niet worden gelezen: ${item.name}]` };
          }
        }
      }
    }

    // Build messages — include uploaded context documents
    const contextDocs = await getContextDocuments();
    const promptLevel = level || 'advanced';
    const builder = promptBuilders[promptLevel] || promptBuilders.advanced;

    const promptData = {
      archetypeKey, supportArchetype, supportGroup, mainGroup,
      extendedArchetypeName, oceanScores, contextDocs,
      shadowArchetype, blindspotArchetype, isIndividuated,
      hasHarmonyBonus, harmonyBonusApplied,
      polarizationIndex, polarizationLevel,
      authenticityIndex, authenticityLevel,
      totalNaturePoints, totalCulturePoints,
      archetypeDetails, scores,
      responses, subjectResults, harmonyScore,
      consciousnessLevel, overallShadow, uploadedFileContents,
    };

    const system = systemPrompt || builder.buildSystemPrompt(promptData);
    const user = userQuestion || builder.buildUserMessage(promptData);

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    // ── Stage 1: Data compiled, prompt built ──
    sendEvent('progress', { stage: 1, message: 'Data verwerkt — AI analyse gestart...' });

    // Request body overrides defaults; ignore admin model/provider (no UI selector)
    const finalProvider = provider || undefined;
    const finalModel = model || undefined;
    const finalMaxTokens = maxTokens || adminConfig.maxTokens || 18000;
    const finalTemperature = temperature ?? adminConfig.temperature ?? 0.7;

    const result = await callAI({
      provider: finalProvider,
      model: finalModel,
      messages,
      maxTokens: finalMaxTokens,
      temperature: finalTemperature,
    });

    console.log(`[AI] Analysis complete: provider=${result.provider}, model=${result.model}, tokens=${result.completionTokens}`);

    // ── Stage 2: AI generation complete ──
    sendEvent('progress', { stage: 2, message: 'AI analyse compleet — resultaten verwerken...' });

    // ── Send final result ──
    sendEvent('result', {
      archetypeKey,
      supportGroup: supportGroup || null,
      extendedArchetypeName: extendedArchetypeName || null,
      ...result,
    });

    res.end();
  } catch (err) {
    console.error('[AI] Error:', err.message);
    sendEvent('error', { error: err.message });
    res.end();
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/ai/providers
// ─────────────────────────────────────────────────────────────

router.get('/providers', (_req, res) => {
  res.json({ providers: getAvailableProviders() });
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/send-results — Email PDF report to recipient
// ─────────────────────────────────────────────────────────────

router.post('/send-results', async (req, res) => {
  try {
    const { recipientEmail, result } = req.body;

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return res.status(400).json({ error: 'recipientEmail is required' });
    }
    if (!result || !result.overallArchetype) {
      return res.status(400).json({ error: 'result data is required' });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Build the PDF HTML content
    const pdfHtml = buildResultsPDFHTML(result);

    // Build the email body
    const emailBody = buildResultsEmailBody(result);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    const archetypeName = result.overallArchetype || 'Assessment';
    const filename = `GFL-Consciousness-Profile-${archetypeName.replace(/\s+/g, '_')}.html`;

    await transporter.sendMail({
      from: `"Garden For Life" <${config.email.from}>`,
      to: recipientEmail.trim(),
      subject: `Je Garden For Life Bewustzijnsprofiel — ${archetypeName}`,
      html: emailBody,
      attachments: [{
        filename,
        content: Buffer.from(pdfHtml, 'utf-8'),
        contentType: 'text/html',
      }],
    });

    console.log(`[Email] Results sent to ${recipientEmail.trim()}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    res.status(500).json({ error: 'E-mail kon niet worden verzonden. Probeer het later opnieuw.' });
  }
});

module.exports = router;

// ─────────────────────────────────────────────────────────────
// Prompt helpers — delegated to level-specific builders in /prompts/
// ─────────────────────────────────────────────────────────────

/**
 * Fetch all uploaded context documents from MongoDB.
 * Returns array of { filename, extractedText }.
 */
async function getContextDocuments() {
  try {
    const db = getDB();
    const docs = await db.collection('promptDocuments')
      .find({})
      .sort({ uploadedAt: 1 })
      .project({ filename: 1, extractedText: 1 })
      .toArray();
    return docs;
  } catch {
    // If DB not connected or collection doesn't exist, return empty
    return [];
  }
}

/**
 * Fetch admin prompt configuration from MongoDB.
 * Returns defaults if not found or DB unavailable.
 */
async function getAdminPromptConfig() {
  try {
    const db = getDB();
    const config = await db.collection('promptConfigs').findOne({ _id: 'default' });
    return config || {};
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────────
// Email / PDF Helpers for send-results
// ─────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMarkdownish(text) {
  if (!text) return '';
  return text.split('\n').map(line => {
    if (!line.trim()) return '<br/>';
    if (line.startsWith('### ')) return `<h5 class="ai-h4">${esc(line.slice(4))}</h5>`;
    if (line.startsWith('## '))  return `<h4 class="ai-h3">${esc(line.slice(3))}</h4>`;
    if (line.startsWith('# '))   return `<h3 class="ai-h2">${esc(line.slice(2))}</h3>`;
    if (line.startsWith('- ') || line.startsWith('* '))
      return `<p class="ai-bullet">&bull; ${esc(line.slice(2))}</p>`;
    if (line.startsWith('**') && line.endsWith('**'))
      return `<p class="ai-bold">${esc(line.slice(2, -2))}</p>`;
    return `<p class="ai-body">${esc(line)}</p>`;
  }).join('\n');
}

/**
 * Build the HTML attachment (printable PDF-style report).
 */
function buildResultsPDFHTML(result) {
  const colors = ['#22d3ee', '#a855f7', '#f472b6', '#fbbf24', '#f97316'];
  const date = result.timestamp ? new Date(result.timestamp).toLocaleDateString('nl-NL') : new Date().toLocaleDateString('nl-NL');
  const archetype = result.overallArchetype || 'Unknown';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8"/>
<title>Garden for Life — Consciousness Profile</title>
<style>
  @page { size: A4; margin: 16mm 14mm 18mm 14mm; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 10pt; line-height: 1.55; background: #060612; color: #e2e8f0; }
  .page { max-width: 700px; margin: 0 auto; padding: 0 4mm; }
  .brand { text-align: center; padding: 10mm 0 6mm; border-bottom: 1px solid #22d3ee33; margin-bottom: 6mm; }
  .brand-name { font-size: 9pt; letter-spacing: 5px; text-transform: uppercase; color: #22d3ee; margin: 0 0 3mm; }
  .brand-sub { font-size: 7pt; letter-spacing: 2px; text-transform: uppercase; color: #64748b; margin: 0; }
  .card { background: #0c0c1d; border: 1px solid #1e293b; border-radius: 8px; padding: 5mm 6mm; margin-bottom: 4mm; page-break-inside: avoid; position: relative; overflow: hidden; }
  .card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .card-cyan::before { background: linear-gradient(90deg, #22d3ee, transparent 70%); }
  .card-purple::before { background: linear-gradient(90deg, #a855f7, transparent 70%); }
  .card-emerald::before { background: linear-gradient(90deg, #10b981, transparent 70%); }
  .card-amber::before { background: linear-gradient(90deg, #f59e0b, transparent 70%); }
  .card-title { font-size: 8pt; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 3mm; display: flex; align-items: center; gap: 2mm; }
  .card-title .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .hero-archetype { font-size: 22pt; font-weight: 300; color: #fff; margin: 2mm 0 3mm; line-height: 1.2; }
  .hero-desc { color: #94a3b8; font-size: 9.5pt; line-height: 1.6; margin: 0 0 4mm; }
  .shadow-box { background: #1a0a0a; border: 1px solid #7f1d1d; border-radius: 6px; padding: 3mm 4mm; color: #fca5a5; font-size: 9pt; }
  .shadow-box strong { color: #f87171; }
  .stats-grid { display: flex; gap: 3mm; margin-bottom: 4mm; }
  .stat-card { flex: 1; background: #0c0c1d; border: 1px solid #1e293b; border-radius: 8px; padding: 4mm; text-align: center; page-break-inside: avoid; }
  .stat-label { font-size: 6.5pt; letter-spacing: 1.5px; text-transform: uppercase; color: #64748b; margin: 0 0 1.5mm; }
  .stat-value { font-size: 14pt; font-weight: 600; margin: 0; }
  .quote { font-style: italic; color: #cbd5e1; line-height: 1.7; font-size: 10pt; }
  .layer { background: #0c0c1d; border: 1px solid #1e293b; border-radius: 6px; padding: 3.5mm 4mm; margin-bottom: 2.5mm; page-break-inside: avoid; }
  .layer-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; }
  .layer-name { font-weight: 600; font-size: 9.5pt; }
  .layer-pct { font-size: 9pt; font-weight: 600; }
  .bar-track { height: 5px; background: #1e293b; border-radius: 3px; overflow: hidden; margin-bottom: 2mm; }
  .bar-fill { height: 100%; border-radius: 3px; }
  .layer-detail { font-size: 8pt; color: #64748b; margin: 0.5mm 0; }
  .layer-insight { font-size: 8.5pt; color: #94a3b8; margin: 0.5mm 0; }
  .layer-rec { font-size: 8.5pt; color: #22d3ee; margin: 0.5mm 0; }
  .ai-h2 { font-size: 12pt; font-weight: 500; color: #6ee7b7; margin: 4mm 0 2mm; }
  .ai-h3 { font-size: 10.5pt; font-weight: 500; color: #34d399; margin: 3mm 0 1.5mm; }
  .ai-h4 { font-size: 9.5pt; font-weight: 500; color: #10b981; margin: 2mm 0 1mm; }
  .ai-bullet { margin: 0.5mm 0; padding-left: 4mm; color: #cbd5e1; font-size: 9pt; }
  .ai-bold { font-weight: 600; color: #e2e8f0; margin: 2mm 0; font-size: 9pt; }
  .ai-body { color: #cbd5e1; margin: 0.5mm 0; font-size: 9pt; line-height: 1.6; }
  .ai-provider { font-size: 6.5pt; color: #475569; text-transform: uppercase; letter-spacing: 1px; float: right; margin-top: -3mm; }
  .footer { text-align: center; font-size: 7pt; color: #334155; padding: 6mm 0 2mm; border-top: 1px solid #1e293b; margin-top: 6mm; letter-spacing: 1px; }
  .section-break { page-break-before: auto; }
  .keep-together { page-break-inside: avoid; }
  @media screen { body { padding: 10mm 0; } }
</style>
</head>
<body>
<div class="page">
  <div class="brand">
    <p class="brand-name">Garden for Life</p>
    <p class="brand-sub">Advanced Consciousness Assessment</p>
  </div>
  <p style="text-align:center;font-size:7pt;color:#475569;margin:0 0 6mm;">
    Profile ${esc(result.id || '')} &middot; ${esc(date)}
  </p>
  <div class="card card-cyan">
    <p class="card-title" style="color:#22d3ee;"><span class="dot" style="background:#22d3ee;"></span>Jouw Profiel</p>
    <h1 class="hero-archetype">Jij navigeert als ${esc(result.extendedArchetypeName || archetype)}</h1>
    <p class="hero-desc">${esc(result.archetypeDescription || '')}</p>
    ${result.archetypeShadow ? `<div class="shadow-box"><strong>Shadow Aspect: </strong>${esc(result.archetypeShadow)}</div>` : ''}
  </div>
  <div class="stats-grid">
    <div class="stat-card"><p class="stat-label">Harmony Score</p><p class="stat-value" style="color:#22d3ee;">${esc(String(result.harmonyScore || 0))}%</p></div>
    <div class="stat-card"><p class="stat-label">Consciousness Level</p><p class="stat-value" style="color:#a855f7;">${esc(result.consciousnessLevel || '')}</p></div>
    <div class="stat-card"><p class="stat-label">Profile ID</p><p class="stat-value" style="color:#fbbf24;">${esc((result.id || '').split('-')[1] || result.id || '')}</p></div>
  </div>
  ${result.quantumResonance ? `
  <div class="card card-purple">
    <p class="card-title" style="color:#a855f7;"><span class="dot" style="background:#a855f7;"></span>Quantum Resonance</p>
    <p class="quote">&ldquo;${esc(result.quantumResonance)}&rdquo;</p>
  </div>` : ''}
  ${result.aiAnalysis ? `
  <div class="card card-emerald section-break">
    <p class="card-title" style="color:#10b981;"><span class="dot" style="background:#10b981;"></span>AI Persoonlijkheidsanalyse</p>
    ${result.aiProvider ? `<span class="ai-provider">${esc(result.aiProvider)} / ${esc(result.aiModel || '')}</span>` : ''}
    <div>${renderMarkdownish(result.aiAnalysis)}</div>
  </div>` : ''}
  ${(result.subjectResults && result.subjectResults.length > 0) ? `
  <div class="section-break">
    <div class="card card-amber" style="margin-bottom:3mm;">
      <p class="card-title" style="color:#f59e0b;"><span class="dot" style="background:#f59e0b;"></span>Layer Analysis</p>
    </div>
    ${result.subjectResults.map((s, i) => `
    <div class="layer keep-together">
      <div class="layer-head">
        <span class="layer-name" style="color:${colors[i]};">${i + 1}. ${esc(s.subjectName)}</span>
        <span class="layer-pct" style="color:${colors[i]};">${s.percentage}%</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${s.percentage}%;background:${colors[i]};"></div></div>
      <p class="layer-detail">Archetype: ${esc(s.dominantArchetype)}</p>
      ${(s.insights || []).map(ins => `<p class="layer-insight">&bull; ${esc(ins)}</p>`).join('')}
      ${(s.recommendations || []).map(rec => `<p class="layer-rec">&rarr; ${esc(rec)}</p>`).join('')}
    </div>`).join('')}
  </div>` : ''}
  <div class="footer">WWW.GARDENFORLIFE.NL &bull; CONSCIOUSNESS PROFILE</div>
</div>
</body>
</html>`;
}

/**
 * Build the email body HTML using the Garden For Life template.
 */
function buildResultsEmailBody(result) {
  const archetype = esc(result.overallArchetype || 'Unknown');
  const harmony = result.harmonyScore || 0;
  const level = esc(result.consciousnessLevel || '');

  return `<!DOCTYPE html>
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
      .header-title { font-size: 20px !important; }
      .body-cell { padding: 20px 16px !important; font-size: 14px !important; }
      .footer-cell { padding: 0 16px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#ffffff;width:100%;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ffffff;">
<tr><td align="left" style="padding:0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="width:600px;max-width:600px;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
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
    <tr>
      <td class="body-cell" style="padding:28px 30px;line-height:1.7;color:#333;font-size:15px;">
        <p style="margin:0 0 16px;">Bedankt voor het invullen van de Garden For Life Bewustzijnsassessment. Hieronder vind je een samenvatting van je resultaten.</p>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:20px 0;background:#f8f9fa;border-radius:8px;border:1px solid #e9ecef;">
          <tr>
            <td style="padding:20px 24px;">
              <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6c757d;">Primair Archetype</p>
              <p style="margin:0 0 16px;font-size:24px;font-weight:600;color:#212529;">${archetype}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="50%" style="padding-right:8px;">
                    <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6c757d;">Harmonie Score</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:600;color:#0891b2;">${harmony}%</p>
                  </td>
                  <td width="50%" style="padding-left:8px;">
                    <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6c757d;">Bewustzijnsniveau</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:600;color:#7c3aed;">${level}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 16px;">Je volledige rapport met gedetailleerde laaganalyse en AI-persoonlijkheidsanalyse is bijgevoegd als HTML-bestand. Open dit bestand in je browser en gebruik <strong>Ctrl+P</strong> (of Cmd+P op Mac) om het als PDF op te slaan.</p>
        <p style="margin:0 0 8px;">Met warme groet,</p>
        <p style="margin:0;font-weight:600;">Het Garden For Life Team</p>
      </td>
    </tr>
    <tr>
      <td class="footer-cell" style="padding:0 30px 24px;">
        <div style="border-top:2px solid #bc13fe;padding-top:20px;margin-top:12px;">
          <div style="font-size:12px;line-height:1.6;color:#555;">
            <div>&#9993; <a href="mailto:yuanwullink30@gfl.community" style="color:#1a73e8;text-decoration:none;">yuanwullink30@gfl.community</a></div>
            <div>&#127760; <a href="https://gardenforlife.nl/" style="color:#1a73e8;text-decoration:none;">www.gardenforlife.nl</a></div>
            <div style="margin-top:4px;font-size:11px;color:#888;">KVK: 85125245</div>
          </div>
          <div style="margin-top:16px;padding-top:12px;border-top:1px solid #eee;">
            <p style="margin:0;font-size:11px;color:#999;">&copy; ${new Date().getFullYear()} Garden For Life &middot; Alle rechten voorbehouden</p>
            <p style="margin:4px 0 0;font-size:10px;color:#bbb;">Dit bericht is verstuurd vanuit het Garden For Life Verbindingscentrum</p>
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
