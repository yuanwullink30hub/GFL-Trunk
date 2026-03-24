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
 *   provider: "openai" | "claude" | "grok",   // optional, defaults to claude
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
 *   hasHarmonyBonus: false,                       // deprecated (Geometric Bleed has no counters)
 *   harmonyBonusApplied: 0,                        // deprecated
 *   polarizationIndex: 25,                       // Main - Shadow score gap
 *   polarizationLevel: "MODERATE",               // HIGH_POLARIZATION | MODERATE | HIGH_INDIVIDUATION
 *   authenticityIndex: 55,                       // Nature % of total
 *   authenticityLevel: "BALANCED",               // NATURE_DOMINANT | BALANCED | CULTURE_DOMINANT
 *   totalNaturePoints: 165,                      // total Nature sub-score
 *   totalCulturePoints: 135,                     // total CultureForce sub-score
 *   archetypeDetails: [...],                     // per-archetype breakdown with core/bleed sub-scores
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
      // Group dynamics (Dual-Core)
      subgroups,
    } = req.body;

    if (!archetypeKey) {
      sendEvent('error', { error: 'archetypeKey is required' });
      return res.end();
    }

    // Fetch admin prompt config from MongoDB for defaults
    const adminConfig = await getAdminPromptConfig();
    console.log('[AI] Admin config retrieved from MongoDB');
    console.log('[AI] System prompt template (first 100 chars):', adminConfig.systemPromptTemplate ? adminConfig.systemPromptTemplate.substring(0, 100) : '(empty)');

    // Extract text from any uploaded PDFs (sent as base64)
    // pdf-parse v2 exports a PDFParse class (not a function).
    // PDFs that fail to parse are removed so the AI never receives error placeholder text.
    const pdfWarnings = [];
    if (uploadedFileContents && uploadedFileContents.length > 0) {
      const { PDFParse } = require('pdf-parse');
      for (let i = uploadedFileContents.length - 1; i >= 0; i--) {
        const item = uploadedFileContents[i];
        if (item.pdfBase64 && !item.text) {
          let extracted = null;
          try {
            const buffer = Buffer.from(item.pdfBase64, 'base64');
            const parser = new PDFParse({ data: buffer });
            const parsed = await parser.getText();
            extracted = parsed.text?.trim();
            await parser.destroy();
          } catch (err) {
            console.error(`PDF parse error for ${item.name}:`, err.message);
          }
          if (extracted && extracted.length >= 30) {
            uploadedFileContents[i] = { name: item.name, text: extracted };
          } else {
            // Empty or unreadable — remove from list so the AI is not given garbage content
            console.warn(`PDF produced no usable text, removing from prompt: ${item.name}`);
            pdfWarnings.push(item.name);
            uploadedFileContents.splice(i, 1);
          }
        }
      }
    }
    // Notify the client about unreadable PDFs before the AI call
    if (pdfWarnings.length > 0) {
      sendEvent('pdf_warning', { files: pdfWarnings });
    }

    // ── Parse OCEAN scores directly from uploaded file text ──
    // This is done here (before the AI runs) so we can send authoritative
    // structured scores back to the client — no regex parsing of AI text needed.
    let uploadedOceanScores = null;
    if (uploadedFileContents && uploadedFileContents.length > 0) {
      // Keywords that map to each OCEAN dimension (order: longest match first to avoid substring collisions)
      const DIM_KEYWORDS = {
        O: ['openheid voor ervaringen', 'openheid voor ervaring', 'openheid', 'openness to experience', 'openness', 'open to experience', 'open voor ervaring'],
        C: ['ordelijkheid', 'conscientiousness', 'consciëntieusheid', 'conscientieusheid', 'gewetensvolheid', 'zorgvuldigheid', 'nauwgezetheid'],
        E: ['extraversie', 'extraversion', 'extroversie', 'extraverted', 'extravert'],
        A: ['meegaandheid', 'agreeableness', 'inschikkelijkheid', 'vriendelijkheid', 'verdraagzaamheid'],
        N: ['neuroticisme', 'neuroticism', 'emotionele stabiliteit', 'emotional stability', 'emotionaliteit'],
      };

      const parsed = {};

      for (const file of uploadedFileContents) {
        if (!file.text) continue;
        const txt = file.text;

        // Strategy 1: Scan every line for "dimension-keyword ... number" patterns
        // Handles: "Openheid voor Ervaringen (Hoog - 72)", "Openness: 72", "Extraversion  88",
        //          "Conscientiousness — 96 / 100", "Openheid 72%", "O: 72", etc.
        // If keyword found but no number on same line, check the next 2 lines (PDF extraction fallback).
        const lines = txt.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const lower = lines[i].toLowerCase();
          for (const [dim, keywords] of Object.entries(DIM_KEYWORDS)) {
            if (parsed[dim] != null) continue;
            for (const kw of keywords) {
              if (!lower.includes(kw)) continue;
              // Find all numbers in the line (after the keyword position)
              const kwIdx = lower.indexOf(kw);
              const afterKw = lines[i].slice(kwIdx + kw.length);
              // Match a number 0-100 that isn't part of a larger number
              const numMatch = afterKw.match(/\b(\d{1,3})\b/);
              if (numMatch) {
                const val = parseInt(numMatch[1], 10);
                if (val >= 0 && val <= 100) {
                  parsed[dim] = val;
                  break;
                }
              }
              // Fallback: keyword found but no number — check next 2 lines
              // (handles PDF text extraction where score lands on a separate line)
              for (let j = 1; j <= 2 && (i + j) < lines.length; j++) {
                const nextLine = lines[i + j].trim();
                if (!nextLine) continue;
                const nextNumMatch = nextLine.match(/\b(\d{1,3})\b/);
                if (nextNumMatch) {
                  const val = parseInt(nextNumMatch[1], 10);
                  if (val >= 0 && val <= 100) {
                    parsed[dim] = val;
                    break;
                  }
                }
              }
              if (parsed[dim] != null) break;
            }
          }
        }

        // Strategy 2: If we still have gaps, try single-letter header format "O: 72" / "C = 81"
        // (only on lines that look like score entries, not prose)
        if (Object.keys(parsed).length < 5) {
          for (const line of lines) {
            const trimmed = line.trim();
            // Match lines like "O: 72", "C = 81", "E  92/100", "N: 28 / 100"
            const letterMatch = trimmed.match(/^([OCEAN])\s*[:=\-–—]?\s*(\d{1,3})\s*(?:\/\s*100)?/i);
            if (letterMatch && trimmed.length < 40) { // short line = likely a score entry
              const letter = letterMatch[1].toUpperCase();
              if ('OCEAN'.includes(letter) && parsed[letter] == null) {
                const val = parseInt(letterMatch[2], 10);
                if (val >= 0 && val <= 100) parsed[letter] = val;
              }
            }
          }
        }

        // Strategy 3: "Openheid (Niveau - XX)" format from our own AI-generated prompts
        if (Object.keys(parsed).length < 5) {
          for (const [dim, keywords] of Object.entries(DIM_KEYWORDS)) {
            if (parsed[dim] != null) continue;
            for (const kw of keywords) {
              const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^)]*?\\((.*?)(\\d{1,3})\\)', 'i');
              const m = txt.match(re);
              if (m) {
                const val = parseInt(m[2], 10);
                if (val >= 0 && val <= 100) { parsed[dim] = val; break; }
              }
            }
          }
        }

        // Strategy 4: Full-text proximity scan — find keyword anywhere in text, then grab nearest number
        // (catches cases where line breaks are inconsistent or text is wrapped differently)
        if (Object.keys(parsed).length < 5) {
          const fullLower = txt.toLowerCase();
          for (const [dim, keywords] of Object.entries(DIM_KEYWORDS)) {
            if (parsed[dim] != null) continue;
            for (const kw of keywords) {
              const idx = fullLower.indexOf(kw);
              if (idx === -1) continue;
              // Grab up to 80 chars after the keyword to find a nearby number
              const window = txt.slice(idx + kw.length, idx + kw.length + 80);
              const numMatch = window.match(/\b(\d{1,3})\b/);
              if (numMatch) {
                const val = parseInt(numMatch[1], 10);
                if (val >= 0 && val <= 100) { parsed[dim] = val; break; }
              }
            }
          }
        }

        if (Object.keys(parsed).length >= 5) break; // all found, stop checking files
      }

      if (Object.keys(parsed).length >= 3) {
        uploadedOceanScores = parsed;
        console.log('[AI] Parsed uploaded OCEAN scores:', uploadedOceanScores);
      } else {
        console.warn('[AI] Could not parse enough OCEAN scores from uploaded files. Found:', parsed);
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
      subgroups,
    };

    // Admin meta instruction from MongoDB (editable via dashboard) is the sole system prompt.
    // The backend hardcoded prompt is no longer used — all instructions live in the admin dashboard.
    const adminMeta = adminConfig.systemPromptTemplate || '';
    const system = systemPrompt || adminMeta || '';
    const user = userQuestion || builder.buildUserMessage(promptData);

    console.log('[AI] ═══════════════════════════════════════════════════════════');
    console.log('[AI] FINAL SYSTEM PROMPT BEING SENT TO AI:');
    console.log('[AI] ───────────────────────────────────────────────────────────');
    console.log('[AI] Total length:', system.length, 'characters');
    console.log('[AI] Admin meta instruction included:', adminMeta.length > 0 ? 'YES' : 'NO');
    if (adminMeta.length > 0) {
      console.log('[AI] Admin meta (first 150 chars):', adminMeta.substring(0, 150));
    }
    console.log('[AI] User message length:', user.length, 'characters');
    console.log('[AI] ═══════════════════════════════════════════════════════════');

    // Only include system message if there is actual content — an empty
    // Note: avoid inline images with text-only providers.
    const messages = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: user });

    // ── Stage 1: Data compiled, prompt built ──
    sendEvent('progress', { stage: 1, message: 'Data verwerkt — AI analyse gestart...' });

    // Request body overrides defaults; ignore admin model/provider (no UI selector)
    const finalProvider = provider || undefined;
    const finalModel = model || undefined;
    const finalMaxTokens = maxTokens || adminConfig.maxTokens || 16000;
    const finalTemperature = temperature ?? adminConfig.temperature ?? 0.7;

    console.log('[AI] Calling AI with config:');
    console.log('[AI]   Provider:', finalProvider || '(default)');
    console.log('[AI]   Model:', finalModel || '(default)');
    console.log('[AI]   Max Tokens:', finalMaxTokens);
    console.log('[AI]   Temperature:', finalTemperature);
    console.log('[AI]   Archetype:', archetypeKey);

    // Extract user-uploaded images to pass directly to vision-capable models
    const uploadedImages = (uploadedFileContents || [])
      .filter(item => item.imageBase64 && item.mimeType)
      .map(item => ({ base64: item.imageBase64, mimeType: item.mimeType, name: item.name }));

    const result = await callAI({
      provider: finalProvider,
      model: finalModel,
      messages,
      maxTokens: finalMaxTokens,
      temperature: finalTemperature,
      uploadedImages,
    });

    console.log(`[AI] ✅ Analysis complete: provider=${result.provider}, model=${result.model}, tokens=${result.completionTokens}`);

    // ── Stage 2: AI generation complete ──
    sendEvent('progress', { stage: 2, message: 'AI analyse compleet — resultaten verwerken...' });

    // ── Send final result ──
    sendEvent('result', {
      archetypeKey,
      supportGroup: supportGroup || null,
      extendedArchetypeName: extendedArchetypeName || null,
      uploadedOceanScores: uploadedOceanScores || null,
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
    const emailBody = buildResultsEmailBody(result, recipientEmail.trim());

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
function buildResultsEmailBody(result, recipientEmail) {
  const archetype = esc(result.overallArchetype || 'Unknown');
  const harmony = result.harmonyScore || 0;
  const level = esc(result.consciousnessLevel || '');
  const feedbackUrl = recipientEmail
    ? `https://gardenforlife.nl/feedback?email=${encodeURIComponent(recipientEmail)}`
    : 'https://gardenforlife.nl/feedback';

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

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
          <tr>
            <td style="background:#f8f0ff;border-radius:8px;border:1px solid #e0c0ff;padding:20px 24px;text-align:center;">
              <p style="margin:0 0 12px;font-size:15px;color:#444;font-style:italic;">Na het lezen van je rapport — kun je ons vertellen wat je er van vond?</p>
              <a href="${feedbackUrl}" style="display:inline-block;padding:12px 28px;background:#a855f7;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;letter-spacing:0.5px;font-family:'Segoe UI',Tahoma,sans-serif;">&#9997;&#65039; Geef Feedback</a>
            </td>
          </tr>
        </table>

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
