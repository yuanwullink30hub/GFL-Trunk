/**
 * Two-layer Leerling test (scoring_version v2_two_layer) — the browser's DISPLAY mirror of the server's
 * Bleed v2 scoring (apps/backend/engine/bleedV2.js, Bleed v2 Scoring instruction §3).
 *
 * The report reads the server's scoring only; this mirror lets the results screen name the Main and
 * Support and draw the radar while the report is written. Same exact integer units (unit 3/10 point), same
 * tie chain: total → more single Layer-2 picks → more keuze → more passief → lower wheel position.
 * apps/backend/engine/tests/twoLayerMirror.test.js holds it to bleedV2 on every question state and on the
 * session fixtures; a change to the bleed config must change both.
 */

/** Wheel positions 1–12. */
export const WHEEL = ['Judge', 'Lover', 'Caregiver', 'Innocent', 'Explorer', 'Outlaw', 'Trickster', 'Sage', 'Artist', 'Magician', 'Hero', 'Ruler'];
export const GROUPS = {
  Ruling: ['Judge', 'Ruler'], Relational: ['Lover', 'Caregiver'], Seeker: ['Innocent', 'Explorer'],
  Chaos: ['Outlaw', 'Trickster'], Abstract: ['Sage', 'Artist'], Agency: ['Magician', 'Hero'],
};
export const MANDJES = ['keuze', 'passief', 'groen', 'blauw', 'blauw_intern', 'paars', 'geel'];

const POS = Object.fromEntries(WHEEL.map((n, i) => [n, i + 1]));
const GROUP_OF = Object.fromEntries(Object.entries(GROUPS).flatMap(([g, ns]) => ns.map((n) => [n, g])));
const name = (p) => WHEEL[p - 1];
const sibling = (n) => GROUPS[GROUP_OF[n]].find((x) => x !== n);
const bluePartner = (n) => name(13 - POS[n]);
const purplePartner = (n) => name(((POS[n] + 5) % 12) + 1);
const yellowPartners = (n) => WHEEL.filter((x) => x !== n && POS[x] % 4 === POS[n] % 4);

// Per-question units (9 points = 30 units): one direct pick, each of two direct picks, a Layer-1 fallback.
const PICK = { 1: { core: 30, groen: 10, blauw: 6, paars: 4, geel: 4 }, 2: { core: 15, groen: 5, blauw: 3, paars: 2, geel: 2 } };
const FALLBACK = { 2: { core: 20, blauw: 2 }, 4: { core: 10, blauw: 1 } };

const emptyMandjes = () => Object.fromEntries(WHEEL.map((n) => [n, Object.fromEntries(MANDJES.map((m) => [m, 0]))]));
const blueBasket = (from, to) => (GROUP_OF[from] === GROUP_OF[to] ? 'blauw_intern' : 'blauw');

/**
 * One response record → Layer-1 group names and Layer-2 archetype names (a refusal or timeout scores zero).
 * Takes both forms the server takes: `l1_picks: [{group, slot}]` or `l1_groups`, and `l2_picks` as
 * `[{archetype}]` or names.
 */
function picksOf(r) {
  if (!r || r.l1_refusal || r.timeout) return [[], []];
  const l1 = Array.isArray(r.l1_groups) ? r.l1_groups : (r.l1_picks || []).map((p) => p.group);
  const l2 = (r.l2_picks || []).map((p) => (typeof p === 'string' ? p : p.archetype));
  return [l1, l2];
}

/** Add one question to the mandjes, in units. */
function addQuestion(acc, l1, l2) {
  if (!l1.length) return;
  if (l2.length) {
    const u = PICK[l2.length];
    for (const x of l2) {
      acc[x].keuze += u.core;
      acc[sibling(x)].groen += u.groen;
      acc[bluePartner(x)][blueBasket(x, bluePartner(x))] += u.blauw;
      acc[purplePartner(x)].paars += u.paars;
      for (const y of yellowPartners(x)) acc[y].geel += u.geel;
    }
  } else {
    const shown = l1.flatMap((g) => GROUPS[g]);
    const u = FALLBACK[shown.length];
    for (const x of shown) {
      acc[x].passief += u.core;
      acc[bluePartner(x)][blueBasket(x, bluePartner(x))] += u.blauw;
    }
  }
}

const toPoints = (u) => (u * 3) / 10;

/**
 * The test screen's answers → the response records the server scores (Rotation Sequence v0.1.1 §2), one per
 * position 1–36: question_id, position, l1_refusal, timeout, l1_picks [{group, slot}], l2_picks [{archetype}].
 * No latency field and no slot on Layer-2 picks. A question without an answer (only possible when the screen
 * was left mid-way) is recorded as a timeout: zero points, never a refusal.
 * @param {{subjects: {questions: {id:string, position:number}[]}[]}} plan  the locked plan (GET /api/questions/two-layer)
 * @param {Object<number, Object<string, {l1:{group:string, slot:string}[], l2:string[], refusal:boolean, timeout:boolean}>>} answersByLayer
 */
export function toResponseRecords(plan, answersByLayer) {
  return plan.subjects.flatMap((subject, layerIndex) => subject.questions.map((q) => {
    const rec = answersByLayer?.[layerIndex]?.[q.id];
    const refusal = Boolean(rec?.refusal);
    const timeout = !rec || (!refusal && (Boolean(rec.timeout) || !rec.l1?.length));
    const answered = !refusal && !timeout;
    return {
      question_id: q.id,
      position: q.position,
      l1_refusal: refusal,
      timeout,
      l1_picks: answered ? rec.l1.map((p) => ({ group: p.group, slot: p.slot })) : [],
      l2_picks: answered ? rec.l2.map((archetype) => ({ archetype })) : [],
    };
  })).sort((a, b) => a.position - b.position);
}

/**
 * @param {{l1_refusal:boolean, timeout?:boolean, l1_picks:{group:string}[], l2_picks:{archetype:string}[]}[]} responses
 * @returns {{main:string, support:string, ranking:string[], totals_u:Object, mandjes_u:Object, totals:Object, mandjes:Object}}
 *   archetype names in the engine's form ('Ruler'); totals/mandjes in points for display
 */
export function scoreTwoLayer(responses) {
  const acc = emptyMandjes();
  const single = Object.fromEntries(WHEEL.map((n) => [n, 0]));
  for (const r of responses || []) {
    const [l1, l2] = picksOf(r);
    addQuestion(acc, l1, l2);
    if (l1.length && l2.length === 1) single[l2[0]] += 1;
  }
  const totalsU = Object.fromEntries(WHEEL.map((n) => [n, MANDJES.reduce((s, m) => s + acc[n][m], 0)]));
  const ranking = WHEEL.slice().sort((a, b) => (
    totalsU[b] - totalsU[a] || single[b] - single[a] || acc[b].keuze - acc[a].keuze
    || acc[b].passief - acc[a].passief || POS[a] - POS[b]
  ));
  return {
    main: ranking[0],
    support: ranking[1],
    ranking,
    totals_u: totalsU,
    mandjes_u: acc,
    totals: Object.fromEntries(WHEEL.map((n) => [n, toPoints(totalsU[n])])),
    mandjes: Object.fromEntries(WHEEL.map((n) => [n, Object.fromEntries(MANDJES.map((m) => [m, toPoints(acc[n][m])]))])),
  };
}
