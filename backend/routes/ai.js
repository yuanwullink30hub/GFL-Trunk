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
 *   temperature: 0.7                             // optional
 * }
 *
 * NOTE: Knowledge context (archetype descriptions, OCEAN profiles, etc.)
 * is now provided via admin-uploaded documents stored in MongoDB
 * (collection: promptDocuments), not hardcoded parameters.
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
    });

    const user = userQuestion || buildDefaultUserMessage(archetypeKey, supportGroup);

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
}) {
  const parts = [
    `Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen, ` +
    `het OCEAN (Big Five) persoonlijkheidsmodel, en neurobiologische persoonlijkheidstheorie. ` +
    `Je werkt voor Garden For Life, een bewustzijnsplatform.\n\n` +
    `Antwoord altijd in het Nederlands tenzij de gebruiker in het Engels schrijft. ` +
    `Wees empathisch, genuanceerd en concreet. Vermijd vage algemeenheden.\n`,
  ];

  // ── Uploaded context documents ──
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

  // ── Assessment result data ──
  parts.push(`═══════════════════════════════════════`);
  parts.push(`ARCHETYPE PROFIEL`);
  parts.push(`═══════════════════════════════════════`);
  parts.push(`Archetype: ${archetypeKey}`);

  if (supportGroup) parts.push(`Steungroep: ${supportGroup}`);
  if (extendedArchetypeName) parts.push(`Uitgebreid archetype: ${extendedArchetypeName}`);
  if (oceanScores) parts.push(`\nOCEAN Scores: ${JSON.stringify(oceanScores)}`);

  return parts.join('\n');
}

function buildDefaultUserMessage(archetypeKey, supportGroup) {
  return `Geef een diepgaande persoonlijkheidsanalyse voor het archetype ${archetypeKey}` +
    (supportGroup ? ` met steungroep ${supportGroup}` : '') +
    `. Gebruik de OCEAN-dimensies en neurobiologische inzichten. ` +
    `Geef concrete adviezen voor persoonlijke groei en individuatie.`;
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
