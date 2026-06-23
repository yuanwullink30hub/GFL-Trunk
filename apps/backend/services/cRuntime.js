/**
 * Deltawerken — C-runtime orchestrator (restructure part 2.2)
 * ===========================================================
 * Ties the three pieces together into the single backend call that produces the
 * C-runtime layer for the model payload:
 *
 *   geometry (bleed engine, given) + Connection Matrix edges + corpus stored_D/[Effect]
 *     -> precompute()  ->  composed D-state + C-magnitude values
 *
 * Input `geometry` is the bleed-engine output the backend already has:
 *   { archetypeDetails: [{ key, total, nature_core, green_hw, culture_core,
 *       blue_fb, yellow_cog, purple_shadow, ... }, ...12],
 *     mainKey, supportKey, shadowKey }
 * Keys are UPPERCASE (RULER, OUTLAW). The orchestrator stores nothing.
 */

'use strict';

const { precompute } = require('./cMagnitude');
const { edgeToMain } = require('./connectionMatrix');
const { loadCorpus, getStoredD, getCEffectDirection } = require('./corpusData');

/**
 * @param {Object} geometry
 * @param {Array}  geometry.archetypeDetails  per-archetype 5-mandje + total (bleed engine)
 * @param {string} geometry.mainKey
 * @param {string} geometry.supportKey
 * @param {string} [geometry.shadowKey]       180° opposite of Main (for polar gap)
 * @param {Object} [corpus]
 * @returns the precompute() C-runtime block (composed_D_state, c_runtime_values, …)
 */
function computeCRuntime({ archetypeDetails, mainKey, supportKey, shadowKey }, corpus = loadCorpus()) {
  const byKey = {};
  for (const a of archetypeDetails || []) byKey[String(a.key).toUpperCase()] = a;

  const main = String(mainKey).toUpperCase();
  const support = String(supportKey).toUpperCase();
  const shadow = shadowKey ? String(shadowKey).toUpperCase() : null;
  const weightOf = (k) => (byKey[k] ? byKey[k].total || 0 : 0);

  // Build geo.archetypes: counted baskets (magnitude) + canon edge (type/sign).
  const archetypes = {};
  for (const [k, a] of Object.entries(byKey)) {
    const { edge, red_sign } = edgeToMain(main, k);
    archetypes[k] = {
      name: k,
      weight: a.total || 0,
      edge_to_main: edge,
      red_sign_to_main: red_sign, // null unless RED; LOST_COUPLING → σ refuses (by design)
      nature_core: a.nature_core || 0,
      green_hw: a.green_hw || 0,
      culture_core: a.culture_core || 0,
      blue_fb: a.blue_fb || 0,
      yellow_cog: a.yellow_cog || 0,
      purple_shadow: a.purple_shadow || 0,
      // Yellow fires only on Culture picks; yellow_cog>0 means culture picks landed.
      is_culture_pick: (a.yellow_cog || 0) > 0,
      d_field_traces: {}, // M1: carried per-archetype if present; passthrough only
    };
  }

  const geo = {
    main,
    support,
    archetypes,
    main_weight: weightOf(main),
    support_weight: weightOf(support),
    shadow_weight: shadow ? weightOf(shadow) : 0,
  };

  const storedD = getStoredD(corpus);
  const supportEffect = getCEffectDirection(corpus, support);

  return precompute(geo, storedD, supportEffect);
}

module.exports = { computeCRuntime };
