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
 * The counted channel magnitudes σ() reads, per scoring version.
 *   v1 (Nature/Culture): the 5-mandje fields as the client sends them, unchanged.
 *   v2 (two-layer; Path A v2 wiring task v0.1, edit a): the seven mandjes in integer units under the
 *     channel names — groen = green_hw, blauw = blue_fb, paars = purple_shadow, geel = yellow_cog,
 *     blauw_intern = blauw_intern (the tetrad's second channel). No nature_core / culture_core: they don't
 *     exist in v2. A missing mandje raises.
 */
function channels(a, k, scoringVersion) {
  if (scoringVersion === 'v2_two_layer') {
    const need = (f) => {
      if (!Number.isFinite(a[f])) throw new Error(`C-runtime v2: ${k}.${f} missing`);
      return a[f];
    };
    return {
      green_hw: need('groen'),
      blue_fb: need('blauw'),
      purple_shadow: need('paars'),
      yellow_cog: need('geel'),
      blauw_intern: need('blauw_intern'),
    };
  }
  return {
    nature_core: a.nature_core || 0,
    green_hw: a.green_hw || 0,
    culture_core: a.culture_core || 0,
    blue_fb: a.blue_fb || 0,
    yellow_cog: a.yellow_cog || 0,
    purple_shadow: a.purple_shadow || 0,
    // Yellow fires only on Culture picks; yellow_cog>0 means culture picks landed.
    is_culture_pick: (a.yellow_cog || 0) > 0,
  };
}

/**
 * @param {Object} geometry
 * @param {Array}  geometry.archetypeDetails  per archetype: key + total + its mandjes (v1: the 5-mandje
 *                                            fields; v2: keuze · passief · groen · blauw · blauw_intern · paars · geel,
 *                                            total and mandjes in integer units)
 * @param {string} geometry.mainKey
 * @param {string} geometry.supportKey
 * @param {string} [geometry.shadowKey]       180° opposite of Main (for polar gap)
 * @param {'v1_nature_culture'|'v2_two_layer'} [geometry.scoringVersion]  the session's scoring_version
 * @returns the precompute() geometry (geo)
 */
function buildGeometry({ archetypeDetails, mainKey, supportKey, shadowKey, scoringVersion = 'v1_nature_culture' }) {
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
      ...channels(a, k, scoringVersion),
      d_field_traces: {}, // M1: carried per-archetype if present; passthrough only
    };
  }

  return {
    scoring_version: scoringVersion,
    main,
    support,
    archetypes,
    main_weight: weightOf(main),
    support_weight: weightOf(support),
    shadow_weight: shadow ? weightOf(shadow) : 0,
  };
}

/**
 * @param {Object} geometry  as buildGeometry()
 * @param {Object} [corpus]
 * @returns the precompute() C-runtime block (composed_D_state, c_runtime_values, …)
 */
function computeCRuntime(geometry, corpus = loadCorpus()) {
  const geo = buildGeometry(geometry);
  const storedD = getStoredD(corpus);
  const supportEffect = getCEffectDirection(corpus, geo.support);
  return precompute(geo, storedD, supportEffect);
}

module.exports = { computeCRuntime, buildGeometry };
