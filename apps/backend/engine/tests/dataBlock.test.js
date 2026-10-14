/**
 * The server-built data block (payload instruction v7 §7; tests 11–12): our backend builds PROFIEL DATA
 * VOOR AI VERWERKING from the engine's values, in the fixed block order, with none of the never-list values.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { runPipeline } = require('../index');
const E = require('../runtimeEngine');
const B = require('../bleedV2');
const S = require('../answerStyle');
const { buildDataBlock, dataBlockText, TITLES_EN } = require('../dataBlock');
const { redLinePartner } = require('../../services/lineType');
const sessions = require('./bleed_v2_session_fixtures_v0_1.json').cases;

const ORDER = ['IDENTITEIT', 'SCORES (12-PUNTS WIEL)', 'MANDJE DECOMPOSITIE', 'KEUZE / ECHO PER GROEP', 'AFGELEIDE INDICES',
  'ANTWOORDSTIJL', 'OCEAN PROFIEL (EXTERN GEUPLOAD)', 'COGNITIEVE DRIEHOEK (YELLOW)', 'HARDWARE SIGNALEN',
  'EXTENDED ARCHETYPE PROFIEL', 'SHADOW INTEGRATIE', 'BLINDSPOT'];

function build(questions, ocean = null, language = 'nl') {
  const s = B.scoreSession(questions);
  const { payload } = runPipeline({ scores: s.totals_u, main: s.main, support: s.support,
    geometry: { shadow: s.shadow, blindspot: redLinePartner(s.main) }, language: 'nl' });
  const tags = S.styleTags(questions, { main: s.main, support: s.support, totals: s.totals_u, polarizationLevel: s.polarizationLevel }).tags;
  const supportEdit = E.support_edit_band({ scores: s.totals_u, main: s.main }, s.support);
  return { s, payload, tags, supportEdit, blocks: buildDataBlock({ session: s, payload, supportEdit, styleTags: tags, ocean, language }) };
}

for (const [name, c] of Object.entries(sessions)) {
  test(`${name}: the §7 blocks, in order, filled from the engine`, () => {
    const { s, payload, tags, supportEdit, blocks } = build(c.questions);
    const titles = blocks.map((b) => b.title);
    assert.deepEqual(titles, ORDER.filter((t) => t !== 'OCEAN PROFIEL (EXTERN GEUPLOAD)' && (t !== 'ANTWOORDSTIJL' || tags.length)));
    const get = (t) => blocks.find((b) => b.title === t).lines;
    // IDENTITEIT: Tetrad only for a Ruling or Chaos pair; Support-herkomst always on v2
    assert.equal(get('IDENTITEIT').includes('Tetrad: ja'), s.tetrad);
    assert.ok(get('IDENTITEIT').includes(`Support-herkomst: ${s.support_herkomst}`));
    assert.ok(get('IDENTITEIT').some((l) => /^Main-Support lijntype: \S+ Lijn$/.test(l)));
    // the group view is the payload line, verbatim
    assert.deepEqual(get('KEUZE / ECHO PER GROEP'), s.payload_block.split('\n').slice(1));
    assert.ok(get('AFGELEIDE INDICES').includes(`Support-bewerking: ${supportEdit}`));
    assert.equal(get('MANDJE DECOMPOSITIE').length, 12);
    // HARDWARE SIGNALEN: the register fields, the active set with roles, the four stamps
    const hw = get('HARDWARE SIGNALEN').join('\n');
    for (const f of ['register_baseline_pct:', 'register_transform_pct:', 'inversies:', 'actieve_set:', 'stempels:']) assert.ok(hw.includes(f), f);
    for (const k of Object.keys(payload.stamps)) assert.ok(hw.includes(`${k}=${payload.stamps[k]}`), k);
    assert.ok(hw.includes(`${s.main} (main)`));
  });
}

test('never on the data block: compute values, the answer sheet, Nature/Culture, the Authenticity Index', () => {
  for (const c of Object.values(sessions)) {
    const text = dataBlockText(build(c.questions).blocks);
    assert.doesNotMatch(text, /τ|tau'|tau_prime|baseline_arc|transform_arc|displacement|per_state|c_modulation|\bw=|pull/i);
    assert.doesNotMatch(text, /nature|culture|authenticity|nat_core|cult_core/i);
    assert.doesNotMatch(text, /antwoordformulier|INDIVIDUELE ANTWOORDEN|vraag \d/i);
  }
});

test('ANTWOORDSTIJL appears only with a fired tag, with its code and one-line meaning; OCEAN only with an upload', () => {
  const withTag = build(sessions.fallback_heavy.questions);
  assert.deepEqual(withTag.blocks.find((b) => b.title === 'ANTWOORDSTIJL').lines,
    ['V-PRECISION — Passieve identiteit alleen op groepsniveau lezen; niet als besluiteloosheid.']);
  assert.ok(!build(sessions.concentrated_lover.questions).blocks.some((b) => b.title === 'ANTWOORDSTIJL'));
  const ocean = build(sessions.selftest_example.questions, { O: 71, C: 40, E: 55, A: 62, N: 30 }).blocks.find((b) => b.title === 'OCEAN PROFIEL (EXTERN GEUPLOAD)');
  assert.deepEqual(ocean.lines, ['Openheid: 71/100', 'Consciëntieusheid: 40/100', 'Extraversie: 55/100', 'Meegaandheid: 62/100', 'Neuroticisme: 30/100']);
});

test('W5: without register_bands the block names the gap instead of printing band labels', () => {
  const { s, payload, supportEdit } = build(sessions.selftest_example.questions);
  const bare = { ...payload, main: { ...payload.main, register: { ...payload.main.register, band_labels: null } } };
  const hw = buildDataBlock({ session: s, payload: bare, supportEdit }).find((b) => b.title === 'HARDWARE SIGNALEN').lines;
  assert.ok(hw.includes('banden: ontbreken (register_bands niet geleverd)'));
  assert.ok(!hw.some((l) => l.startsWith('banden (')));
});

test('refuses what it is not for: a v1 session, a payload for another Main/Support, a missing band', () => {
  const { s, payload, supportEdit } = build(sessions.selftest_example.questions);
  assert.throws(() => buildDataBlock({ session: { ...s, scoring_version: 'v1_nature_culture' }, payload, supportEdit }), /v2 sessions/);
  assert.throws(() => buildDataBlock({ session: { ...s, support: 'Hero' }, payload, supportEdit }), /disagree/);
  assert.throws(() => buildDataBlock({ session: s, payload }), /P11 band/);
});

// English reports (owner, 13 Oct; Data Block Labels EN v0.1): English titles and labels, the same values,
// codes kept as codes; `key` stays the Dutch title so lookups never depend on the language.
const DUTCH = /\b(keuze|passief|groen|blauw|paars|geel|totaal|gekozen|herkomst|bewerking|lijntype|Lijn|groep|positie|inversies|banden|leeg|geen|stempels|actieve|Driehoek|Nummer|Naam|Extensie|Polarisatie|ja|zacht|merkbaar|sterk|laag|gemiddeld|schaduw|spanning|Openheid|niet)\b/;

for (const [name, c] of Object.entries(sessions)) {
  test(`${name}: English report — English titles and labels, the same values`, () => {
    const nl = build(c.questions, { O: 71, C: 40, E: 55, A: 62, N: 30 });
    const en = build(c.questions, { O: 71, C: 40, E: 55, A: 62, N: 30 }, 'en');
    assert.deepEqual(en.blocks.map((b) => b.key), nl.blocks.map((b) => b.key));
    assert.deepEqual(en.blocks.map((b) => b.title), nl.blocks.map((b) => TITLES_EN[b.key]));
    for (const b of en.blocks) {
      for (const l of b.lines) {
        if (/^(Name NL|Extension):/.test(l)) continue; // the extension's Dutch name is a name
        assert.doesNotMatch(l, DUTCH, `${b.key}: ${l}`);
      }
    }
    // every number on the page is the same in both languages
    const nums = (blocks) => blocks.map((b) => b.lines.join(' ').match(/-?\d+(\.\d+)?/g));
    assert.deepEqual(nums(en.blocks), nums(nl.blocks));
    const get = (blocks, k) => blocks.find((b) => b.key === k).lines;
    assert.equal(get(en.blocks, 'IDENTITEIT').includes('Tetrad: yes'), nl.s.tetrad);
    assert.ok(get(en.blocks, 'IDENTITEIT').some((l) => /^Main-Support line type: (Green|Blue|Purple|Red) Line$/.test(l)));
    assert.ok(get(en.blocks, 'IDENTITEIT').includes(`Support origin: ${{ keuze: 'chosen', passief: 'passive', echo: 'echo' }[nl.s.support_herkomst]}`));
    assert.ok(get(en.blocks, 'AFGELEIDE INDICES').includes(`Support editing: ${{ zacht: 'soft', merkbaar: 'noticeable', sterk: 'strong' }[nl.supportEdit]}`));
    assert.match(get(en.blocks, 'KEUZE / ECHO PER GROEP')[0],
      /^Ruling: chosen \S+ \| passive \S+ \| echo from own hardware \S+ \| echo from the wheel \S+ \| total \S+ \| chosen share \d+%$/);
    assert.match(get(en.blocks, 'MANDJE DECOMPOSITIE')[0], /^Judge: chosen \S+ \| passive \S+ \| green \S+ \| blue \S+ \| blue \(internal\) \S+ \| purple \S+ \| yellow \S+$/);
  });
}

test('English report: the style lines mirror the labels file, codes stay codes', () => {
  const lines = build(sessions.fallback_heavy.questions, null, 'en').blocks.find((b) => b.key === 'ANTWOORDSTIJL');
  assert.equal(lines.title, 'RESPONSE STYLE');
  assert.deepEqual(lines.lines, ['V-PRECISION — Read passive identity at group level only; not as indecision.']);
  assert.ok(!dataBlockText(build(sessions.selftest_example.questions, null, 'en').blocks).includes('-- IDENTITEIT --'));
});
