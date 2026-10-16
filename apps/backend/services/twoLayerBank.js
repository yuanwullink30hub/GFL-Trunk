/**
 * The two-layer Leerling bank as the test screen receives it: the bank's questions laid out by this
 * quarter's rotation sequence (Backend Instruction Rotation Sequence v0.1.1).
 *
 * The sequence is generated from seed = quarter label + level + bank (§1, "one sequence per level"),
 * validated before it is served, and cached per quarter. The screen locks the sequence it started
 * with: it gets the whole plan at test start and sends `rotation_sequence_id` back with the report.
 * Layer-1 answers come in display order A–F with their slot; Layer 2 carries no order (the screen
 * shuffles it at render, §1).
 *
 * The bank is the ratified Leerling Question Bank v1.0 (owner, 16 Oct 2026: 648 answers accepted; Bleed v2
 * gate G2). Its question ids are the placeholder's, so the rotation sequences — seeded on the ids — are unchanged.
 * Once the admin editor publishes, the published texts replace the file's (useBank / loadPublishedBank); the
 * question ids never change, so neither do the sequences.
 */

'use strict';

const crypto = require('crypto');
const { generateSequence, validateSequence, quarterOf, SUBJECTS } = require('../engine/rotationSequence');

const LEVEL = 'leerling';
const GROUPS = ['Ruling', 'Relational', 'Seeker', 'Chaos', 'Abstract', 'Agency']; // group number 1..6

let bank = null;
const cache = new Map(); // quarter → screen payload

function indexBank(raw, source) {
  const bySubject = {};
  for (const q of raw.questions) (bySubject[q.subject] ||= []).push(q.question_id);
  const hash = crypto.createHash('sha256').update(JSON.stringify(raw.questions.map((q) => [q.subject, q.question_id]))).digest('hex').slice(0, 12);
  return { raw, bySubject, hash, byId: new Map(raw.questions.map((q) => [q.question_id, q])), placeholder: /PLACEHOLDER/.test(raw._note || ''), source };
}

function loadBank() {
  if (bank) return bank;
  bank = indexBank(require('../engine/data/question_bank_leerling_v1_0.json'), { kind: 'file' });
  return bank;
}

/**
 * Serve another bank from now on: the one the admin editor published (services/questionBankStore.js). Its
 * question ids must be the ratified file's, so the rotation sequences — seeded on the ids — stay the same.
 */
function useBank(raw, source) {
  const file = indexBank(require('../engine/data/question_bank_leerling_v1_0.json'), { kind: 'file' });
  const next = indexBank(raw, source);
  if (next.hash !== file.hash) throw new Error('the published bank does not have the ratified question ids');
  bank = next;
  cache.clear();
}

/**
 * Load the Leerling bank the editor last published, if any (at startup and after each publish). This instance
 * serves it from then on; another instance picks it up on its next start.
 */
async function loadPublishedBank() {
  const snap = await require('./questionBankStore').getPublished('leerling');
  if (snap && snap.bank) useBank(snap.bank, { kind: 'published', revision: snap.revision, publishedAt: snap.publishedAt });
  return bankSource();
}

/** Where the served bank comes from: { kind: 'file' } or { kind: 'published', revision, publishedAt }. */
const bankSource = () => loadBank().source;

/** The served bank's question, by id (bank-file format). */
const servedQuestion = (questionId) => loadBank().byId.get(questionId) || null;

/** The test screen's plan for one quarter label ('2026-Q4'). Throws when the sequence does not validate. */
function twoLayerPlanFor(quarter) {
  if (cache.has(quarter)) return cache.get(quarter);
  const b = loadBank();
  const seq = generateSequence(quarter, LEVEL, b.bySubject);
  const hard = validateSequence(seq, b.bySubject).filter(([, severity]) => severity === 'hard');
  if (hard.length) throw new Error(`rotation sequence ${quarter} invalid: ${hard.map(([, , m]) => m).join('; ')}`);

  const subjects = SUBJECTS.map(([subject, s, e]) => ({
    subject,
    questions: seq.slice(s, e).map((p) => {
      const q = b.byId.get(p.question_id);
      const l1ByGroup = new Map(q.l1_answers.map((a) => [a.group, a]));
      return {
        id: q.question_id,
        position: p.position,
        text: q.text,
        ...(q.textEn ? { textEn: q.textEn } : {}),
        l1: Object.entries(p.slots).map(([slot, g]) => {
          const a = l1ByGroup.get(GROUPS[g - 1]);
          return { slot, group: a.group, text: a.text, ...(a.textEn ? { textEn: a.textEn } : {}) };
        }),
        l2: q.l2_answers.map((a) => ({ archetype: a.archetype, group: a.group, text: a.text, ...(a.textEn ? { textEn: a.textEn } : {}) })),
      };
    }),
  }));
  const plan = {
    enabled: true,
    level: LEVEL,
    placeholder: b.placeholder,
    rotation_sequence_id: `${LEVEL}:${quarter}:${b.hash}`,
    l1_refusal_label: b.raw.l1_refusal_label,
    subjects,
  };
  cache.set(quarter, plan);
  return plan;
}

/** The plan for the quarter `now` falls in (Europe/Amsterdam). */
const twoLayerPlan = (now = new Date()) => twoLayerPlanFor(quarterOf(now));

/** `count` quarter labels from the one `now` falls in onwards: '2026-Q4', '2027-Q1', … */
function quartersFrom(now = new Date(), count = 8) {
  let [y, q] = quarterOf(now).split('-Q').map(Number);
  return Array.from({ length: count }, () => { const label = `${y}-Q${q}`; q += 1; if (q > 4) { q = 1; y += 1; } return label; });
}

module.exports = { twoLayerPlan, twoLayerPlanFor, quartersFrom, useBank, loadPublishedBank, bankSource, servedQuestion };
