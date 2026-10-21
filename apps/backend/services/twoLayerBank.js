/**
 * The two-layer banks as the test screen receives them: a level's questions laid out by this quarter's rotation
 * sequence (Backend Instruction Rotation Sequence v0.1.1).
 *
 * The sequence is generated from seed = quarter label + level + bank (§1, "one sequence per level"),
 * validated before it is served, and cached per level and quarter. The screen locks the sequence it started
 * with: it gets the whole plan at test start and sends `rotation_sequence_id` back with the report.
 * Layer-1 answers come in display order A–F with their slot; Layer 2 carries no order (the screen
 * shuffles it at render, §1).
 *
 * Banks per level:
 *   leerling   the ratified Leerling Question Bank v1.0 (owner, 16 Oct 2026: 648 answers accepted; Bleed v2 gate
 *              G2). Its question ids are the placeholder's, so the rotation sequences are unchanged.
 *   gevorderd  the Gevorderd sheet as it stood on 21 Oct 2026 (owner: installed as is, 648 answers).
 *   beginner   no bank of its own yet: the screen keeps Beginner on the Leerling plan without answer texts.
 * Once the admin editor publishes a level, the published texts replace the file's (useBank / loadPublishedBank);
 * the question ids never change, so neither do the sequences. Every function defaults to Leerling.
 */

'use strict';

const crypto = require('crypto');
const { generateSequence, validateSequence, quarterOf, SUBJECTS } = require('../engine/rotationSequence');

const BANK_FILES = Object.freeze({
  leerling: '../engine/data/question_bank_leerling_v1_0.json',
  gevorderd: '../engine/data/question_bank_gevorderd_v1_0.json',
});
const LEVELS = Object.freeze(Object.keys(BANK_FILES));
const DEFAULT_LEVEL = 'leerling';
const GROUPS = ['Ruling', 'Relational', 'Seeker', 'Chaos', 'Abstract', 'Agency']; // group number 1..6

const banks = new Map(); // level → indexed bank
const cache = new Map(); // "level:quarter" → screen payload

function assertLevel(level) {
  if (!LEVELS.includes(level)) throw new RangeError(`no two-layer bank for level ${JSON.stringify(level)}`);
}

function indexBank(raw, source) {
  const bySubject = {};
  for (const q of raw.questions) (bySubject[q.subject] ||= []).push(q.question_id);
  const hash = crypto.createHash('sha256').update(JSON.stringify(raw.questions.map((q) => [q.subject, q.question_id]))).digest('hex').slice(0, 12);
  return { raw, bySubject, hash, byId: new Map(raw.questions.map((q) => [q.question_id, q])), placeholder: /PLACEHOLDER/.test(raw._note || ''), source };
}

const fileBank = (level) => indexBank(require(BANK_FILES[level]), { kind: 'file' });

function loadBank(level = DEFAULT_LEVEL) {
  assertLevel(level);
  if (!banks.has(level)) banks.set(level, fileBank(level));
  return banks.get(level);
}

const clearLevel = (level) => { for (const k of [...cache.keys()]) if (k.startsWith(`${level}:`)) cache.delete(k); };

/**
 * Serve another bank for a level from now on: the one the admin editor published (services/questionBankStore.js).
 * Its question ids must be the level's file's, so the rotation sequences — seeded on the ids — stay the same.
 */
function useBank(raw, source, level = DEFAULT_LEVEL) {
  assertLevel(level);
  const next = indexBank(raw, source);
  if (next.hash !== fileBank(level).hash) throw new Error('the published bank does not have the ratified question ids');
  banks.set(level, next);
  clearLevel(level);
}

/**
 * Load the bank the editor last published for every level, if any (at startup and after each publish). This
 * instance serves them from then on; another instance picks them up on its next start. Resolves the Leerling
 * source (the startup log line); bankSource(level) tells the others.
 */
async function loadPublishedBank() {
  const store = require('./questionBankStore');
  for (const level of LEVELS) {
    const snap = await store.getPublished(level);
    if (snap && snap.bank) useBank(snap.bank, { kind: 'published', revision: snap.revision, publishedAt: snap.publishedAt }, level);
  }
  return bankSource(DEFAULT_LEVEL);
}

/** Where a level's served bank comes from: { kind: 'file' } or { kind: 'published', revision, publishedAt }. */
const bankSource = (level = DEFAULT_LEVEL) => loadBank(level).source;

/** A level's served question, by id (bank-file format). */
const servedQuestion = (questionId, level = DEFAULT_LEVEL) => loadBank(level).byId.get(questionId) || null;

/** The test screen's plan for one quarter label ('2026-Q4') and level. Throws when the sequence does not validate. */
function twoLayerPlanFor(quarter, level = DEFAULT_LEVEL) {
  const key = `${level}:${quarter}`;
  if (cache.has(key)) return cache.get(key);
  const b = loadBank(level);
  const seq = generateSequence(quarter, level, b.bySubject);
  const hard = validateSequence(seq, b.bySubject).filter(([, severity]) => severity === 'hard');
  if (hard.length) throw new Error(`rotation sequence ${level} ${quarter} invalid: ${hard.map(([, , m]) => m).join('; ')}`);

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
    level,
    placeholder: b.placeholder,
    rotation_sequence_id: `${level}:${quarter}:${b.hash}`,
    l1_refusal_label: b.raw.l1_refusal_label,
    subjects,
  };
  cache.set(key, plan);
  return plan;
}

/** The plan for the quarter `now` falls in (Europe/Amsterdam). */
const twoLayerPlan = (now = new Date(), level = DEFAULT_LEVEL) => twoLayerPlanFor(quarterOf(now), level);

/** `count` quarter labels from the one `now` falls in onwards: '2026-Q4', '2027-Q1', … */
function quartersFrom(now = new Date(), count = 8) {
  let [y, q] = quarterOf(now).split('-Q').map(Number);
  return Array.from({ length: count }, () => { const label = `${y}-Q${q}`; q += 1; if (q > 4) { q = 1; y += 1; } return label; });
}

module.exports = {
  LEVELS, BANK_FILES, twoLayerPlan, twoLayerPlanFor, quartersFrom, useBank, loadPublishedBank, bankSource, servedQuestion,
};
