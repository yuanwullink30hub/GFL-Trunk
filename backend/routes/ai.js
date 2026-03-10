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
    } = req.body;

    if (!archetypeKey) {
      return res.status(400).json({ error: 'archetypeKey is required' });
    }

    // Fetch admin prompt config from MongoDB for defaults
    const adminConfig = await getAdminPromptConfig();

    // Build messages — include uploaded context documents
    const contextDocs = await getContextDocuments();
    const system = systemPrompt || buildDefaultSystemPrompt({
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
    });

    const user = userQuestion || buildDefaultUserMessage(archetypeKey, supportArchetype, {
      extendedArchetypeName, supportGroup, mainGroup,
      shadowArchetype, blindspotArchetype, isIndividuated,
      polarizationLevel, authenticityLevel,
      subjectResults, harmonyScore, consciousnessLevel,
    });

    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    // Admin config overrides hardcoded defaults; request body overrides admin config
    const finalProvider = provider || adminConfig.defaultProvider || undefined;
    const finalModel = model || adminConfig.defaultModel || undefined;
    const finalMaxTokens = maxTokens || adminConfig.maxTokens || 4096;
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
// Prompt helpers
// ─────────────────────────────────────────────────────────────

function buildDefaultSystemPrompt({
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
}) {
  // ── Neural focus labels ──
  const GROUP_NEURAL_FOCUS = {
    RULING:     'CEN: Externe structuur & Wet',
    RELATIONAL: 'Limbic: Emotionele fusie',
    SEEKER:     'Openness: Pure ervaring',
    CHAOS:      'Salience: Disruptie & Waarheid',
    ABSTRACT:   'DMN: Interne reflectie',
    AGENCY:     'Extraversie: Wilskracht',
  };

  const parts = [
    // ═══ SYSTEM ROLE (Advanced Ontological Report Generator) ═══
    `Je bent een expert in de Jungiaanse dieptepsychologie en de neurowetenschap van het Triple Network Model. ` +
    `Je analyseert de resultaten van een gevorderde gebruiker die streeft naar individuatie. ` +
    `Scan de data specifiek op de scheidslijn tussen 'Nature' (biologische flow) en 'Culture/Force' (aangeleerde overleving).\n\n` +
    `Je werkt voor Garden For Life, een bewustzijnsplatform.\n` +
    `Antwoord altijd in het Nederlands tenzij de gebruiker in het Engels schrijft.\n\n` +
    `BELANGRIJKE RICHTLIJNEN:\n` +
    `- Vermijd zinnen als "Jij bent een X." Gebruik in plaats daarvan: "Jij navigeert de realiteit momenteel via de [Main] lens, versterkt door de [Support] groep."\n` +
    `- Wanneer Main en Support 180° tegenpolen zijn, presenteer dit als Meesterschap over de Paradox.\n` +
    `- Gebruik heldere alledaagse taal met zo min mogelijk wetenschappelijk jargon.\n` +
    `- Shadow (tegenpool van Main) = "Innerlijke Brandstof". Lage score: "Hier ligt je volgende alchemistische transformatie". Hoge score: "Gefeliciteerd met je succesvolle integratie."\n` +
    `- Blindspot (tegenpool van Support) = "Externe Saboteur" — de eigenschap in anderen die de gebruiker triggert.\n`,
  ];

  // ── Admin-uploaded context documents (KENNISBANK) ──
  if (contextDocs && contextDocs.length > 0) {
    parts.push(`\n═══════════════════════════════════════`);
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
    parts.push(`\n═══════════════════════════════════════`);
    parts.push(`GEBRUIKER-GEÜPLOADE DOCUMENTEN`);
    parts.push(`═══════════════════════════════════════`);
    for (const file of uploadedFileContents) {
      parts.push(`── ${file.name} ──`);
      parts.push(file.text);
      parts.push('');
    }
  }

  // ═══ ASSESSMENT DATA ═══
  parts.push(`\n═══════════════════════════════════════`);
  parts.push(`ARCHETYPE PROFIEL (ADVANCED ONTOLOGY)`);
  parts.push(`═══════════════════════════════════════`);

  // Core identity
  parts.push(`Main Archetype: ${archetypeKey}`);
  parts.push(`Main Groep: ${mainGroup || 'onbekend'} (${GROUP_NEURAL_FOCUS[mainGroup] || ''})`);
  if (supportArchetype) parts.push(`Support Archetype: ${supportArchetype}`);
  if (supportGroup) parts.push(`Support Groep: ${supportGroup} (${GROUP_NEURAL_FOCUS[supportGroup] || ''})`);
  if (extendedArchetypeName) parts.push(`Extended Archetype (72-matrix): ${extendedArchetypeName}`);

  // Harmony
  if (hasHarmonyBonus) {
    parts.push(`\nHarmony Bonus: +${harmonyBonusApplied} toegekend (Main & Support zijn biologische buren in dezelfde Neurale Zuil)`);
  } else {
    parts.push(`\nHarmony Bonus: Niet van toepassing (Main & Support zitten in verschillende Neurale Zuilen)`);
  }

  // Shadow & Blindspot
  if (shadowArchetype) parts.push(`Shadow (180° tegenpool van Main): ${shadowArchetype}`);
  if (blindspotArchetype) parts.push(`Blindspot (180° tegenpool van Support): ${blindspotArchetype}`);
  if (isIndividuated) {
    parts.push(`⚡ INDIVIDUATIE GEDETECTEERD: Main (${archetypeKey}) en Support (${supportArchetype}) zijn 180° tegenpolen — Meesterschap over de Paradox!`);
  }

  // Advanced Metrics
  parts.push(`\n── GEAVANCEERDE METRICS ──`);
  if (polarizationIndex != null) {
    parts.push(`Polarization Index: ${polarizationIndex} (${polarizationLevel})`);
    if (polarizationLevel === 'HIGH_POLARIZATION') {
      parts.push(`  → AI-trigger: Gat > 49 punten (Hoge Polarisatie). De gebruiker onderdrukt de schaduw agressief. De AI moet in de output focussen op de blinde paniek en de specifieke stress-trigger (Neuroticisme).`);
    } else if (polarizationLevel === 'HIGH_INDIVIDUATION') {
      parts.push(`  → AI-trigger: Gat < 15 punten. De gebruiker heeft de paradox verenigd. Herformuleer het conflict als meesterschap over de paradox.`);
    }
  }
  if (authenticityIndex != null) {
    parts.push(`Authenticity Index: ${authenticityIndex}% Nature (${authenticityLevel})`);
    parts.push(`  Nature punten: ${totalNaturePoints || 0} / Culture punten: ${totalCulturePoints || 0}`);
    if (authenticityLevel === 'NATURE_DOMINANT') {
      parts.push(`  → AI-trigger: >75% Nature. De gebruiker navigeert grotendeels ongedwongen vanuit biologische flow. De AI benadrukt autonomie en integriteit.`);
    } else if (authenticityLevel === 'CULTURE_DOMINANT') {
      parts.push(`  → AI-trigger: >65% Culture/Force. De gebruiker functioneert in "Overlevingsmodus" of past zich excessief aan aan systemische verwachtingen. De AI moet in de output direct interveniëren en waarschuwen voor kritiek energieverlies en naderende burn-out.`);
    }
  }

  if (harmonyScore != null) parts.push(`Engagement Score: ${harmonyScore}%`);
  if (consciousnessLevel) parts.push(`Bewustzijnsniveau: ${consciousnessLevel}`);
  if (overallShadow) parts.push(`Dominante Schaduw: ${overallShadow}`);
  if (oceanScores) parts.push(`OCEAN Scores: ${JSON.stringify(oceanScores)}`);

  // Per-archetype breakdown (Nature vs Culture)
  if (archetypeDetails && archetypeDetails.length > 0) {
    parts.push(`\n── ARCHETYPE SCOREOVERZICHT (12 Punten) ──`);
    parts.push(`Archetype       | Pos | Groep       | Totaal | Nature | Culture | Nature%`);
    parts.push(`----------------|-----|-------------|--------|--------|---------|--------`);
    for (const a of archetypeDetails) {
      const name = (a.key || '').padEnd(15);
      const pos = String(a.position || '').padStart(3);
      const group = (a.group || '').padEnd(11);
      const total = String(a.total || 0).padStart(6);
      const nature = String(a.nature || 0).padStart(6);
      const culture = String(a.culture || 0).padStart(7);
      const ratio = String(a.natureRatio || 0).padStart(7) + '%';
      parts.push(`${name} | ${pos} | ${group} | ${total} | ${nature} | ${culture} | ${ratio}`);
    }
  }

  // Per-layer results
  if (subjectResults && subjectResults.length > 0) {
    parts.push(`\n── LAAG-VOOR-LAAG RESULTATEN ──`);
    for (const layer of subjectResults) {
      parts.push(`\n${layer.subjectName}: Score ${layer.totalScore}/${layer.maxScore} (${layer.percentage}%) — Dominant: ${layer.dominantArchetype}`);
      if (layer.shadowAspects && layer.shadowAspects.length > 0) {
        const unique = [...new Set(layer.shadowAspects)].filter(Boolean);
        if (unique.length > 0) parts.push(`  Schaduwpatronen: ${unique.join(', ')}`);
      }
    }
  }

  // Individual responses (compact)
  if (responses && responses.length > 0) {
    parts.push(`\n── INDIVIDUELE ANTWOORDEN (${responses.length} vragen) ──`);
    const summary = responses.map(r =>
      `Q${r.questionId}: archetype=${r.archetype}${r.shadowAspect ? ', schaduw=' + r.shadowAspect : ''}`
    ).join('\n');
    parts.push(summary);
  }

  // ═══ OUTPUT FORMAT INSTRUCTIONS ═══
  parts.push(`\n═══════════════════════════════════════`);
  parts.push(`VEREIST OUTPUT FORMAAT (11 SECTIES)`);
  parts.push(`═══════════════════════════════════════`);
  parts.push(`
Genereer het rapport in EXACT deze structuur:

## 1. De Identiteit
[Extended Archetype Naam: ${extendedArchetypeName || 'bepaal uit data'}]
Geef een krachtige beschrijving van 2 zinnen over hoe de Main en Support archetypen samensmelten tot deze unieke identiteit.

## 2. Waarom jij het ${extendedArchetypeName || '[Extended Archetype]'} perspectief gebruikt
Leg uit hoe de twee hoogste scores in deze gebruiker samenwerken. Focus op de unieke kracht die ontstaat wanneer deze twee neurale netwerken elkaar ontmoeten.

## 3. De Essentie (Main Archetype: ${archetypeKey})
- Groep: ${mainGroup || '?'} — Biologische Focus: ${GROUP_NEURAL_FOCUS[mainGroup] || '?'}
- Drijfveer: Kijk naar de Nature vs Culture data — is dit Nature (Flow) of Culture/Force (Overleving)? Benoem dit expliciet!
- Advanced Inzicht: Hoe dit netwerk de primaire lens vormt voor hun wereldbeeld.

## 4. De Vermenigvuldiging (Support Archetype: ${supportArchetype || '?'})
- Groep: ${supportGroup || '?'} — Biologische Focus: ${GROUP_NEURAL_FOCUS[supportGroup] || '?'}
- Rol: Hoe dit archetype de Main ondersteunt, uitdaagt of verfijnt.
- Harmony Check: ${hasHarmonyBonus ? 'JA — +69 Harmony Bonus is actief. Leg uit waarom deze biologische buren elkaar versterken.' : 'GEEN Harmony Bonus — Main en Support zitten in verschillende biologische groepen.'}

## 5. De Matrix van 72 Mogelijkheden
Toon de complete tabel van de 6 Extended Archetypen voor het Main archetype (${archetypeKey}). Highlight de specifieke uitslag (${extendedArchetypeName || '?'}) met vette tekst.

## 6. De Schaduw (Innerlijke Brandstof)
Shadow Archetype: ${shadowArchetype || '?'}
- De Paradox: Leg de spanning uit tussen Main en deze tegenpool op de 180°-as.
- Individuatie Status: ${polarizationLevel === 'HIGH_INDIVIDUATION' ? 'HOGE INTEGRATIE — prijs hen.' : polarizationLevel === 'HIGH_POLARIZATION' ? 'AGRESSIEVE ONDERDRUKKING — waarschuw en adviseer.' : 'Beschrijf hoe ze dit netwerk optimaler kunnen inzetten als energie.'}

## 7. De Blindspot (De Saboteur)
Blindspot Archetype: ${blindspotArchetype || '?'}
Leg uit waarom de gebruiker mogelijk allergisch is voor dit type gedrag in anderen en hoe dit hun plannen onbewust kan dwarsbomen.

## 8. Visuele Analyse
Beschrijf het webdiagram en de dual core dynamics tekstueel. Welke assen zijn sterk? Welke zijn zwak?

## 9. De Alchemie van Individuatie (Systeem Kernanalyse)
- De Switch: Hoe effectief schakelt de gebruiker tussen hun 'Aanpak-modus' en 'Reflectie-modus'?
- Nature vs. Nurture Balans: Analyseer de verhouding Nature (${totalNaturePoints || '?'}) vs Culture (${totalCulturePoints || '?'}). Authenticity Index = ${authenticityIndex || '?'}%. Leven ze vanuit hun kern, of vechten ze tegen hun eigen biologie?
${isIndividuated ? '- De Paradox: Main en Support zijn 180° tegenpolen — prijs hen voor het overstijgen van labeling en het integreren van hun schaduw.' : ''}

## 10. Het Neurale Schakelbord (Tactische Implementatie)
Geef 3 concrete 'hendels':
1. De Focus-hendel: Wanneer ze hun dominante netwerk bewust moeten dempen.
2. De Schaduw-injectie: Een specifieke oefening om de energie van de Shadow te gebruiken.
3. De Blindspot-check: Waar moeten ze deze week op letten in sociale interacties?

## 11. Ontologische Evolutie (Toekomstige Integratie)
- Richting het Centrum: Hoe kunnen ze extreme uitslagen naar het midden bewegen?
- Ontologische Vraag: Geef één diepe reflectieve vraag die de kern van hun paradox raakt.
- AI Agent Prompt: Schrijf een prompt die gebruikers kunnen importeren naar hun eigen AI Agent. De prompt stuurt de agent in moraliteit, houding en taalgebruik zodat de individuatie ook digitaal verwerkelijkt wordt. Specifiek gericht op de testresultaten.
`);

  return parts.join('\n');
}

function buildDefaultUserMessage(archetypeKey, supportArchetype, extra = {}) {
  const {
    extendedArchetypeName, supportGroup, mainGroup,
    shadowArchetype, blindspotArchetype, isIndividuated,
    polarizationLevel, authenticityLevel,
    subjectResults, harmonyScore, consciousnessLevel,
  } = extra;

  let msg = `Genereer een volledig Advanced Ontologisch Rapport (alle 11 secties) voor deze gebruiker.\n\n`;
  msg += `Main Archetype: ${archetypeKey}`;
  if (supportArchetype) msg += ` | Support: ${supportArchetype}`;
  if (extendedArchetypeName) msg += ` | Extended: ${extendedArchetypeName}`;
  msg += `\n`;

  if (mainGroup) msg += `Main Groep: ${mainGroup}`;
  if (supportGroup) msg += ` | Support Groep: ${supportGroup}`;
  msg += `\n`;

  if (shadowArchetype) msg += `Shadow: ${shadowArchetype}`;
  if (blindspotArchetype) msg += ` | Blindspot: ${blindspotArchetype}`;
  msg += `\n`;

  if (isIndividuated) {
    msg += `⚡ INDIVIDUATIE: Main en Support zijn 180° tegenpolen — meesterschap over de paradox.\n`;
  }

  if (polarizationLevel) msg += `Polarisatie: ${polarizationLevel}\n`;
  if (authenticityLevel) msg += `Authenticiteit: ${authenticityLevel}\n`;

  if (harmonyScore != null) {
    msg += `Engagement Score: ${harmonyScore}% | Bewustzijnsniveau: ${consciousnessLevel || 'onbekend'}\n`;
  }

  if (subjectResults && subjectResults.length > 0) {
    msg += `\nAnalyseer de vijf lagen van bewustzijn en integreer dit in de 11-sectie analyse.\n`;
  }

  msg += `\nGebruik het PDF bestand (indien geüpload) voor additionele context. Volg het exacte 11-sectie format uit je systeeminstructies.`;

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
    <p class="card-title" style="color:#22d3ee;"><span class="dot" style="background:#22d3ee;"></span>Primary Archetype</p>
    <h1 class="hero-archetype">${esc(archetype)}</h1>
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
