/**
 * The cognitive triangle (Master Prompt v7.2, page 5.7b "De Cognitieve Driehoek") — a port of the reference
 * cog_triangle_v0_1.py (Backend Task "Triangle Page" v0.1 §4–5).
 *
 * Reads ONLY what scoring already produced: the mandjes in integer units and the Main. It never touches the
 * bleed, the totals or the geometry. The measure is CHOSEN weight, never the yellow echo:
 *   g(p) = keuze(p) + passief(p)                     (units)
 *   G'   = Σ g over every archetype but the Main
 *   the Main's triangle:  s = g(the two partners), k = 2      another triangle:  s = Σ g(its members), k = 3
 *   lift = (s / G') / (k / 11)        lift ≥ a/b  ⇔  b · 11 · s ≥ a · k · G'   (integers only, gate G6)
 *   band: draagt when lift ≥ DRAAGT, stil when lift ≤ STIL, else neutraal; G' = 0 → stil
 * The lift, s, G' and the thresholds never leave this module (W1, W5): the model, the PDF and the logs read the
 * band only. `lifts` exists for the tests.
 *
 * Triangles are the wheel positions with the same p mod 4 (canon framework_rosetta §194–239); the canon pairs
 * D1 ↔ D2 and D3 ↔ D4. Wheel positions 1–12: Judge, Lover, Caregiver, Innocent, Explorer, Outlaw, Trickster,
 * Sage, Artist, Magician, Hero, Ruler.
 */

'use strict';

const B = require('./bleedV2');
const X = require('./exact');

/** Band seeds, exact (owner, 17 Oct 2026): about the 95th / 10th percentile of the null model. Calibrated post-launch. */
const TRIANGLE_BANDS = Object.freeze({
  version: 'cog_triangle v0.1 seeds (17 Oct 2026)',
  main: Object.freeze({ draagt: X.threshold('17/10'), stil: X.threshold('1/2') }),
  other: Object.freeze({ draagt: X.threshold('31/20'), stil: X.threshold('3/5') }),
});

const TRIANGLES = Object.freeze({ D1: [1, 5, 9], D2: [2, 6, 10], D3: [3, 7, 11], D4: [4, 8, 12] });
const COMPLEMENT = Object.freeze({ D1: 'D2', D2: 'D1', D3: 'D4', D4: 'D3' });
const IDS = Object.freeze(Object.keys(TRIANGLES));

/** The triangle of an archetype name. */
const triangleOf = (name) => IDS.find((t) => TRIANGLES[t].includes(B.posOf[name]));
/** A triangle's three members, by name, in wheel order. */
const membersOf = (t) => TRIANGLES[t].map((p) => B.byPos(p));
/** The canon pair a triangle belongs to: 'D1-D2' or 'D3-D4'. */
const pairOf = (t) => [t, COMPLEMENT[t]].sort().join('-');

/** One band, by integer cross-multiplication: chosen weight s over k counted members, against G' = gp. */
function band(s, k, gp, { draagt, stil }) {
  if (gp === 0) return 'stil';
  if (![s, k, gp].every(Number.isSafeInteger)) throw new Error(`cogTriangle: band needs integers (s=${s}, k=${k}, G'=${gp})`);
  if (draagt[1] * 11 * s >= draagt[0] * k * gp) return 'draagt';
  if (stil[1] * 11 * s <= stil[0] * k * gp) return 'stil';
  return 'neutraal';
}

/** s, k and G' per triangle (internal). mandjesU: { [name]: { keuze, passief, … } } in units; main: a name. */
function weights(mandjesU, main) {
  const mp = B.posOf[main];
  if (!mp) throw new Error(`cogTriangle: unknown Main ${JSON.stringify(main)}`);
  const g = (p) => mandjesU[B.byPos(p)].keuze + mandjesU[B.byPos(p)].passief;
  let gp = 0;
  for (let p = 1; p <= 12; p++) if (p !== mp) gp += g(p);
  return Object.fromEntries(IDS.map((t) => {
    const counted = TRIANGLES[t].filter((p) => p !== mp);
    return [t, { s: counted.reduce((a, p) => a + g(p), 0), k: counted.length, gp, mains: counted.length === 2 }];
  }));
}

/** { D1: band, D2: band, D3: band, D4: band } for this session. */
function triangleBands(mandjesU, main) {
  const w = weights(mandjesU, main);
  return Object.fromEntries(IDS.map((t) => [t, band(w[t].s, w[t].k, w[t].gp, w[t].mains ? TRIANGLE_BANDS.main : TRIANGLE_BANDS.other)]));
}

/** Diagnostic only, never sent: the lift per triangle as a float (the tests compare it with the reference). */
function lifts(mandjesU, main) {
  const w = weights(mandjesU, main);
  return Object.fromEntries(IDS.map((t) => [t, w[t].gp ? (w[t].s / w[t].gp) / (w[t].k / 11) : 0]));
}

/**
 * The page's facts for one session: the Main's triangle (members, band, the Main's role), its counter-triangle,
 * and every other triangle that carries (never the counter-triangle). Names and pool lines come from the
 * canon in the report language (corpusResolver.triangleCanon).
 * @param {{ mandjes_u: object, main: string }} s   scoreSession's result
 * @param {{ names: object, pools: object }} canon  triangle names D1–D4 and each archetype's pool line
 */
function triangleFacts(s, canon) {
  const bands = triangleBands(s.mandjes_u, s.main);
  const tm = triangleOf(s.main);
  const comp = COMPLEMENT[tm];
  const named = (t) => ({ id: t, name: canon.names[t], members: membersOf(t), band: bands[t] });
  return {
    main: { ...named(tm), role: { name: s.main, pool: canon.pools[s.main] } },
    counter: named(comp),
    others: IDS.filter((t) => t !== tm && t !== comp && bands[t] === 'draagt').map(named),
    geel: membersOf(tm).map((n) => ({ name: n, u: s.mandjes_u[n].geel })),
  };
}

module.exports = {
  TRIANGLE_BANDS, TRIANGLES, COMPLEMENT, IDS, triangleOf, membersOf, pairOf, band, triangleBands, lifts, triangleFacts,
};
