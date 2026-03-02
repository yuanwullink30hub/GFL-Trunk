/**
 * Garden For Life — AI Analysis Routes
 *
 * POST /api/ai/analyze       — Run assessment analysis via any AI provider
 * GET  /api/ai/providers     — List available (configured) providers
 */
const { Router } = require('express');
const { callAI, getAvailableProviders } = require('../services/aiProviders');

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
 *   coreProfile: "...",                          // optional
 *   extendedDescription: "...",                  // optional
 *   neuroticismTrigger: "...",                   // optional
 *   systemPrompt: "...",                         // optional full override
 *   maxTokens: 2048,                             // optional
 *   temperature: 0.7                             // optional
 * }
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
      coreProfile,
      extendedDescription,
      neuroticismTrigger,
      systemPrompt,
      maxTokens,
      temperature,
    } = req.body;

    if (!archetypeKey) {
      return res.status(400).json({ error: 'archetypeKey is required' });
    }

    // Build messages
    const system = systemPrompt || buildDefaultSystemPrompt({
      archetypeKey, supportGroup, extendedArchetypeName,
      oceanScores, coreProfile, extendedDescription, neuroticismTrigger,
    });

    const user = userQuestion || buildDefaultUserMessage(archetypeKey, supportGroup);

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    const result = await callAI({ provider, model, messages, maxTokens, temperature });

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
  oceanScores, coreProfile, extendedDescription, neuroticismTrigger,
}) {
  const parts = [
    `Je bent een persoonlijke ontwikkelingscoach gespecialiseerd in Jungiaanse archetypen, ` +
    `het OCEAN (Big Five) persoonlijkheidsmodel, en neurobiologische persoonlijkheidstheorie. ` +
    `Je werkt voor Garden For Life, een bewustzijnsplatform.\n\n` +
    `Antwoord altijd in het Nederlands tenzij de gebruiker in het Engels schrijft. ` +
    `Wees empathisch, genuanceerd en concreet. Vermijd vage algemeenheden.\n`,

    `═══════════════════════════════════════`,
    `ARCHETYPE PROFIEL`,
    `═══════════════════════════════════════`,
    `Archetype: ${archetypeKey}`,
  ];

  if (supportGroup) parts.push(`Steungroep: ${supportGroup}`);
  if (extendedArchetypeName) parts.push(`Uitgebreid archetype: ${extendedArchetypeName}`);
  if (oceanScores) parts.push(`\nOCEAN Scores: ${JSON.stringify(oceanScores)}`);
  if (coreProfile) parts.push(`\n── Kernprofiel ──\n${coreProfile}`);
  if (extendedDescription) parts.push(`\n── Uitgebreide beschrijving ──\n${extendedDescription}`);
  if (neuroticismTrigger) parts.push(`\n── Neuroticisme trigger ──\n${neuroticismTrigger}`);

  return parts.join('\n');
}

function buildDefaultUserMessage(archetypeKey, supportGroup) {
  return `Geef een diepgaande persoonlijkheidsanalyse voor het archetype ${archetypeKey}` +
    (supportGroup ? ` met steungroep ${supportGroup}` : '') +
    `. Gebruik de OCEAN-dimensies en neurobiologische inzichten. ` +
    `Geef concrete adviezen voor persoonlijke groei en individuatie.`;
}
