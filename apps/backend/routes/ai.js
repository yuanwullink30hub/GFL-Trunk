/**
 * Garden For Life — AI Analysis Routes
 *
 * POST /api/ai/analyze       — Run assessment analysis via any AI provider
 * GET  /api/ai/providers     — List available (configured) providers
 */
const { sealCode } = require('../services/sealedCode');
const { Router } = require('express');
const { callAI, getAvailableProviders } = require('../services/aiProviders');
const { computeCRuntime } = require('../services/cRuntime');
const { orb3FromGeometry } = require('@gfl/orb-engine');
const { formatLineTypeBlock } = require('../services/lineType');
const { getCorpusText } = require('../services/corpusData');
const reportV5 = require('../engine/reportV5');
const { getDB } = require('../db');
const config = require('../config');
const nodemailer = require('nodemailer');
const { buildAccessEmail } = require('../services/accessEmail');
const { redactUploadText, neutralFileName } = require('../services/uploadRedaction');

// Level-specific prompt builders
const promptBuilders = {
  beginner: require('../prompts/beginner'),
  intermediate: require('../prompts/intermediate'),
  advanced: require('../prompts/advanced'),
};

/**
 * Format the pre-computed C-runtime block for the model payload. The engine
 * computes this; the model must NOT recompute it (it reads these values).
 */
function formatCRuntimeBlock(c) {
  const d = c.composed_D_state || {};
  const cv = c.c_runtime_values || {};
  const cLines = Object.entries(cv)
    .map(([f, v]) => `${f}=${v === null ? 'no-channel' : v.toFixed(3)}`)
    .join(', ');
  const refusals = (c.unresolved_edges || []).map(([n, e]) => `${n}(${e})`).join(', ') || 'none';
  return [
    '═══ C-RUNTIME (pre-computed by the engine — do NOT recompute) ═══',
    'Composed D-state (dynamic-ceiling normalised, peak=100%; within-configuration relative):',
    `  D1=${d.D1} D2=${d.D2} D3=${d.D3} D4=${d.D4} D5=${d.D5}`,
    'C-modulation (Support [Effect] × geometry — direction stored, magnitude geometry-driven):',
    `  ${cLines}`,
    `polar_norm=${c.polar_norm}  support_weight_norm=${(c.support_weight_norm || 0).toFixed(3)}`,
    `unresolved edges (refused, not guessed): ${refusals}`,
    `[${c.WARNING}]`,
  ].join('\n');
}

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
 *   blindspotArchetype: "OUTLAW",               // Red Line partner of Main
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
 *   uploadedFileContents: [{ name, pdfBase64 | docxBase64 | text }] // OCEAN report upload (no images)
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
      polarizationPct,
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
      uploadedFileContents: rawUploads,
      // Level selection
      level,
      // Group dynamics (Dual-Core)
      subgroups,
      radarData,
      // The relevant Levensles (Main×SupportGroup), sent by the frontend so the AI
      // gets it directly without searching the corpus.
      levensles,
      // UI language tag — selects which corpus TEXT is sent to the model
      // ('nl' → Dutch corpus, otherwise the English corpus). Engine math is EN.
      language,
    } = req.body;

    if (!archetypeKey) {
      sendEvent('error', { error: 'archetypeKey is required' });
      return res.end();
    }

    // Log radarData for debugging
    if (radarData) {
      console.log('[AI] radarData received:');
      console.log(JSON.stringify(radarData, null, 2));
    }

    // Fetch admin prompt config from MongoDB for defaults
    const adminConfig = await getAdminPromptConfig();
    console.log('[AI] Admin config retrieved from MongoDB');
    console.log('[AI] System prompt template (first 100 chars):', adminConfig.systemPromptTemplate ? adminConfig.systemPromptTemplate.substring(0, 100) : '(empty)');

    // Extract text from any uploaded PDFs (sent as base64)
    // pdf-parse v2 exports a PDFParse class (not a function).
    // PDFs that fail to parse are removed so the AI never receives error placeholder text.
    const pdfWarnings = [];
    // OCEAN uploads are PDF, Word (.docx) or plain text only (human ruling 2026-09-16). Images are
    // dropped: a screenshot can show the person's name and a picture cannot be scrubbed.
    const uploadedFileContents = Array.isArray(rawUploads)
      ? rawUploads.filter((item) => item && (item.pdfBase64 || item.docxBase64 || typeof item.text === 'string'))
      : undefined;
    if (uploadedFileContents && uploadedFileContents.length > 0) {
      const { PDFParse } = require('pdf-parse');
      for (let i = uploadedFileContents.length - 1; i >= 0; i--) {
        const item = uploadedFileContents[i];
        if ((item.pdfBase64 || item.docxBase64) && !item.text) {
          let extracted = null;
          try {
            if (item.docxBase64) {
              const mammoth = require('mammoth');
              const parsed = await mammoth.extractRawText({ buffer: Buffer.from(item.docxBase64, 'base64') });
              extracted = parsed.value?.trim();
            } else {
              const buffer = Buffer.from(item.pdfBase64, 'base64');
              const parser = new PDFParse({ data: buffer });
              const parsed = await parser.getText();
              extracted = parsed.text?.trim();
              await parser.destroy();
            }
          } catch (err) {
            console.error(`Upload parse error for ${neutralFileName(item.name, i)}:`, err.message);
          }
          if (extracted && extracted.length >= 30) {
            uploadedFileContents[i] = { name: item.name, text: extracted };
          } else {
            // Empty or unreadable — remove from list so the AI is not given garbage content
            console.warn(`PDF produced no usable text, removing from prompt: ${neutralFileName(item.name, i)}`);
            pdfWarnings.push(item.name);
            uploadedFileContents.splice(i, 1);
          }
        }
      }
    }
    // Names out before anything reads the uploads (human ruling 2026-09-16): the OCEAN parser, the
    // model and the logs only see scrubbed text under a neutral label — never the person's name,
    // contact details or their own file name. (The unreadable-file warning below goes back to the
    // uploader only and keeps their file names so they recognise them.)
    if (uploadedFileContents && uploadedFileContents.length > 0) {
      let scrubbed = 0;
      uploadedFileContents.forEach((item, i) => {
        const label = neutralFileName(item.name, i);
        if (typeof item.text === 'string') {
          const { text, removed } = redactUploadText(item.text);
          scrubbed += removed;
          uploadedFileContents[i] = { ...item, name: label, text };
        } else {
          uploadedFileContents[i] = { ...item, name: label };
        }
      });
      console.log(`[AI] Uploads scrubbed: ${uploadedFileContents.length} file(s), ${scrubbed} personal detail(s) removed`);
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

    // Report pipeline (config.reportPipeline, set in the repo: the engine pipeline). Free-form
    // userQuestion calls always stay on the v4.3 path.
    const pipeline = !userQuestion && config.reportPipeline === 'v5.2' ? 'v5.2' : 'v4.3';
    const isV5 = pipeline === 'v5.2';

    // Build messages — include uploaded context documents. v5.2: the Corpus Manifest slice is the
    // model's whole corpus (Backend Instruction v1 rule 10), so the admin knowledge-base docs stay out.
    const contextDocs = isV5 ? [] : await getContextDocuments();
    const promptLevel = level || 'advanced';
    const builder = promptBuilders[promptLevel] || promptBuilders.advanced;

    const promptData = {
      archetypeKey, supportArchetype, supportGroup, mainGroup,
      extendedArchetypeName, oceanScores, contextDocs,
      shadowArchetype, blindspotArchetype, isIndividuated,
      hasHarmonyBonus, harmonyBonusApplied,
      polarizationIndex, polarizationPct, polarizationLevel,
      authenticityIndex, authenticityLevel,
      totalNaturePoints, totalCulturePoints,
      archetypeDetails, scores,
      responses, subjectResults, harmonyScore,
      consciousnessLevel, overallShadow, uploadedFileContents,
      subgroups,
      // The OCEAN values parsed from the user's upload (above) — the engine pipeline ships them as
      // one structured line so the model reads them instead of digging through the PDF text.
      uploadedOceanScores,
      // Report language — picks the Dutch or English 132-roster for the extension
      // name + matrix table, matching the corpus selected above.
      language,
      sliceScoped: isV5,
    };

    // System prompt = the AI Master Prompt, stored in the MongoDB admin config (editable in the
    // dashboard) — the only copy, for both pipelines. Together with the cached corpus it is the
    // cached prefix. v5.2 refuses to run without it (buildV5Request).
    const adminMeta = adminConfig.systemPromptTemplate || '';
    const system = systemPrompt || adminMeta || '';

    // ── C-runtime: engine pre-computes the composed D-state + C-magnitude (the model
    //    reads these; it does not recompute). Non-fatal if the geometry is incomplete. ──
    let cRuntime = null;
    try {
      if (archetypeDetails && archetypeKey) {
        cRuntime = computeCRuntime({
          archetypeDetails,
          mainKey: archetypeKey,
          supportKey: supportArchetype,
          shadowKey: shadowArchetype,
        });
      }
    } catch (e) {
      console.warn('[AI] C-runtime precompute failed (continuing without it):', e.message);
    }

    // ── Orb code: the engine authors the one-line LC_ORB3_ profile code (3D orb) from the same
    //    12-arc geometry — palette/pulse/cymatic/friction/harmony/radial derived at runtime, the
    //    composed-B-deferred levers from the §3 group priors — gating radial+purple with the REAL
    //    polar_gap (main − shadow weight). Printed on the PDF; the component decodes + renders. ──
    let orbCode = '';
    try {
      if (archetypeDetails && archetypeKey) {
        orbCode = orb3FromGeometry({
          archetypeDetails,
          mainKey: archetypeKey,
          shadowKey: shadowArchetype,
        });
      }
    } catch (e) {
      console.warn('[AI] orb code-gen failed (continuing without it):', e.message);
    }

    // ── Main↔Support line-type: resolved deterministically from the static lookup table
    //    so the model never re-derives the colour (the recurring Green/Blue mistake). The
    //    resolved tag rides in the payload; the full table rides as a separate reference doc. ──
    const lineTypeBlock = (!userQuestion && archetypeKey && supportArchetype)
      ? formatLineTypeBlock({
          mainKey: archetypeKey, supportKey: supportArchetype,
          shadowKey: shadowArchetype, blindspotKey: blindspotArchetype,
        })
      : '';

    // ── User payload: per-user geometry (buildUserMessage) + the line-type tag + the
    //    C-runtime block + the relevant Levensles. Corpus rides separately as cached context. ──
    const geometryMsg = userQuestion || builder.buildUserMessage(promptData);

    // ── v5.2: runtime engine (D-path) → Corpus Manifest slice → role-tagged payload. An engine
    //    error (RoleError, a Support outside the active set, incomplete geometry) is fatal for the
    //    request — surfaced, never patched and never silently downgraded to v4.3. ──
    const v5 = isV5
      ? reportV5.buildV5Request({
          system, bleed: req.body, geometryMsg, lineTypeBlock, cRuntime, language,
        })
      : null;
    if (v5) {
      console.log(`[AI] v5.2 pipeline: active set ${[v5.payload.main.name, ...v5.payload.codrivers.map(c => c.name)].join(', ')}; ` +
        `corpus ${v5.manifest.corpus_manifest_version} ${v5.manifest.documents.length} docs ≈${v5.manifest.token_estimate} tokens; ` +
        `schaduw-pakket (shadow ${v5.manifest.shadow_pack.shadow}, blindspot ${v5.manifest.shadow_pack.blindspot}) → ${v5.manifest.shadow_pack.objects.join(', ') || 'carried by the group blocks'}; ` +
        `stamps ${JSON.stringify(v5.payload.stamps)}`);
    }

    const user = userQuestion ? geometryMsg : v5 ? v5.user : [
      geometryMsg,
      lineTypeBlock,
      cRuntime ? formatCRuntimeBlock(cRuntime) : '',
      levensles ? `═══ LEVENSLES (extended archetype) ═══\n${levensles}` : '',
    ].filter(Boolean).join('\n\n');

    // Cached static-prefix context. v4.3: the full corpus (single source of truth; v4 §1.1 — read
    // it fully before translating). v5.2: the manifest slice. Skipped for free-form userQuestion calls.
    const cachedContext = userQuestion
      ? null
      : v5 ? v5.cachedContext
      : `═══ DELTAWERKEN VOLLEDIG CORPUS (single source of truth — Matrix 360, Rosetta, de vier geometrische bronmodellen) ═══\n${getCorpusText(language)}`;

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
    // No uploaded images reach the model (they are dropped above — names cannot be scrubbed from a picture).
    const uploadedImages = [];

    // ── Keep the SSE connection alive during the long (~4 min) AI generation ──
    // callAI awaits the full model response, writing nothing to the stream in the
    // meantime. Without periodic bytes, idle timeouts (browser / dev proxy /
    // Cloudflare ~100s) drop the connection; the client then sees a failure and the
    // user retries — re-running the entire expensive corpus call while THIS one still
    // completes server-side (the source of the duplicate billed calls). An SSE
    // comment line (": ...") is ignored by the client parser but resets every idle
    // timer along the path.
    const heartbeat = setInterval(() => {
      try { res.write(`: keepalive ${Date.now()}\n\n`); } catch { /* socket already gone */ }
    }, 15000);
    req.on('close', () => clearInterval(heartbeat));

    let result;
    try {
      result = await callAI({
        provider: finalProvider,
        model: finalModel,
        messages,
        maxTokens: finalMaxTokens,
        temperature: finalTemperature,
        uploadedImages,
        cachedContext,
        // No reference documents (human ruling 2026-09-16): the full-wheel lookup table is not
        // sent. The model reads the resolved Main–Support line type (the line-type block, which
        // also names the shadow and blindspot) and the Main's own links (payload.links) — literally.
        referenceDocs: [],
      });
    } finally {
      clearInterval(heartbeat);
    }

    console.log(`[AI] ✅ Analysis complete: provider=${result.provider}, model=${result.model}, tokens=${result.completionTokens}`);

    // ── Kaart Microcopy: extract the profile-card fields SERVER-SIDE and DISCARD them from
    // the analysis before it reaches the client — the result card / report PDF never see
    // them. Stored as a draft keyed by the orb code's hash; register / orb-link merge it
    // into the reading's orbHistory entry when the code is claimed. ──
    try {
      if (!userQuestion && result && typeof result.analysis === 'string') {
        const { extractKaartSection } = require('../services/readingExtract');
        const kaart = extractKaartSection(result.analysis);
        result.analysis = kaart.cleaned;
        if (orbCode && (kaart.giftMicro || kaart.geomSummary)) {
          const { hash } = require('../services/encryption');
          await getDB().collection('kaartDrafts').updateOne(
            { codeHash: hash(orbCode) },
            // sealed: true — authored under the sealed-code model, so the nightly sweep may delete
            // it when the report is never unlocked (server.js). Beta drafts lack the flag and stay.
            { $set: { ...(kaart.giftMicro ? { giftMicro: kaart.giftMicro } : {}), ...(kaart.geomSummary ? { geomSummary: kaart.geomSummary } : {}), at: new Date(), sealed: true } },
            { upsert: true }
          );
          console.log('[AI] kaart-microcopy extracted → draft stored (gift:', !!kaart.giftMicro, '| geometrie:', !!kaart.geomSummary, ')');
        } else if (!kaart.giftMicro && !kaart.geomSummary) {
          console.warn('[AI] ⚠ kaart-microcopy MISSING from model output (card falls back to levensles/placeholder)');
        }
      }
    } catch (e) { console.warn('[AI] kaart-microcopy extract failed (continuing):', e.message); }

    // ── Stage 2: AI generation complete ──
    sendEvent('progress', { stage: 2, message: 'AI analyse compleet — resultaten verwerken...' });

    // ── Send final result ──
    sendEvent('result', {
      archetypeKey,
      supportGroup: supportGroup || null,
      extendedArchetypeName: extendedArchetypeName || null,
      uploadedOceanScores: uploadedOceanScores || null,
      // The engine's pre-computed C-runtime (composed D-state + C-magnitude) so the
      // frontend can render the Plastische Morfologie / De Stille Stem visuals
      // without recomputing. null when the geometry was incomplete.
      cRuntime: cRuntime || null,
      // Which report pipeline produced this analysis. v5.2 adds the role-tagged engine payload
      // (the Spec A1 chart reads enginePayload.main.register — two curves, both the Main's) and the
      // corpus manifest the model received. The geometry passthrough is the client's own data, left out.
      pipeline,
      enginePayload: v5 ? reportV5.clientPayload(v5.payload) : null,
      corpusManifest: v5 ? v5.manifest : null,
      // Authoritative orb profile code (LC_ORB3_…), radial+purple-gated with the real polar_gap —
      // SEALED (services/sealedCode.js): the browser cannot read it. The raw code is handed over
      // only when the full report is unlocked (payment or activation code). '' when geometry incomplete.
      sealedOrbCode: orbCode ? sealCode(orbCode) : '',
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
// POST /api/ai/discard — the user left the report page without unlocking it
// ─────────────────────────────────────────────────────────────
// Single-instance profile: an unpaid report is deleted in full, crystal code included. The code
// itself only ever existed sealed in the tab; what the server holds is the card draft keyed by
// its hash. Holding the seal proves it is this report. A report that was unlocked is never
// touched (its code stays valid for life). Body is the raw seal as text/plain (keepalive fetch
// from an unloading page, no CORS preflight). Always 204 — reveals nothing.
router.post('/discard', require('express').text({ type: 'text/plain', limit: '2kb' }), async (req, res) => {
  try {
    const { unsealCode } = require('../services/sealedCode');
    const { codeHashFor } = require('../services/reportAccess');
    const orbCode = unsealCode(String(req.body || '').trim(), Date.now(), { allowExpired: true });
    const codeHash = codeHashFor(orbCode);
    if (codeHash) {
      const unlocked = await getDB().collection('reportUnlocks').findOne({ codeHash }, { projection: { _id: 1 } });
      // The tab can close while the payment is still at the bank (iDEAL) — the webhook will
      // still unlock the report, so its draft stays until the payment settles.
      const { hasLivePayment } = require('../services/payments');
      if (!unlocked && !(await hasLivePayment(codeHash))) {
        const r = await getDB().collection('kaartDrafts').deleteOne({ codeHash, sealed: true });
        if (r.deletedCount) console.log('[AI] unpaid report discarded — card draft deleted');
      }
    }
  } catch (_) { /* invalid seal or db hiccup — the nightly sweep remains the fallback */ }
  res.status(204).end();
});

// ─────────────────────────────────────────────────────────────
// GET /api/ai/providers
// ─────────────────────────────────────────────────────────────

router.get('/providers', (_req, res) => {
  res.json({ providers: getAvailableProviders() });
});

// ─────────────────────────────────────────────────────────────
// POST /api/ai/send-access-email — access/welcome email, fired by the client
// after the FULL (paid) report PDF has been downloaded. Language follows the
// language of the taken test ('nl' | 'en').
// ─────────────────────────────────────────────────────────────

router.post('/send-access-email', async (req, res) => {
  try {
    const { recipientEmail, archetypeName, lang } = req.body || {};
    const to = String(recipientEmail || '').trim();
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return res.status(400).json({ error: 'Valid recipientEmail is required' });
    }

    const { subject, html } = buildAccessEmail({
      archetypeName: archetypeName || '',
      lang: lang === 'en' ? 'en' : 'nl',
    });

    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: { user: config.email.user, pass: config.email.pass },
    });
    await transporter.sendMail({
      from: `"Garden For Life" <${config.email.from}>`,
      to,
      subject,
      html,
    });

    console.log('[Email] Access email sent'); // no address in the log
    res.json({ success: true });
  } catch (err) {
    console.error('[Email] Access email failed:', err.message);
    res.status(500).json({ error: 'E-mail kon niet worden verzonden.' });
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
