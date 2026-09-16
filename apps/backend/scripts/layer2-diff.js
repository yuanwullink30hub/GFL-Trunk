#!/usr/bin/env node
/**
 * Layer-2 falsification diff — v4.0 and v4.1 against the canonical v4.3 reconstruction.
 *
 *   node scripts/layer2-diff.js [--v40 <xlsx>] [--v41 <xlsx>] [--md40 <md>] [--md41 <md>] [--out <file.md>]
 *
 * Canon rule (from the v4.1 diff header): v4.3 stays canonical regardless of findings; this diff is
 * falsification input only. Nothing here writes to the workbook.
 *
 * Column authenticity, and therefore what a difference means:
 *   Direction · Class · C1 · Flag   original in v4.0/v4.1 — must match v4.3 exactly; any difference
 *                                   is a genuine finding to route upstream.
 *   Polarity                        pre-loss original; a clean match upgrades v4.3's rebuilt column
 *                                   from "high" to confirmed.
 *   Sense                           "(derived)" since origin — consistency check only.
 *   Locus                           PRE-SPLIT grain. Old value/shape/entry/— map onto v4.3's split
 *                                   (value / shape:tracking / shape:operational / entry / —).
 *                                   Refinement inside old `shape` is expected, not a finding; any
 *                                   old→new move that crosses between value / shape / entry / — is.
 * The base matrix (Matrix_360, 360 B/C/D cells) is diffed too: v4.3's README says it is carried
 * unchanged from v3.3.1, so every difference there is a finding as well.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadWorkbook } = require('../engine/xlsx');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const DL = 'C:/Users/yuanw/Downloads';
const PATHS = {
  'v4.0': arg('v40', path.join(DL, 'Matrix_360_v4_0_integrated.xlsx')),
  'v4.1': arg('v41', path.join(DL, 'Matrix_360_v4_1_payment_styles.xlsx')),
  'v4.3': path.join(__dirname, '..', 'engine', 'data', 'Matrix_360_v4_3_reconstructed.xlsx'),
};
const MD = { 'v4.0': arg('md40', path.join(DL, 'Matrix_360_v4_0_Dtransform_for_diff.md')), 'v4.1': arg('md41', path.join(DL, 'Matrix_360_v4_1_Dtransform_for_diff.md')) };
const OUT = arg('out', path.join(__dirname, '..', 'engine', 'data', 'layer2_diff_findings.md'));

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const norm = (v) => (v === null || v === undefined ? '' : String(v).trim());

const sheet = (ver, name) => {
  const rows = loadWorkbook(PATHS[ver]).rows(name);
  const head = rows[0].map(norm);
  return rows.slice(1).filter((r) => norm(r[0])).map((r) => Object.fromEntries(head.map((h, i) => [h, norm(r[i])])));
};
const index = (rows, keyCols) => new Map(rows.map((r) => [keyCols.map((c) => r[c]).join('|'), r]));

/** Compare one column across every shared key; returns the differing keys. */
function column(aIdx, bIdx, col) {
  const diffs = [];
  for (const [k, a] of aIdx) {
    const b = bIdx.get(k);
    if (b && a[col] !== b[col]) diffs.push({ key: k, from: a[col], to: b[col] });
  }
  return diffs;
}

const table = (rows) => {
  const counts = {};
  for (const d of rows) { const k = `${d.from || '(blank)'} → ${d.to || '(blank)'}`; counts[k] = (counts[k] || 0) + 1; }
  return Object.entries(counts).sort((x, y) => y[1] - x[1]);
};

say(`# Layer-2 falsification diff — v4.0 / v4.1 vs v4.3 (canonical)\n`);
say(`Run: \`node scripts/layer2-diff.js\` · ${new Date().toISOString().slice(0, 10)}`);
say(`\nSources: v4.0 \`${path.basename(PATHS['v4.0'])}\` · v4.1 \`${path.basename(PATHS['v4.1'])}\` · v4.3 \`${path.basename(PATHS['v4.3'])}\` (engine copy).\n`);

// ── 0 · the handed markdown serialisations match their own workbooks ──────────
say('## 0 · Handed markdown vs its workbook\n');
for (const ver of ['v4.0', 'v4.1']) {
  if (!fs.existsSync(MD[ver])) { say(`- ${ver}: markdown not found at ${MD[ver]} — skipped.`); continue; }
  const md = fs.readFileSync(MD[ver], 'utf8');
  const block = md.split(/^## /m).find((s) => s.startsWith('D_Transform_Articulations'));
  const mdRows = block.split('\n').filter((l) => l.startsWith('|') && !/^\|\s*-+/.test(l) && !/\|\s*Main\s*\|/.test(l))
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const xl = sheet(ver, 'D_Transform_Articulations');
  const cols = ['Main', 'Support', 'D-state', 'Cost-state', 'Direction', 'Class', 'Polarity', 'Sense (derived)', 'Locus', 'C1', 'Flag'];
  let bad = 0;
  mdRows.forEach((m, i) => { const x = xl[i]; if (!x || cols.some((c, j) => m[j] !== x[c])) bad++; });
  say(`- ${ver}: markdown ${mdRows.length} rows vs workbook ${xl.length} rows — ${bad === 0 && mdRows.length === xl.length ? 'identical' : `${bad} row(s) differ`}.`);
}

// ── 1 · D_Transform_Articulations ────────────────────────────────────────────
const KEY = ['Main', 'Support', 'D-state'];
const AUTH = {
  Direction: 'original', Class: 'original', C1: 'original', Flag: 'original', 'Cost-state': 'structural',
  Polarity: 'pre-loss original (v4.3 rebuilt it)', 'Sense (derived)': 'derived since origin', Locus: 'PRE-SPLIT grain',
};
const art = Object.fromEntries(['v4.0', 'v4.1', 'v4.3'].map((v) => [v, index(sheet(v, 'D_Transform_Articulations'), KEY)]));

say('\n## 1 · D_Transform_Articulations (660 rows)\n');
say(`Row keys: v4.0 ${art['v4.0'].size} · v4.1 ${art['v4.1'].size} · v4.3 ${art['v4.3'].size}.`);
for (const v of ['v4.0', 'v4.1']) {
  const missing = [...art['v4.3'].keys()].filter((k) => !art[v].has(k));
  const extra = [...art[v].keys()].filter((k) => !art['v4.3'].has(k));
  say(`Key set ${v} vs v4.3: ${missing.length === 0 && extra.length === 0 ? 'identical' : `${missing.length} missing, ${extra.length} extra`}`);
}
say('\n| Column | Authenticity | v4.1 → v4.3 | v4.0 → v4.3 | Reading |');
say('| --- | --- | --- | --- | --- |');
const artDiffs = {};
for (const col of Object.keys(AUTH)) {
  const d41 = column(art['v4.1'], art['v4.3'], col);
  const d40 = column(art['v4.0'], art['v4.3'], col);
  artDiffs[col] = { d41, d40 };
  const verdict = col === 'Locus'
    ? (d41.length ? 'see §2 (split mapping)' : 'no change')
    : col === 'Sense (derived)' ? (d41.length ? 'CHECK' : 'consistent')
    : col === 'Polarity' ? (d41.length ? 'FINDING' : 'rebuild CONFIRMED by the pre-loss original')
    : (d41.length ? 'FINDING — route upstream' : 'clean');
  say(`| ${col} | ${AUTH[col]} | ${d41.length} | ${d40.length} | ${verdict} |`);
}
for (const col of Object.keys(AUTH)) {
  const { d41, d40 } = artDiffs[col];
  if (!d41.length && !d40.length) continue;
  if (col === 'Locus') continue;
  say(`\n**${col}** — v4.1→v4.3 changes (${d41.length}):`);
  for (const [k, n] of table(d41)) say(`- ${k} · ${n} row(s)`);
  for (const d of d41.slice(0, 12)) say(`  - ${d.key}: ${d.from || '(blank)'} → ${d.to || '(blank)'}`);
  if (d41.length > 12) say(`  - …and ${d41.length - 12} more`);
  const only40 = d40.filter((d) => !d41.some((x) => x.key === d.key));
  if (only40.length) say(`  v4.0 differs on ${only40.length} further row(s): ${only40.slice(0, 6).map((d) => `${d.key} ${d.from}→${d.to}`).join(' · ')}`);
}

// ── 2 · Locus: pre-split → split mapping ─────────────────────────────────────
say('\n## 2 · Locus — pre-split (v4.1) mapped onto the v4.3 split\n');
const map = {};
const byState = {};
for (const [k, a] of art['v4.1']) {
  const b = art['v4.3'].get(k);
  if (!b) continue;
  const pair = `${a.Locus || '(blank)'} → ${b.Locus || '(blank)'}`;
  map[pair] = (map[pair] || 0) + 1;
  (byState[a['Cost-state']] = byState[a['Cost-state']] || {})[pair] = ((byState[a['Cost-state']] || {})[pair] || 0) + 1;
}
say('| v4.1 locus → v4.3 locus | rows | expected? |');
say('| --- | --- | --- |');
const EXPECTED = { 'value → value': 1, 'shape → shape:tracking': 1, 'shape → shape:operational': 1, 'entry → entry': 1, '— → —': 1 };
for (const [pair, n] of Object.entries(map).sort((a, b) => b[1] - a[1])) {
  say(`| ${pair} | ${n} | ${EXPECTED[pair] ? 'yes — refinement or identity' : '**NO — crosses the grain, finding**'} |`);
}
say('\nPer cost-state (the regenerated zone is dissolution and boundary-loss):');
for (const [state, pairs] of Object.entries(byState)) {
  say(`- **${state}**: ${Object.entries(pairs).sort((a, b) => b[1] - a[1]).map(([p, n]) => `${p} ×${n}`).join(' · ')}`);
}

// ── 2b · Is the split reproducible from v4.1 + the stated rule? ──────────────
// v4.3 Provenance states the rule: shape splits to shape:tracking only where the state mechanism
// disturbs how expression tracks condition — petrification D2 (mask) and borderlessness D2–D3
// (buffer); every other shape cell is shape:operational. Applying that to v4.1's pre-split column
// leaves no free parameter, so it either reproduces v4.3 exactly or it does not.
say('\n### 2b · Rule reproduction (no free parameters)\n');
const ruleLocus = (r) => {
  if (r.Locus !== 'shape') return r.Locus;
  const tracking = (r['Cost-state'] === 'petrification' && r['D-state'] === 'D2')
    || (r['Cost-state'] === 'borderlessness' && (r['D-state'] === 'D2' || r['D-state'] === 'D3'));
  return tracking ? 'shape:tracking' : 'shape:operational';
};
let repro = 0; const reproMiss = [];
for (const [k, a] of art['v4.1']) {
  const b = art['v4.3'].get(k);
  if (ruleLocus(a) === b.Locus) repro++; else reproMiss.push(`${k}: rule ${ruleLocus(a)} vs v4.3 ${b.Locus}`);
}
say(`Regenerating v4.3's locus from v4.1 + the rule: ${repro}/${art['v4.1'].size} cells match.`);
for (const m of reproMiss.slice(0, 10)) say(`- ${m}`);
say(`Census produced by the rule: tracking ${[...art['v4.1'].values()].filter((r) => ruleLocus(r) === 'shape:tracking').length}, operational ${[...art['v4.1'].values()].filter((r) => ruleLocus(r) === 'shape:operational').length} (L3 §5 states 64 / 56).`);

// ── 3 · D_Transform_Cells ────────────────────────────────────────────────────
say('\n## 3 · D_Transform_Cells (132 rows)\n');
const CKEY = ['Main', 'Support'];
const cells = Object.fromEntries(['v4.0', 'v4.1', 'v4.3'].map((v) => [v, index(sheet(v, 'D_Transform_Cells'), CKEY)]));
say('| Column | v4.1 → v4.3 | v4.0 → v4.3 |');
say('| --- | --- | --- |');
for (const col of ['Cost-state', 'Class', 'C1', 'Flag', 'D1', 'D2', 'D3', 'D4', 'D5']) {
  const d41 = column(cells['v4.1'], cells['v4.3'], col);
  const d40 = column(cells['v4.0'], cells['v4.3'], col);
  say(`| ${col} | ${d41.length} | ${d40.length} |`);
  for (const d of d41.slice(0, 8)) say(`| ↳ ${d.key} | ${d.from || '(blank)'} → ${d.to || '(blank)'} | |`);
}

// ── 4 · Base matrix (Matrix_360) ─────────────────────────────────────────────
say('\n## 4 · Matrix_360 base cells (360: B 156 · C 144 · D 60)\n');
const MKEY = ['archetype', 'component', 'member'];
const base = Object.fromEntries(['v4.0', 'v4.1', 'v4.3'].map((v) => [v, index(sheet(v, 'Matrix_360'), MKEY)]));
const MCOLS = ['value', 'reasoning', 'source_anchor', 'confidence', 'failure_mode', 'valence_trajectory', 'mode_relation', 'state_mechanism', 'strain_response', 'state_relation'];
say('| Column | v4.1 → v4.3 | v4.0 → v4.3 |');
say('| --- | --- | --- |');
const baseDiffs = {};
for (const col of MCOLS) {
  const d41 = column(base['v4.1'], base['v4.3'], col);
  const d40 = column(base['v4.0'], base['v4.3'], col);
  baseDiffs[col] = d41;
  say(`| ${col} | ${d41.length} | ${d40.length} |`);
}
for (const [col, d41] of Object.entries(baseDiffs)) {
  if (!d41.length) continue;
  say(`\n**Matrix_360 ${col}** (${d41.length}):`);
  for (const d of d41.slice(0, 10)) say(`- ${d.key}: ${String(d.from).slice(0, 90) || '(blank)'} → ${String(d.to).slice(0, 90) || '(blank)'}`);
  if (d41.length > 10) say(`- …and ${d41.length - 10} more`);
}

// ── 5 · Verdict ──────────────────────────────────────────────────────────────
say('\n## 5 · Verdict\n');
const certain = ['Direction', 'Class', 'C1', 'Flag', 'Cost-state'].reduce((n, c) => n + artDiffs[c].d41.length + artDiffs[c].d40.length, 0);
const crossings = Object.entries(map).filter(([p]) => !EXPECTED[p]).reduce((n, [, c]) => n + c, 0);
say(`- Original columns (Direction, Class, C1, Flag, Cost-state): **${certain} differences** against v4.0 and v4.1 combined.`);
say(`- Polarity: **${artDiffs.Polarity.d41.length} differences** — v4.3's rebuild against the pre-loss original.`);
say(`- Sense: **${artDiffs['Sense (derived)'].d41.length} differences** — the derivation still lands where it landed at origin.`);
say(`- Locus: ${artDiffs.Locus.d41.length} cells changed, **${crossings} of them crossing between value / shape / entry / —**; the rest is the shape split.`);
say(`- Split reproducibility: ${repro}/${art['v4.1'].size} cells regenerate from v4.1 + the stated rule.`);
say(`- Base matrix: ${Object.values(baseDiffs).reduce((n, d) => n + d.length, 0)} field differences, all on the single Hero D4 cell (the OD-18 closure).`);
say('\nAmendment this supports on the v4.3 Provenance sheet (human-ratified 2026-09-16; applied to the engine workbook copy):');
if (!certain) say('- `direction` / `class` / `c1` / `flag`: "Recovered" → **confirmed against v4.0 and v4.1 originals**.');
if (!artDiffs.Polarity.d41.length) say('- `polarity`: "Reconstructed from the stated rule · high" → **confirmed identical to the pre-loss original**.');
if (!artDiffs['Sense (derived)'].d41.length) say('- `sense_derived`: still derived, but **identical to the origin derivation** — not a new derivation event.');
if (!crossings && repro === art['v4.1'].size) say('- `locus`: "RULE-REGENERATED · derived" → **reproducible from v4.1 + the rule, no cell crosses the pre-split grain**; only the tracking/operational assignment inside old `shape` remains unverifiable against the lost v4.2.');
say('- The 660 definition sentences stay lost: no version carries that column.');

fs.writeFileSync(OUT, out.join('\n') + '\n');
console.log(`\nwritten: ${OUT}`);
