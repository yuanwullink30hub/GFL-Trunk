#!/usr/bin/env node
/**
 * Acceptance gates 5 and 6 (model half) — Backend Instruction v1 §5.
 *
 *   node scripts/engine-dry-run.js                 offline: build the exact engine-pipeline request, static checks
 *   node scripts/engine-dry-run.js --live          + two model calls, run in parallel:
 *                                                    A  gate 5 — hero_hole through the Master Prompt, normal slice
 *                                                    B  gate 6 — same request with one shipped section withheld
 *   options: --case <fixture> (hero_hole) · --withhold <manifest id> (group/ruling) · --out <dir> · --model <id>
 *
 * The request is assembled by engine/reportV5.js, the same code the /api/ai/analyze route runs
 * (config.reportPipeline 'v5.2'), with the Master Prompt read from MongoDB promptConfigs/default exactly
 * as the route reads it. The engine fixture carries the twelve totals only (no 5-basket
 * decomposition), so the geometry block states exactly that instead of printing zero baskets.
 *
 * The output checks are screens, not verdicts: they print every hit with its context so a person
 * can read the finding. MongoDB is read, never written. Needs MONGODB_URI, and ANTHROPIC_API_KEY for --live.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const E = require('../engine/runtimeEngine');
const reportV5 = require('../engine/reportV5');
const { registry } = require('../engine/corpusResolver');
const { formatLineTypeBlock } = require('../services/lineType');
const { loadCorpus } = require('../services/corpusData');
const fixtures = require('../engine/tests/backend_test_fixtures_v1.json');

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const LIVE = process.argv.includes('--live');
const CASE = arg('case', 'hero_hole');
const WITHHOLD = arg('withhold', 'group/ruling');
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), 'gfl-engine-dry-run')));
const MODEL = arg('model', undefined);
const LANGUAGE = 'nl';

const c = fixtures.cases[CASE];
if (!c) throw new Error(`unknown fixture ${CASE}`);
fs.mkdirSync(OUT, { recursive: true });

// ── The fixture as a bleed-engine object: totals only, identity from the canon wheel ──
const upper = (n) => n.toUpperCase();
const main = c.main;
const support = c.expected.codrivers[0];
const shadow = E.OPP[main];
const blindspot = Object.keys(E.WHEEL).find((n) => E.WHEEL[n] === ((((7 - E.WHEEL[main]) % 12) + 12) % 12 || 12));
const bleed = {
  archetypeKey: upper(main), supportArchetype: upper(support),
  shadowArchetype: upper(shadow), blindspotArchetype: upper(blindspot),
  archetypeDetails: Object.entries(c.input_scores).map(([n, total]) => ({ key: upper(n), position: E.WHEEL[n], total })),
};
const geometryMsg = [
  'Genereer het volledige rapport voor deze gebruiker volgens de systeeminstructies.',
  '',
  `═══ GEOMETRIE (acceptatie-fixture ${CASE}) ═══`,
  `Main Archetype: ${upper(main)} (Positie ${E.WHEEL[main]})`,
  `Support Archetype: ${upper(support)} (Positie ${E.WHEEL[support]})`,
  `Shadow (180° van Main): ${upper(shadow)} (Positie ${E.WHEEL[shadow]})`,
  `Blindspot (Rode Lijn van Main): ${upper(blindspot)} (Positie ${E.WHEEL[blindspot]})`,
  '-- SCORES (12-PUNTS WIEL) --',
  ...Object.entries(c.input_scores).map(([n, t]) => `${upper(n)}(${E.WHEEL[n]}): ${t}`),
  'Deze fixture draagt alleen de twaalf totalen: er is GEEN 5-mandje decompositie, GEEN Nature/Culture-verdeling,',
  'GEEN afgeleide indices en GEEN OCEAN-upload geleverd.',
].join('\n');
const lineTypeBlock = formatLineTypeBlock({ mainKey: upper(main), supportKey: upper(support), shadowKey: upper(shadow), blindspotKey: upper(blindspot) });
const log = [];
const say = (s = '') => { log.push(s); console.log(s); };
const tok = (s) => Math.ceil(s.length / 4);
let runs = [];

/** The Master Prompt from MongoDB, the same record the route reads (read-only). */
async function masterPrompt() {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(require('../config').mongoUri);
  try {
    await client.connect();
    return await reportV5.loadMasterPrompt(client.db());
  } finally {
    await client.close();
  }
}

// ── Static request checks (offline) ──
function buildAndCheck(system) {
  const build = (withhold) => reportV5.buildV5Request({ system, bleed, geometryMsg, lineTypeBlock, language: LANGUAGE, withhold });
  runs = [
    { key: 'A', gate: 'gate 5 — report dry-run (normal slice)', req: build([]), withheld: null },
    { key: 'B', gate: `gate 6 — withheld section ${WITHHOLD}`, req: build([WITHHOLD]), withheld: WITHHOLD },
  ];
  const masthead = system.split('\n')[0];
  say(`Deltawerken engine dry-run · fixture ${CASE} · ${new Date().toISOString()}`);
  say(`master prompt (Mongo promptConfigs/default): ${masthead} · ${system.length} chars · sha256 ${require('crypto').createHash('sha256').update(system).digest('hex').slice(0, 12)}`);
  say(`output dir: ${OUT}`);
  for (const r of runs) checkRequest(r, system, masthead);
}

function checkRequest(r, system, masthead) {
  const { req } = r;
  const ids = req.manifest.documents.map((d) => d.id);
  const count = (re) => (req.cachedContext.match(re) || []).length;
  const docsLike = (re) => ids.filter((id) => re.test(id)).length;
  say(`\n[${r.key}] ${r.gate}`);
  say(`  system ≈${tok(req.system)} tok · user ≈${tok(req.user)} tok · corpus ≈${req.manifest.token_estimate} tok · docs: ${ids.join(', ')}`);
  say(`  stamps ${JSON.stringify(req.payload.stamps)}`);
  const staticChecks = [
    [`system prompt = the Mongo Master Prompt, unaltered (${masthead})`, req.system === system && /^AI MASTER PROMPT v/.test(system)],
    ['line-type block in user content', req.user.includes('Main-Support lijntype:')],
    [`schaduw-pakket (shadow ${shadow}, blindspot ${blindspot}) in the slice, nothing twice`,
      req.manifest.shadow_pack.shadow === shadow && req.manifest.shadow_pack.blindspot === blindspot
      && count(/^### 6 [—–-] (?:Biochemische Architectuur|Biochemical Architecture)/gm) === docsLike(/^(group|shadow_pack)\//)
      && count(/^### 1 [—–-] (?:Groep-Identiteit|Group Identity)/gm) === docsLike(/^(group|shadow_pack\/shadow)\//)],
    ['Main links in payload (green · blue · purple · red · two yellow)', req.payload.links && req.payload.links.main === main && req.payload.links.yellow.length === 2 && !req.user.includes('"triangle"')],
    ['payload block present', req.user.includes('═══ ENGINE PAYLOAD')],
    ['no 11-row 132 matrix in user content', !req.user.includes('11 MOGELIJKE PROFIELEN')],
    ['register statement in payload', req.user.includes('TRANSPERSONAL TOPOLOGY TRANSLATION (T3)')],
    ['withheld section absent from corpus', !r.withheld || !req.cachedContext.includes(`════ CORPUS ${r.withheld} ════`)],
  ];
  for (const [label, ok] of staticChecks) say(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
  fs.writeFileSync(path.join(OUT, `${r.key}_request.json`), JSON.stringify({ system: req.system, user: req.user, cachedContext: req.cachedContext, manifest: req.manifest }, null, 1));
}

// ── Output screens ──
const contextOf = (text, idx, span = 110) => text.slice(Math.max(0, idx - span), idx + span).replace(/\s+/g, ' ').trim();
function hits(text, re, max = 8) {
  const out = [];
  for (const m of text.matchAll(re)) { out.push(contextOf(text, m.index)); if (out.length >= max) break; }
  return out;
}
const numForms = (v) => { const s = String(v); return s.includes('.') ? [s, s.replace('.', ',')] : [s]; };

function screen(r, analysis) {
  const p = r.req.payload;
  const regVals = new Set([...p.main.register.register_baseline_pct, ...p.main.register.register_transform_pct,
    ...Object.values(p.main.register.register_displacement_pct)].filter((v) => v !== null).flatMap(numForms));
  // Compute-layer values that must never be narrated: decimals only (bare integers such as 30 or 86
  // collide with ordinary prose) and never a value that is also a register value.
  const compute = new Set();
  // Also the 2-decimal rounding a model tends to quote ("pull-som 1,74" for 1.7368).
  const addCompute = (v) => {
    if (typeof v !== 'number' || Number.isInteger(v)) return;
    for (const x of new Set([v, Math.round(v * 100) / 100])) {
      if (!Number.isInteger(x)) for (const f of numForms(x)) if (!regVals.has(f)) compute.add(f);
    }
  };
  [...p.main.baseline_arc, ...p.main.transform_arc, ...Object.values(p.main.displacement)].forEach(addCompute);
  for (const ps of Object.values(p.main.per_state)) { addCompute(ps.tau); addCompute(ps.tau_prime); addCompute(ps.pull); }
  for (const cd of p.codrivers) addCompute(cd.w);
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const computeHits = compute.size ? hits(analysis, new RegExp(`(?<![\\d.,])(${[...compute].map(escape).join('|')})(?![\\d])`, 'g'), 20) : [];

  // Hardware-group docs that did not ship: their distinctive vocabulary (long words used ≥2× in the
  // doc and nowhere in anything the model received).
  const shipped = [r.req.system, r.req.user, r.req.cachedContext].join('\n').toLowerCase();
  const { docs } = registry(LANGUAGE);
  const shippedIds = new Set(r.req.manifest.documents.map((d) => d.id));
  const foreign = [];
  for (const [id, d] of docs) {
    if (!id.startsWith('group/') || shippedIds.has(id)) continue;
    const counts = {};
    for (const w of d.text.toLowerCase().match(/[a-zà-ÿ][a-zà-ÿ-]{11,}/g) || []) counts[w] = (counts[w] || 0) + 1;
    // narrative only: the machine block's field labels are prescribed by the prompt (e.g. "authenticiteit-index")
    const mb = analysis.search(/PROFIEL DATA VOOR AI VERWERKING/);
    const lower = (mb >= 0 ? analysis.slice(0, mb) : analysis).toLowerCase();
    for (const [w, n] of Object.entries(counts)) {
      if (n >= 2 && !shipped.includes(w) && lower.includes(w)) foreign.push(`${id}: "${w}" — ${contextOf(lower, lower.indexOf(w), 90)}`);
    }
  }

  const d4Peak = analysis.split(/(?<=[.!?])\s+/).filter((s) => /\bD4\b|acu(ut|te)/i.test(s) && /piek|100\s?%|hoogste/i.test(s));
  const checks = [
    ['compute-layer numbers narrated (must be none)', computeHits.length === 0, computeHits],
    ['two curves named (baseline + transform)', /basislijn|baseline|uitgangscurve/i.test(analysis) && /transform/i.test(analysis), hits(analysis, /twee curve|basislijn|baseline|transform/gi, 4)],
    ['band language present', /boven gemiddeld|extreem hoog/i.test(analysis), hits(analysis, /ver boven gemiddeld|boven gemiddeld|extreem hoog/gi, 6)],
    ['clinical framing (review: negations are fine)', true, hits(analysis, /diagnos|stoornis|patholog|klinisch|therapie|behandel|patiënt|medicatie/gi, 10)],
    ['no vocabulary from non-shipped hardware groups', foreign.length === 0, foreign.slice(0, 15)],
    ['D4 spoken as the configuration\'s peak', d4Peak.length > 0, d4Peak.slice(0, 4)],
    ['DE VORM + DE HARDWARE ONDER DRUK tags emitted', /DE VORM/.test(analysis) && /DE HARDWARE ONDER DRUK/.test(analysis), []],
    ...v52Checks(r, analysis),
  ];
  if (r.withheld) {
    const group = r.withheld.split('/')[1];
    checks.push([`paragraphs touching the withheld ${r.withheld} (review for reconstructed content)`, true,
      analysis.split(/\n\s*\n/).filter((para) => new RegExp(group === 'ruling' ? 'heers|ruling|ruler|judge|rechter' : group, 'i').test(para)).map((x) => x.replace(/\s+/g, ' ').slice(0, 400)).slice(0, 6)]);
  }
  say(`\n[${r.key}] ${r.gate} — output screens (${analysis.length} chars)`);
  for (const [label, ok, detail] of checks) {
    say(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail.length ? ` (${detail.length})` : ''}`);
    for (const h of detail) say(`        · ${h}`);
  }
}

/**
 * Gate-5 screens for the Master Prompt's laws (Session Opener §2.D; v6.1.x numbering): W2 SJABLOONWET,
 * W3 NAAMWET, W4 STILTEWET, W5 BANDENWET, §5.4 DE EXTENSIE.
 */
function v52Checks(r, analysis) {
  const norm = (s) => String(s).replace(/[“”„"'‘’]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const mbAt = analysis.search(/PROFIEL DATA VOOR AI VERWERKING/);
  const narrative = mbAt >= 0 ? analysis.slice(0, mbAt) : analysis;
  const machine = mbAt >= 0 ? analysis.slice(mbAt) : '';
  const ext = r.req.payload.extension;
  const recNl = loadCorpus('nl').archetypes[ext.main].extensions.find((x) => x.support === ext.support);

  // DE EXTENSIE section: from its title to the next section title (v6.2.x: CREATIEVE RESONANTIE)
  const exAt = analysis.search(/DE EXTENSIE\s*[—–-]/);
  const exEnd = exAt >= 0 ? analysis.slice(exAt).search(/CREATIEVE RESONANTIE|PROFESSIONELE RESONANTIE/) : -1;
  const section = exAt >= 0 ? analysis.slice(exAt, exEnd > 0 ? exAt + exEnd : undefined) : '';
  const titleLine = exAt >= 0 ? analysis.slice(exAt).split('\n')[0] : '';
  // longest run of consecutive words shared with the ratified gift / curse (anchoring, not exact copy)
  const longestRun = (a, b) => {
    const A = norm(a).split(' '), B = new Set();
    const bn = norm(b).split(' ');
    for (let i = 0; i < bn.length; i++) for (let k = 3; k <= 12 && i + k <= bn.length; k++) B.add(bn.slice(i, i + k).join(' '));
    let best = 0;
    for (let i = 0; i < A.length; i++) for (let k = best + 1; k <= 12 && i + k <= A.length; k++) if (B.has(A.slice(i, i + k).join(' '))) best = k;
    return best;
  };

  // machine block: the extension block at 132-grain, the four stamps, no narrative extension text inside
  const extBlockAt = machine.search(/EXTENDED ARCHETYPE PROFIEL/);
  const extBlock = extBlockAt >= 0 ? machine.slice(extBlockAt, extBlockAt + machine.slice(extBlockAt + 30).search(/--\s*[A-Z]/) + 30) : '';
  const stampNames = ['tau_calibration_version', 'corpus_manifest_version', 'register_bands_version', 'workbook'];
  const FIELDS = '\\b(strain_response|failure_mode|valence_trajectory|nature_core|culture_core|green_hw|blue_fb|yellow_cog|purple_shadow|tau_prime|register_[a-z_]+|c_modulation|support_weight_norm|orth_ledger|entry_reads|tracking_pulls|operational_ledger|baseline_arc|transform_arc)\\b';
  // "laag" and "gemiddeld" are everyday Dutch: count them only in band phrasing; the upper labels are unambiguous.
  const BANDS = 'ver boven gemiddeld|boven gemiddeld|extreem hoog|\\b(laag|gemiddeld)e?\\s+(band|register)|band\\s*[:(]?\\s*(laag|gemiddeld)\\b';

  return [
    ['W4 · output opens on the first report section (no process narration)', /^\s*(#+\s*)?(1\.\s*)?DE IDENTITEIT/.test(analysis) && !/interne stem-commit|ik lees eerst|structurele lezing:/i.test(analysis), [JSON.stringify(analysis.slice(0, 140))]],
    ['W3 · no schema field names in the narrative', !new RegExp(FIELDS).test(narrative), hits(narrative, new RegExp(FIELDS, 'g'), 8)],
    ['W5 · band language from register_bands in the narrative', new RegExp(BANDS, 'i').test(narrative), hits(narrative, new RegExp(BANDS, 'gi'), 6)],
    // v6.2.1 §5.4: the title carries the report-language name ALONE — no number, no second language.
    ['§5.4 · DE EXTENSIE title = the payload name in the report language, nothing else',
      new RegExp(`DE EXTENSIE\\s*[—–-]\\s*${ext.name_nl}\\s*$`).test(titleLine.trim()), [titleLine, `payload: ${ext.name_nl} (nr ${ext.n} and ${ext.name_en} must NOT appear here)`]],
    ['§5.4 · levensles quoted verbatim (ratified NL text)', section !== '' && norm(section).includes(norm(recNl.levensles)), [`levensles: ${recNl.levensles}`]],
    ['§5.4 · gift anchored to the ratified text (longest shared run ≥ 4 words)', longestRun(section, recNl.gift) >= 4, [`longest run ${longestRun(section, recNl.gift)} words`]],
    ['§5.4 · curse anchored to the ratified text (longest shared run ≥ 4 words)', longestRun(section, recNl.curse) >= 4, [`longest run ${longestRun(section, recNl.curse)} words`]],
    ['W2 · machine block carries the four stamps', stampNames.every((s) => machine.includes(s)), stampNames.filter((s) => !machine.includes(s)).map((s) => `missing ${s}`)],
    (() => {
      // W2 / DEEL 6: HARDWARE SIGNALEN holds ONLY register curves (baseline + transform), the inversion list, band
      // labels per D-state, the active set (names + roles) and the four stamps — "niets erbuiten".
      const hsAt = machine.search(/HARDWARE SIGNALEN/);
      const hsBody = hsAt >= 0 ? machine.slice(hsAt).split('\n').slice(1) : [];
      const end = hsBody.findIndex((l) => /^\s*-{1,2}\s*[A-Z][A-Z /()-]+-{0,2}\s*$/.test(l));
      const lines = (end >= 0 ? hsBody.slice(0, end) : hsBody).map((l) => l.trim()).filter(Boolean);
      const ALLOWED = [/basis|baseline/i, /transform/i, /inversie|geïnverteerd|geinverteerd/i, /band/i, /actieve[ _]set|active[ _]set/i, /stempel|tau_calibration_version/i];
      const extra = lines.filter((l) => !ALLOWED.some((re) => re.test(l)) || /verplaatsing|displacement|verrijking|faalvorm|spanningsrespons|orth|c-modulatie|piek-staat/i.test(l));
      return ['W2 · HARDWARE SIGNALEN holds only the pinned fields', hsAt >= 0 && extra.length === 0, extra.length ? extra.map((l) => `extra: ${l.slice(0, 160)}`) : [`${lines.length} lines, all pinned`]];
    })(),
    ['W2 · EXTENDED ARCHETYPE PROFIEL = nummer / naam EN / naam NL / Main / Support only',
      extBlock !== '' && [String(ext.n), ext.name_en, ext.name_nl].every((v) => extBlock.includes(v))
        && longestRun(extBlock, recNl.gift) < 4 && longestRun(extBlock, recNl.curse) < 4 && !norm(extBlock).includes(norm(recNl.levensles).slice(0, 40)),
      [JSON.stringify(extBlock.slice(0, 300))]],
  ];
}

async function run() {
  buildAndCheck(await masterPrompt());
  if (process.argv.includes('--rescreen')) {
    say('\nre-screening the saved analyses (no model call)');
    for (const r of runs) {
      const file = path.join(OUT, `${r.key}_analysis.md`);
      if (fs.existsSync(file)) screen(r, fs.readFileSync(file, 'utf8'));
    }
    fs.writeFileSync(path.join(OUT, 'run_log.txt'), log.join('\n'));
    return;
  }
  if (!LIVE) {
    say('\noffline only — pass --live to run the two model calls (gates 5 and 6).');
    fs.writeFileSync(path.join(OUT, 'run_log.txt'), log.join('\n'));
    return;
  }
  const { callAI } = require('../services/aiProviders');
  const results = await Promise.all(runs.map(async (r) => {
    const t0 = Date.now();
    const res = await callAI({
      // 30000 = what the platform sends (AssessmentResultsModal → analyzeAssessment).
      provider: 'claude', model: MODEL, maxTokens: 30000,
      messages: [{ role: 'system', content: r.req.system }, { role: 'user', content: r.req.user }],
      cachedContext: r.req.cachedContext,
      referenceDocs: [],   // as the route sends it: no lookup-table document
    });
    fs.writeFileSync(path.join(OUT, `${r.key}_analysis.md`), res.analysis);
    return { r, res, secs: ((Date.now() - t0) / 1000).toFixed(0) };
  }));
  for (const { r, res, secs } of results) {
    say(`\n[${r.key}] model ${res.model} · ${secs}s · in ${res.promptTokens} tok · out ${res.completionTokens} tok`);
    screen(r, res.analysis);
  }
  fs.writeFileSync(path.join(OUT, 'run_log.txt'), log.join('\n'));
  say(`\nrun log: ${path.join(OUT, 'run_log.txt')}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
