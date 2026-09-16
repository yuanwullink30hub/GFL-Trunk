/**
 * Report call, engine pipeline — Backend Instruction v1 §2 step 6:
 *   system prompt = the AI Master Prompt, MongoDB promptConfigs/default.systemPromptTemplate
 *                   (admin dashboard; the only copy — no prompt file on disk)
 *   user content  = the per-user geometry blocks + the engine payload
 *   corpus        = the Corpus Manifest slice (the model's WHOLE corpus for the request, rule 10)
 *
 * Selected by REPORT_PIPELINE=v5.2 (config.reportPipeline); the default stays v4.3. Shared by
 * routes/ai.js and scripts/engine-dry-run.js so the dry-run exercises the exact request the route
 * would send.
 */

'use strict';

const { runPipeline, corpusName } = require('./index');

/** The Master Prompt from its one home. Missing or empty is fatal — never an empty system message. */
async function loadMasterPrompt(db) {
  const cfg = await db.collection('promptConfigs').findOne({ _id: 'default' }, { projection: { systemPromptTemplate: 1 } });
  return requirePrompt(cfg && cfg.systemPromptTemplate);
}

function requirePrompt(system) {
  if (typeof system !== 'string' || !system.trim()) {
    throw new Error('Master Prompt missing: promptConfigs/default.systemPromptTemplate is empty');
  }
  return system;
}

const BASKETS = ['nature_core', 'green_hw', 'culture_core', 'blue_fb', 'yellow_cog', 'purple_shadow'];

/**
 * Engine inputs from the bleed-engine object the platform posts: the twelve counted totals keyed
 * by corpus name, the Main and geometric Support, and the archetypes that received a direct
 * Culture pick (culture_core > 0 — the TNM manifest trigger).
 */
function engineInputs({ archetypeDetails, archetypeKey, supportArchetype }) {
  const scores = {};
  const culturePicks = [];
  for (const a of archetypeDetails || []) {
    const name = corpusName(a.key);
    if (!name) continue;
    scores[name] = Number(a.total) || 0;
    if ((Number(a.culture_core) || 0) > 0) culturePicks.push(name);
  }
  const main = corpusName(archetypeKey);
  const support = corpusName(supportArchetype);
  if (Object.keys(scores).length !== 12 || !main || !support) {
    throw new Error(`v5.2 pipeline needs 12 archetype totals plus Main and Support (got ${Object.keys(scores).length}, main=${archetypeKey}, support=${supportArchetype})`);
  }
  return { scores, main, support, culturePicks };
}

/** The bleed-engine object, passed through (§3 `geometry`) — its own fields, nothing added. */
function geometryPassthrough(b) {
  return {
    main: b.archetypeKey, support: b.supportArchetype, shadow: b.shadowArchetype ?? null,
    blindspot: b.blindspotArchetype ?? null, mainGroup: b.mainGroup ?? null, supportGroup: b.supportGroup ?? null,
    isIndividuated: b.isIndividuated ?? null,
    polarizationIndex: b.polarizationIndex ?? null, polarizationLevel: b.polarizationLevel ?? null,
    authenticityIndex: b.authenticityIndex ?? null, authenticityLevel: b.authenticityLevel ?? null,
    totalNaturePoints: b.totalNaturePoints ?? null, totalCulturePoints: b.totalCulturePoints ?? null,
    archetypes: (b.archetypeDetails || []).map((a) => ({
      key: a.key, position: a.position ?? null, group: a.group ?? null, total: a.total,
      ...Object.fromEntries(BASKETS.filter((k) => k in a).map((k) => [k, a[k]])),
    })),
  };
}

/** Hard rule 7: unresolved Red signs surface as refusals. The C-modulation itself ships in the payload. */
function formatCPathBlock(cRuntime) {
  if (!cRuntime) return '';
  const refusals = (cRuntime.unresolved_edges || []).map(([n, e]) => `${n}(${e})`).join(', ') || 'none';
  return [
    '═══ C-PATH (pre-computed by the engine — do NOT recompute) ═══',
    'C-modulation: ENGINE PAYLOAD → support.c_modulation (role "support"; null = no channel, never 0).',
    `unresolved edges (refused, not guessed): ${refusals}`,
  ].join('\n');
}

function formatPayloadBlock(payload) {
  return `═══ ENGINE PAYLOAD (Deltawerken runtime engine — role-tagged, resolved; do NOT recompute) ═══\n${JSON.stringify(payload, null, 1)}`;
}

/**
 * Corpus block for the cached context. `withhold` removes manifest documents by id — used only by
 * the gate-6 dry-run to prove a withheld section stays out of scope; the route never passes it.
 */
function corpusBlock(manifest, withhold = []) {
  const kept = manifest.documents.filter((d) => d.kind !== 'image' && !withhold.includes(d.id)).map((d) => d.id);
  const sections = manifest.text.split(/\n\n(?=════ CORPUS )/).filter((s) => kept.includes(/^════ CORPUS (\S+) ════/.exec(s)[1]));
  return {
    ids: kept,
    text: `═══ DELTAWERKEN CORPUS — GESNEDEN (Corpus Manifest ${manifest.corpus_manifest_version}; documenten: ${kept.join(', ')}) ═══\n${sections.join('\n\n')}`,
  };
}

/**
 * @param {object} p
 * @param {string} p.system         the Master Prompt (Mongo promptConfigs/default), passed through unaltered
 * @param {object} p.bleed          the bleed-engine fields from the request body (archetypeDetails, archetypeKey, …)
 * @param {string} p.geometryMsg    the per-user geometry blocks (prompt builder, slice-scoped)
 * @param {string} [p.lineTypeBlock]
 * @param {object} [p.cRuntime]     services/cRuntime output (refusals only are shipped)
 * @param {'nl'|'en'} [p.language]
 * @param {string[]} [p.withhold]   dry-run only
 *
 * No separate levensles block: under Corpus Lookup Table v1 the Main × Support extension cell in the
 * slice is the single source of gift, curse and levensles.
 */
function buildV5Request({ system, bleed, geometryMsg, lineTypeBlock = '', cRuntime = null, language = 'nl', withhold = [] }) {
  requirePrompt(system);
  const inputs = engineInputs(bleed);
  const out = runPipeline({ ...inputs, geometry: geometryPassthrough(bleed), language });
  const corpus = corpusBlock(out.manifest, withhold);
  const user = [
    geometryMsg,
    lineTypeBlock,
    formatCPathBlock(cRuntime),
    formatPayloadBlock(out.payload),
  ].filter(Boolean).join('\n\n');
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
    inputs,
  };
}

/** What the client needs to draw the Spec A1 chart and label it — no geometry echo. */
function clientPayload(payload) {
  const { geometry, ...rest } = payload;
  return rest;
}

module.exports = { buildV5Request, clientPayload, engineInputs, geometryPassthrough, loadMasterPrompt };
