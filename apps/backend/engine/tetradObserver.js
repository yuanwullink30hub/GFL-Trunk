/**
 * Tetrad observer — port of tetrad_observer_v0_4.py `observe()` (Bleed Engine v2 spec §4; Backend
 * Instruction "Bleed v2 Scoring" v0.1 §5.4). DRAFT: runs on every completed v2 session once v2 is live.
 *
 * STORAGE RULE (human-ratified, 12 Oct 2026) — binding:
 *   per completed test EXACTLY ONE row with THREE fields and nothing else:
 *     archetype      the Main from TRUE picks only (direct Layer-2 picks; no bleed, no fallback points)
 *     double_picks   how often BOTH archetypes of that Main's own pair were picked on Layer 2
 *     shown          how often that Main's own pair was shown on Layer 2
 *   No id, no date, no level, no answers, no scores, no profile — and the row is never logged.
 *   It goes to the store only through services/anonQueue.js (batched, shuffled, random flush).
 *
 * The observer never feeds scores, geometry, style tags or the report.
 */

'use strict';

const { toScoringInput, GROUPS, groupOf, byPos } = require('./bleedV2');

/** Main from direct Layer-2 picks only: 1 pick = 9, 2 picks = 4.5 each; ties → first reached. */
function truePickMain(questions) {
  const pts = new Map();
  for (const [l1, picks] of questions) {
    // the reference walks the picks group by group in Layer-1 order
    const ordered = l1.flatMap((g) => picks.filter((p) => groupOf[p] === g));
    for (const x of ordered) pts.set(x, (pts.has(x) ? pts.get(x) : 0) + 9.0 / ordered.length);
  }
  let best = null;
  for (const [p, v] of pts) if (best === null || v > pts.get(best)) best = p;
  return best;
}

/**
 * @param {object[]} responses the session's response records (validated like the scoring: bad records throw)
 * @returns {{ archetype: string, double_picks: number, shown: number } | null} the ONE row to store
 */
function observe(responses) {
  const questions = toScoringInput(responses);
  const main = truePickMain(questions);
  if (main === null) return null;
  const g = groupOf[main];
  let shown = 0, double = 0;
  for (const [l1, picks] of questions) {
    if (!l1.includes(g)) continue;
    shown += 1;
    if (GROUPS[g].every((p) => picks.includes(p))) double += 1;
  }
  return { archetype: byPos(main), double_picks: double, shown };
}

module.exports = { observe, truePickMain };
