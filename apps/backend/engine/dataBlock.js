/**
 * PROFIEL DATA VOOR AI VERWERKING — the data block on the report's last page, built by OUR backend from
 * the engine's values (payload instruction v7 §7; Master Prompt v7 W2 / 5.10, owner 13 Oct 2026). The
 * model writes no machine block; nothing here comes from the model's text. v2 sessions only — v1
 * reports keep their current page.
 *
 * Pure formatting: every value is read from the scoring session (bleedV2.scoreSession), the engine payload
 * (engine/index.runPipeline), the P11 band (runtimeEngine.support_edit_band) and the fired style tags
 * (answerStyle.styleTags) — nothing is derived here.
 *
 * Language (owner, 13 Oct): English reports print English labels (Data Block Labels EN v0.1), Dutch reports
 * the Dutch ones. Codes stay codes — tag codes, the version stamps, archetype and group names. Every block
 * carries `key`, its Dutch title, in both languages: code that looks a block up reads the key, never the title.
 *
 * Never on the block (v7 W1 holds for the server too): compute values (τ, τ′, w, arcs, displacement,
 * raw C magnitudes), the answer sheet, Nature/Culture values, the Authenticity Index.
 */

'use strict';

const { groupOf, posOf, BASKETS, toPoints } = require('./bleedV2');
const { pyRound } = require('./py');
const { resolveLineType } = require('../services/lineType');
const { dataPageLines } = require('./answerStyle');

const STATES = ['D1', 'D2', 'D3', 'D4', 'D5'];
const pos = (name) => posOf[name];
/** One decimal, Python str() style: 36 → "36.0". */
const p1 = (x) => { const r = pyRound(x, 1); return Number.isInteger(r) ? r.toFixed(1) : String(r); };

/** Block titles: key (= the Dutch title) → English (labels file §1). */
const TITLES_EN = {
  IDENTITEIT: 'IDENTITY',
  'SCORES (12-PUNTS WIEL)': 'SCORES (12-POINT WHEEL)',
  'MANDJE DECOMPOSITIE': 'BASKET DECOMPOSITION',
  'KEUZE / ECHO PER GROEP': 'CHOICE / ECHO PER GROUP',
  'AFGELEIDE INDICES': 'DERIVED INDICES',
  ANTWOORDSTIJL: 'RESPONSE STYLE',
  'OCEAN PROFIEL (EXTERN GEUPLOAD)': 'OCEAN PROFILE (EXTERNAL UPLOAD)',
  'COGNITIEVE DRIEHOEK (YELLOW)': 'COGNITIVE TRIANGLE (YELLOW)',
  'HARDWARE SIGNALEN': 'HARDWARE SIGNALS',
  'EXTENDED ARCHETYPE PROFIEL': 'EXTENDED ARCHETYPE PROFILE',
  'SHADOW INTEGRATIE': 'SHADOW INTEGRATION',
  BLINDSPOT: 'BLINDSPOT',
};

/**
 * Field labels and values. §2 of the labels file where it has them; the rest (marked *) are the backend's
 * draft for the strings §4 leaves to translate — the Supervisor's pass replaces them.
 */
const LABELS = {
  nl: {
    group: 'groep', position: 'positie', extension: 'Extensie', notAvailable: 'niet beschikbaar',
    lineType: 'Main-Support lijntype', tetrad: 'Tetrad: ja', herkomst: 'Support-herkomst', edit: 'Support-bewerking',
    baskets: { keuze: 'keuze', passief: 'passief', groen: 'groen', blauw: 'blauw', blauw_intern: 'blauw_intern', paars: 'paars', geel: 'geel' },
    herkomstValue: { keuze: 'keuze', passief: 'passief', echo: 'echo' },
    editValue: { zacht: 'zacht', merkbaar: 'merkbaar', sterk: 'sterk' },
    groupLine: (g, d) => `${g}: keuze ${p1(d.keuze)} | passief ${p1(d.passief)} | echo eigen hardware ${p1(d.eigen_echo)} `
      + `| echo uit het wiel ${p1(d.wiel_echo)} | totaal ${p1(d.totaal)} | gekozen-aandeel ${d.gekozen_aandeel}%`,
    polarisation: (pct, m, sh, band) => `Polarisatie: ${pct}% van Main (Main ${m} − Shadow ${sh}) → band: ${band}`,
    polarBand: { HIGH_POLARIZATION: 'schaduw onderdrukt', MODERATE: 'gezonde spanning', HIGH_INDIVIDUATION: 'actieve integratie' },
    ocean: [['O', 'Openheid'], ['C', 'Consciëntieusheid'], ['E', 'Extraversie'], ['A', 'Meegaandheid'], ['N', 'Neuroticisme']],
    triangle: 'Driehoek', yellow: 'geel',
    empty: 'leeg', inversions: 'inversies', none: 'geen', bandsBaseline: 'banden (baseline)', bandsTransform: 'banden (transform)',
    bandsMissing: 'banden: ontbreken (register_bands niet geleverd)', activeSet: 'actieve_set', stamps: 'stempels',
    registerBand: {},
    number: 'Nummer', nameEn: 'Naam EN', nameNl: 'Naam NL',
  },
  en: {
    group: 'group', position: 'position', extension: 'Extension', notAvailable: 'not available', // *
    lineType: 'Main-Support line type', tetrad: 'Tetrad: yes', herkomst: 'Support origin', edit: 'Support editing', // line type *
    baskets: { keuze: 'chosen', passief: 'passive', groen: 'green', blauw: 'blue', blauw_intern: 'blue (internal)', paars: 'purple', geel: 'yellow' },
    herkomstValue: { keuze: 'chosen', passief: 'passive', echo: 'echo' },
    editValue: { zacht: 'soft', merkbaar: 'noticeable', sterk: 'strong' },
    groupLine: (g, d) => `${g}: chosen ${p1(d.keuze)} | passive ${p1(d.passief)} | echo from own hardware ${p1(d.eigen_echo)} `
      + `| echo from the wheel ${p1(d.wiel_echo)} | total ${p1(d.totaal)} | chosen share ${d.gekozen_aandeel}%`,
    polarisation: (pct, m, sh, band) => `Polarisation: ${pct}% of Main (Main ${m} − Shadow ${sh}) → band: ${band}`, // frame *
    polarBand: { HIGH_POLARIZATION: 'shadow suppressed', MODERATE: 'healthy tension', HIGH_INDIVIDUATION: 'active integration' },
    ocean: [['O', 'Openness'], ['C', 'Conscientiousness'], ['E', 'Extraversion'], ['A', 'Agreeableness'], ['N', 'Neuroticism']], // *
    triangle: 'Triangle', yellow: 'yellow', // *
    // * — the HARDWARE SIGNALEN inner labels (labels file §4)
    empty: 'empty', inversions: 'inversions', none: 'none', bandsBaseline: 'bands (baseline)', bandsTransform: 'bands (transform)',
    bandsMissing: 'bands: missing (register_bands not supplied)', activeSet: 'active_set', stamps: 'stamps',
    // * — the workbook's register band labels (Band_Cutpoints sheet), which are Dutch
    registerBand: { laag: 'low', gemiddeld: 'average', 'boven gemiddeld': 'above average', 'ver boven gemiddeld': 'well above average', 'extreem hoog': 'extremely high' },
    number: 'Number', nameEn: 'Name EN', nameNl: 'Name NL', // *
  },
};

/** The line type the server writes, in the report language: "Groene Lijn" → "Green Line" (labels file §2). */
const LINE_TYPE_EN = { 'Groene Lijn': 'Green Line', 'Blauwe Lijn': 'Blue Line', 'Paarse Lijn': 'Purple Line', 'Rode Lijn': 'Red Line', 'Gele Lijn': 'Yellow Line','(geen kanonieke lijn)': '(no canonical line)' };

/**
 * @param {object} p
 * @param {object} p.session      bleedV2.scoreSession output (v2 session)
 * @param {object} p.payload      the engine payload for the same session (runPipeline().payload)
 * @param {'zacht'|'merkbaar'|'sterk'} p.supportEdit  the P11 band (runtimeEngine.support_edit_band)
 * @param {string[]} [p.styleTags] fired tags after precedence (answerStyle.styleTags().tags)
 * @param {{O:number,C:number,E:number,A:number,N:number}|null} [p.ocean]  uploaded OCEAN values, or null
 * @param {'nl'|'en'} [p.language] the report language; 'nl' unless 'en'
 * @returns {{ key: string, title: string, lines: string[] }[]} the blocks in their fixed order
 */
function buildDataBlock({ session: s, payload, supportEdit, styleTags = [], ocean = null, language = 'nl' }) {
  if (!s || s.scoring_version !== 'v2_two_layer') throw new Error('the server-built data block is for v2 sessions');
  if (!payload || payload.main.name !== s.main || payload.support.name !== s.support) throw new Error('payload and session disagree on Main/Support');
  if (!['zacht', 'merkbaar', 'sterk'].includes(supportEdit)) throw new Error('the data block needs the P11 band');
  const en = language === 'en';
  const L = LABELS[en ? 'en' : 'nl'];
  const { main, support, shadow } = s;
  const blindspot = payload.links.red;
  const reg = payload.main.register;
  const ext = payload.extension;
  const blocks = [];
  const block = (key, lines) => blocks.push({ key, title: en ? TITLES_EN[key] : key, lines });
  const signed = (v) => (v === null || v === undefined ? L.empty : `${v > 0 ? '+' : ''}${p1(v)}%`);
  const band = (b) => (b ? L.registerBand[b] || b : L.empty);
  const lineType = resolveLineType(main, support);

  block('IDENTITEIT', [
    `Main: ${main} (${pos(main)}) | ${L.group}: ${groupOf[pos(main)]}`,
    `Support: ${support} (${pos(support)}) | ${L.group}: ${groupOf[pos(support)]}`,
    `${L.extension}: ${ext ? `${ext.n} — ${ext.name_en} / ${ext.name_nl}` : L.notAvailable}`,
    `${L.lineType}: ${en ? LINE_TYPE_EN[lineType] || lineType : lineType}`,
    ...(s.tetrad ? [L.tetrad] : []),
    ...(s.support_herkomst ? [`${L.herkomst}: ${L.herkomstValue[s.support_herkomst]}`] : []),
  ]);

  block('SCORES (12-PUNTS WIEL)', Object.entries(s.totals).map(([n, t]) => `${n} (${pos(n)}): ${p1(t)}`));

  block('MANDJE DECOMPOSITIE', Object.entries(s.mandjes_u).map(([n, m]) =>
    `${n}: ${BASKETS.map((b) => `${L.baskets[b]} ${p1(toPoints(m[b]))}`).join(' | ')}`));

  // NL: the payload line itself, verbatim (§1.3). EN: the same group-view values under the English labels.
  block('KEUZE / ECHO PER GROEP', en
    ? Object.entries(s.group_view).map(([g, d]) => L.groupLine(g, d))
    : s.payload_block.split('\n').slice(1));

  block('AFGELEIDE INDICES', [
    L.polarisation(s.polarizationPct, p1(s.totals[main]), p1(s.totals[shadow]), L.polarBand[s.polarizationLevel]),
    `${L.edit}: ${L.editValue[supportEdit]}`,
  ]);

  if (styleTags.length) block('ANTWOORDSTIJL', dataPageLines(styleTags, en ? 'en' : 'nl'));

  if (ocean) block('OCEAN PROFIEL (EXTERN GEUPLOAD)', L.ocean.map(([k, label]) => `${label}: ${Math.round(ocean[k])}/100`));

  const triangle = [main, ...payload.links.yellow];
  block('COGNITIEVE DRIEHOEK (YELLOW)', [
    `${L.triangle}: ${triangle.join(' · ')}`,
    `${L.yellow}: ${triangle.map((n) => `${n} ${p1(toPoints(s.mandjes_u[n].geel))}`).join(' | ')}`,
  ]);

  // Roles as the report names them (owner, 14 Oct): main, support, co-drivers. The engine's role tag
  // ("support" for every pull member) is a storage role, not the Support.
  const codrivers = payload.codrivers.map((c) => `${c.name} (${c.name === support ? 'support' : 'co-driver'})`);
  block('HARDWARE SIGNALEN', [
    `register_baseline_pct: ${STATES.map((d, i) => `${d} ${signed(reg.register_baseline_pct[i])}`).join(' · ')}`,
    `register_transform_pct: ${STATES.map((d, i) => `${d} ${signed(reg.register_transform_pct[i])}`).join(' · ')}`,
    `${L.inversions}: ${reg.inverted_states.length ? reg.inverted_states.join(', ') : L.none}`,
    // Master Prompt v7 W5: without register_bands the model writes no band language and the server
    // names the gap here.
    ...(reg.band_labels
      ? [
        `${L.bandsBaseline}: ${STATES.map((d) => `${d} ${band(reg.band_labels.baseline[d])}`).join(' · ')}`,
        `${L.bandsTransform}: ${STATES.map((d) => `${d} ${band(reg.band_labels.transform[d])}`).join(' · ')}`,
      ]
      : [L.bandsMissing]),
    `${L.activeSet}: ${[`${main} (main)`, ...codrivers].join(', ')}`,
    `${L.stamps}: tau_calibration_version=${payload.stamps.tau_calibration_version} · corpus_manifest_version=${payload.stamps.corpus_manifest_version}`
      + ` · register_bands_version=${payload.stamps.register_bands_version} · workbook=${payload.stamps.workbook}`,
  ]);

  block('EXTENDED ARCHETYPE PROFIEL', ext
    ? [`${L.number}: ${ext.n}`, `${L.nameEn}: ${ext.name_en}`, `${L.nameNl}: ${ext.name_nl}`, `Main: ${ext.main}`, `Support: ${ext.support}`]
    : [L.notAvailable]);

  block('SHADOW INTEGRATIE', [`Shadow: ${shadow} (${L.position} ${pos(shadow)})`]);
  block('BLINDSPOT', [`Blindspot: ${blindspot} (${L.position} ${pos(blindspot)})`]);
  return blocks;
}

/** The blocks as text: "-- TITLE --" then its lines, a blank line between blocks. */
const dataBlockText = (blocks) => blocks.map((b) => [`-- ${b.title} --`, ...b.lines].join('\n')).join('\n\n');

module.exports = { buildDataBlock, dataBlockText, TITLES_EN, LABELS };
