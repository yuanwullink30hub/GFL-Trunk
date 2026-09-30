/**
 * Without an OCEAN upload the report request carries one extra block that fixes the shape of the
 * comparison section (prompts/advanced oceanWithoutUploadRequest); with an upload it must not.
 */
require('./helpers');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildUserMessage } = require('../prompts/advanced');

const KEYS = ['JUDGE', 'LOVER', 'CAREGIVER', 'INNOCENT', 'EXPLORER', 'OUTLAW', 'TRICKSTER', 'SAGE', 'ARTIST', 'MAGICIAN', 'HERO', 'RULER'];
const base = (extra) => ({
  archetypeKey: 'HERO', supportArchetype: 'SAGE', sliceScoped: true, language: 'nl',
  archetypeDetails: KEYS.map((key, i) => ({ key, total: 10 + i })),
  ...extra,
});
const NL = '═══ OCEAN ZONDER UPLOAD';
const EN = '═══ OCEAN WITHOUT AN UPLOAD';

test('no upload: the block is sent, in the report language', () => {
  const nl = buildUserMessage(base({}));
  assert.ok(nl.includes(NL));
  assert.ok(nl.includes('"TRAIT O — Openheid"') && nl.includes('420–540 woorden'));
  const en = buildUserMessage(base({ language: 'en' }));
  assert.ok(en.includes(EN) && !en.includes(NL));
  assert.ok(en.includes('"TRAIT N — Neuroticism"'));
});

test('an upload with numbers: no such block', () => {
  const msg = buildUserMessage(base({ uploadedOceanScores: { O: 72, C: 96, E: 88, A: 39, N: 2 } }));
  assert.equal(msg.includes(NL), false);
  assert.ok(msg.includes('OCEAN (geüpload door de gebruiker)'));
});

test('an uploaded file whose numbers could not be read counts as no upload, as it does in the PDF', () => {
  const msg = buildUserMessage(base({ uploadedOceanScores: null, uploadedFileContents: [{ name: 'upload-1.pdf', text: 'x' }] }));
  assert.ok(msg.includes(NL));
});

test('the card microcopy block stays last', () => {
  const msg = buildUserMessage(base({}));
  assert.ok(msg.indexOf(NL) < msg.indexOf('KAART MICROCOPY'));
});
