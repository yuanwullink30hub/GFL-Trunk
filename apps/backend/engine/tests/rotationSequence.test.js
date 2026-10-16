/**
 * Rotation sequence (Backend Instruction Rotation Sequence v0.1.1 §6): the JS port reproduces
 * l1_key_generator_v0_2.py exactly (PRNG, slot key, full sequence), generated sequences validate with
 * zero issues, questions never leave their subject, and the validator flags edits by severity.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const R = require('../rotationSequence');
const ref = require('./rotation_sequence_reference_v0_2.json');
const bank = require('../data/question_bank_leerling_v1_0.json');

const bySubject = {};
for (const q of bank.questions) (bySubject[q.subject] ||= []).push(q.question_id);

test('Python random: same getrandbits and shuffle for the same seed', () => {
  for (const [seed, want] of Object.entries(ref.prng)) {
    const r = new R.PyRandom(BigInt(`0x${crypto.createHash('sha256').update(seed).digest('hex')}`));
    assert.deepEqual(Array.from({ length: 5 }, () => r.getrandbits(32)), want.getrandbits32, seed);
    const xs = Array.from({ length: 20 }, (_, i) => i);
    r.shuffle(xs);
    assert.deepEqual(xs, want.shuffle20, seed);
  }
});

test('§6.2: slot keys and sequences are identical to the reference for the same seed + level + bank', () => {
  for (const [seed, key] of Object.entries(ref.keys)) assert.deepEqual(R.generate(seed), key, seed);
  for (const [id, seq] of Object.entries(ref.sequences)) {
    const [seed, level] = id.split('|');
    assert.deepEqual(R.generateSequence(seed, level, bySubject), seq, id);
  }
});

test('§6.1 / §6.3: generated sequences validate with zero issues; questions stay in their subject', () => {
  for (let i = 0; i < 40; i++) {
    const seq = R.generateSequence(`seed-${i}`, 'leerling', bySubject);
    assert.deepEqual(R.validateSequence(seq, bySubject), []);
    for (const [subject, s, e] of R.SUBJECTS) {
      for (const p of seq.slice(s, e)) assert.ok(p.subject === subject && bySubject[subject].includes(p.question_id));
    }
  }
});

test('§6.4 / §6.5: swapping two slot rows keeps the hard rules; editing one cell is a hard G2 issue', () => {
  const seq = R.generateSequence('2026-Q4', 'leerling', bySubject);
  const swapped = seq.map((p) => ({ ...p, slots: { ...p.slots } }));
  [swapped[3].slots, swapped[20].slots] = [swapped[20].slots, swapped[3].slots];
  assert.ok(R.validateSequence(swapped, bySubject).every(([, severity]) => severity === 'soft'));

  const edited = seq.map((p) => ({ ...p, slots: { ...p.slots } }));
  [edited[0].slots.A, edited[0].slots.B] = [edited[0].slots.B, edited[0].slots.A];
  assert.ok(R.validateSequence(edited, bySubject).some(([code, severity]) => code === 'G2' && severity === 'hard'));

  const short = { ...bySubject, massa_macht: bySubject.massa_macht.slice(1) };
  assert.ok(R.validateSequence(seq, short).some(([code]) => code === 'SUBJ'));
  assert.throws(() => R.generateSequence('2026-Q4', 'leerling', short), /massa_macht: expected 6 questions/);
});

test('quarters switch at 00:00 Europe/Amsterdam', () => {
  assert.equal(R.quarterOf(new Date('2026-12-31T22:59:00Z')), '2026-Q4');
  assert.equal(R.quarterOf(new Date('2026-12-31T23:00:00Z')), '2027-Q1');
  assert.equal(R.quarterOf(new Date('2026-06-30T21:59:00Z')), '2026-Q2');
  assert.equal(R.quarterOf(new Date('2026-06-30T22:00:00Z')), '2026-Q3');
});
