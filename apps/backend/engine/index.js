/**
 * Deltawerken runtime pipeline, stages 3–5 (Backend Instruction v1 §2):
 *   D-path (runtimeEngine) → manifest (corpusResolver) → payload assembly (payload).
 * The C-path (services/cMagnitude.js via services/cRuntime.js) runs alongside in the report
 * route. Stages 1–2 (the bleed engine, packages/assessment-core scoring) are consumed, never
 * recomputed: `scores` are its twelve counted totals, `geometry` its object, passed through.
 */

'use strict';

const E = require('./runtimeEngine');
const { manifest } = require('./corpusResolver');
const { assemblePayload } = require('./payload');
const fs = require('fs');
const path = require('path');
const { loadCorpus } = require('../services/corpusData');

/**
 * Dutch enrichment cells (payload instruction v7 §9, owner 13 Oct): the Main's strain_response /
 * failure_mode / valence_trajectory values are English codes in both corpora. A Dutch v2 report reads
 * them from a ratified translation table — { field: { English value: Dutch text } } — never from the
 * model translating while it writes. No table, no Dutch v2 report (the route refuses it first).
 */
const ENRICHMENT_NL_PATH = path.join(__dirname, 'data', 'enrichment_nl.json');
const ENRICHMENT_FIELDS = ['strain_response', 'failure_mode', 'valence_trajectory'];
let _enrichmentNl;
function enrichmentNl() {
  if (_enrichmentNl === undefined) _enrichmentNl = fs.existsSync(ENRICHMENT_NL_PATH) ? JSON.parse(fs.readFileSync(ENRICHMENT_NL_PATH, 'utf8')) : null;
  return _enrichmentNl;
}

/** The Main's D cells with the enrichment values in Dutch. A value the table lacks fails loudly. */
function dutchCells(cells, mainName) {
  const table = enrichmentNl();
  if (!table) throw new Error('Dutch enrichment cells are not ratified yet (payload instruction v7 §9): engine/data/enrichment_nl.json is missing');
  return Object.fromEntries(Object.entries(cells).map(([state, cell]) => [state, {
    ...cell,
    ...Object.fromEntries(ENRICHMENT_FIELDS.filter((f) => cell[f] != null).map((f) => {
      const nl = table[f] && table[f][cell[f]];
      if (typeof nl !== 'string' || !nl.trim()) throw new Error(`enrichment_nl.json has no Dutch text for ${f} "${cell[f]}" (${mainName} ${state})`);
      return [f, nl];
    })),
  }]));
}

/** Corpus TitleCase name for any case-form key ("HERO" → "Hero"). */
function corpusName(key) {
  const k = String(key || '').toUpperCase();
  return Object.keys(loadCorpus('en').archetypes).find((n) => n.toUpperCase() === k) || null;
}

/**
 * @param {object} p
 * @param {Record<string, number>} p.scores   twelve counted totals, keyed by corpus archetype name
 * @param {string} p.main                     the bleed engine's Main
 * @param {string} p.support                  the bleed engine's geometric Support
 * @param {string[]} [p.culturePicks]         archetypes that received a Culture pick
 * @param {any} p.geometry                    the bleed-engine object, passed through untouched; its resolved
 *                                            `shadow` and `blindspot` key the Schaduw-pakket (Lookup Table v1.1 §8)
 * @param {'nl'|'en'} [p.language]
 * @param {'v1_nature_culture'|'v2_two_layer'} [p.scoringVersion]  v2: the TNM objects in every slice (P9),
 *                                            the old test's readings cut from it (P13), Dutch enrichment cells (§9)
 * @param {{ main: string, others: string[] }} [p.triangles]  v2: the session's cognitive triangles (engine/cogTriangle),
 *                                            which route the slice's triangle material (Master Prompt v7.2)
 */
function runPipeline({ scores, main, support, culturePicks = [], geometry, language = 'nl', scoringVersion = 'v1_nature_culture', triangles = null }) {
  const v2 = scoringVersion === 'v2_two_layer';
  // Main and Support are the scoring's (Bleed v2 scoring §3.4, with its tie chain) — read, never re-derived.
  if (!main || !support) throw new Error('runPipeline needs the scoring\'s Main and Support');
  const { tau_version, layer2, arcs, c_cells, register_bands } = E.loadEngine();
  const geo = new E.RuntimeGeometry({ scores, main, support });
  const result = E.compose_transform_v4(geo, layer2, arcs);
  const register = E.register_layer(result);
  const store = new E.RoleIndexedStore(geo, arcs, c_cells, layer2);
  // Corpus Lookup Table v1 §0: group blocks key off the active set (the pull set). A Support outside
  // the pull set (R8) still ships through the payload and the Main × Support extension cell.
  const activeSet = [geo.main, ...result.codrivers.map((c) => c.name)];
  const slice = manifest(activeSet, geo.main, geo.support, culturePicks, {
    language, shadow: geometry && geometry.shadow, blindspot: geometry && geometry.blindspot, v2, triangles,
  });
  const corpusEn = loadCorpus('en');
  const cells = corpusEn.archetypes[geo.main].D_states;
  const payload = assemblePayload({
    geo, result, register, store, c_cells, tau_version, register_bands,
    corpus_manifest_version: slice.corpus_manifest_version, geometry,
    main_cells: v2 && slice.language === 'nl' ? dutchCells(cells, geo.main) : cells,
    extension_record: corpusEn.archetypes[geo.main].extensions.find((x) => x.support === geo.support) || null,
  });
  return { geo, result, register, payload, manifest: slice };
}

module.exports = { runPipeline, corpusName, enrichmentNl, ENRICHMENT_NL_PATH };
