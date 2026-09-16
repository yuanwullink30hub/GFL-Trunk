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
const { loadCorpus } = require('../services/corpusData');

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
 */
function runPipeline({ scores, main, support, culturePicks = [], geometry, language = 'nl' }) {
  const { tau_version, layer2, arcs, c_cells, register_bands } = E.loadEngine();
  const geo = new E.RuntimeGeometry({ scores, main, support });
  const result = E.compose_transform_v4(geo, layer2, arcs);
  const register = E.register_layer(result);
  const store = new E.RoleIndexedStore(geo, arcs, c_cells, layer2);
  // Corpus Lookup Table v1 §0: group blocks key off the active set (the pull set). A Support outside
  // the pull set (R8) still ships through the payload and the Main × Support extension cell.
  const activeSet = [geo.main, ...result.codrivers.map((c) => c.name)];
  const slice = manifest(activeSet, geo.main, geo.support || result.codrivers[0].name, culturePicks, {
    language, shadow: geometry && geometry.shadow, blindspot: geometry && geometry.blindspot,
  });
  const corpusEn = loadCorpus('en');
  const payload = assemblePayload({
    geo, result, register, store, c_cells, tau_version, register_bands,
    corpus_manifest_version: slice.corpus_manifest_version, geometry,
    main_cells: corpusEn.archetypes[geo.main].D_states,
    extension_record: corpusEn.archetypes[geo.main].extensions.find((x) => x.support === (geo.support || result.codrivers[0].name)) || null,
  });
  return { geo, result, register, payload, manifest: slice };
}

module.exports = { runPipeline, corpusName };
