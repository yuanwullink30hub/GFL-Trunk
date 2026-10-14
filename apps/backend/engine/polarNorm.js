/**
 * polar_norm, the Polarization Index and the Support-edit k — the ONE implementation (addendum
 * "polar_norm", 13 Oct 2026, rev 2; gate G6 exact comparisons, 13 Oct 2026).
 *
 * polar_norm = Main−Shadow gap as a fraction of the Main's total: the same quantity as the report's
 * Polarization Index (gap as % of Main). It replaces the placeholder denominator 100, which clamped
 * every profile with a gap of 100+ points to 1 and so zeroed the C-modulation.
 *
 * G6: totals are integers (Bleed v2 units; v1 totals are whole points too), and every threshold is an
 * integer cross-multiplication against an exact fraction, so an exact boundary lands where the written
 * rule puts it in every language: exactly 60 % and exactly 30 % are the middle band.
 *
 * Imported by the live C-modulation (engine/runtimeEngine.js), the precompute port (services/cMagnitude.js),
 * the report route (AFGELEIDE INDICES) and the orb gate. Never re-derive any of it elsewhere.
 */

'use strict';

const { threshold, pctHalfUp } = require('./exact');

const POLAR_NORM_SHAPE = 'linear (gap / main_weight)';

/** Band cut-points as exact fractions (Master Prompt R-c 3.2): > 60 % upper, < 30 % lower. */
const POLAR_BANDS = Object.freeze({ upper: threshold('3/5'), lower: threshold('3/10') });

/** The gap the rules read: Main − Shadow, clamped to [0, Main] (polar_norm is clamped to [0, 1]). */
const clampedGap = (m, s) => Math.max(0, Math.min(m, m - s));

/** polar_norm as a number (one division): for the orb gate and for reporting. */
function polarNorm(mainWeight, shadowWeight) {
  const m = mainWeight ?? 0.0;
  if (!(m > 0)) return 0.0;                                  // no geometry (all refusals)
  return clampedGap(m, shadowWeight ?? 0.0) / m;
}

/**
 * AFGELEIDE INDICES: the Polarization Index (points gap), its % (half up, exact) and its band (exact
 * cross-multiplication: b × gap against a × Main). Needs integer totals.
 */
function polarization(mainWeight, shadowWeight) {
  const m = mainWeight ?? 0, s = shadowWeight ?? 0;
  if (!Number.isSafeInteger(m) || !Number.isSafeInteger(s)) throw new Error(`polarization needs integer totals, got ${m} / ${s}`);
  if (m <= 0) return { polarizationIndex: m - s, polarizationPct: 0, polarizationLevel: 'HIGH_INDIVIDUATION' };
  const gap = clampedGap(m, s);
  const [ua, ub] = POLAR_BANDS.upper, [la, lb] = POLAR_BANDS.lower;
  const level = ub * gap > ua * m ? 'HIGH_POLARIZATION' : lb * gap < la * m ? 'HIGH_INDIVIDUATION' : 'MODERATE';
  return { polarizationIndex: m - s, polarizationPct: pctHalfUp(gap, m), polarizationLevel: level };
}

/**
 * k = support_weight_norm × (1 − polar_norm) = (Support × Shadow) ÷ Main² — the same quantity as before,
 * not a new Shadow term (1 − polar_norm is Shadow ÷ Main). Returned as the exact pair { num, den }:
 * c_modulation multiplies with num / den; the P11 band compares the integers. No geometry → 0.
 */
function supportEditK(mainWeight, supportWeight, shadowWeight) {
  const m = mainWeight ?? 0;
  if (!(m > 0)) return { num: 0, den: 1 };
  const shadow = m - clampedGap(m, shadowWeight ?? 0);              // Shadow, clamped to [0, Main]
  return { num: (supportWeight ?? 0) * shadow, den: m * m };
}

module.exports = { polarNorm, polarization, supportEditK, POLAR_BANDS, POLAR_NORM_SHAPE };
