/**
 * Garden For Life — AI Analysis Routes
 *
 * POST /api/ai/analyze       — Run assessment analysis via any AI provider
 * GET  /api/ai/providers     — List available (configured) providers
 */
const { Router } = require('express');
const { callAI, getAvailableProviders } = require('../services/aiProviders');
const { getDB } = require('../db');

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
 *   supportGroup: "RULING",                     // optional
 *   extendedArchetypeName: "The Arbiter",       // optional
 *   userQuestion: "...",                         // optional
 *   oceanScores: { O:4, C:9, E:4, A:3, N:3 },  // optional
 *   systemPrompt: "...",                         // optional full override
 *   maxTokens: 2048,                             // optional
 *   temperature: 0.7,                            // optional
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
  try {
    const {
      provider,
      model,
      archetypeKey,
      supportGroup,
      extendedArchetypeName,
      userQuestion,
      oceanScores,
      systemPrompt,
      maxTokens,
      temperature,
      // Full pipeline fields
      responses,
      subjectResults,
      harmonyScore,
      consciousnessLevel,
      overallShadow,
      uploadedFileContents,
    } = req.body;

    if (!archetypeKey) {
      return res.status(400).json({ error: 'archetypeKey is required' });
    }

    // Fetch admin prompt config from MongoDB for defaults
    const adminConfig = await getAdminPromptConfig();

    // Build messages — include uploaded context documents
    const contextDocs = await getContextDocuments();
    const system = systemPrompt || buildDefaultSystemPrompt({
      archetypeKey, supportGroup, extendedArchetypeName,
      oceanScores, contextDocs,
      responses, subjectResults, harmonyScore,
      consciousnessLevel, overallShadow, uploadedFileContents,
    });

    const user = userQuestion || buildDefaultUserMessage(archetypeKey, supportGroup, {
      subjectResults, harmonyScore, consciousnessLevel,
    });

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    // Admin config overrides hardcoded defaults; request body overrides admin config
    const finalProvider = provider || adminConfig.defaultProvider || undefined;
    const finalModel = model || adminConfig.defaultModel || undefined;
    const finalMaxTokens = maxTokens || adminConfig.maxTokens || 2048;
    const finalTemperature = temperature ?? adminConfig.temperature ?? 0.7;

    const result = await callAI({
      provider: finalProvider,
      model: finalModel,
      messages,
      maxTokens: finalMaxTokens,
      temperature: finalTemperature,
    });

    res.json({
      archetypeKey,
      supportGroup: supportGroup || null,
      extendedArchetypeName: extendedArchetypeName || null,
      ...result,
    });
  } catch (err) {
    console.error('[AI] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/ai/providers
// ─────────────────────────────────────────────────────────────

router.get('/providers', (_req, res) => {
  res.json({ providers: getAvailableProviders() });
});

module.exports = router;

// ─────────────────────────────────────────────────────────────
// Prompt helpers
// ─────────────────────────────────────────────────────────────

function buildDefaultSystemPrompt({
  archetypeKey, supportGroup, extendedArchetypeName,
  oceanScores, contextDocs,
  responses, subjectResults, harmonyScore,
  consciousnessLevel, overallShadow, uploadedFileContents,
}) {
  const parts = [
    `Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen, ` +
    `het OCEAN (Big Five) persoonlijkheidsmodel, en neurobiologische persoonlijkheidstheorie. ` +
    `Je werkt voor Garden For Life, een bewustzijnsplatform.\n\n` +
    `Antwoord altijd in het Nederlands tenzij de gebruiker in het Engels schrijft. ` +
    `Wees empathisch, genuanceerd en concreet. Vermijd vage algemeenheden.\n`,
  ];

  // ── Admin-uploaded context documents (KENNISBANK) ──
  if (contextDocs && contextDocs.length > 0) {
    parts.push(`═══════════════════════════════════════`);
    parts.push(`KENNISBANK / CONTEXT DOCUMENTEN`);
    parts.push(`═══════════════════════════════════════`);
    for (const doc of contextDocs) {
      parts.push(`── ${doc.filename} ──`);
      parts.push(doc.extractedText);
      parts.push('');
    }
  }

  // ── User-uploaded files (OCEAN report etc.) ──
  if (uploadedFileContents && uploadedFileContents.length > 0) {
    parts.push(`═══════════════════════════════════════`);
    parts.push(`GEBRUIKER-GEÜPLOADE DOCUMENTEN`);
    parts.push(`═══════════════════════════════════════`);
    for (const file of uploadedFileContents) {
      parts.push(`── ${file.name} ──`);
      parts.push(file.text);
      parts.push('');
    }
  }

  // ── Assessment result data ──
  parts.push(`═══════════════════════════════════════`);
  parts.push(`ARCHETYPE PROFIEL`);
  parts.push(`═══════════════════════════════════════`);
  parts.push(`Archetype: ${archetypeKey}`);

  if (supportGroup) parts.push(`Steungroep: ${supportGroup}`);
  if (extendedArchetypeName) parts.push(`Uitgebreid archetype: ${extendedArchetypeName}`);
  if (oceanScores) parts.push(`\nOCEAN Scores: ${JSON.stringify(oceanScores)}`);
  if (harmonyScore != null) parts.push(`Harmonie Score: ${harmonyScore}%`);
  if (consciousnessLevel) parts.push(`Bewustzijnsniveau: ${consciousnessLevel}`);
  if (overallShadow) parts.push(`Dominante Schaduw: ${overallShadow}`);

  // ── Per-layer results ──
  if (subjectResults && subjectResults.length > 0) {
    parts.push(`\n═══════════════════════════════════════`);
    parts.push(`LAAG-VOOR-LAAG RESULTATEN`);
    parts.push(`═══════════════════════════════════════`);
    for (const layer of subjectResults) {
      parts.push(`\n── ${layer.subjectName} ──`);
      parts.push(`Score: ${layer.totalScore}/${layer.maxScore} (${layer.percentage}%)`);
      parts.push(`Dominant Archetype: ${layer.dominantArchetype}`);
      if (layer.shadowAspects && layer.shadowAspects.length > 0) {
        const unique = [...new Set(layer.shadowAspects)];
        parts.push(`Schaduwpatronen: ${unique.join(', ')}`);
      }
    }
  }

  // ── Individual question responses (compact summary) ──
  if (responses && responses.length > 0) {
    parts.push(`\n═══════════════════════════════════════`);
    parts.push(`INDIVIDUELE ANTWOORDEN (${responses.length} vragen)`);
    parts.push(`═══════════════════════════════════════`);
    const summary = responses.map(r =>
      `Q${r.questionId}: waarde=${r.value}, archetype=${r.archetype}, schaduw=${r.shadowAspect}`
    ).join('\n');
    parts.push(summary);
  }

  return parts.join('\n');
}

function buildDefaultUserMessage(archetypeKey, supportGroup, extra = {}) {
  const { subjectResults, harmonyScore, consciousnessLevel } = extra;

  let msg = `Geef een diepgaande persoonlijkheidsanalyse voor het archetype ${archetypeKey}`;
  if (supportGroup) msg += ` met steungroep ${supportGroup}`;
  msg += `. Gebruik de OCEAN-dimensies en neurobiologische inzichten.`;

  if (harmonyScore != null) {
    msg += ` De harmonie score is ${harmonyScore}% en het bewustzijnsniveau is ${consciousnessLevel || 'onbekend'}.`;
  }

  if (subjectResults && subjectResults.length > 0) {
    msg += ` Analyseer de vijf lagen van bewustzijn en geef specifieke adviezen per laag.`;
  }

  msg += ` Geef concrete adviezen voor persoonlijke groei en individuatie.`;
  msg += ` Structureer je antwoord met duidelijke kopjes.`;

  return msg;
}

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
