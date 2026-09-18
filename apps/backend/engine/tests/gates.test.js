/**
 * Acceptance gates — Backend Instruction v1 §5, against tests/backend_test_fixtures_v1.json.
 * Run: `node --test engine/tests` (from apps/backend) or `pnpm --filter @gfl/backend test:gates`.
 *
 *   Gate 1  Loader                 — offline, here
 *   Gate 2  Engine (to the decimal) — offline, here
 *   Gate 3  Manifest               — offline, here
 *   Gate 4  Payload schema         — offline, here
 *   Gate 5  Report dry-run         — model call: engine/dryRun.js
 *   Gate 6  Guards                 — RoleError here; withheld-section half in engine/dryRun.js
 * Plus the deploy absent-check (§1): no superseded artifact anywhere in the tree.
 *
 * A drifted number identifies its own layer — never edit the fixture to make a gate pass.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const E = require('../runtimeEngine');
const R = require('../corpusResolver');
const { runPipeline, corpusName } = require('../index');
const { ENRICHMENT_FIELDS } = require('../payload');
const { loadCorpus } = require('../../services/corpusData');
const { compile, contentHash } = require('../../scripts/compile-workbook');
const VERSIONS = require('../../config/versions');
const fixtures = require('./backend_test_fixtures_v1.json');

const STATES = ['D1', 'D2', 'D3', 'D4', 'D5'];
const { layer2, arcs, c_cells, tau_version, register_bands } = E.loadEngine();
const ALWAYS = ['always/frame_extract', 'always/claim', 'always/anchors', 'always/nature_culture', 'always/methodology_principles', 'always/wheel_mechanics'];

/** Wheel rules, stated independently of services/lineType.js: the archetype at a position, and the Main's red partner. */
const POS = Object.fromEntries(Object.entries(loadCorpus('en').archetypes).map(([n, a]) => [n, Number(a.position)]));
const atPos = (p) => Object.keys(POS).find((n) => POS[n] === ((((p - 1) % 12) + 12) % 12) + 1);
const redOf = (main) => atPos(7 - POS[main] + 12);
/** The bleed engine's resolved wheel facts for a Main, as the payload's geometry carries them. */
const wheelOf = (main) => ({ shadow: atPos(POS[main] + 6), blindspot: redOf(main) });
const groupOf = (n) => R.GROUPS.find((x) => x.members.includes(n)).key;

const pipelineFor = (c, language = 'nl') =>
  runPipeline({ scores: c.input_scores, main: c.main, support: c.expected.codrivers[0], language, geometry: { scores: c.input_scores, ...wheelOf(c.main) } });

/** Table v1.1 §8, per fixture, written out: the Schaduw-pakket objects each fixture's slice carries. */
const SHADOW_PACK = {
  stacked_pull: ['shadow_pack/shadow/Outlaw'],                                   // Ruler: shadow Outlaw + blindspot Trickster share Chaos → §1 + §6 once
  agency_entry: ['shadow_pack/shadow/Innocent', 'shadow_pack/blindspot/Artist'], // Seeker and Abstract both outside the active set
  heavy_orth: ['shadow_pack/blindspot/Hero'],                                    // shadow Lover: Relational is active → no shadow object
  hero_hole: ['shadow_pack/shadow/Explorer', 'shadow_pack/blindspot/Sage'],
  threshold_edge: ['shadow_pack/blindspot/Explorer'],                            // shadow Sage: Abstract is active → no shadow object
};

/**
 * Absence check, language-agnostic: every Rosetta section the manifest's objects do NOT license must be
 * absent from the slice text (probed by the opening of its body). Licensed = wheel mechanics, the shipped
 * groups' bound sections, and — when TNM ships — the preamble and the shipped entries; minus [STAGED].
 */
function sliceLeaks(manifest, language) {
  const b = R.bindings();
  const ids = manifest.documents.map((d) => d.id);
  const licensed = new Set([b.wheel, ...b.front.map(([, i]) => i)]);
  for (const g of Object.values(b.groups)) if (ids.includes(`group/${g.key}`)) g.indices.forEach((i) => licensed.add(i));
  for (const g of Object.values(b.groups)) {
    if (g.members.some((m) => ids.includes(`shadow_pack/shadow/${m}`))) [g.identity, g.biochem].forEach((i) => licensed.add(i));
    if (g.members.some((m) => ids.includes(`shadow_pack/blindspot/${m}`))) licensed.add(g.biochem);
  }
  if (ids.includes('tnm/preamble')) b.tnm.preamble.forEach((i) => licensed.add(i));
  for (const [n, i] of Object.entries(b.tnm.entries)) if (ids.includes(`tnm/entry/${n}`)) licensed.add(i);
  b.staged.forEach((i) => licensed.delete(i));
  const leaks = [];
  uniqueProbes(language).forEach((probe, i) => {
    if (probe && !licensed.has(i) && manifest.text.includes(probe)) leaks.push(`${i} ${loadCorpus(language).framework_rosetta[i].title}`);
  });
  return leaks;
}
/** Per section: the first 160-char window of its body that occurs exactly once in the whole Rosetta
 *  (sibling chapters share boilerplate openings, so a plain prefix is not a fingerprint). */
const _probes = {};
function uniqueProbes(language) {
  if (_probes[language]) return _probes[language];
  const ros = loadCorpus(language).framework_rosetta;
  const all = ros.map((s) => s.body).join('\n\n');
  const once = (w) => { const a = all.indexOf(w); return a >= 0 && all.indexOf(w, a + 1) < 0; };
  _probes[language] = ros.map((s) => {
    const body = String(s.body);
    for (let at = 0; at + 160 <= body.length; at += 60) { const w = body.slice(at, at + 160); if (once(w)) return w; }
    return null;
  });
  return _probes[language];
}

test('Gate 1 — loader integrity', () => {
  const x = fixtures.loader_expectations;
  assert.equal(layer2.size, x.articulations);
  const census = {};
  for (const a of layer2.values()) census[a.locus] = (census[a.locus] || 0) + 1;
  assert.deepEqual(census, x.locus_census);
  assert.deepEqual(arcs.Hero, x.hero_arc);
  assert.equal(E.PROVISIONAL_SCALARS_L3.tau_overrides.size, x.tau_values);
  assert.equal(Object.keys(c_cells).length, 12, '12 C-direction maps');
  assert.equal(tau_version, VERSIONS.tau_calibration_version);
});

test('Gate 1 — the engine loads the compiled workbook JSON, current and checksum-true', () => {
  assert.ok(E.WORKBOOK.endsWith('.json'), 'engine reads the compiled JSON, never the .xlsx');
  const onDisk = JSON.parse(fs.readFileSync(E.WORKBOOK, 'utf8'));
  const fresh = compile();
  assert.equal(onDisk.content_sha256, contentHash(onDisk.sheet_order, onDisk.sheets), 'content checksum verifies');
  assert.equal(onDisk.source.sha256, fresh.source.sha256, 'compiled from the .xlsx on disk (re-run scripts/compile-workbook.js)');
  assert.equal(onDisk.content_sha256, fresh.content_sha256);
  // Provenance amendment (human-ratified 2026-09-16): confidence labels only, appended after the original record
  const prov = onDisk.sheets.Provenance;
  const at = prov.findIndex((r) => r[0] === 'AMENDMENT — human-ratified 2026-09-16');
  assert.equal(at, 14, 'amendment block follows the 13 original rows and a blank row');
  assert.deepEqual(prov.slice(at + 1, at + 8).map((r) => [r[0], r[2]]), [
    ['Polarity', 'CONFIRMED'], ['Sense', 'CONFIRMED'], ['Locus', 'VERIFIED-REGENERABLE'],
    ['Direction', 'CONFIRMED'], ['Class', 'CONFIRMED'], ['C1', 'CONFIRMED'], ['Flag', 'CONFIRMED'],
  ]);
  assert.ok(prov.some((r) => r[0] === '(not present) definitions' && r[2] === 'lost'), 'the loss record stays');
});

test('Gate 1 — τ has one home: every value the engine uses comes from the Tau_Calibration sheet', () => {
  const sheet = JSON.parse(fs.readFileSync(E.WORKBOOK, 'utf8')).sheets.Tau_Calibration.slice(1).filter((r) => r[0]);
  assert.equal(sheet.length, 12);
  for (const r of sheet) {
    STATES.forEach((st, i) => {
      assert.ok(E.PROVISIONAL_SCALARS_L3.tau_overrides.has(`${r[0]}\u0000${st}`), `${r[0]} ${st} resolves from the sheet, not tau_default`);
      assert.equal(E.tau(r[0], st), Number(r[4 + i]));
    });
  }
});

test('Gate 1 — register bands load from Band_Cutpoints_v0_PROVISIONAL (R4), contiguous, stamped', () => {
  assert.equal(register_bands.version, VERSIONS.register_bands_version);
  assert.deepEqual(register_bands.bands.map((b) => [b.label, b.min, b.max]), [
    ['laag', null, 25], ['gemiddeld', 25, 50], ['boven gemiddeld', 50, 70], ['ver boven gemiddeld', 70, 90], ['extreem hoog', 90, null],
  ]);
  assert.match(register_bands.scale, /register %/);
});

test('R4/R5 — band labels: bounds, sign, holes, and a known configuration', () => {
  const L = (v) => E.band_of(v, register_bands);
  assert.deepEqual([0, 24.9, 25, 49.9, 50, 69.9, 70, 89.9, 90, 100].map(L), [
    'laag', 'laag', 'gemiddeld', 'gemiddeld', 'boven gemiddeld', 'boven gemiddeld', 'ver boven gemiddeld', 'ver boven gemiddeld', 'extreem hoog', 'extreem hoog',
  ], 'lower bound inclusive, upper bound exclusive');
  assert.equal(L(-100), 'extreem hoog', 'sign is direction, the band is magnitude');
  assert.equal(L(-24.9), 'laag');
  assert.strictEqual(L(null), null, 'a hole has no band');
  const hole = E.register_band_labels({
    register_baseline_pct: [58.2, 61.1, 59.3, 20.3, 12.8], register_transform_pct: [34.9, null, -41.5, 100, 49],
  }, register_bands);
  assert.deepEqual(hole, {
    baseline: { D1: 'boven gemiddeld', D2: 'boven gemiddeld', D3: 'boven gemiddeld', D4: 'laag', D5: 'laag' },
    transform: { D1: 'gemiddeld', D2: null, D3: 'gemiddeld', D4: 'extreem hoog', D5: 'gemiddeld' },
  });
});

test('C-path parity — services/cMagnitude matches c_magnitude_precompute_v2_2.py output field for field', () => {
  const { precompute } = require('../../services/cMagnitude');
  // Python serialises a signed zero as -0.0; JSON has one zero (Node writes 0), so compare on the wire value.
  const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'c_magnitude_parity_v2_2.json'), 'utf8'), (k, v) => (Object.is(v, -0) ? 0 : v));
  assert.ok(fx.cases.length >= 60 && fx.cases.some((c) => c.label === 'tie'), 'fixture covers real, synthetic and the rounding tie');
  assert.ok(fx.cases.some((c) => c.expected.unresolved_edges.length > 1), 'fixture covers a multi-edge refusal list (order)');
  for (const c of fx.cases) {
    const storedD = c.storedD === 'matrix_v43' ? fx.storedD_matrix_v43 : c.storedD;
    const js = JSON.parse(JSON.stringify(precompute(c.geo, storedD, c.effect)));
    // every Python field exactly, the deduped + sorted refusal list included (d_curve is Node-only)
    for (const [k, v] of Object.entries(c.expected)) assert.deepEqual(js[k], v, `${c.label}: ${k}`);
  }
});

for (const [name, c] of Object.entries(fixtures.cases)) {
  test(`Gate 2 — engine to the decimal: ${name}`, () => {
    const geo = new E.RuntimeGeometry({ scores: c.input_scores, main: c.main });
    const r = E.compose_transform_v4(geo, layer2, arcs);
    const reg = E.register_layer(r);
    const x = c.expected;
    assert.deepEqual(r.codrivers.map((d) => d.name), x.codrivers, 'active-set membership');
    assert.equal(1 + r.codrivers.length, x.active_set_size);
    assert.deepEqual(r.baseline_arc, x.baseline_arc);
    assert.deepEqual(r.transform_arc, x.transform_arc_compute);
    assert.deepEqual(reg.register_transform_pct, x.register_transform_pct);
    assert.equal(reg.dynamic_ceiling_compute, x.dynamic_ceiling_compute);
    assert.deepEqual(reg.inverted_states, x.inverted_states);
    assert.equal(r.tracking_pulls.length, x.tracking_pulls);
    assert.equal(r.operational_ledger.length, x.operational_ledger);
    assert.equal(r.orth_ledger.length, x.orth_ledger);
    assert.equal(r.entry_reads.length, x.entry_reads);
  });

  test(`Gate 3 — manifest matches Corpus Lookup Table v1 exactly, absences included: ${name}`, () => {
    for (const language of ['nl', 'en']) {
      const { manifest, result } = pipelineFor(c, language);
      const active = [c.main, ...result.codrivers.map((d) => d.name)];
      const groups = [];
      for (const n of active) { const g = R.GROUPS.find((x) => x.members.includes(n)).key; if (!groups.includes(g)) groups.push(g); }
      // §0 + §8: ALWAYS + one GROUP-block per touched group (siblings dedupe) + the Schaduw-pakket + ONE extension
      // cell; no culture picks → no TNM
      assert.deepEqual(manifest.documents.map((d) => d.id), [
        ...ALWAYS, ...groups.map((g) => `group/${g}`), ...SHADOW_PACK[name],
        `extension/${c.main}×${c.expected.codrivers[0]}`,
      ]);
      // the written-out list is the §8 rule: the shadow's §1 + §6 only when its group is absent (the absence is an
      // assertion too); the blindspot's §6 unless a group block or the shadow object already carries it
      const { shadow, blindspot } = wheelOf(c.main);
      const shadowShips = !groups.includes(groupOf(shadow));
      assert.equal(manifest.documents.some((d) => d.id === `shadow_pack/shadow/${shadow}`), shadowShips);
      assert.equal(manifest.documents.some((d) => d.id === `shadow_pack/blindspot/${blindspot}`),
        !groups.includes(groupOf(blindspot)) && !(shadowShips && groupOf(shadow) === groupOf(blindspot)));
      assert.deepEqual(manifest.shadow_pack, { shadow, blindspot, objects: SHADOW_PACK[name] });
      assert.equal(manifest.corpus_manifest_version, VERSIONS.corpus_manifest_version);
      assert.deepEqual(sliceLeaks(manifest, language), [], 'no Rosetta section outside the table ships');
      // §4: the cell is the ratified row, verbatim, in this twin's language
      const rec = loadCorpus(language).archetypes[c.main].extensions.find((x) => x.support === c.expected.codrivers[0]);
      for (const field of ['name', 'name_nl', 'gift', 'curse', 'levensles']) assert.ok(manifest.text.includes(rec[field]), `cell carries ${field} verbatim`);
      const again = pipelineFor(c, language).manifest;
      assert.equal(again.text, manifest.text, 'manifest is a pure function of its arguments');
    }
  });

  test(`Gate 4 — payload schema, role tags, null-not-zero, stamps: ${name}`, () => {
    const { payload, result } = pipelineFor(c);
    const isArc = (a) => Array.isArray(a) && a.length === 5 && a.every((v) => v === null || typeof v === 'number');
    const m = payload.main;
    assert.equal(m.role, 'main');
    assert.equal(m.name, c.main);
    assert.ok(isArc(m.baseline_arc) && isArc(m.transform_arc));
    assert.deepEqual(Object.keys(m.per_state), STATES);
    for (const ps of Object.values(m.per_state)) {
      assert.ok(['tau', 'pull', 'tau_prime'].every((k) => typeof ps[k] === 'number') && Array.isArray(ps.terms));
    }
    assert.ok(isArc(m.register.register_baseline_pct) && isArc(m.register.register_transform_pct));
    assert.deepEqual(Object.keys(m.register.register_displacement_pct), STATES);
    assert.ok(Array.isArray(m.register.inverted_states));
    assert.match(m.register.register_statement, /^TRANSPERSONAL TOPOLOGY TRANSLATION \(T3\)/);
    assert.equal(m.register.dynamic_ceiling_compute, undefined, 'compute ceiling stays internal');
    // R4/R5 — band label per D-state for both curves, read on |value| against the sheet (min inclusive, max exclusive)
    const expectLabel = (v) => (v === null ? null
      : register_bands.bands.find((b) => (b.min === null || Math.abs(v) >= b.min) && (b.max === null || Math.abs(v) < b.max)).label);
    for (const [curve, arc] of [['baseline', m.register.register_baseline_pct], ['transform', m.register.register_transform_pct]]) {
      assert.deepEqual(m.register.band_labels[curve], Object.fromEntries(STATES.map((st, i) => [st, expectLabel(arc[i])])), `${curve} band labels`);
    }
    assert.deepEqual(Object.keys(m.displacement), STATES);
    assert.ok(Array.isArray(m.holes));
    assert.deepEqual(Object.keys(m.enrichment), STATES);
    const cells = loadCorpus('en').archetypes[c.main].D_states;
    for (const st of STATES) {
      const cell = cells[Object.keys(cells).find((k) => k.startsWith(`${st} `))];
      for (const f of ENRICHMENT_FIELDS) assert.strictEqual(m.enrichment[st][f], cell[f] ?? null, `enrichment ${st}.${f} is the Main's cell verbatim`);
    }

    const s = payload.support;
    assert.equal(s.role, 'support');
    assert.equal(s.name, c.expected.codrivers[0]);
    assert.equal(typeof s.w, 'number');
    const dirs = c_cells[s.name];
    const noChannel = Object.keys(dirs).filter((f) => dirs[f] === null);
    assert.ok(noChannel.length > 0, 'fixture Support has at least one no-channel function');
    for (const f of Object.keys(dirs)) {
      if (dirs[f] === null) assert.strictEqual(s.c_modulation[f], null, `no channel must serialise as null, not ${s.c_modulation[f]}`);
      else assert.equal(typeof s.c_modulation[f], 'number');
    }
    assert.ok(!JSON.stringify(s.c_modulation).includes('"null"'));

    assert.equal(payload.codrivers.length, result.codrivers.length);
    for (const cd of payload.codrivers) {
      assert.equal(cd.role, 'support');
      assert.equal(typeof cd.w, 'number');
      assert.deepEqual(Object.keys(cd.per_state_terms), STATES);
    }
    for (const ch of ['orth_ledger', 'entry_reads', 'tracking_pulls', 'operational_ledger']) {
      assert.ok(Array.isArray(payload[ch]));
      for (const e of payload[ch]) assert.equal(e.role, 'support', `${ch} entry without role tag`);
    }
    assert.ok('geometry' in payload);
    // table v1.1 §8 — only the Main's links ship: one green, blue, purple, red partner and two yellow partners
    assert.deepEqual(Object.keys(payload.links), ['main', 'green', 'blue', 'purple', 'red', 'yellow']);
    assert.equal(payload.links.main, c.main);
    assert.deepEqual([payload.links.purple, payload.links.red], [wheelOf(c.main).shadow, wheelOf(c.main).blindspot]);
    assert.equal(payload.links.yellow.length, 2);
    // R5 — exactly the four stamps
    assert.deepEqual(payload.stamps, {
      tau_calibration_version: VERSIONS.tau_calibration_version,
      corpus_manifest_version: VERSIONS.corpus_manifest_version,
      register_bands_version: VERSIONS.register_bands_version,
      workbook: VERSIONS.workbook,
    });
    // R4 — register_bands ride in the payload, identical to the sheet
    assert.deepEqual(payload.register_bands, register_bands);
    // §5.7 / §5.10 — extension identity at 132-grain, verbatim from the corpus record, no narrative text
    const rec = loadCorpus('en').archetypes[c.main].extensions.find((x) => x.support === s.name);
    assert.deepEqual(payload.extension, { role: 'main', n: rec.n, name_en: rec.name, name_nl: rec.name_nl, main: c.main, support: s.name });
    assert.ok(!/gift|curse|levensles/.test(JSON.stringify(payload.extension)), 'extension identity carries no narrative text');
  });
}

test('Gate 3 — TNM: preamble once + one entry per culture-picked ACTIVE archetype, nothing else', () => {
  const c = fixtures.cases.hero_hole;
  const active = [c.main, ...c.expected.codrivers];
  const outside = Object.keys(c.input_scores).find((n) => !active.includes(n));
  const run = (culturePicks, language = 'nl') => runPipeline({ scores: c.input_scores, main: c.main, support: c.expected.codrivers[0], culturePicks, language, geometry: wheelOf(c.main) }).manifest;

  assert.ok(!run([outside]).documents.some((d) => d.id.startsWith('tnm/')), 'a pick outside the active set ships nothing, not even the preamble');
  for (const language of ['nl', 'en']) {
    const m = run([c.expected.codrivers[1], outside, c.main], language);
    assert.deepEqual(m.documents.filter((d) => d.id.startsWith('tnm/')).map((d) => d.id),
      ['tnm/preamble', `tnm/entry/${c.main}`, `tnm/entry/${c.expected.codrivers[1]}`]);
    assert.deepEqual(sliceLeaks(m, language), [], 'no triangle bodies, AI-reading scenarios or web-audit beyond the table');
  }
  // the preamble is exactly the table's headings — "Cognitive Weaknesses & Fallacies" binds under every triangle
  const b = R.bindings();
  const en = loadCorpus('en').framework_rosetta;
  assert.deepEqual(b.tnm.preamble.map((i) => R.norm(en[i].title)), [
    'introduction: what are the yellow triangles?', 'overview: the four triangles',
    'cognitive weaknesses & fallacies', 'cognitive weaknesses & fallacies', 'cognitive weaknesses & fallacies', 'cognitive weaknesses & fallacies',
    'per-archetype layer - profile sec 1-2 supply',
  ]);
});

test('Gate 3 — the always-block (Frame Extract · claim · nine anchors · Nature/Culture · M1/M2 · wheel mechanics) is identical in every call', () => {
  const sets = [
    ...Object.values(fixtures.cases).map((c) => ({ scores: c.input_scores, main: c.main, support: c.expected.codrivers[0] })),
    { scores: fixtures.cases.hero_hole.input_scores, main: 'Hero', support: 'Magician', culturePicks: ['Magician', 'Ruler'] },
  ];
  for (const language of ['nl', 'en']) {
    const { corpus, docs } = { corpus: loadCorpus(language), docs: R.registry(language).docs };
    const ros = corpus.framework_rosetta;
    const b = R.bindings();
    const titleOf = (i) => R.norm(loadCorpus('en').framework_rosetta[i].title);
    assert.deepEqual(b.front.map(([id]) => id), ['claim', 'anchors', 'nature_culture']);
    assert.match(titleOf(b.front[0][1]), /^1 - the claim, stated plainly/);
    assert.match(titleOf(b.front[1][1]), /^3 - the load-bearing spine/);
    assert.match(titleOf(b.front[2][1]), /^5 - nature and culture: the two layers/);
    assert.match(corpus.framework_masthead[b.principles], /\(M1\)[\s\S]*\(M2\)/, 'the principles paragraph carries M1 and M2');
    let first = null;
    for (const p of sets) {
      const m = runPipeline({ ...p, language, geometry: wheelOf(p.main) }).manifest;
      assert.deepEqual(m.documents.slice(0, ALWAYS.length).map((d) => d.id), ALWAYS);
      const block = ALWAYS.map((id) => docs.get(id).text).join('\n');
      if (first === null) first = block;
      assert.equal(block, first, 'always-block does not depend on the archetypes');
      for (const [id, i] of b.front) assert.ok(m.text.includes(ros[i].body), `${id} ships verbatim`);
      assert.ok(m.text.includes(corpus.framework_masthead[b.principles]), 'M1/M2 ship verbatim');
      corpus.framework_masthead.forEach((para, i) => {
        if (i !== b.principles && para.length > 200) assert.ok(!m.text.includes(para.slice(20, 180)), `masthead paragraph ${i} (changelog/lineage) must not ship`);
      });
    }
  }
});

test('Gate 3 — every Lookup Table heading binds; [STAGED] filtered at bind time; NEVER headings never ship', () => {
  const b = R.bindings();
  const en = loadCorpus('en').framework_rosetta;
  assert.deepEqual(b.staged.map((i) => R.norm(en[i].title)), ['epilogue - the hardware database'], 'a standalone banner drops its whole section (GEO-2L epilogue)');
  for (const g of Object.values(b.groups)) assert.equal(g.indices.length, 9, `${g.key}: header + §1–§7 + §10, each its own section`);
  // an inline banner drops only its cell's staged text: Seeker §1 ships, without the non-canon re-type claim
  const seekerId = b.groups.seeker.indices[1];
  assert.deepEqual(b.stagedInline, [seekerId]);
  // Rosetta v1.4.11's dependency markers ("[STAGED-afhankelijk — …]") do not stage a section: the marker and the
  // clause it tags (the staged Seeker re-type) are dropped, the rest ships (HG3 §1, HG4 chapter opening, HG4 §5);
  // the corpus keeps both verbatim. The shipped text is written out here, independent of the resolver's clause list.
  assert.deepEqual(b.dependent, [b.groups.agency.identity, b.groups.seeker.indices[0], b.groups.seeker.indices[5]]);
  const dependentCases = {
    en: {
      seamRow: '| Hardware seam (red) | Magician ↔ Artist (9). Hero ↔ Sage (8). Hardware opposition to Abstract/DMN — task-positive against task-negative (A3). |',
      seeker: [
        'F4 function-inversion, not a hardware opposite). All corpus data extracted from the Archetype folder + web audit (2020–2026).\n\n### 1 — ',
        'The hardware seam (red) is the Relational/Limbic coupling. The Seeker push/pull',
        'the mirror of Agency’s own paths.*\n\n### 6 — ',
      ],
      dropped: ['This, not the Seeker, is Agency’s hardware antagonist.', 'the Seeker has no hardware antagonist', 'not a hardware antagonist'],
    },
    nl: {
      seamRow: '| Hardware-naad (rood) | Magiër ↔ Kunstenaar (9). Held ↔ Wijze (8). Hardware-oppositie tot Abstract/DMN — taak-positief tegen taak-negatief (A3). |',
      seeker: [
        'F4 functie-inversie, geen hardware-tegenpool). Alle corpus-data geëxtraheerd uit de Archetype-map + web-audit (2020–2026).\n\n### 1 — ',
        'De hardware-naad (rood) is de Relationeel/Limbische koppeling. De Zoeker duw/trek',
        "de spiegel van Actie's eigen paden.*\n\n### 6 — ",
      ],
      dropped: ['Dit, niet de Zoeker, is de hardware-antagonist van Actie.', 'de Zoeker heeft geen hardware-antagonist', 'geen hardware-antagonist'],
    },
  };
  for (const [language, x] of Object.entries(dependentCases)) {
    const { docs } = R.registry(language);
    const ros = loadCorpus(language).framework_rosetta;
    const everything = [...docs.values()].map((d) => d.text).join('\n');
    for (const i of b.dependent) assert.ok(ros[i].body.includes('[STAGED-afhankelijk — '), `${language}: corpus keeps the marker in ${i}`);
    for (const phrase of x.dropped) {
      assert.ok(b.dependent.some((i) => ros[i].body.includes(phrase)), `${language}: corpus keeps "${phrase}"`);
      assert.ok(!everything.includes(phrase), `${language}: "${phrase}" ships in no object`);
    }
    assert.ok(!everything.includes('[STAGED-afhankelijk'), `${language}: no marker in any object`);
    assert.ok(docs.get('group/agency').text.split('\n').includes(x.seamRow), `${language}: HG3 seam row ships without the clause`);
    for (const s of x.seeker) assert.ok(docs.get('group/seeker').text.includes(s), `${language}: Seeker text ships clean: ${s.slice(0, 40)}…`);
    for (const i of b.dependent) {
      for (const line of ros[i].body.split('\n').filter((l) => !l.includes('[STAGED-afhankelijk'))) {
        assert.ok(everything.includes(line), `${language}: every unmarked line of section ${i} ships verbatim`);
      }
    }
  }
  const seam = {
    en: ['| Hardware seam (red) | Innocent ↔ Caregiver (3). Explorer ↔ Lover (2). |', 'No hardware antagonist: the Seeker reinforces Motor'],
    nl: ['| Hardware-naad (rood) | Onschuldige ↔ Verzorger (3). Ontdekker ↔ Minnaar (2). |', 'Geen hardware-antagonist: de Zoeker versterkt Motor'],
  };
  for (const [language, [row, claim]] of Object.entries(seam)) {
    const ros = loadCorpus(language).framework_rosetta;
    assert.ok(ros[seekerId].body.includes(claim), `${language}: corpus still holds the staged claim (canon untouched)`);
    const text = R.registry(language).docs.get('group/seeker').text;
    assert.ok(text.includes(`### ${ros[seekerId].title}`), `${language}: Seeker §1 ships`);
    assert.ok(text.split('\n').includes(row), `${language}: the seam row keeps its canon text`);
    assert.ok(!text.includes(claim), `${language}: the staged claim does not ship`);
    const rest = ros[seekerId].body.split('\n').filter((l) => !R.STAGED.test(l));
    for (const l of rest) assert.ok(text.includes(l), `${language}: every other §1 line ships verbatim`);
  }
  // the Relational §3/§4 split: §4 is its own section in both twins and §3 no longer carries it
  const rel = b.groups.relational.indices;
  for (const language of ['en', 'nl']) {
    const ros = loadCorpus(language).framework_rosetta;
    assert.match(ros[rel[3]].title, /^3 — /);
    assert.match(ros[rel[4]].title, /^4 — OCEAN/);
    assert.ok(!/OCEAN/.test(ros[rel[3]].body), `${language}: §3 body holds no §4 table`);
    assert.equal(ros[rel[4]].body.split('\n').filter((l) => l.startsWith('|')).length, 7, `${language}: §4 table = header + rule + 5 traits`);
  }
  // run every group and every TNM entry through one EN manifest and check no NEVER heading appears
  const all = runPipeline({ scores: fixtures.cases.hero_hole.input_scores, main: 'Hero', support: 'Magician', language: 'en', geometry: wheelOf('Hero') });
  const { docs } = R.registry('en');
  const everything = [...docs.values()].filter((d) => !d.id.startsWith('extension/')).map((d) => d.text).join('\n\n');
  const headings = [...everything.matchAll(/^### (.+)$/gm)].map((m) => R.norm(m[1]));
  const never = headings.filter((h) => R.NEVER_PATTERNS.some((re) => re.test(h)));
  assert.deepEqual(never, [], 'no object in the registry carries a NEVER-list heading');
  assert.ok(!R.STAGED.test([...R.registry('nl').docs.values(), ...docs.values()].map((d) => d.text).join('\n')), 'no [STAGED] banner in any object');
  assert.ok(all.manifest.token_estimate > 0);
});

test('Links — the stored wheel is the scoring engine\'s (green · blue · purple · red · yellow) and the corpus triangles; the Main\'s row ships', async () => {
  // The bleed engine is ESM with extension-less relative imports (Vite style): resolve those as .js for this import only.
  const hooks = require('node:module').registerHooks({
    resolve(specifier, context, next) {
      try { return next(specifier, context); } catch (e) {
        if (e.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.')) return next(`${specifier}.js`, context);
        throw e;
      }
    },
  });
  let S;
  try { S = await import('../../../../packages/assessment-core/src/data/scoring/index.js'); } finally { hooks.deregister(); }
  const { wheelLinks, mainLinks, redLinePartner } = require('../../services/lineType');
  const up = (n) => n.toUpperCase();
  const b = R.bindings();
  const en = loadCorpus('en');
  const rows = wheelLinks();
  assert.deepEqual(rows.map((r) => r.archetype), Object.keys(POS).sort((x, y) => POS[x] - POS[y]));
  for (const r of rows) {
    const k = up(r.archetype);
    assert.equal(r.position, POS[r.archetype]);
    assert.equal(up(r.green), S.GREEN_LINE[k], `${r.archetype} green`);
    assert.equal(r.green, R.GROUPS.find((g) => g.members.includes(r.archetype)).members.find((m) => m !== r.archetype), `${r.archetype} green = hardware sibling`);
    assert.equal(up(r.blue), S.BLUE_LINE[k], `${r.archetype} blue`);
    assert.equal(up(r.purple), S.PURPLE_LINE[k], `${r.archetype} purple`);
    assert.equal(r.purple, en.archetypes[r.archetype].shadow_archetype, `${r.archetype} purple = the corpus shadow`);
    assert.equal(up(r.red), S.RED_LINE[k], `${r.archetype} red`);
    assert.deepEqual(r.yellow.map(up), S.YELLOW_LINES[k], `${r.archetype} yellow`);
    for (const y of r.yellow) assert.equal(rows.find((x) => x.archetype === y).triangle, r.triangle, `${r.archetype} shares its triangle with ${y}`);
    assert.match(en.framework_rosetta[b.tnm.entries[r.archetype]].title, new RegExp(`[—–-] Triangle ${r.triangle}\\b`), `${r.archetype} triangle`);
    assert.equal(redLinePartner(k), r.red);
    assert.deepEqual(wheelOf(r.archetype), { shadow: r.purple, blindspot: r.red }, 'the gate helper agrees');
    assert.deepEqual(mainLinks(k), { main: r.archetype, green: r.green, blue: r.blue, purple: r.purple, red: r.red, yellow: r.yellow });
  }
  assert.equal(mainLinks('nope'), null);
});

test('Schaduw-pakket — the shadow\'s §1 + §6 and the blindspot\'s §6, each exactly once, verbatim, nothing else', () => {
  const b = R.bindings();
  for (const language of ['nl', 'en']) {
    const ros = loadCorpus(language).framework_rosetta;
    const { docs } = R.registry(language);
    const body = (i) => {
      const inline = b.stagedInline.includes(i) ? R.stripInline(ros[i].body) : ros[i].body;
      return b.dependent.includes(i) ? R.stripDependent(inline, language) : inline;
    };
    const times = (text, i) => text.split(body(i)).length - 1;
    // Every Main, with its shadow's and blindspot's groups in and out of the active set.
    for (const main of Object.keys(POS)) {
      const { shadow, blindspot } = wheelOf(main);
      const sg = b.groups[groupOf(shadow)];
      const bg = b.groups[groupOf(blindspot)];
      for (const active of [[main], [main, shadow], [main, blindspot], [main, shadow, blindspot]]) {
        const m = R.manifest(active, main, active[1] || null, [], { language, shadow, blindspot });
        const ids = m.documents.map((d) => d.id);
        const at = `${language} ${main} [${active.join(', ')}]`;
        const shadowShips = !ids.includes(`group/${sg.key}`);
        assert.equal(ids.includes(`shadow_pack/shadow/${shadow}`), shadowShips, `${at}: shadow object iff its group is absent`);
        assert.equal(ids.includes(`shadow_pack/blindspot/${blindspot}`), !ids.includes(`group/${bg.key}`) && !(shadowShips && sg === bg), `${at}: blindspot object`);
        assert.equal(times(m.text, sg.identity), 1, `${at}: the shadow group's §1 once`);
        assert.equal(times(m.text, sg.biochem), 1, `${at}: the shadow group's §6 once`);
        assert.equal(times(m.text, bg.biochem), 1, `${at}: the blindspot group's §6 once`);
        if (!ids.includes(`group/${bg.key}`) && sg !== bg) assert.equal(times(m.text, bg.identity), 0, `${at}: nothing else of the blindspot's group`);
        assert.deepEqual(m.shadow_pack, { shadow, blindspot, objects: ids.filter((id) => id.startsWith('shadow_pack/')) });
      }
    }
    // The objects themselves: a labelled header, then the sections verbatim, in Rosetta order.
    const heads = (id) => [...docs.get(id).text.matchAll(/^### (.+)$/gm)].map((x) => x[1]);
    const L = language === 'en' ? ['Shadow pack — shadow', 'Shadow pack — blindspot'] : ['Schaduw-pakket — schaduw', 'Schaduw-pakket — blindspot'];
    const { seeker, abstract } = b.groups;
    assert.deepEqual(heads('shadow_pack/shadow/Explorer'), [`${L[0]}: Explorer (${ros[seeker.indices[0]].title})`, ros[seeker.identity].title, ros[seeker.biochem].title]);
    assert.deepEqual(heads('shadow_pack/blindspot/Sage'), [`${L[1]}: Sage (${ros[abstract.indices[0]].title})`, ros[abstract.biochem].title]);
    const hero = R.manifest(['Hero', 'Magician', 'Ruler', 'Judge'], 'Hero', 'Magician', [], { language, shadow: 'Explorer', blindspot: 'Sage' });
    assert.deepEqual(sliceLeaks(hero, language), [], `${language}: only the licensed §1 / §6 of the shadow and blindspot groups ship`);
  }
  // Read, never guessed: no shadow/blindspot → no manifest; a pair that is not the Main's wheel → no manifest.
  assert.throws(() => R.manifest(['Hero'], 'Hero', 'Magician', []), /Schaduw-pakket needs the payload's shadow and blindspot/);
  assert.throws(() => R.manifest(['Hero'], 'Hero', 'Magician', [], { shadow: 'Sage', blindspot: 'Explorer' }), /not Hero's wheel/);

  // The request: the pack rides in the corpus slice, the link table in the payload; system prompt and user blocks unchanged.
  const reportV5 = require('../reportV5');
  const { formatLineTypeBlock } = require('../../services/lineType');
  const c = fixtures.cases.hero_hole;
  const bleed = {
    archetypeKey: 'HERO', supportArchetype: c.expected.codrivers[0].toUpperCase(), shadowArchetype: 'EXPLORER', blindspotArchetype: 'SAGE',
    archetypeDetails: Object.entries(c.input_scores).map(([n, total]) => ({ key: n.toUpperCase(), total })),
  };
  const lineTypeBlock = formatLineTypeBlock({ mainKey: 'HERO', supportKey: bleed.supportArchetype, shadowKey: 'EXPLORER', blindspotKey: 'SAGE' });
  // The Master Prompt comes from Mongo (promptConfigs/default) and passes through unaltered; no prompt, no request.
  const system = 'AI MASTER PROMPT (gate fixture)\nW1 · …';
  const req = reportV5.buildV5Request({ system, bleed, geometryMsg: 'geometry', lineTypeBlock, language: 'nl' });
  assert.equal(req.system, system, 'system prompt = the master prompt, unaltered');
  for (const missing of [undefined, '', '  \n']) {
    assert.throws(() => reportV5.buildV5Request({ system: missing, bleed, geometryMsg: 'geometry', lineTypeBlock, language: 'nl' }), /Master Prompt missing/);
  }
  assert.ok(!('loadPrompt' in reportV5) && !('PROMPT_PATH' in reportV5), 'no prompt file path left in the engine pipeline');
  assert.ok(req.user.startsWith(`geometry\n\n${lineTypeBlock}`), 'user content still carries the line-type block');
  for (const id of SHADOW_PACK.hero_hole) assert.ok(req.cachedContext.includes(`════ CORPUS ${id} ════`), `${id} in the corpus slice`);
  assert.deepEqual(req.manifest.shadow_pack, { shadow: 'Explorer', blindspot: 'Sage', objects: SHADOW_PACK.hero_hole });
  assert.deepEqual(req.payload.links, { main: 'Hero', green: 'Magician', blue: 'Lover', purple: 'Explorer', red: 'Sage', yellow: ['Caregiver', 'Trickster'] });
  assert.ok(req.user.includes('"links": {'), 'the Main\'s links ride in the payload block');
  assert.ok(!req.user.includes('"triangle"'), 'the stored wheel table itself is not sent');
  const { shadowArchetype, blindspotArchetype, ...bare } = bleed;
  assert.throws(() => reportV5.buildV5Request({ system, bleed: bare, geometryMsg: 'geometry', lineTypeBlock, language: 'nl' }), /Schaduw-pakket needs/);
});

test('Gate 6 — RoleError trips in both directions (and blocks assembly)', () => {
  const c = fixtures.cases.agency_entry;
  const geo = new E.RuntimeGeometry({ scores: c.input_scores, main: c.main });
  const store = new E.RoleIndexedStore(geo, arcs, c_cells, layer2);
  assert.throws(() => store.main_values('Hero'), (e) => e instanceof E.RoleError && /requested as MAIN/.test(e.message));
  assert.throws(() => store.support_values(c.main), (e) => e instanceof E.RoleError && /requested as SUPPORT/.test(e.message));
  assert.throws(() => runPipeline({ scores: c.input_scores, main: c.main, support: c.main, geometry: wheelOf(c.main) }), (e) => e instanceof E.RoleError);
});

test('R8 — a Support outside the pull set still ships (C-modulation + support_weight_norm), with no τ′ terms', () => {
  const c = fixtures.cases.hero_hole;
  const pullSet = [c.main, ...c.expected.codrivers];
  const outside = Object.entries(c.input_scores).filter(([n]) => !pullSet.includes(n)).sort((a, b) => b[1] - a[1])[0][0];
  const { payload, result, manifest } = runPipeline({ scores: c.input_scores, main: c.main, support: outside, geometry: wheelOf(c.main) });
  // D-path untouched: same pull set, same arcs as the fixture
  assert.deepEqual(result.codrivers.map((d) => d.name), c.expected.codrivers);
  assert.deepEqual(result.transform_arc, c.expected.transform_arc_compute);
  // Support present, role-tagged, w = s_Support / s_Main (3 dp), C-modulation shipped, null-not-zero kept
  assert.equal(payload.support.name, outside);
  assert.equal(payload.support.role, 'support');
  assert.equal(payload.support.w, Number((c.input_scores[outside] / c.input_scores[c.main]).toFixed(3)));
  for (const [f, d] of Object.entries(c_cells[outside])) {
    if (d === null) assert.strictEqual(payload.support.c_modulation[f], null);
    else assert.equal(typeof payload.support.c_modulation[f], 'number');
  }
  // …and it contributes nothing to the D-path
  assert.ok(!payload.codrivers.some((d) => d.name === outside));
  const terms = Object.values(result.per_state).flatMap((ps) => ps.terms);
  assert.ok(!terms.some((t) => t.codriver === outside), 'no τ′ term from a Support outside the pull set');
  // Lookup Table v1: groups key off the active (pull) set; the Support reaches the slice through the Main × Support cell
  const ids = manifest.documents.map((d) => d.id);
  assert.ok(ids.includes(`extension/${c.main}×${outside}`));
  const supportGroup = R.GROUPS.find((g) => g.members.includes(outside)).key;
  const pullGroups = new Set(pullSet.map((n) => R.GROUPS.find((g) => g.members.includes(n)).key));
  assert.equal(ids.includes(`group/${supportGroup}`), pullGroups.has(supportGroup));
  assert.equal(payload.extension.support, outside);
  assert.equal(corpusName('HERO'), 'Hero');
  assert.equal(corpusName('nope'), null);
});

test('Request — the derived indices and the uploaded OCEAN values reach the model in the prompt\'s own terms (L4, R-c, D-10)', () => {
  const { buildUserMessage } = require('../../prompts/advanced');
  const details = [{ key: 'HERO', position: 11, group: 'Agency', total: 120 }, { key: 'EXPLORER', position: 5, group: 'Seeker', total: 40 }];
  const base = {
    archetypeKey: 'HERO', supportArchetype: 'MAGICIAN', shadowArchetype: 'EXPLORER', blindspotArchetype: 'SAGE',
    archetypeDetails: details, responses: [], sliceScoped: true, language: 'nl',
    polarizationIndex: 80, polarizationPct: 67, polarizationLevel: 'HIGH_POLARIZATION',
    authenticityIndex: 71, authenticityLevel: 'BALANCED', totalNaturePoints: 300, totalCulturePoints: 120,
  };
  const msg = buildUserMessage(base);
  assert.ok(msg.includes('Polarization Index: 80 punten (Main 120 − Shadow 40) = 67% van Main → band: gap > 60% van Main — schaduw onderdrukt'), msg);
  assert.ok(msg.includes('Authenticity Index: 71% Nature (over 72 picks) — Nature punten: 300 / Culture punten: 120'));
  assert.ok(!/Gat [<>] \d+ punten/.test(msg), 'the old point-threshold notes never reach the engine pipeline');
  // one line type, from the line-type block: the older three-colour "Verbinding" line (no red) is gone
  assert.ok(!msg.includes('Main-Support Verbinding'), 'no second line-type statement');
  assert.ok(buildUserMessage({ ...base, sliceScoped: false }).includes('Main-Support Verbinding:'), 'v4.3 path keeps it');
  // the band follows the level the engine banded (R-c: > 60 · 30–60 · < 30), and the pct falls back to the totals
  assert.match(buildUserMessage({ ...base, polarizationPct: undefined, polarizationLevel: 'MODERATE' }), /= 67% van Main → band: gap 30–60% — gezonde spanning/);
  assert.match(buildUserMessage({ ...base, polarizationLevel: 'HIGH_INDIVIDUATION' }), /band: gap < 30% — actieve integratie/);
  // no upload → no OCEAN line at all (D-10: never geometry-derived values)
  assert.ok(!/OCEAN \(/.test(msg));
  assert.ok(!msg.includes('OCEAN Scores:'), 'the v4.3 derived-OCEAN line stays out of the engine pipeline');
  const up = { O: 72, C: 55, E: 61, A: 80, N: 23 };
  assert.ok(buildUserMessage({ ...base, uploadedOceanScores: up })
    .includes('OCEAN (geüpload door de gebruiker): Openheid: 72/100 | Consciëntieusheid: 55/100 | Extraversie: 61/100 | Meegaandheid: 80/100 | Neuroticisme: 23/100'));
  assert.ok(buildUserMessage({ ...base, language: 'en', uploadedOceanScores: { O: 72, N: 23 } })
    .includes('OCEAN (uploaded by the user): Openness: 72/100 | Neuroticism: 23/100'));
  // the v4.3 path is untouched
  const v43 = buildUserMessage({ ...base, sliceScoped: false });
  assert.ok(v43.includes('Polarization Index: 80 (HIGH_POLARIZATION)') && v43.includes('Gat > 222 punten'));
});

test('Request — an OCEAN upload reaches the model as numbers under our names, never as its text (Addendum A §5c)', () => {
  const { buildUserMessage } = require('../../prompts/advanced');
  const { parseOceanAspects } = require('../../services/oceanUpload');
  // The layout of a real Dutch Big Five report (synthetic name, no source prose): a name-only cover and
  // a greeting the scrubber does not know, an overview printing a column of labels and THEN a column of
  // numbers, a sixth HEXACO scale, and a score page — one trait split over two lines.
  const upload = [
    'Persoonlijkheid', 'Jan Jansen', 'Hé Jan,',
    'Je overzicht', 'Meegaandheid', 'Compassie', 'Beleefdheid', 'Consciëntieusheid', 'IJver', 'Ordelijkheid',
    'Extraversie', 'Enthousiasme', 'Assertiviteit', 'Neuroticisme', 'Terughoudendheid', 'Volatiliteit',
    'Openheid voor Ervaringen', 'Intellect', 'Esthetiek', 'Eerlijkheid - Nederigheid',
    '39', '76', '9', '96', '99', '81', '88', '69', '92', '2', '2', '7', '72', '75', '64', '66',
    'Even spieken ?',
    'Meegaandheid: 39', '- Beleefdheid: 9', '- Compassie: 76',
    'Consciëntieusheid: 96', '- IJver: 99', '- Ordelijkheid: 81',
    'Extraversie: 88', '- Enthousiasme: 69', '- Assertiviteit: 92',
    'Neuroticisme: 2', '- Terughoudendheid: 2', '- Volatiliteit: 7',
    'Openheid voor', 'Ervaringen: 72', '- Intellect: 75', '- Esthetiek: 64',
    'Beschrijft hoe graag je bezig bent met intellectuele interesses.', 'Goed bezig Jan!',
  ].join('\n');

  const aspects = parseOceanAspects(upload);
  assert.deepEqual(aspects, {
    intellect: 75, aesthetics: 64, industriousness: 99, orderliness: 81, enthusiasm: 69,
    assertiveness: 92, compassion: 76, politeness: 9, volatility: 7, withdrawal: 2,
  });
  // the overview's label column is never paired with its number column
  assert.equal(parseOceanAspects('Esthetiek\n39\n76'), null);
  // "intellectuele" is not "Intellect"
  assert.equal(parseOceanAspects('intellectuele interesses 12'), null);

  const base = {
    archetypeKey: 'HERO', supportArchetype: 'MAGICIAN', shadowArchetype: 'EXPLORER', blindspotArchetype: 'SAGE',
    archetypeDetails: [], responses: [], sliceScoped: true,
    uploadedFileContents: [{ name: 'upload-1.pdf', text: upload }],
    uploadedOceanScores: { O: 72, C: 96, E: 88, A: 39, N: 2 },
    uploadedOceanAspects: aspects,
  };
  const msg = buildUserMessage(base);
  assert.ok(msg.includes('OCEAN-aspecten (geüpload door de gebruiker): Openheid — Intellect: 75/100 · Esthetiek: 64/100 | '
    + 'Consciëntieusheid — IJver: 99/100 · Ordelijkheid: 81/100 | Extraversie — Enthousiasme: 69/100 · Assertiviteit: 92/100 | '
    + 'Meegaandheid — Compassie: 76/100 · Beleefdheid: 9/100 | Neuroticisme — Volatiliteit: 7/100 · Terugtrekking: 2/100'), msg);
  // nothing of the report's text: not its sixth scale, not its own label for Withdrawal, not the person, not the file
  for (const leak of ['Nederigheid', 'Terughoudendheid', 'Jansen', 'Hé Jan', 'GEBRUIKER-GEÜPLOADE DOCUMENTEN', 'upload-1.pdf']) {
    assert.ok(!msg.includes(leak), `"${leak}" must not reach the model`);
  }
  assert.ok(buildUserMessage({ ...base, language: 'en' })
    .includes('OCEAN aspects (uploaded by the user): Openness — Intellect: 75/100 · Aesthetics: 64/100 | '));
  // an unreadable upload claims nothing
  assert.ok(!/OCEAN \(|OCEAN-aspecten|OCEAN-RAPPORT/.test(buildUserMessage({ ...base, uploadedOceanScores: null, uploadedOceanAspects: null })));
  // the v4.3 path keeps pasting the (scrubbed) text, as before
  assert.ok(buildUserMessage({ ...base, sliceScoped: false }).includes('GEBRUIKER-GEÜPLOADE DOCUMENTEN'));
});

test('Request — the yellow-triangle activation numbers ship, the backend\'s own lens prose does not (W6: content = the slice)', () => {
  const { buildUserMessage } = require('../../prompts/advanced');
  const details = ['JUDGE', 'EXPLORER', 'ARTIST', 'LOVER', 'OUTLAW', 'MAGICIAN', 'CAREGIVER', 'TRICKSTER', 'HERO', 'INNOCENT', 'SAGE', 'RULER']
    .map((key, i) => ({ key, position: i + 1, group: 'x', total: 50, nature_core: 20, yellow_cog: i < 3 ? 40 : 0 }));
  const base = { archetypeKey: 'JUDGE', supportArchetype: 'RULER', shadowArchetype: 'TRICKSTER', blindspotArchetype: 'OUTLAW', archetypeDetails: details, responses: [], language: 'nl' };
  const v5 = buildUserMessage({ ...base, sliceScoped: true });
  assert.ok(v5.includes('── GELE DRIEHOEKEN — CULTUREFORCE ACTIVATIE ──') && /DOMINANT COGNITIEF NETWERK: .* \(Driehoek 1\)/.test(v5), 'activation table + dominant triangle stay');
  for (const label of ['Superkracht:', 'Cognitieve Valkuilen:', 'Culturele Context:']) assert.ok(!v5.includes(label), `${label} not in the engine-pipeline request`);
  const v43 = buildUserMessage({ ...base, sliceScoped: false });
  for (const label of ['Superkracht:', 'Cognitieve Valkuilen:', 'Culturele Context:']) assert.ok(v43.includes(label), `${label} still on the v4.3 path`);
  // the triangle names the request uses are the corpus's own (TNM overview "Naam" row, NL twin), in order
  const { YELLOW_TRIANGLE_PROFILES } = require('../../prompts/advanced');
  const overview = R.registry('nl').docs.get('tnm/preamble').text;
  const naam = overview.split('\n').find((l) => /^\|\s*Naam\s*\|/.test(l));
  const corpusNames = naam.split('|').map((c) => c.trim()).filter(Boolean).slice(1);
  assert.deepEqual(YELLOW_TRIANGLE_PROFILES.map((t) => t.name), corpusNames);
  for (const t of YELLOW_TRIANGLE_PROFILES) {
    const row = overview.split('\n').find((l) => /^\|\s*Leden\s*\|/.test(l)).split('|').map((c) => c.trim()).filter(Boolean)[t.id];
    assert.equal((row.match(/\((\d+)\)/g) || []).length, 3, `Driehoek ${t.id} has three members in the corpus`);
  }
});

test('Request — the English title set handed to the model is exactly what the platform parser routes (W8)', async () => {
  const { buildUserMessage, EN_SECTION_TITLES } = require('../../prompts/advanced');
  const hooks = require('node:module').registerHooks({
    resolve(specifier, context, next) {
      try { return next(specifier, context); } catch (e) {
        if (e.code === 'ERR_MODULE_NOT_FOUND' && specifier.startsWith('.')) return next(`${specifier}.js`, context);
        throw e;
      }
    },
  });
  let P;
  try { P = await import('../../../platform/src/components/assessment/v4Parser.js'); } finally { hooks.deregister(); }
  const titles = EN_SECTION_TITLES.narrative.filter((x) => !x.startsWith('  '));
  // every narrative title routes to a slot, as an English tag; the OCEAN page title is the comparison heading
  const slots = [];
  for (const title of titles) {
    const line = title.replace('[name] · [name in the second language]', 'The Usurper · De Troonrover');
    if (title.startsWith('PERSONALITY REPORT COMPARISON')) { assert.match(line, /personality\s*report.*comparison/i); continue; }
    const hit = P.matchNarrativeTag(line);
    assert.ok(hit && hit.lang === 'en', `parser routes "${line}"`);
    slots.push(hit.slot);
  }
  for (const trait of EN_SECTION_TITLES.traitTitles) {
    const hit = P.matchNarrativeTag(trait);
    assert.ok(hit && hit.slot === `ocean_${trait.charAt(6).toLowerCase()}`, `parser routes "${trait}"`);
    slots.push(hit.slot);
  }
  assert.equal(new Set(slots).size, slots.length, 'no two titles land in one slot');
  // every DEEL 5 slot the prompt names is covered (professional resonance left the prompt in v6.1)
  const expected = P.PAGE_ORDER.flat().filter((s) => s !== 'prof_resonance');
  assert.deepEqual([...new Set(slots)].sort(), expected.sort());
  // machine block: every tag is a known parser tag
  for (const tag of EN_SECTION_TITLES.machineTags) {
    assert.ok(Object.keys(P.MACHINE_TAGS).some((k) => k.toUpperCase() === tag), `machine tag "${tag}"`);
  }
  // experiment labels are excluded from tag matching (NOT_TAGS), so they never split a section
  for (const label of EN_SECTION_TITLES.experimentLabels) assert.equal(P.matchNarrativeTag(label), null, label);
  // the block ships only for an English engine-pipeline report
  const base = { archetypeKey: 'HERO', supportArchetype: 'MAGICIAN', shadowArchetype: 'EXPLORER', blindspotArchetype: 'SAGE', archetypeDetails: [], responses: [], sliceScoped: true };
  assert.ok(buildUserMessage({ ...base, language: 'en' }).includes('═══ SECTION TITLES — ENGLISH REPORT'));
  assert.ok(!buildUserMessage({ ...base, language: 'nl' }).includes('SECTION TITLES'));
  assert.ok(!buildUserMessage({ ...base, language: 'en', sliceScoped: false }).includes('SECTION TITLES'));
});

test('Report pipeline — decided in the repo (the engine pipeline), never by a host environment variable', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'config', 'index.js'), 'utf8');
  assert.ok(!/REPORT_PIPELINE/.test(src), 'config/index.js reads no REPORT_PIPELINE');
  assert.equal(require('../../config').reportPipeline, 'v5.2');
});

test('Deploy absent-check — no superseded artifact in the tree; canon stamps current', () => {
  const root = path.resolve(__dirname, '..', '..', '..', '..');
  const KILL = [
    /Rosetta_v1_4_[0-9](?!\d)/i, /Master_Prompt_v4_3/i, /Cell_Schema_Reference_v1_8/i, /Official_132_v1_[12](?!\d)/i,
    /lessen.*v2_0(?!\d)/i, /SUPERSEDED_NAMING/i, /Tau_Calibration.*\.xlsx$/i, /c_magnitude_precompute_FINAL/i,
    /Rosetta_v1_4_10(?!\d)/i, /c_magnitude_precompute_v2\.py$/i, /c_magnitude_parity_v2\.json$/i,
    /Layer3_v1_0/i, /Matrix_360_v4_[012](?!\d)/i, /EXT132_Batch/i, /Extensions_132.*(DRAFT|v0)/i,
    /AI_Master_Prompt_v5_[012]/i,
  ];
  const hits = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist', 'build', '.turbo'].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (KILL.some((re) => re.test(ent.name))) hits.push(path.relative(root, p));
    }
  };
  for (const top of ['apps', 'packages']) walk(path.join(root, top));
  assert.deepEqual(hits, [], `superseded artifacts present: ${hits.join(', ')}`);

  for (const file of ['deltawerken_corpus.json', 'deltawerken_corpus_nl.json']) {
    const raw = fs.readFileSync(path.join(root, 'packages/assessment-core/src/data/canon', file), 'utf8');
    const corpus = JSON.parse(raw);
    const meta = corpus._meta;
    // Composition math (D Relational Operations, any version) is engine-implementation material on
    // the reference shelf — never narration ground. Its formulas invite the report model to derive.
    assert.ok(!('d_relational_operations' in corpus), `${file}: d_relational_operations must not be in the runtime corpus`);
    assert.ok(!/composition math|Global Computation Certificate|RELATIONAL OPERATIONS/i.test(raw), `${file}: composition-math text present`);
    assert.equal(meta.rosetta, 'v1.4.11');
    assert.equal(meta.schema, 'v1.9');
    assert.equal(meta.matrix, 'v4.3');
    assert.equal(meta.roster, 'Extended list v1.3');
  }
});
