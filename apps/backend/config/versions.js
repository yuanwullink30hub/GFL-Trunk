/**
 * Version pins for the Deltawerken runtime (Backend Instruction v1 §1 config/versions.yaml).
 * Stamped on every engine payload. Change only at consolidated canon events.
 * τ itself has one home — the Tau_Calibration sheet inside the workbook; this file only
 * names its version. The Master Prompt is not pinned here: its one home is Mongo
 * promptConfigs/default (admin dashboard); its version is its own masthead.
 */
module.exports = Object.freeze({
  tau_calibration_version: 'v0-PROVISIONAL',
  corpus_manifest_version: 'v1.1',   // Corpus Lookup Table v1.1 (§8 Schaduw-pakket + link table) + always-block ruling (claim, anchors, Nature/Culture, M1/M2)
  register_bands_version: 'v0-PROVISIONAL',   // Band_Cutpoints_v0_PROVISIONAL sheet (Master Prompt v5.2 R4)
  workbook: 'v4.3',
  spec: 'A1',
});
