/**
 * Two-layer Leerling test (scoring_version v2_two_layer): the test screen's answers → the response records
 * the server scores.
 *
 * The browser does not score this test. The server scores the records once (apps/backend/engine/bleedV2.js)
 * and every reader — the results screen, the report, the PDF — reads that one result (owner, 14 Oct 2026).
 */

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
