/**
 * Deltawerken — Connection Matrix v2 + edge adapter (restructure part 2.2)
 * =======================================================================
 * Transcribes the canon Connection Matrix v2 (§3 complete 12×5 table) and turns
 * it into the per-archetype `edge_to_main` (+ red sign) that the C-magnitude path
 * (cMagnitude.js) consumes. TYPE/SIGN from canon ONLY — never a magnitude.
 *
 * Geometry (unchanged from v1): each colour is a geometric operation on the wheel.
 *   Green  — adjacent group-mate            (within-group hardware coupling)
 *   Blue   — reflection, pairs sum to 13     (feedback bridge / reorganisation)
 *   Purple — N→N+6 point-reflection          (emergent-shadow / phenomenological mirror)
 *   Red    — reflection, pairs sum to 7      (cross-group hardware seam; sign varies)
 *   Yellow — TNM triangle (two triad-partners)
 *
 * Two reads encoded here:
 *  - PRECEDENCE (§2 integration circuit): for the hyper-linked groups (Ruling,
 *    Chaos) green and blue coincide; "blue collapses onto the within-group
 *    partner" → GREEN > BLUE > PURPLE > RED > YELLOW > NONE.
 *  - RED SIGN (§2/§4, pair-specific): opposition at the CEN–SN (Ruling↔Chaos) and
 *    Motor–DMN (Agency↔Abstract) seams; lost-coupling at the Limbic–Seeker
 *    (Relational↔Seeker) seam. Lost-coupling sign is condition-dependent (live
 *    falsifier) → left for runtime resolution; absent it, σ refuses (by design).
 *
 * Keys are UPPERCASE (backend/scoring convention).
 */

'use strict';

const { Edge, RedSign } = require('./cMagnitude');

// ── §3 complete matrix, verbatim (UPPERCASE). yellow = the two TNM triad-partners
//    (T1 Judge/Explorer/Artist · T2 Lover/Outlaw/Magician · T3 Caregiver/Trickster/Hero
//     · T4 Innocent/Sage/Ruler). redSign per the seam (see header). ────────────────
const CONNECTION_MATRIX = {
  RULER:     { green: 'JUDGE',     blue: 'JUDGE',     purple: 'OUTLAW',    red: 'TRICKSTER', redSign: RedSign.OPPOSITION,    yellow: ['INNOCENT', 'SAGE'] },
  JUDGE:     { green: 'RULER',     blue: 'RULER',     purple: 'TRICKSTER', red: 'OUTLAW',    redSign: RedSign.OPPOSITION,    yellow: ['EXPLORER', 'ARTIST'] },
  LOVER:     { green: 'CAREGIVER', blue: 'HERO',      purple: 'SAGE',      red: 'EXPLORER',  redSign: RedSign.LOST_COUPLING, yellow: ['OUTLAW', 'MAGICIAN'] },
  CAREGIVER: { green: 'LOVER',     blue: 'MAGICIAN',  purple: 'ARTIST',    red: 'INNOCENT',  redSign: RedSign.LOST_COUPLING, yellow: ['TRICKSTER', 'HERO'] },
  INNOCENT:  { green: 'EXPLORER',  blue: 'ARTIST',    purple: 'MAGICIAN',  red: 'CAREGIVER', redSign: RedSign.LOST_COUPLING, yellow: ['SAGE', 'RULER'] },
  EXPLORER:  { green: 'INNOCENT',  blue: 'SAGE',      purple: 'HERO',      red: 'LOVER',     redSign: RedSign.LOST_COUPLING, yellow: ['JUDGE', 'ARTIST'] },
  OUTLAW:    { green: 'TRICKSTER', blue: 'TRICKSTER', purple: 'RULER',     red: 'JUDGE',     redSign: RedSign.OPPOSITION,    yellow: ['LOVER', 'MAGICIAN'] },
  TRICKSTER: { green: 'OUTLAW',    blue: 'OUTLAW',    purple: 'JUDGE',     red: 'RULER',     redSign: RedSign.OPPOSITION,    yellow: ['CAREGIVER', 'HERO'] },
  SAGE:      { green: 'ARTIST',    blue: 'EXPLORER',  purple: 'LOVER',     red: 'HERO',      redSign: RedSign.OPPOSITION,    yellow: ['INNOCENT', 'RULER'] },
  ARTIST:    { green: 'SAGE',      blue: 'INNOCENT',  purple: 'CAREGIVER', red: 'MAGICIAN',  redSign: RedSign.OPPOSITION,    yellow: ['JUDGE', 'EXPLORER'] },
  MAGICIAN:  { green: 'HERO',      blue: 'CAREGIVER', purple: 'INNOCENT',  red: 'ARTIST',    redSign: RedSign.OPPOSITION,    yellow: ['LOVER', 'OUTLAW'] },
  HERO:      { green: 'MAGICIAN',  blue: 'LOVER',     purple: 'EXPLORER',  red: 'SAGE',      redSign: RedSign.OPPOSITION,    yellow: ['CAREGIVER', 'TRICKSTER'] },
};

/**
 * Edge type (+ red sign) of `archetypeKey` relative to `mainKey`, by canon
 * precedence. Returns { edge, red_sign }. red_sign is null unless edge is RED.
 * For a RED lost-coupling seam, red_sign = LOST_COUPLING → σ refuses unless a
 * runtime sign is later supplied (the GANE-trap guard).
 */
function edgeToMain(mainKey, archetypeKey) {
  const main = CONNECTION_MATRIX[String(mainKey).toUpperCase()];
  const x = String(archetypeKey).toUpperCase();
  if (!main || x === String(mainKey).toUpperCase()) return { edge: Edge.NONE, red_sign: null };

  // Precedence: GREEN > BLUE > PURPLE > RED > YELLOW > NONE.
  // GREEN first handles the Ruling/Chaos hyper-link (green === blue → collapse to green).
  if (x === main.green) return { edge: Edge.GREEN, red_sign: null };
  if (x === main.blue) return { edge: Edge.BLUE, red_sign: null };
  if (x === main.purple) return { edge: Edge.PURPLE, red_sign: null };
  if (x === main.red) return { edge: Edge.RED, red_sign: main.redSign };
  if (main.yellow.includes(x)) return { edge: Edge.YELLOW, red_sign: null };
  return { edge: Edge.NONE, red_sign: null };
}

/**
 * Full edge map for one Main: { ARCHETYPE_UPPER -> { edge, red_sign } } over all 12.
 */
function edgesForMain(mainKey) {
  const out = {};
  for (const key of Object.keys(CONNECTION_MATRIX)) {
    out[key] = edgeToMain(mainKey, key);
  }
  return out;
}

module.exports = { CONNECTION_MATRIX, edgeToMain, edgesForMain };
