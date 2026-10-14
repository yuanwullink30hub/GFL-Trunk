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
const reportV5 = require('../engine/reportV5');
const { promptSlotFor, loadPromptRecord, promptMismatch, DEFAULT_LEVEL } = require('../services/promptRouting');
const reportV7 = require('../engine/reportV7');
const { BleedInputError } = require('../engine/bleedV2');
const { enrichmentNl } = require('../engine/index');
const { observe: observeTetrad } = require('../engine/tetradObserver');
const { queueTetradRow } = require('../services/statsStore');
const { OPP } = require('../engine/runtimeEngine');
const { polarNorm, polarization } = require('../engine/polarNorm');
const { getDB } = require('../db');
const config = require('../config');
const nodemailer = require('nodemailer');
const { buildAccessEmail } = require('../services/accessEmail');
const { redactUploadText, neutralFileName } = require('../services/uploadRedaction');
const { parseOceanAspects } = require('../services/oceanUpload');
const { rateLimit } = require('../middleware/rateLimit');
const { parseUpload, checkUploads, UploadError } = require('../services/uploadParser');

// The per-user geometry message (the Leerling builder; the Master Prompt itself comes from Mongo).
const { buildUserMessage } = require('../prompts/advanced');

/**
 * The Main's total and its 180° opposite's — the pair runtimeEngine.polar_norm reads — from the
 * per-archetype totals. null when the request carries no totals.
 */
function mainShadowTotals(archetypeDetails, mainKey) {
  if (!Array.isArray(archetypeDetails) || !mainKey) return null;
  const title = (k) => { const s = String(k || '').toLowerCase(); return s.charAt(0).toUpperCase() + s.slice(1); };
  const totalOf = (name) => {
    const a = archetypeDetails.find((d) => title(d.key) === name);
    return a ? Number(a.total) || 0 : null;
  };
  const main = title(mainKey);
  const m = totalOf(main);
  if (m === null || !OPP[main]) return null;
  const s = totalOf(OPP[main]) ?? 0;
  // The exact comparisons (gate G6) need integer totals — v1 totals are whole points, v2 sends units.
  // Anything else is skipped (no polarisation line) rather than guessed or allowed to break the report.
  if (!Number.isSafeInteger(m) || !Number.isSafeInteger(s)) {
    console.warn('[AI] polarisation skipped: non-integer totals');
    return null;
  }
  return { main: m, shadow: s };
}

const router = Router();

// ─────────────────────────────────────────────────────────────
// POST /api/ai/analyze
// ─────────────────────────────────────────────────────────────

/**
 * Body:
 * {
 *   archetypeKey: "JUDGE",                      // required
 *   supportArchetype: "RULER",                  // optional
 *   supportGroup: "RULING",                     // optional
 *   mainGroup: "RULING",                        // optional
 *   extendedArchetypeName: "The Arbiter",       // optional
 *   (provider, model, systemPrompt, userQuestion, maxTokens and temperature are NOT accepted:
 *    they come from the server config only — see "Who may run an analysis" below.)
 *
 *   // ── Advanced Ontology fields ──
 *   shadowArchetype: "TRICKSTER",               // 180° shadow of Main
 *   blindspotArchetype: "OUTLAW",               // Red Line partner of Main
 *   isIndividuated: false,                       // Main & Support are 180° opposites
 *   authenticityIndex: 55,                       // Nature % of total
 *   authenticityLevel: "BALANCED",               // NATURE_DOMINANT | BALANCED | CULTURE_DOMINANT (engine passthrough)
 *   totalNaturePoints: 165,                      // total Nature sub-score
 *   totalCulturePoints: 135,                     // total CultureForce sub-score
 *   archetypeDetails: [...],                     // per-archetype breakdown with core/bleed sub-scores
 *   responses: [...],                            // individual question answers
 *   subgroups: [...],                            // Dual-Core per group
 *   language: "nl",                              // report language
 *   level: "advanced",                           // beginner | intermediate | advanced (absent → advanced):
 *                                                // picks the Master Prompt (services/promptRouting.js)
 *   uploadedFileContents: [{ name, pdfBase64 | docxBase64 | text }] // OCEAN report upload (no images)
 * }
 *
 * The model's corpus is the Corpus Manifest slice (engine/reportV5.js), nothing else.
 */
// ── Who may run an analysis ──
// This endpoint needs no login (the report is decoupled from any account), and every call is a long,
// paid model call. So: the prompt, question, model and token budget are the server's alone — nothing
// in the request can change them — and calls are limited per visitor and in total per hour.
const REPORT_MAX_TOKENS = 30000; // headroom for the full report (was sent by the client; now fixed here)
const ANALYZE_PER_VISITOR = Number(process.env.AI_ANALYZE_PER_VISITOR_PER_HOUR) || 6;
const ANALYZE_TOTAL = Number(process.env.AI_ANALYZE_TOTAL_PER_HOUR) || 300;
// One visitor gets ANALYZE_PER_VISITOR an hour. The global ceiling is a cost circuit-breaker, not a
// budget one caller can drain: with EDGE_SECRET set, a caller rotating a forged CF-Connecting-IP lands in
// the single untrusted bucket and still gets only ANALYZE_PER_VISITOR in total, so reaching the ceiling
// takes ~50 genuinely distinct visitors. Persisted, so a deploy or a Render restart does not reset it.
const analyzeLimit = rateLimit({
  name: 'ai-analyze', max: ANALYZE_PER_VISITOR, windowMs: 60 * 60 * 1000,
  global: { max: ANALYZE_TOTAL, persistent: true },
});

// Upload caps, checked BEFORE the handler: it opens the SSE stream on its first line, after which a
// proper 413 can no longer be sent. Count and size only — the parsing itself runs in a worker
// (services/uploadParser.js) with a timeout and a memory bound.
function uploadCaps(req, res, next) {
  const raw = req.body && req.body.uploadedFileContents;
  const problem = checkUploads(Array.isArray(raw) ? raw.filter(Boolean) : []);
  if (problem) return res.status(413).json({ error: problem });
  return next();
}

// The session's scoring_version (Bleed v2 Scoring instruction §1), checked BEFORE the SSE stream opens.
// 'v1_nature_culture' (or none) is the old test. 'v2_two_layer' (the Leerling two-layer test) is scored
// HERE from its raw answers — the server's scoring is the only one read, never the client's — so malformed
// answers get a plain 400. Which test may run is decided by the Leerling prompt's version (promptGate:
// v2 needs Master Prompt v7+, the old test v6 or earlier); a Dutch v2 report needs the ratified Dutch
// enrichment cells (payload instruction v7 §9).
const SCORING_VERSIONS = ['v1_nature_culture', 'v2_two_layer'];
function scoringVersionGate(req, res, next) {
  const v = req.body && req.body.scoring_version;
  if (v === undefined || v === 'v1_nature_culture') return next();
  if (!SCORING_VERSIONS.includes(v)) return res.status(400).json({ error: `unknown scoring_version ${JSON.stringify(v)}` });
  let session;
  try {
    session = reportV7.scoreV2(req.body.responses);
  } catch (e) {
    if (e instanceof BleedInputError) return res.status(400).json({ error: e.message });
    throw e;
  }
  if (String(req.body.language || 'nl').toLowerCase() !== 'en' && !enrichmentNl()) {
    return res.status(409).json({ error: 'Dutch v2 reports wait for the ratified Dutch enrichment cells (payload instruction v7 §9)' });
  }
  req.v2 = { session };
  return next();
}

// The Master Prompt for this report (services/promptRouting.js): one record per level. Read BEFORE the stream opens, so a level without a prompt (Beginner and
// Intermediate, until theirs are written) is refused with a plain 409 and never reaches a paid call.
async function promptGate(req, res, next) {
  const { level, scoring_version: scoringVersion } = req.body || {};
  let slot;
  try {
    slot = promptSlotFor(level ?? DEFAULT_LEVEL, scoringVersion);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  let record;
  try {
    record = await loadPromptRecord(getDB(), slot);
  } catch (e) {
    console.error('[AI] Master Prompt read failed:', e.message);
    return res.status(503).json({ error: 'De rapportgenerator is tijdelijk niet beschikbaar. Probeer het later opnieuw.' });
  }
  if (!record) return res.status(409).json({ error: `no Master Prompt for level ${slot} yet` });
  // Leerling: the test must fit the prompt (v2 → v7+, the old test → v6 and earlier); never a payload
  // the prompt was not written for.
  const mismatch = slot === 'advanced' ? promptMismatch(record.systemPromptTemplate, scoringVersion) : null;
  if (mismatch) return res.status(409).json({ error: mismatch });
  req.masterPrompt = { slot, ...record };
  return next();
}

router.post('/analyze', analyzeLimit, uploadCaps, scoringVersionGate, promptGate, async (req, res) => {
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
      archetypeKey,
      supportArchetype,
      supportGroup,
      mainGroup,
      extendedArchetypeName,
      // Advanced Ontology fields
      shadowArchetype,
      blindspotArchetype,
      isIndividuated,
      authenticityIndex,
      totalNaturePoints,
      totalCulturePoints,
      archetypeDetails,
      responses,
      uploadedFileContents: rawUploads,
      // Group dynamics (Dual-Core)
      subgroups,
      // UI language tag — selects which corpus TEXT is sent to the model
      // ('nl' → Dutch corpus, otherwise the English corpus). Engine math is EN.
      language,
    } = req.body;

    // v2: the scoring's Main (scored by scoringVersionGate); v1: the client's.
    if (!req.v2 && !archetypeKey) {
      sendEvent('error', { error: 'archetypeKey is required' });
      return res.end();
    }

    // The Master Prompt record for this level, read by promptGate (never empty here).
    const adminConfig = req.masterPrompt;
    console.log(`[AI] Master Prompt: slot ${adminConfig.slot}`);
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
      for (let i = uploadedFileContents.length - 1; i >= 0; i--) {
        const item = uploadedFileContents[i];
        if ((item.pdfBase64 || item.docxBase64) && !item.text) {
          let extracted = null;
          try {
            // In a worker thread with a hard timeout and a memory bound: a crafted file can only cost
            // its own upload, never the rest of the server (services/uploadParser.js).
            const kind = item.docxBase64 ? 'docx' : 'pdf';
            const text = await parseUpload(kind, Buffer.from(item.docxBase64 || item.pdfBase64, 'base64'));
            extracted = text.trim();
          } catch (err) {
            const why = err instanceof UploadError ? err.code : err.message;
            console.error(`Upload parse refused for ${neutralFileName(item.name, i)}: ${why}`);
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
    let uploadedOceanAspects = null;   // the two aspects per trait, numbers only (services/oceanUpload)
    if (uploadedFileContents && uploadedFileContents.length > 0) {
      // Keywords that map to each OCEAN dimension (order: longest match first to avoid substring collisions)
      const DIM_KEYWORDS = {
        O: ['openheid voor ervaringen', 'openheid voor ervaring', 'openheid', 'openness to experience', 'openness', 'open to experience', 'open voor ervaring'],
        // Not 'ordelijkheid': that is an ASPECT of C (Addendum A §5b) — see the legacy fallback below.
        C: ['conscientiousness', 'consciëntieusheid', 'conscientieusheid', 'gewetensvolheid', 'zorgvuldigheid', 'nauwgezetheid'],
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

      // The ten aspect scores (two per trait), from the first file that carries any.
      for (const file of uploadedFileContents) {
        const found = parseOceanAspects(file.text);
        if (found) { uploadedOceanAspects = found; break; }
      }
      if (uploadedOceanAspects) console.log('[AI] Parsed uploaded OCEAN aspects:', uploadedOceanAspects);

      // Older reports — our own v4 PDFs among them — named C itself "Ordelijkheid". Read it as C only
      // when no trait-named C was found AND the report has no aspect split (no IJver), because in a
      // report with the split, Ordelijkheid is an aspect and C is printed separately.
      if (parsed.C == null && !(uploadedOceanAspects && uploadedOceanAspects.industriousness != null)) {
        for (const file of uploadedFileContents) {
          const m = String(file.text || '').match(/ordelijkheid[^\n\d]{0,40}?(\d{1,3})\b/i);
          if (m && +m[1] <= 100) { parsed.C = +m[1]; break; }
        }
      }

      if (Object.keys(parsed).length >= 3) {
        uploadedOceanScores = parsed;
        console.log('[AI] Parsed uploaded OCEAN scores:', uploadedOceanScores);
      } else {
        console.warn('[AI] Could not parse enough OCEAN scores from uploaded files. Found:', parsed);
      }
    }

    // System prompt = this level's Master Prompt, stored in the MongoDB admin config (editable in the
    // dashboard) — the only copy. Together with the cached corpus slice it is the cached prefix;
    // buildV5Request refuses to run without it.
    const adminMeta = adminConfig.systemPromptTemplate || '';
    const system = adminMeta;

    // The request plan. Both branches yield the model input (user, cachedContext) and what the browser
    // draws (engine curves, polarisation, data block), plus the orb code.
    let user, cachedContext, orbCode, clientEngine, clientPolarization, dataBlock = null;
    // Who the report is about: v2 reads the server's own scoring, v1 the client's fields.
    let reportMain = archetypeKey, reportSupportGroup = supportGroup, reportExtension = extendedArchetypeName;
    if (req.v2) {
      // ── Leerling two-layer test → Master Prompt v7 (engine/reportV7.js: payload P1–P13, the data block). ──
      const v7 = reportV7.buildV2Request({
        system, responses, session: req.v2.session, language,
        ocean: uploadedOceanScores, oceanAspects: uploadedOceanAspects,
      });
      const s = v7.session;
      console.log(`[AI] engine pipeline (v2): ${s.main} × ${s.support}; active set ${[v7.payload.main.name, ...v7.payload.codrivers.map(c => c.name)].join(', ')}; ` +
        `corpus ${v7.manifest.corpus_manifest_version} ${v7.manifest.documents.length} docs ≈${v7.manifest.token_estimate} tokens; ` +
        `style tags ${v7.styleTags.join(', ') || 'none'}; Support-bewerking ${v7.supportEdit}; Support-herkomst ${s.support_herkomst}; ` +
        `prompt_version=${v7.promptVersion} stamps ${JSON.stringify(v7.payload.stamps)}`);
      if (s.tie_breaks.length) console.log('[AI] v2 tie-breaks (logged, never sent):', JSON.stringify(s.tie_breaks));
      user = v7.user;
      cachedContext = v7.cachedContext;
      clientEngine = v7.client.enginePayload;
      clientPolarization = v7.client.polarization;
      dataBlock = v7.dataBlock;
      reportMain = s.main.toUpperCase();
      reportSupportGroup = String(v7.payload.geometry.supportGroup).toUpperCase();
      reportExtension = v7.payload.extension ? (String(language).toLowerCase() === 'en' ? v7.payload.extension.name_en : v7.payload.extension.name_nl) : null;
      orbCode = '';
      try {
        orbCode = orb3FromGeometry({ archetypeDetails: v7.archetypeDetails, polarNorm: s.polar_norm });
      } catch (e) {
        console.warn('[AI] orb code-gen failed (continuing without it):', e.message);
      }
    } else {
      // Polarisation — computed once, here, by the same polar_norm the C-modulation uses
      // (engine/polarNorm.js, addendum rev 2): it feeds AFGELEIDE INDICES and gates the orb.
      const ms = mainShadowTotals(archetypeDetails, archetypeKey);
      const polar = ms ? polarization(ms.main, ms.shadow) : {};

      const promptData = {
        archetypeKey, supportArchetype, supportGroup, mainGroup,
        extendedArchetypeName,
        shadowArchetype, blindspotArchetype, isIndividuated,
        ...polar,
        authenticityIndex,
        totalNaturePoints, totalCulturePoints,
        archetypeDetails, responses, uploadedFileContents, subgroups,
        // The OCEAN values parsed from the user's upload (above), as one structured line so the model
        // reads them instead of digging through the PDF text.
        uploadedOceanScores,
        // …and its aspects, numbers under our names. These two lines are ALL the model gets from an
        // upload — never the report's text (Addendum A §5c).
        uploadedOceanAspects,
        // Report language — picks the Dutch or English 132-roster for the extension name.
        language,
      };


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
      //    composed-B-deferred levers from the §3 group priors — gating radial+purple with the one
      //    polar_norm (above). Printed on the PDF; the component decodes + renders. ──
      orbCode = '';
      try {
        if (archetypeDetails && archetypeKey) {
          orbCode = orb3FromGeometry({
            archetypeDetails,
            polarNorm: ms ? polarNorm(ms.main, ms.shadow) : undefined,
          });
        }
      } catch (e) {
        console.warn('[AI] orb code-gen failed (continuing without it):', e.message);
      }

      // ── Main↔Support line-type: resolved deterministically from the static lookup table
      //    so the model never re-derives the colour (the recurring Green/Blue mistake). The
      //    resolved tag rides in the payload; the full table rides as a separate reference doc. ──
      const lineTypeBlock = (archetypeKey && supportArchetype)
        ? formatLineTypeBlock({
            mainKey: archetypeKey, supportKey: supportArchetype,
            shadowKey: shadowArchetype, blindspotKey: blindspotArchetype,
          })
        : '';

      // ── User payload: per-user geometry (buildUserMessage) + the line-type tag. ──
      const geometryMsg = buildUserMessage(promptData);

      // ── Runtime engine (D-path) → Corpus Manifest slice → role-tagged payload. An engine error
      //    (RoleError, a Support outside the active set, incomplete geometry) is fatal for the
      //    request — surfaced, never patched. ──
      const v5 = reportV5.buildV5Request({
        system, bleed: { ...req.body, ...polar }, geometryMsg, lineTypeBlock, cRuntime, language,
      });
      console.log(`[AI] engine pipeline: active set ${[v5.payload.main.name, ...v5.payload.codrivers.map(c => c.name)].join(', ')}; ` +
        `corpus ${v5.manifest.corpus_manifest_version} ${v5.manifest.documents.length} docs ≈${v5.manifest.token_estimate} tokens; ` +
        `schaduw-pakket (shadow ${v5.manifest.shadow_pack.shadow}, blindspot ${v5.manifest.shadow_pack.blindspot}) → ${v5.manifest.shadow_pack.objects.join(', ') || 'carried by the group blocks'}; ` +
        `stamps ${JSON.stringify(v5.payload.stamps)}`);

      user = v5.user;
      // Cached static-prefix context: the manifest slice.
      cachedContext = v5.cachedContext;
      clientEngine = reportV5.clientPayload(v5.payload);
      clientPolarization = ms ? polar : null;
    }

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

    // Server config only (see "Who may run an analysis"): default provider + model, fixed token budget.
    const finalProvider = undefined;
    const finalModel = undefined;
    const finalMaxTokens = REPORT_MAX_TOKENS;
    const finalTemperature = adminConfig.temperature ?? 0.7;

    console.log('[AI] Calling AI with config:');
    console.log('[AI]   Provider:', finalProvider || '(default)');
    console.log('[AI]   Model:', finalModel || '(default)');
    console.log('[AI]   Max Tokens:', finalMaxTokens);
    console.log('[AI]   Temperature:', finalTemperature);
    console.log('[AI]   Archetype:', reportMain);

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
        // No uploaded images reach the model (they are dropped above — names cannot be scrubbed from
        // a picture), and no reference documents (human ruling 2026-09-16): the model reads the
        // resolved Main–Support line type and the Main's own links (payload.links) — literally.
        cachedContext,
      });
    } finally {
      clearInterval(heartbeat);
    }

    console.log(`[AI] ✅ Analysis complete: provider=${result.provider}, model=${result.model}, tokens=${result.completionTokens}`);
    // v7 (payload instruction §7): the report ends on the closing line; without it, it is incomplete
    // (the browser's reader checks the 19 sections and logs the gap; the report still renders).
    if (req.v2 && !/^[ \t#*>]*\[\s*EINDE\s+RAPPORT\s*\][ \t*]*$/im.test(result.analysis || '')) {
      console.warn('[AI] ⚠ v7 report without its closing line [EINDE RAPPORT] — incomplete');
    }

    // ── Kaart Microcopy: lift the profile-card fields out of the analysis (the report text never
    // shows them), SIGN them for this code and hand them to the client beside the analysis. The
    // report PDF prints them in its data block; a claim reads them back from the uploaded PDF and
    // keeps them only when the signature holds (services/cardSignature.js). Nothing of them is
    // stored here (owner, 2026-09-19). ──
    let kaartCard = null;
    try {
      if (result && typeof result.analysis === 'string') {
        const { extractKaartSection } = require('../services/readingExtract');
        const kaart = extractKaartSection(result.analysis);
        result.analysis = kaart.cleaned;
        if (orbCode && (kaart.giftMicro || kaart.geomSummary)) {
          const { hash } = require('../services/encryption');
          const { signCard } = require('../services/cardSignature');
          const fields = { giftMicro: kaart.giftMicro || '', geomSummary: kaart.geomSummary || '' };
          kaartCard = { ...fields, sig: signCard(hash(orbCode), fields) };
          console.log('[AI] kaart-microcopy extracted → signed, travels in the PDF (gift:', !!kaart.giftMicro, '| geometrie:', !!kaart.geomSummary, ')');
        } else if (!kaart.giftMicro && !kaart.geomSummary) {
          console.warn('[AI] ⚠ kaart-microcopy MISSING from model output (card falls back to levensles/placeholder)');
        }
      }
    } catch (e) { console.warn('[AI] kaart-microcopy extract failed (continuing):', e.message); }

    // ── Stage 2: AI generation complete ──
    sendEvent('progress', { stage: 2, message: 'AI analyse compleet — resultaten verwerken...' });

    // ── Send final result ──
    // Only what the report page draws. The engine's internals (band cutpoint tables, corpus fields,
    // C-runtime values, ledgers, the corpus manifest) and the provider/model/token counts stay here.
    sendEvent('result', {
      archetypeKey: reportMain,
      supportGroup: reportSupportGroup || null,
      extendedArchetypeName: reportExtension || null,
      uploadedOceanScores: uploadedOceanScores || null,
      // Morphology chart (Spec A1): the Main's two register curves only.
      enginePayload: clientEngine,
      // v2: the data block for the last page, built here from the payload (never by the model).
      dataBlock,
      // The polarisation (index, %, band) — computed once, above; the browser shows it, never derives it.
      polarization: clientPolarization,
      // Authoritative orb profile code (LC_ORB3_…), radial+purple-gated with the one polar_norm —
      // SEALED (services/sealedCode.js): the browser cannot read it. The raw code is handed over
      // only when the full report is unlocked (payment or activation code). '' when geometry incomplete.
      sealedOrbCode: orbCode ? sealCode(orbCode) : '',
      // The profile card's copy, signed for this code — printed in the unlocked PDF's data block.
      kaart: kaartCard,
      analysis: result.analysis,
    });

    // Tetrad observer (Bleed v2 Scoring §5.4): one anonymous row per completed v2 session — exactly
    // archetype, double_picks, shown — through the shuffling queue into the separate statistics store.
    // Off (nothing stored) without STATS_MONGODB_URI. Never allowed to touch the delivered report.
    if (req.v2) {
      try { queueTetradRow(observeTetrad(responses)); } catch (e) { console.warn('[stats] tetrad observer skipped:', e.message); }
    }

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

// Unauthenticated, and sends branded mail to any address it is given: per visitor, under a persisted
// global ceiling, so it cannot be turned into a mail relay by spreading requests across addresses.
const sendAccessEmailLimiter = rateLimit({
  name: 'access-email', max: 5, windowMs: 60 * 60 * 1000, global: { max: 200, persistent: true },
});
router.post('/send-access-email', sendAccessEmailLimiter, async (req, res) => {
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
