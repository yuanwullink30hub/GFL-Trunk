/**
 * Report call for the Leerling two-layer test (scoring v2_two_layer) under Master Prompt v7 — Backend
 * Instruction "Report Payload v7" v0.1, P1–P13 and §7.
 *
 *   responses (the two-layer answers) → bleedV2.scoreSession (the scoring, read everywhere, never re-derived)
 *     → style tags (answerStyle) · Support-bewerking band (runtimeEngine) · engine payload + slice (runPipeline, v2)
 *     → user message in the prompt's own terms + the server-built data block for the last page
 *
 * What the model receives, by item:
 *   P1  -- MANDJE DECOMPOSITIE -- with the seven mandjes; no nature_core / culture_core / old basket names
 *   P2  no answer sheet: every tag the Answer Style Sheet marks ready is emitted, so the questions and answers stay out
 *   P3  AFGELEIDE INDICES without the Authenticity Index      P4  no culture-pick flag
 *   P5  -- ANTWOORDSTIJL -- tags: … (after precedence) only when a tag fired
 *   P6  Tetrad: ja      P7 the scoring's tie chain (never named)      P8 active set unchanged (totals)
 *   P9  the TNM objects in every slice      P10 prompt_version in the log line (routes/ai.js)
 *   P11 Support-bewerking      P12 Support-herkomst      P13 the old test's readings cut from the slice
 * The same blocks, read from the same values, are the data block the server prints on the last page (§7).
 */

'use strict';

const B = require('./bleedV2');
const S = require('./answerStyle');
const E = require('./runtimeEngine');
const CT = require('./cogTriangle');
const { runPipeline } = require('./index');
const { triangleCanon } = require('./corpusResolver');
const { buildDataBlock, dataBlockText } = require('./dataBlock');
const { requirePrompt, corpusBlock, formatCPathBlock, formatPayloadBlock, clientPayload } = require('./reportV5');
const { redLinePartner } = require('../services/lineType');
const { computeCRuntime } = require('../services/cRuntime');
const { formatAspectLine } = require('../services/oceanUpload');
const { EN_SECTION_TITLES, oceanWithoutUploadRequest } = require('../prompts/advanced');

const V2 = 'v2_two_layer';
const CLOSING_LINE = '[EINDE RAPPORT]';

/** The prompt's version as its masthead states it ("… v7.0 — …" → "v7.0"), for the P10 log line. */
function promptVersion(system) {
  const m = /\bv(\d+(?:\.\d+){1,2})\b/i.exec(String(system || '').split('\n')[0]);
  return m ? `v${m[1]}` : 'unknown';
}

/** Does the prompt's masthead name this version or a later one? ("v7.2" ≥ 7.2; "unknown" never.) */
function promptAtLeast(system, major, minor) {
  const m = /^v(\d+)\.(\d+)/.exec(promptVersion(system));
  return Boolean(m) && (Number(m[1]) > major || (Number(m[1]) === major && Number(m[2]) >= minor));
}

/**
 * The English title set for a v7 report (W8): the 19 titles (21 from v7.2: the triangle page), the trait
 * subheadings, the closing line — no machine block.
 */
function englishTitles(system) {
  const triangles = promptAtLeast(system, 7, 2);
  return [
    '\n═══ SECTION TITLES — ENGLISH REPORT (the delivered title set, W8) ═══',
    'Emit each title LITERALLY as its own line, in this order, uppercase as written — these are the parser tags.',
    'The word budgets and every HARD LIMIT of DEEL 5 apply unchanged.',
    ...EN_SECTION_TITLES.narrative.filter((x) => triangles || !EN_SECTION_TITLES.triangleTitles.includes(x)).map((x) => (x.startsWith('  ')
      ? '  then one block per trait, each under its own subheading "[trait] — [score]": Openness · Conscientiousness · Extraversion · Agreeableness · Neuroticism'
      : `- ${x}`)),
    `Neural switchboard experiment labels (line starts): ${EN_SECTION_TITLES.experimentLabels.join(' · ')}`,
    `Closing line, exactly as written in both languages: ${CLOSING_LINE}`,
  ].join('\n');
}

/**
 * The public profile card's two texts, requested after the closing line (outside the report; the backend
 * lifts the block out before anyone reads the report). v2 wording: read from the mandjes and the payload,
 * never from Nature/Culture.
 */
function kaartRequestV2({ en, main, support }) {
  if (en) {
    return [
      '',
      '═══ CARD MICROCOPY — the two texts of the public profile card ═══',
      `After the closing line ${CLOSING_LINE}, write this one block. It is not a report section: the backend lifts it out of your output before anyone reads the report and places it on the public profile card, and it checks the closing line as the end of the report itself. W1, W3, W7 and W9 apply.`,
      'Exactly this format — the heading on its own line, then the two labelled fields, nothing else:',
      '## CARD MICROCOPY',
      'CARD_GIFT: [2–3 sentences in plain, clear language: a deeper description of THIS person\'s gift, starting from the gift in the extension cell of your slice and deepened in your own words for this profile — NO copy or paraphrase of that gift text or of the life lesson, and NEVER the curse. No jargon and no network names. Address the reader directly ("your gift…").]',
      `CARD_GEOMETRY: [4–6 sentences. STEP 1 (internal, not in the output): read this profile's shape from the payload — the active set with its roles (Main ${main}, Support ${support}, the co-drivers), the Main's resolved links, the spread of the twelve wheel scores and their mandjes (chosen or echo), the polarisation band, and the register curve in band language, never in numbers (W1). STEP 2 (the output): translate that into everyday words for someone with no knowledge of the model — no network names, no line types, no model jargon. Describe the SHAPE: where the strength lies and how the two main energies relate. A PUBLIC SHOWCASE CARD: no growth points, advice or reflection tasks. Every configuration is a full way of navigating; never a deficit word. Probabilistic language; no closing disclaimer.]`,
    ].join('\n');
  }
  return [
    '',
    '═══ KAART MICROCOPY — de twee teksten van de openbare profielkaart ═══',
    `Ná de slotregel ${CLOSING_LINE} schrijf je dit ene blok. Het is geen rapportsectie: de backend haalt het uit je output voordat iemand het rapport leest en zet het op de openbare profielkaart, en controleert de slotregel zelf als het einde van het rapport. W1, W3, W7 en W9 gelden.`,
    'Exact dit formaat — de kop op een eigen regel, dan de twee gelabelde velden, niets anders:',
    '## KAART MICROCOPY',
    'KAART_GIFT: [2–3 zinnen in eenvoudige, heldere taal: een verdiepende beschrijving van de gave van déze gebruiker, vanuit de gave in de extensie-cel van je slice en in eigen woorden verdiept voor dit profiel — GEEN kopie of parafrase van die gave-tekst of van de levensles, en NOOIT de vloek. Geen jargon en geen netwerknamen. Schrijf direct aan de gebruiker ("jouw gave…").]',
    `KAART_GEOMETRIE: [4–6 zinnen. STAP 1 (intern, niet in de output): lees de vorm van dit profiel uit de payload — de actieve set met hun rollen (Main ${main}, Support ${support}, de co-drivers), de opgeloste links van de Main, de spreiding van de twaalf wielscores en hun mandjes (gekozen of echo), de polarisatieband, en de registercurve in bandtaal, nooit in getallen (W1). STAP 2 (de output): vertaal dat naar alledaagse woorden voor iemand zonder modelkennis — geen netwerknamen, geen lijntypes, geen modeljargon. Beschrijf de VORM: waar de kracht zit en hoe de twee hoofdenergieën zich tot elkaar verhouden. Een PUBLIEKE SHOWKAART: geen groeipunten, adviezen of reflectie-opdrachten. Elke configuratie is een volwaardige manier van navigeren; geen enkel deficit-woord. Probabilistische taal; geen afsluitende disclaimer.]`,
  ].join('\n');
}

/**
 * The session's one result as the browser reads it (owner, 14 Oct): Main, Support, the twelve totals and the
 * seven mandjes per archetype, in points. The browser never scores the test itself — the results screen,
 * the radar and every hook that needs Main × Support read this. The same values the data block prints.
 * @param {object} s  scoreV2(responses)
 */
function profileOf(s) {
  return {
    scoring_version: V2,
    main: s.main,
    support: s.support,
    totals: { ...s.totals },
    mandjes: Object.fromEntries(B.NAMES.map((n) => [n, Object.fromEntries(B.BASKETS.map((b) => [b, B.toPoints(s.mandjes_u[n][b])]))])),
  };
}

/**
 * Score a two-layer session. Throws bleedV2.BleedInputError on malformed responses (the route answers 400).
 * @param {object[]} responses
 */
function scoreV2(responses) {
  return B.scoreSession(responses);
}

/**
 * @param {object} p
 * @param {string} p.system                 the Master Prompt v7 (Mongo promptConfigs/default, the Leerling record), unaltered
 * @param {object[]} p.responses            the two-layer answers (bleedV2.parseResponse format)
 * @param {object} [p.session]              scoreV2(responses), when the caller already scored them
 * @param {'nl'|'en'} [p.language]
 * @param {object|null} [p.ocean]           uploaded OCEAN trait values { O, C, E, A, N } or null
 * @param {object|null} [p.oceanAspects]    uploaded aspect values (services/oceanUpload) or null
 * @param {string[]} [p.withhold]           dry-run only
 */
function buildV2Request({ system, responses, session = null, language = 'nl', ocean = null, oceanAspects = null, withhold = [] }) {
  requirePrompt(system, 'advanced');
  const s = session || scoreV2(responses);
  const lang = String(language || '').toLowerCase() === 'en' ? 'en' : 'nl';
  const en = lang === 'en';
  const blindspot = redLinePartner(s.main);
  const pos = (n) => B.posOf[n];
  const pts = (u) => B.toPoints(u);

  // P5 / P2: the style tags after precedence — the model's only window on how the test was answered.
  const styleTags = S.styleTags(responses, { main: s.main, support: s.support, totals: s.totals_u, polarizationLevel: s.polarizationLevel }).tags;
  // P11: the one k, from the engine.
  const supportEdit = E.support_edit_band({ scores: s.totals_u, main: s.main }, s.support);

  // The scoring's facts the payload passes through (§3 `geometry`) — no Nature/Culture, no Authenticity
  // Index, no culture-pick flag (P3, P4); the mandjes travel in their own block (P1).
  const geometry = {
    scoring_version: V2,
    main: s.main, support: s.support, shadow: s.shadow, blindspot,
    mainGroup: B.groupOf[pos(s.main)], supportGroup: B.groupOf[pos(s.support)],
    isIndividuated: s.support === s.shadow,
    polarizationIndex: pts(s.polarizationIndex), polarizationPct: s.polarizationPct, polarizationLevel: s.polarizationLevel,
  };
  // Master Prompt v7.2 page 5.7b: the session's cognitive triangles, once, from the chosen weight in the mandjes
  // (engine/cogTriangle) — they route the slice, fill the data block and draw the PDF figure.
  const triangle = CT.triangleFacts(s, triangleCanon(lang));
  const out = runPipeline({
    scores: s.totals_u, main: s.main, support: s.support, geometry, language: lang, scoringVersion: V2,
    triangles: { main: triangle.main.id, others: triangle.others.map((o) => o.id) },
  });

  // C-path A on the v2 mandjes (Path A wiring task): only its refusal list reaches the model.
  const cRuntime = computeCRuntime({
    archetypeDetails: B.NAMES.map((n) => ({ key: n.toUpperCase(), total: s.totals_u[n], ...s.mandjes_u[n] })),
    mainKey: s.main, supportKey: s.support, shadowKey: s.shadow, scoringVersion: V2,
  });

  // §7: the data block — the server's, never the model's. The page prints it in the report language
  // (English labels on English reports, owner 13 Oct); the model reads it in the prompt's own Dutch terms.
  const blockInput = { session: s, payload: out.payload, supportEdit, styleTags, ocean, triangle };
  const modelData = buildDataBlock({ ...blockInput, language: 'nl' });
  const dataBlock = en ? buildDataBlock({ ...blockInput, language: 'en' }) : modelData;

  // The model's input: the same blocks, with ANTWOORDSTIJL in its parameter form (P5) and the uploaded
  // OCEAN aspects as numbers under our names (never the report's text).
  const antwoordstijl = S.antwoordstijlBlock(styleTags);
  const aspectLine = ocean ? formatAspectLine(oceanAspects, lang) : null;
  const modelBlocks = modelData.map((b) => {
    if (b.key === 'ANTWOORDSTIJL') return null;
    if (b.key === 'OCEAN PROFIEL (EXTERN GEUPLOAD)' && aspectLine) return { ...b, lines: [...b.lines, `${en ? 'Aspects' : 'Aspecten'}: ${aspectLine}`] };
    return b;
  }).filter(Boolean);
  const split = modelBlocks.findIndex((b) => b.key === 'AFGELEIDE INDICES') + 1;
  const profile = [
    `═══ PROFIEL — DE OPGELOSTE WAARDEN (${en ? 'read, never recompute' : 'lezen, nooit narekenen'}) ═══`,
    dataBlockText(modelBlocks.slice(0, split)),
    antwoordstijl,
    dataBlockText(modelBlocks.slice(split)),
  ].filter(Boolean).join('\n\n');

  const user = [
    'Genereer het volledige rapport voor deze gebruiker volgens de systeeminstructies.',
    en ? englishTitles(system) : '',
    profile,
    formatCPathBlock(cRuntime),
    formatPayloadBlock(out.payload),
    ocean ? '' : oceanWithoutUploadRequest({ en }),
    kaartRequestV2({ en, main: s.main.toUpperCase(), support: s.support.toUpperCase() }),
  ].filter(Boolean).join('\n\n');

  const corpus = corpusBlock(out.manifest, withhold);
  return {
    system,
    user,
    cachedContext: corpus.text,
    payload: out.payload,
    manifest: {
      corpus_manifest_version: out.manifest.corpus_manifest_version,
      language: out.manifest.language,
      shadow_pack: out.manifest.shadow_pack,
      documents: out.manifest.documents.filter((d) => !withhold.includes(d.id)).map(({ id, tokens }) => ({ id, tokens })),
      token_estimate: Math.ceil(corpus.text.length / 4),
    },
    session: s,
    styleTags,
    supportEdit,
    triangle,
    dataBlock,
    promptVersion: promptVersion(system),
    // What the browser receives: the two register curves, the Keuze/Echo graph (§1), the polarisation
    // (computed once, shown, never derived), and the profile — no geometry echo, no tags.
    client: {
      enginePayload: { ...(clientPayload(out.payload) || {}), keuze_echo: s.group_view },
      polarization: { polarizationIndex: pts(s.polarizationIndex), polarizationPct: s.polarizationPct, polarizationLevel: s.polarizationLevel },
      profile: profileOf(s),
      // The triangle figure on the PDF's page 5.7b: which triangle to highlight, how strongly (the band sets the
      // fill, never printed as a word), the other carrying triangles dashed, the names for the caption — and the
      // profile's three highest totals as purple points (owner, 17 Oct), so the reader sees where they meet the
      // triangle. Read from the scoring's one ranking (total, then its tie chain), never re-sorted.
      triangle: {
        main: { id: triangle.main.id, name: triangle.main.name, members: triangle.main.members, band: triangle.main.band },
        others: triangle.others.map(({ id, name, members }) => ({ id, name, members })),
        top: s.ranking.slice(0, 3),
      },
    },
    // For the orb code-gen (points, like v1) and the logs.
    archetypeDetails: B.NAMES.map((n) => ({ key: n.toUpperCase(), total: s.totals[n] })),
  };
}

module.exports = { buildV2Request, scoreV2, promptVersion, promptAtLeast, CLOSING_LINE };
