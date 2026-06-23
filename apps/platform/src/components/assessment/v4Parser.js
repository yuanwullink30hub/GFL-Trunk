/**
 * Deltawerken — v4 result parser / translator (restructure part 2.3)
 * ==================================================================
 * Per Parser_Translator_Coding_Plan.md. Core principle: TITLE-LINES ARE TAGS.
 * The model emits each section behind an uppercase title-line, plus a
 * machine-readable `-- TAG --` data block at the end. The parser does a
 * STRUCTURAL split on those tags and routes each block to a layout slot — it
 * never parses prose semantically.
 *
 * Build order (plan §7): splitter -> machine-parser -> router -> page-assembler
 * -> chart extractor -> cleanup. The format-DEPENDENT regexes (splitter / machine
 * / chart) are tuned against the Ronin fixture; the format-INDEPENDENT structure
 * (registry, page-map, IF-state) is fixed by the plan and lives here in full.
 *
 * NOTE: the splitter/machine/chart regexes below are the plan's §5 sketches and
 * are marked TUNE — they must be validated against the real Ronin output.
 */

// ── §2a Narrative tag registry: tag-stem -> { slot, renderer } ────────────────
// Matched case-insensitively, trimmed, on a startswith/stem basis (the model may
// append a subtitle after an em-dash, e.g. "PLASTISCHE MORFOLOGIE — DE VORM …").
export const NARRATIVE_TAGS = [
  { stem: 'DE IDENTITEIT', slot: 'identity', renderer: 'prose' },
  { stem: 'WAAROM JIJ DIT PERSPECTIEF GEBRUIKT', slot: 'why_perspective', renderer: 'prose' },
  { stem: 'DE ESSENTIE', slot: 'main_essence', renderer: 'prose' },
  { stem: 'DE VERMENIGVULDIGING', slot: 'support_mult', renderer: 'prose' },
  { stem: 'DE SCHADUW', slot: 'shadow', renderer: 'prose' },
  { stem: 'DE BLINDSPOT', slot: 'blindspot', renderer: 'prose' },
  { stem: 'VISUELE ANALYSE', slot: 'radar_analysis', renderer: 'radar+prose' },
  { stem: 'HET OCEAN-PROFIEL', slot: 'ocean', renderer: 'ocean' },
  { stem: 'PLASTISCHE MORFOLOGIE', slot: 'morphology', renderer: 'morphology_chart' },
  { stem: 'DE STILLE STEM', slot: 'stille_stem', renderer: 'prose+domain_table' },
  { stem: 'PROFESSIONELE RESONANTIE', slot: 'prof_resonance', renderer: 'prose' },
  { stem: 'CREATIEVE RESONANTIE', slot: 'creative_resonance', renderer: 'prose' },
  { stem: 'DUAL-CORE DYNAMICS', slot: 'dual_core', renderer: 'dual_core_table' },
  { stem: 'DE ALCHEMIE VAN INDIVIDUATIE', slot: 'alchemy', renderer: 'prose' },
  { stem: 'HET NEURALE SCHAKELBORD', slot: 'neural_board', renderer: 'prose' },
  { stem: 'ONTOLOGISCHE EVOLUTIE', slot: 'ontological', renderer: 'prose' },
  { stem: 'PERSOONLIJKHEIDSRAPPORT VERGELIJKING', slot: 'ocean_compare', renderer: 'comparison' },
  { stem: 'DE VOLLEDIGE AI PROMPT', slot: 'ai_prompt', renderer: 'monospace' },
];

// ── §2b Machine-block tags (the `-- TAG --` data block) → numeric source of truth.
export const MACHINE_TAGS = {
  'IDENTITEIT': 'identity_fields',
  'SCORES (12-PUNTS WIEL)': 'scores',            // 12 rows: archetype → {total, core, bleed}
  'NATURE / CULTURE VERDELING PER GROEP': 'nat_cult', // 6 rows: group → {N, C, /36}
  'AFGELEIDE INDICES': 'indices',                // authenticity, polarization(+band), datapoints
  'OCEAN PROFIEL (MODEL-AFGELEID)': 'DROP',      // §2b / D-10 — derived OCEAN is forbidden; drop
  'OCEAN PROFIEL (EXTERN GEUPLOAD)': 'ocean_uploaded', // OCEAN bars (only if present)
  'COGNITIEVE DRIEHOEK (YELLOW)': 'yellow_triangle',
  'HARDWARE SIGNALEN': 'hardware_signals',
  'EXTENDED ARCHETYPE PROFIEL': 'extended_profile', // gift, curse, levensles
  'MAIN ARCHETYPE DIEPTE': 'main_depth',
  'SHADOW INTEGRATIE': 'shadow_integration',
  'BLINDSPOT': 'blindspot_fields',
};

// ── §3 Page-map: the locked v4 page order (slot_ids), assembled regardless of
//    emission order. Missing slot → skip (never error). Static pages handled by
//    the existing template; this lists the model-driven slots in order.
export const PAGE_ORDER = [
  ['identity', 'why_perspective'],
  ['main_essence', 'support_mult'],
  ['radar_analysis', 'shadow', 'blindspot'],
  ['ocean', 'ocean_compare'],            // IF-state: 1pg no-upload / 2pg upload
  ['morphology'],                        // CHART + prose
  ['stille_stem'],
  ['prof_resonance', 'creative_resonance'], // + archetype images
  ['dual_core'],
  ['alchemy', 'neural_board', 'ontological'],
  ['ai_prompt'],
  // machine block rendered verbatim on the last page (handled separately)
];

// ── Tag matching: stem startswith on a normalised (upper, em-dash-stripped) line ──
function normalizeTagLine(line) {
  return line
    // strip a leading PDF page-annotation like "(–5). " (digits/dashes/parens/dot)
    .replace(/^[\s(]*[–—\d][–—\d\s).]*\.?\s*(?=[A-Za-z])/, '')
    // drop a subtitle after " — " / " – " (em/EN dash with spaces) — NOT the hyphen
    // inside a tag like "DUAL-CORE DYNAMICS".
    .replace(/\s[—–]\s.*$/, '')
    .replace(/\*+/g, '')                // strip markdown bold
    .replace(/^#+\s*/, '')              // strip markdown heading hashes
    .trim()
    .toUpperCase();
}

/** Is this non-empty line a narrative section tag? Returns the registry entry or null. */
export function matchNarrativeTag(line) {
  const norm = normalizeTagLine(line);
  if (!norm) return null;
  // longest stem first so "DE ESSENTIE (MAIN ARCHETYPE)" matches before "DE …".
  const sorted = [...NARRATIVE_TAGS].sort((a, b) => b.stem.length - a.stem.length);
  return sorted.find((t) => norm.startsWith(t.stem)) || null;
}

// ── §1/§7.1 Splitter: raw model output → { narrative[], machine[] } ────────────
// The machine block starts at the first KNOWN machine tag. A `-- … --` line is a
// machine delimiter only if its name is a registered machine tag — so PDF page
// footers ("-- 9 of 22 --") and stray dashes are NOT mistaken for tags.
const MACHINE_DELIM = /^\s*--\s*(.+?)\s*--\s*$/; // `-- TAG --`
const PAGE_FOOTER = /^\s*--\s*\d+\s+(?:of|van)\s+\d+\s*--\s*$/i; // "-- 9 of 22 --"

function isKnownMachineTag(name) {
  const u = String(name).trim().toUpperCase();
  return Object.keys(MACHINE_TAGS).some((k) => k.toUpperCase() === u);
}

export function splitV4Output(raw) {
  if (!raw) return { narrative: [], machine: [] };
  // Drop PDF page-footers — render artifacts, never part of the model output.
  const lines = String(raw).split('\n').filter((l) => !PAGE_FOOTER.test(l));

  // Machine block = from the first KNOWN machine tag onward.
  const machineStart = lines.findIndex((l) => {
    const m = l.match(MACHINE_DELIM);
    return m && isKnownMachineTag(m[1]);
  });
  const narrativeLines = machineStart === -1 ? lines : lines.slice(0, machineStart);
  const machineLines = machineStart === -1 ? [] : lines.slice(machineStart);

  // Narrative: slice on title-line tags.
  const narrative = [];
  let cur = null;
  for (const line of narrativeLines) {
    const hit = line.trim() ? matchNarrativeTag(line) : null;
    if (hit) {
      if (cur) narrative.push(cur);
      cur = { tag: hit.stem, slot: hit.slot, renderer: hit.renderer, title: line.trim(), body: [] };
    } else if (cur) {
      cur.body.push(line);
    }
    // lines before the first tag (preamble) are dropped
  }
  if (cur) narrative.push(cur);
  narrative.forEach((b) => { b.body = b.body.join('\n').trim(); });

  // Machine: slice only on KNOWN `-- TAG --` delimiters (footers already gone).
  const machine = [];
  let mcur = null;
  for (const line of machineLines) {
    const m = line.match(MACHINE_DELIM);
    if (m && isKnownMachineTag(m[1])) {
      if (mcur) machine.push(mcur);
      const tagName = m[1].trim().toUpperCase();
      mcur = { tag: tagName, key: MACHINE_TAGS[tagName] || null, body: [] };
    } else if (mcur) {
      mcur.body.push(line);
    }
  }
  if (mcur) machine.push(mcur);
  machine.forEach((b) => { b.body = b.body.join('\n').trim(); });

  return { narrative, machine };
}

/** §4 OCEAN IF-state: one flag — was an OCEAN profile uploaded? */
export function hasOceanUpload(machine) {
  return (machine || []).some((b) => b.key === 'ocean_uploaded' && b.body && b.body.trim().length > 0);
}

/** Route narrative blocks → { slot: block }. Drops the forbidden model-derived OCEAN. */
export function routeToSlots(narrative) {
  const slots = {};
  for (const b of narrative || []) slots[b.slot] = b;
  return slots;
}

// ── §5 Morphology D-curve: parse the three series from the morphology block ────
// Tuned against the Ronin fixture. Two real quirks handled:
//  - per-archetype bullets are "D1 Coherent = 86" OR bare "D1 = 56", AND a combined
//    "D4/D5 = 47 -> 21" line (the model collapses the last two points).
//  - composed line is dash-separated with markdown bold: "D1=94 - D2=**100** - …".
// Composed: D1=94 - D2=100 - D3=98 - D4=46 - D5=22.
// Dash-separated, contiguous (D1=94 - D2=**100** - …) — unique to the composed line;
// Support's comma format and Main's bulleted lines won't match.
const COMPOSED_D = /D1\s*=\s*\**(\d+)\**\s*[-–—]\s*D2\s*=\s*\**(\d+)\**\s*[-–—]\s*D3\s*=\s*\**(\d+)\**\s*[-–—]\s*D4\s*=\s*\**(\d+)\**\s*[-–—]\s*D5\s*=\s*\**(\d+)\**/i;

/** Extract [D1..D5] from a Main/Support sub-block. Handles bullets + the D4/D5 combined line. */
function extractDSeries(block) {
  if (!block) return null;
  const out = [];
  // combined "D4/D5 = 47 -> 21" first (sets both points)
  const COMBINED = /D(\d)\s*\/\s*D(\d)\s*=\s*(\d+)\s*(?:->|→|-)\s*(\d+)/gi;
  let cm;
  while ((cm = COMBINED.exec(block)) !== null) { out[+cm[1] - 1] = +cm[3]; out[+cm[2] - 1] = +cm[4]; }
  // single "D{n} [State] = v" — fill only points the combined line didn't set
  const SINGLE = /D(\d)\s*(?:Coherent|Strained|Entrenched|Acute|Collapse)?\s*=\s*(\d+)/gi;
  let m;
  while ((m = SINGLE.exec(block)) !== null) { const i = +m[1] - 1; if (out[i] === undefined) out[i] = +m[2]; }
  for (let i = 0; i < 5; i++) if (out[i] === undefined) return null;
  return out;
}

export function parseMorphologyChart(morphologyBody) {
  if (!morphologyBody) return null;
  // Sub-blocks delimited by their "Main -" / "Support -" headers and the composed line.
  const mainBlock = (morphologyBody.match(/Main\s*[-–—][^]*?(?=Support\s*[-–—])/i) || [])[0] || '';
  const supportBlock = (morphologyBody.match(/Support\s*[-–—][^]*?(?=Samengesteld|$)/i) || [])[0] || '';
  const main = extractDSeries(mainBlock);
  const support = extractDSeries(supportBlock);
  // Composed: the dash-separated line is unambiguous; match it anywhere in the body.
  const cm = morphologyBody.match(COMPOSED_D);
  const composed = cm ? [+cm[1], +cm[2], +cm[3], +cm[4], +cm[5]] : null;
  if (!main && !support && !composed) return null;
  return { main, support, composed };
}

// ── §7.2 Machine-block value parser — THE numeric source of truth ─────────────
// Numbers (radar, dual-core, indices, OCEAN bars) come from here, parsed; never
// scraped from prose. Tuned against the Ronin machine block.

/** "Key: Value | Key2: Value2" lines → { key(lowercased): value }. First wins. */
function parseKeyValueBlock(body) {
  const out = {};
  for (const line of String(body || '').split('\n')) {
    for (const seg of line.split('|')) {
      const i = seg.indexOf(':');
      if (i > 0) {
        const k = seg.slice(0, i).trim().toLowerCase();
        const v = seg.slice(i + 1).trim();
        if (k && v && !(k in out)) out[k] = v;
      }
    }
  }
  return out;
}

/** SCORES rows: "Judge(1): 8 (Core: 0 | Bleed: 8)" → 12 × {key,name,pos,total,core,bleed}. */
function parseScores(body) {
  const rows = [];
  const re = /^\s*([A-Za-z]+)\((\d+)\)\s*:\s*(\d+)\s*\(Core:\s*(\d+)\s*\|\s*Bleed:\s*(\d+)\)/gim;
  let m;
  while ((m = re.exec(body)) !== null) {
    rows.push({ key: m[1].toUpperCase(), name: m[1], pos: +m[2], total: +m[3], core: +m[4], bleed: +m[5] });
  }
  return rows;
}

/** NAT/CULT rows: "Ruling: N1 / C1 = 2/36" → 6 × {group,N,C,total,max}. */
function parseNatCult(body) {
  const rows = [];
  const re = /^\s*([A-Za-z]+)\s*:\s*N(\d+)\s*\/\s*C(\d+)\s*=\s*(\d+)\/(\d+)/gim;
  let m;
  while ((m = re.exec(body)) !== null) {
    rows.push({ group: m[1], N: +m[2], C: +m[3], total: +m[4], max: +m[5] });
  }
  return rows;
}

/** AFGELEIDE INDICES → { authenticity, polarization(+band), datapoints }. */
function parseIndices(body) {
  const out = {};
  let m;
  if ((m = body.match(/Authenticity Index:\s*(\d+)\/(\d+)\s*Nature\s*\((\d+)%?\)/i)))
    out.authenticity = { nature: +m[1], total: +m[2], pct: +m[3] };
  if ((m = body.match(/Polarization Index:\s*(\d+)\s*\(Main\)\s*[-–—]\s*(\d+)\s*\(Shadow\)\s*=\s*gap\s*(\d+)%?\s*(?:->|→)?\s*(.+)?/i)))
    out.polarization = { main: +m[1], shadow: +m[2], gapPct: +m[3], band: (m[4] || '').trim() };
  if ((m = body.match(/Datapunten:\s*(\d+)\s*\/\s*(\d+)/i)))
    out.datapoints = { value: +m[1], max: +m[2] };
  return out;
}

// OCEAN bars: "Openheid: 72/100" etc. NB the machine block uses short Dutch labels.
const DUTCH_OCEAN = { openheid: 'O', ordelijkheid: 'C', extraversie: 'E', meegaandheid: 'A', neuroticisme: 'N' };
function parseOceanBlock(body) {
  const out = {};
  const re = /^\s*([A-Za-zëïéè]+)\s*:\s*(\d+)\s*\/\s*100/gim;
  let m;
  while ((m = re.exec(body)) !== null) {
    const letter = DUTCH_OCEAN[m[1].toLowerCase()];
    if (letter) out[letter] = +m[2];
  }
  return Object.keys(out).length ? out : null;
}

/** §7.2 Parse the whole machine block → structured numeric data. Drops model-derived OCEAN. */
export function parseMachineBlock(machine) {
  const byKey = {};
  for (const b of machine || []) if (b.key && b.key !== 'DROP') byKey[b.key] = b.body;
  const data = {};
  if (byKey.identity_fields) data.identity = parseKeyValueBlock(byKey.identity_fields);
  if (byKey.scores) data.scores = parseScores(byKey.scores);
  if (byKey.nat_cult) data.natCult = parseNatCult(byKey.nat_cult);
  if (byKey.indices) data.indices = parseIndices(byKey.indices);
  if (byKey.ocean_uploaded) data.oceanUploaded = parseOceanBlock(byKey.ocean_uploaded);
  if (byKey.yellow_triangle) data.yellowTriangle = parseKeyValueBlock(byKey.yellow_triangle);
  if (byKey.hardware_signals) data.hardwareSignals = parseKeyValueBlock(byKey.hardware_signals);
  if (byKey.extended_profile) data.extendedProfile = parseKeyValueBlock(byKey.extended_profile);
  if (byKey.main_depth) data.mainDepth = parseKeyValueBlock(byKey.main_depth);
  if (byKey.shadow_integration) data.shadowIntegration = parseKeyValueBlock(byKey.shadow_integration);
  if (byKey.blindspot_fields) data.blindspotFields = parseKeyValueBlock(byKey.blindspot_fields);
  return data;
}

// ── §7.4 Page assembler — emit slots in the locked page-map order, IF-state aware.
export function assembleV4(raw) {
  const { narrative, machine } = splitV4Output(raw);
  const slots = routeToSlots(narrative);
  const machineData = parseMachineBlock(machine);
  const oceanUpload = hasOceanUpload(machine);

  const pages = [];
  for (const group of PAGE_ORDER) {
    const onPage = group
      .filter((id) => {
        if (id === 'ocean_compare' && !oceanUpload) return false; // only when uploaded
        return slots[id];
      })
      .map((id) => slots[id]);
    if (onPage.length) pages.push(onPage);
  }

  // Render-ready morphology: chart series + prose with the charted text removed.
  let morphology = null;
  if (slots.morphology) {
    morphology = {
      chart: parseMorphologyChart(slots.morphology.body),
      prose: stripStrayMarkdown(stripChartedData(slots.morphology.body)),
    };
  }

  return { pages, slots, machineData, oceanUpload, morphology };
}

/** §5 cleanup: strip the charted data (fenced ASCII + raw value lines) from prose. */
export function stripChartedData(body) {
  if (!body) return body;
  return body
    .replace(/```[^]*?```/g, '')                    // fenced ASCII chart block
    .replace(/^.*D1=\d+[^]*?D5=\d+.*$/gim, '')        // the composed value line
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Strip stray markdown the model adds (bold, fences) for clean prose display. */
export function stripStrayMarkdown(body) {
  if (!body) return body;
  return body.replace(/```[^]*?```/g, '').replace(/\*\*/g, '').replace(/\s{3,}/g, ' ').trim();
}
