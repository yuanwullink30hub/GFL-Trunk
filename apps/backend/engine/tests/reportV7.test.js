/**
 * The v2 report request under Master Prompt v7 (engine/reportV7.js): payload instruction v7 P1–P13, §7 and
 * the acceptance tests it names (5, 6, 7, 10, 12), on the Bleed v2 session fixtures.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../reportV7');
const R = require('../corpusResolver');
const { buildDataBlock } = require('../dataBlock');
const sessions = require('./bleed_v2_session_fixtures_v0_1.json').cases;

const SYSTEM = 'AI MASTER PROMPT v7.0 — DELTAWERKEN RAPPORTGENERATOR (gate fixture)\nW1 · …';
const build = (name, extra = {}) => V.buildV2Request({ system: SYSTEM, responses: sessions[name].questions, language: 'en', ...extra });
const OLD_TEST = /Culture-layer reading|Cultuur-laag lezing|Culture pick|Cultuur-keuze|Scenario A\/B\/C|Nature picks|Natuur-keuzes|Yellow = Culture|Geel = Cultuur|decomposes them|ontleedt ze|names which is which|benoemt welke welke is/;

test('P1–P4, test 5: seven mandjes, no answer sheet, no Nature/Culture, no Authenticity Index, no culture-pick flag', () => {
  for (const name of Object.keys(sessions)) {
    const r = build(name);
    assert.match(r.user, /-- MANDJE DECOMPOSITIE --\n\w+: keuze [\d.]+ \| passief [\d.]+ \| groen [\d.]+ \| blauw [\d.]+ \| blauw_intern [\d.]+ \| paars [\d.]+ \| geel [\d.]+/, name);
    assert.ok(r.user.includes('-- KEUZE / ECHO PER GROEP --'), name);
    assert.doesNotMatch(r.user, /nature_core|culture_core|green_hw|blue_fb|yellow_cog|purple_shadow|5-MANDJE|NATURE \/ CULTURE/i, name);
    assert.doesNotMatch(r.user, /Authenticity|culture.?pick|is_culture_pick|totalNaturePoints|totalCulturePoints/i, name);
    // P2: not one answer — no question records, no picks, no answer-sheet block
    assert.doesNotMatch(r.user, /INDIVIDUELE ANTWOORDEN|l1_groups|l2_picks|l1_refusal|"position":/, name);
    for (const q of sessions[name].questions) assert.ok(!r.user.includes(JSON.stringify(q)), `${name}: an answer record leaked`);
  }
});

test('P5, test 6: ANTWOORDSTIJL in its parameter form only when a tag fired; the data block carries the meanings', () => {
  const withTag = build('fallback_heavy');
  assert.deepEqual(withTag.styleTags, ['V-PRECISION(groepen=Seeker+Abstract)']);
  assert.ok(withTag.user.split('\n').includes('-- ANTWOORDSTIJL -- tags: V-PRECISION(groepen=Seeker+Abstract)'));
  assert.ok(withTag.dataBlock.some((b) => b.key === 'ANTWOORDSTIJL'));
  const none = build('concentrated_lover');
  assert.deepEqual(none.styleTags, []);
  assert.ok(!none.user.includes('ANTWOORDSTIJL'));
  assert.ok(!none.dataBlock.some((b) => b.key === 'ANTWOORDSTIJL'));
});

test('P6, P11, P12, tests 7 and 10: tetrad line, Support-bewerking and Support-herkomst per fixture', () => {
  const want = {
    selftest_example: ['Sage', 'sterk', 'keuze'], ruling_tetrad: ['Judge', 'merkbaar', 'echo'], with_refusals: ['Caregiver', 'zacht', 'keuze'],
    concentrated_lover: ['Caregiver', 'zacht', 'echo'], fallback_heavy: ['Innocent', 'zacht', 'passief'],
  };
  for (const [name, [support, band, herkomst]] of Object.entries(want)) {
    const r = build(name);
    assert.equal(r.session.support, support, name);
    assert.ok(r.user.includes(`Support-bewerking: ${band}`), `${name} band`);
    assert.ok(r.user.includes(`Support-herkomst: ${herkomst}`), `${name} herkomst`);
  }
  const t = build('ruling_tetrad');
  assert.match(t.user, /Main-Support lijntype: Groene Lijn\nTetrad: ja/);
  assert.ok(!build('selftest_example').user.includes('Tetrad: ja'));
});

test('P9, P13: every v2 slice carries the TNM objects of the active set, with the old test\'s readings cut', () => {
  for (const lang of ['en', 'nl']) {
    for (const name of Object.keys(sessions)) {
      if (lang === 'nl') continue; // Dutch v2 reports wait for the ratified enrichment cells (below)
      const r = build(name, { language: lang });
      const ids = r.manifest.documents.map((d) => d.id);
      assert.ok(ids.includes('tnm/preamble'), name);
      const active = [r.payload.main.name, ...r.payload.codrivers.map((c) => c.name)];
      for (const a of active) assert.ok(ids.includes(`tnm/entry/${a}`), `${name}: tnm/entry/${a}`);
      assert.doesNotMatch(r.cachedContext, OLD_TEST, name);
      assert.ok(r.cachedContext.includes('Cognitive Triangle (sec 1)'), `${name}: the rest of the TNM entry stays`);
    }
    // the slice builder itself, both languages: v2 strips, v1 keeps the Rosetta's text as it is
    const args = [['Hero', 'Magician', 'Sage'], 'Hero', 'Magician', ['Hero'], { language: lang, shadow: 'Explorer', blindspot: 'Sage' }];
    const v2 = R.manifest(...args.slice(0, 4), { ...args[4], v2: true });
    const v1 = R.manifest(...args);
    assert.doesNotMatch(v2.text, OLD_TEST, lang);
    assert.match(v1.text, OLD_TEST, `${lang}: v1 slices are untouched`);
  }
  // a target that no longer matches fails loudly instead of letting the old text through
  assert.throws(() => R.stripOldTestReadings('tnm/entry/Hero', '| Field | Value |', 'en'), /matched 0×/);
});

test('§7, test 12: the data block is the server\'s, from the same values; the browser gets curves, the Keuze/Echo graph and the polarisation only', () => {
  const r = build('selftest_example', { ocean: { O: 71, C: 40, E: 55, A: 62, N: 30 } });
  const input = { session: r.session, payload: r.payload, supportEdit: r.supportEdit, styleTags: r.styleTags, ocean: { O: 71, C: 40, E: 55, A: 62, N: 30 } };
  // an English report prints the English labels (owner, 13 Oct); the model still reads the prompt's Dutch block names
  assert.deepEqual(r.dataBlock, buildDataBlock({ ...input, language: 'en' }));
  assert.ok(r.dataBlock.some((b) => b.title === 'BASKET DECOMPOSITION') && r.user.includes('-- MANDJE DECOMPOSITIE --'));
  assert.ok(!/BASKET DECOMPOSITION|CHOICE \/ ECHO PER GROUP|DERIVED INDICES|Support origin|Support editing/.test(r.user), 'no English label in the model input');
  assert.ok(r.user.includes('Openheid: 71/100'), 'the upload reaches the model as numbers under our names');
  assert.ok(!r.user.includes('OCEAN WITHOUT AN UPLOAD'), 'no no-upload hook with an upload');
  assert.ok(build('selftest_example').user.includes('OCEAN WITHOUT AN UPLOAD'));
  assert.deepEqual(Object.keys(r.client.enginePayload).sort(), ['keuze_echo', 'main']);
  assert.deepEqual(r.client.enginePayload.keuze_echo, r.session.group_view);
  assert.deepEqual(Object.keys(r.client.polarization).sort(), ['polarizationIndex', 'polarizationLevel', 'polarizationPct']);
  // the one scoring result the browser reads (owner, 14 Oct: the browser never scores the test itself)
  assert.deepEqual(Object.keys(r.client).sort(), ['enginePayload', 'polarization', 'profile']);
  const p = r.client.profile;
  assert.deepEqual(Object.keys(p).sort(), ['main', 'mandjes', 'scoring_version', 'support', 'totals']);
  assert.equal(p.main, r.session.main);
  assert.equal(p.support, r.session.support);
  assert.deepEqual(p.totals, r.session.totals);
  for (const [n, m] of Object.entries(p.mandjes)) {
    assert.deepEqual(Object.keys(m), ['keuze', 'passief', 'groen', 'blauw', 'blauw_intern', 'paars', 'geel'], n);
    assert.ok(Math.abs(Object.values(m).reduce((a, b) => a + b, 0) - p.totals[n]) < 1e-9, `${n}: the mandjes make up the total`);
  }
  assert.ok(r.user.includes(V.CLOSING_LINE) && !/machine block|machineblok/i.test(r.user.split('═══ CARD MICROCOPY')[0]));
});

test('§9: a Dutch v2 report needs the ratified Dutch enrichment cells; P10: the prompt version comes from its masthead', () => {
  const { enrichmentNl } = require('../index');
  if (!enrichmentNl()) {
    assert.throws(() => build('selftest_example', { language: 'nl' }), /Dutch enrichment cells are not ratified yet/);
  } else {
    // every English cell value the corpus holds has its ratified Dutch text, and a Dutch report carries only those
    const corpus = require('../../../../packages/assessment-core/src/data/canon/deltawerken_corpus.json');
    const table = enrichmentNl();
    for (const a of Object.values(corpus.archetypes)) {
      for (const c of Object.values(a.D_states)) {
        for (const f of ['strain_response', 'failure_mode', 'valence_trajectory']) if (c[f] != null) assert.ok(table[f][c[f]], `${f} "${c[f]}" has no Dutch text`);
      }
    }
    for (const name of Object.keys(sessions)) {
      const r = build(name, { language: 'nl' });
      for (const cell of Object.values(r.payload.main.enrichment)) {
        for (const [f, v] of Object.entries(cell)) if (v != null) assert.ok(Object.values(table[f]).includes(v), `${name}: ${f} "${v}" is not a ratified Dutch cell`);
      }
    }
  }
  assert.equal(V.promptVersion(SYSTEM), 'v7.0');
  assert.equal(V.promptVersion('AI MASTER PROMPT v6.2.1 — X'), 'v6.2.1');
  assert.throws(() => V.buildV2Request({ system: ' ', responses: sessions.selftest_example.questions, language: 'en' }), /promptConfigs\/default/);
});
