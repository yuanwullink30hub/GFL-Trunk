/**
 * Payload assembly — Backend Instruction v1 §3. Assembly is concatenation: every value here was
 * computed by the engine (runtimeEngine.js) or the locked bleed engine; nothing is derived.
 *
 * Every value block carries its role tag (hard rule 6): the Main's arcs come through the
 * RoleIndexedStore's MAIN gate, each co-driver's through its SUPPORT gate, so a cross-role
 * binding raises RoleError instead of shipping. Channel entries are (Main, co-driver)
 * articulation reads — support-role by storage — and carry role "support".
 * `no channel` stays null (hard rule 3); holes stay null (hard rule 4).
 *
 * Blocks added to the §3 listing by ratified contract (Master Prompt v5.1/v5.2 §0.7):
 *   main.enrichment   R6 — the Main's own D-cell fields strain_response / failure_mode /
 *                     valence_trajectory per state, copied verbatim; an empty field stays null.
 *   register_bands    R4 — the provisional cut-points from the workbook's
 *                     Band_Cutpoints_v0_PROVISIONAL sheet, read on the register-% scale.
 *   main.register.band_labels  R4/R5 — those bands applied by the engine per D-state to both register
 *                     curves (on |value|; holes null), so the model copies labels instead of banding.
 *   support           R8 — always present, with its support_weight_norm as `w`; outside the pull
 *                     set it contributes no τ′ terms (it is then absent from `codrivers`).
 *   extension         §5.7 / §5.10 — the 132-grain identity of Main × Support (nummer, naam EN,
 *                     naam NL, Main, Support). Stored under archetypes.<Main>.extensions, so it
 *                     carries role "main" by storage. Gift, curse and levensles are NOT here —
 *                     they are narration ground in the extensions/lessen corpus slice.
 *   links             Corpus Lookup Table v1.1 §8 — the Main's resolved links: one green, blue, purple and red
 *                     partner and its two yellow partners, read from the whole wheel stored in services/lineType.js
 *                     (only the Main's row ships; human ruling 2026-09-16). The model reads them literally.
 *   stamps            R5 — the four: tau_calibration_version · corpus_manifest_version ·
 *                     register_bands_version · workbook.
 */

'use strict';

const E = require('./runtimeEngine');
const VERSIONS = require('../config/versions');
const { mainLinks } = require('../services/lineType');

const ENRICHMENT_FIELDS = ['strain_response', 'failure_mode', 'valence_trajectory'];
const tagSupport = (entries) => entries.map((e) => ({ ...e, role: 'support' }));

/** D_states is keyed "D1 Coherent baseline" … "D5 Collapse"; map to D1..D5. */
function enrichmentOf(mainCells) {
  const out = {};
  for (const st of E.STATES) {
    const key = Object.keys(mainCells || {}).find((k) => k.split(/\s+/)[0] === st);
    const cell = key ? mainCells[key] : null;
    out[st] = Object.fromEntries(ENRICHMENT_FIELDS.map((f) => [f, cell && cell[f] != null ? cell[f] : null]));
  }
  return out;
}

function assemblePayload({ geo, result, register, store, c_cells, tau_version, register_bands, corpus_manifest_version, geometry, main_cells, extension_record }) {
  const mainVals = store.main_values(geo.main);
  for (const c of result.codrivers) store.support_values(c.name);
  const v1 = E.emit_payload(result, tau_version);
  const v2 = E.emit_payload_v2(geo, result, store, c_cells, tau_version);

  return {
    main: {
      name: geo.main,
      role: mainVals.role,
      baseline_arc: mainVals.arc,
      transform_arc: result.transform_arc,
      per_state: result.per_state,
      register: {
        register_baseline_pct: register.register_baseline_pct,
        register_transform_pct: register.register_transform_pct,
        register_displacement_pct: register.register_displacement_pct,
        inverted_states: register.inverted_states,
        register_statement: register.register_statement,
        band_labels: register_bands ? E.register_band_labels(register, register_bands) : null,
      },
      displacement: result.displacement,
      holes: v2.main.holes,
      enrichment: enrichmentOf(main_cells),
    },
    support: {
      name: v2.support.name,
      role: v2.support.role,
      w: v2.support.w,
      c_modulation: v2.support.c_modulation,
    },
    extension: extension_record ? {
      role: 'main',
      n: extension_record.n,
      name_en: extension_record.name,
      name_nl: extension_record.name_nl,
      main: extension_record.main,
      support: extension_record.support,
    } : null,
    register_bands,
    codrivers: v1.codrivers_resolved.map((c) => ({ name: c.name, role: 'support', w: c.w, per_state_terms: c.per_state_terms })),
    orth_ledger: tagSupport(result.orth_ledger),
    entry_reads: tagSupport(result.entry_reads),
    tracking_pulls: tagSupport(result.tracking_pulls),
    operational_ledger: tagSupport(result.operational_ledger),
    geometry: geometry === undefined ? null : geometry,
    links: mainLinks(geo.main),
    stamps: {
      tau_calibration_version: tau_version,
      corpus_manifest_version,
      register_bands_version: register_bands.version,
      workbook: VERSIONS.workbook,
    },
  };
}

module.exports = { assemblePayload, ENRICHMENT_FIELDS };
