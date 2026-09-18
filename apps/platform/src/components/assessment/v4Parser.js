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
// Master Prompt v4.1–v5.2 §5 — the locked section list, EXACT titles as parser-tags, in order.
// (Longest stem wins on overlap; see matchNarrativeTag.)
//
// Two report languages. `stem` is the Dutch tag (the canonical routing key); `en` lists the
// English tag an English report emits — a pure translation of the Dutch title — plus, where an
// English display label already existed with other wording (v4Labels), that wording as an alias.
// An English title is canonicalised to its Dutch stem (canonicalTitle), so every page collector
// keys on one vocabulary; the emitted title is kept for display.
export const NARRATIVE_TAGS = [
  // p1 — Identiteit + Verklaring
  { stem: 'DE IDENTITEIT', en: ['THE IDENTITY'], slot: 'identity', renderer: 'prose' },
  { stem: 'DE VERKLARING', en: ['THE EXPLANATION'], slot: 'verklaring', renderer: 'prose' },
  // p2 — Essentie + Vermenigvuldiging
  { stem: 'DE ESSENTIE', en: ['THE ESSENCE'], slot: 'main_essence', renderer: 'prose' },
  { stem: 'DE VERMENIGVULDIGING', en: ['THE MULTIPLICATION'], slot: 'support_mult', renderer: 'prose' },
  // p3 — Radar (render-side) + Schaduw + Blindspot
  { stem: 'DE SCHADUW', en: ['THE SHADOW'], slot: 'shadow', renderer: 'prose' },
  { stem: 'DE BLINDSPOT', en: ['THE BLINDSPOT'], slot: 'blindspot', renderer: 'prose' },
  // p4 — OCEAN comparison. PERSOONLIJKHEIDSRAPPORT VERGELIJKING is ONE section: the value block and
  // the five trait blocks travel together (Brief v2 Addendum A §2). It is a tag so a bare title line is
  // promoted to a heading — otherwise the whole OCEAN text glues onto CREATIEVE RESONANTIE. Deliberately
  // NOT in PAGE_ORDER: the renderer places it, and gate 32 pins the tag slots to PAGE_ORDER.
  { stem: 'PERSOONLIJKHEIDSRAPPORT VERGELIJKING', en: ['PERSONALITY REPORT COMPARISON'], slot: 'ocean', renderer: 'prose' },
  // The five per-trait tags (same tag in both languages); inside the comparison they are subheadings.
  { stem: 'TRAIT O', en: [], slot: 'ocean_o', renderer: 'prose' },
  { stem: 'TRAIT C', en: [], slot: 'ocean_c', renderer: 'prose' },
  { stem: 'TRAIT E', en: [], slot: 'ocean_e', renderer: 'prose' },
  { stem: 'TRAIT A', en: [], slot: 'ocean_a', renderer: 'prose' },
  { stem: 'TRAIT N', en: [], slot: 'ocean_n', renderer: 'prose' },
  // p5 — Plastische Morfologie (render-side D-curve chart) + 3 reads
  { stem: 'DE VORM', en: ['THE SHAPE', 'THE FORM'], slot: 'morph_vorm', renderer: 'prose' },
  { stem: 'DE HARDWARE ONDER DRUK', en: ['THE HARDWARE UNDER PRESSURE'], slot: 'morph_hardware', renderer: 'prose' },
  { stem: 'DE OVERGANG NAAR DE STILLE STEM', en: ['THE TRANSITION TO THE QUIET VOICE', 'THE BRIDGE TO THE QUIET VOICE'], slot: 'morph_overgang', renderer: 'prose' },
  // p6 — De Stille Stem
  { stem: 'REFLECTIE', en: ['REFLECTION'], slot: 'stille_reflectie', renderer: 'prose' },
  { stem: 'MOTIVATIE', en: ['MOTIVATION'], slot: 'stille_motivatie', renderer: 'prose' },
  { stem: 'BEWEGING', en: ['MOVEMENT'], slot: 'stille_beweging', renderer: 'prose' },
  // p7 — Archetype images (render-side) + De Extensie (v5.2 §5.7) + Resonantie
  { stem: 'DE EXTENSIE', en: ['THE EXTENSION'], slot: 'extension', renderer: 'prose' },
  { stem: 'PROFESSIONELE RESONANTIE', en: ['PROFESSIONAL RESONANCE'], slot: 'prof_resonance', renderer: 'prose' },
  { stem: 'CREATIEVE RESONANTIE', en: ['CREATIVE RESONANCE'], slot: 'creative_resonance', renderer: 'prose' },
  // p8 — Dual-Core chart (render-side) + Alchemie + Schakelbord + Evolutie
  { stem: 'DE ALCHEMIE VAN INDIVIDUATIE', en: ['THE ALCHEMY OF INDIVIDUATION'], slot: 'alchemy', renderer: 'prose' },
  { stem: 'HET NEURALE SCHAKELBORD', en: ['THE NEURAL SWITCHBOARD'], slot: 'neural_board', renderer: 'prose' },
  { stem: 'ONTOLOGISCHE EVOLUTIE', en: ['ONTOLOGICAL EVOLUTION'], slot: 'ontological', renderer: 'prose' },
  // p9 — AI prompt
  { stem: 'DE VOLLEDIGE AI PROMPT', en: ['THE FULL AI PROMPT', 'THE COMPLETE AI PROMPT'], slot: 'ai_prompt', renderer: 'monospace' },
];

// In-body labels that begin like a tag but are NOT titles: the three Neurale Schakelbord
// experiments (§5.8) — "De Focus-hendel:", "De Schaduw-injectie:", "De Blindspot-check:" and their
// English translations. Matched on the normalised line, hyphen or space.
const NOT_TAGS = /^(?:DE FOCUS[- ]HENDEL|DE SCHADUW[- ]INJECTIE|DE BLINDSPOT[- ]CHECK|THE FOCUS[- ]LEVER|THE SHADOW[- ]INJECTION|THE BLINDSPOT[- ]CHECK)\b/;

// ── §2b Machine-block tags (the `-- TAG --` data block) → numeric source of truth.
// Master Prompt v4.1 §5.10 — machine block fields, in order. Model-derived OCEAN
// removed (D-10); dead v3 fields removed; 5-mandje decompositie added. English tags are the
// translations the PDF's own data page already prints (i18n resultsModal.pdf.data.*).
export const MACHINE_TAGS = {
  'IDENTITEIT': 'identity_fields',
  'SCORES (12-PUNTS WIEL)': 'scores',            // 12 rows: archetype → {total, core, bleed}
  '5-MANDJE DECOMPOSITIE': 'five_mandje',        // per archetype: nature_core, green_hw, culture_core, blue_fb, yellow_cog, purple_shadow
  'NATURE / CULTURE VERDELING PER GROEP': 'nat_cult', // 6 rows: group → {N, C, /36}
  'AFGELEIDE INDICES': 'indices',                // authenticity, polarization(+band), datapoints
  'OCEAN PROFIEL (EXTERN GEUPLOAD)': 'ocean_uploaded', // OCEAN bars (only if upload present)
  'COGNITIEVE DRIEHOEK (YELLOW)': 'yellow_triangle',
  'HARDWARE SIGNALEN': 'hardware_signals',
  'EXTENDED ARCHETYPE PROFIEL': 'extended_profile', // gift, curse, levensles
  'SHADOW INTEGRATIE': 'shadow_integration',
  'BLINDSPOT': 'blindspot_fields',
  // English report
  'IDENTITY': 'identity_fields',
  'SCORES (12-POINT WHEEL)': 'scores',
  '5-BASKET DECOMPOSITION': 'five_mandje',
  'NATURE / CULTURE DISTRIBUTION PER GROUP': 'nat_cult',
  'DERIVED INDICES': 'indices',
  'OCEAN PROFILE (EXTERNALLY UPLOADED)': 'ocean_uploaded',
  'COGNITIVE TRIANGLE (YELLOW)': 'yellow_triangle',
  'HARDWARE SIGNALS': 'hardware_signals',
  'EXTENDED ARCHETYPE PROFILE': 'extended_profile',
  'SHADOW INTEGRATION': 'shadow_integration',
};

// ── §3 Page-map: the locked v4 page order (slot_ids), assembled regardless of
//    emission order. Missing slot → skip (never error). Static pages handled by
//    the existing template; this lists the model-driven slots in order.
// Master Prompt v4.1 §5 — locked page order. Render-side visuals (radar, D-curve,
// dual-core chart, archetype images, meta-disclaimer) are added by the renderer.
export const PAGE_ORDER = [
  ['identity', 'verklaring'],                                  // p1
  ['main_essence', 'support_mult'],                            // p2
  ['shadow', 'blindspot'],                                     // p3 + radar
  ['ocean_o', 'ocean_c', 'ocean_e', 'ocean_a', 'ocean_n'],     // p4 (upload-only; IF-state)
  ['morph_vorm', 'morph_hardware', 'morph_overgang'],          // p5 + D-curve chart
  ['stille_reflectie', 'stille_motivatie', 'stille_beweging'], // p6
  ['extension', 'prof_resonance', 'creative_resonance'],       // p7 + archetype images
  ['alchemy', 'neural_board', 'ontological'],                  // p8 + dual-core chart
  ['ai_prompt'],                                               // p9
  // machine block rendered verbatim on the last page (handled separately)
];

// ── Tag matching: stem startswith on a normalised (upper, em-dash-stripped) line ──
// Master Prompt v6.2.x: the DEEL 5 checklist names the Stille Stem sections "DE STILLE STEM — REFLECTIE"
// (… MOTIVATIE, … BEWEGING) while their TITEL (exact) lines are plain REFLECTIE / MOTIVATIE / BEWEGING.
// The page label in front is not part of the tag: it is dropped for matching, and from the title the
// card and PDF show (they add their own "De Stille Stem — " prefix). Only this label is stripped, and
// only when a known tag follows — "DE STILLE STEM — DE SUPPORT DIE DE KERN BEWERKT" stays untagged.
// A title dash is an em/en dash or one to three hyphens, always with spaces around it: a prompt pasted
// without pandoc conversion writes "---", and the model copies what it reads. The spaces keep a
// hyphenated tag like "DUAL-CORE DYNAMICS" whole.
const TITLE_DASH = String.raw`(?:[—–]|-{1,3})`;
const PAGE_LABEL_BARE = new RegExp(String.raw`^(?:DE STILLE STEM|THE QUIET VOICE)\s+${TITLE_DASH}\s+(?=\S)`, 'i');
const PAGE_LABEL = new RegExp(String.raw`^(\s*(?:#+\s*)?\**\s*(?:\d+[A-Za-z]?\.\s+)?)(?:DE STILLE STEM|THE QUIET VOICE)\s+${TITLE_DASH}\s+(?=\S)`, 'i');
const SUBTITLE_CUT = new RegExp(String.raw`\s${TITLE_DASH}\s.*$`);

// ── Subheadings — a third heading level inside a section, never a section of their own ──
// Master Prompt v6.2.9 fixes them per section (Brief v2 Addendum A §1): DE ESSENTIE carries
// "Cognitieve aanleg" then "Oriëntatie (intern/extern)"; DE VERMENIGVULDIGING carries
// "Oriëntatie (intern/extern)". Inside PERSOONLIJKHEIDSRAPPORT VERGELIJKING the five trait names
// (and a TRAIT X tag) head the trait blocks. Matched on the exact string, case-insensitive, with
// markdown markers and a trailing colon ignored.
export const CONTRACT_SUBHEADINGS = [
  'Cognitieve aanleg', 'Oriëntatie (intern/extern)',
  'Cognitive disposition', 'Orientation (internal/external)',
];
// The five TRAITS only — Ordelijkheid is an aspect of Consciëntieusheid, never a trait heading (§5b).
const OCEAN_TRAIT_NAMES = [
  'Openheid', 'Consciëntieusheid', 'Conscientieusheid', 'Extraversie', 'Meegaandheid', 'Neuroticisme',
  'Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism',
];
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const CONTRACT_RE = new RegExp(`^(?:${CONTRACT_SUBHEADINGS.map(esc).join('|')})$`, 'i');
// v6.3.0 contracts the trait subheading as "[trait] --- [score]" ("Openheid --- 72"). Also accepted:
// "Openheid", "Openheid (O)", "Openheid voor ervaringen - 72", "TRAIT O — Openheid" — never a value
// line like "Openheid: 72/100" (a colon is data, a title dash is a heading).
const TRAIT_NAMES_RE = OCEAN_TRAIT_NAMES.map(esc).join('|');
const TRAIT_SCORE = String.raw`\s*${TITLE_DASH}\s*\d{1,3}(?:\s*\/\s*100)?`;
const TRAIT_RE = new RegExp(String.raw`^(?:TRAIT\s+[OCEAN]\b(?:\s*${TITLE_DASH}\s*(?:${TRAIT_NAMES_RE}))?|(?:${TRAIT_NAMES_RE})(?:\s+voor\s+ervaring(?:en)?)?)(?:\s*\([^)]*\))?(?:${TRAIT_SCORE})?$`, 'i');
// The same heading run into its body on one line: "Meegaandheid --- 39 Dit getal verbergt…".
const TRAIT_SCORED_LEAD = new RegExp(String.raw`^((?:${TRAIT_NAMES_RE})(?:\s+voor\s+ervaring(?:en)?)?${TRAIT_SCORE})\s*(.+)$`, 'i');
// The render-side OCEAN value table's title — if the model writes its own, it stays inside the section.
const OCEAN_TOOL_RE = /^ocean[\s-]*(?:gereedschap|tool|instrument)\b/i;

/**
 * Text of a heading line with markdown markers, a leading number and a trailing colon removed, and a
 * raw prompt dash (" -- " / " --- ", copied from an unconverted prompt) shown as a plain " - ".
 */
export function bareHeading(line) {
  return String(line || '')
    .replace(/^\s*#+\s*/, '')
    .replace(/^\s*(?:\d+[A-Za-z]?\.\s+)/, '')
    .replace(/\*+/g, '')
    .replace(/\s*:\s*$/, '')
    .replace(/\s-{2,3}\s/g, ' - ')
    .trim();
}

/** Is this heading one of the fixed section subheadings (Essentie / Vermenigvuldiging)? */
export function isContractSubheading(line) {
  return CONTRACT_RE.test(bareHeading(line));
}

/** Does this heading belong inside the OCEAN comparison (a trait block or the value table)? */
export function isOceanMemberHeading(line) {
  const t = bareHeading(line);
  return TRAIT_RE.test(t) || OCEAN_TOOL_RE.test(t);
}

/**
 * A subheading found glued to its body on one line — "**Meegaandheid**Dit blok…" or
 * "MeegaandheidDit blok…" — split into { heading, rest }; null when the line is not glued.
 * A bold run ending in ":" is an inline label ("**De Focus-hendel:**Probeer…"), not a heading.
 */
export function splitGluedHeading(line) {
  const s = String(line || '').trim();
  const bold = s.match(/^\*\*([^*]+?)\*\*(?=\S)(.+)$/);
  if (bold && !/:\s*$/.test(bold[1])) return { heading: bold[1].trim(), rest: bold[2].trim() };
  const scored = s.match(TRAIT_SCORED_LEAD);
  if (scored && /^[A-ZÀ-Þ]/.test(scored[2])) return { heading: scored[1].trim(), rest: scored[2].trim() };
  const names = [...CONTRACT_SUBHEADINGS, ...OCEAN_TRAIT_NAMES].sort((a, b) => b.length - a.length);
  for (const n of names) {
    if (s.length > n.length && s.slice(0, n.length).toLowerCase() === n.toLowerCase() && /[A-ZÀ-Þ]/.test(s.charAt(n.length))) {
      return { heading: s.slice(0, n.length), rest: s.slice(n.length).trim() };
    }
  }
  return null;
}

/** A section title without the Stille Stem page label, when a known tag follows it; else unchanged. */
export function stripPageLabel(title) {
  const s = String(title || '');
  const out = s.replace(PAGE_LABEL, '$1');
  return out !== s && matchNarrativeTag(s) ? out : s;
}

function normalizeTagLine(line) {
  return line
    .replace(/^\s*#+\s*/, '')           // strip markdown heading hashes (first, so "## 2. …" loses its number below)
    .replace(/\*+/g, '')                // strip markdown bold
    // strip a leading PDF page-annotation like "(–5). " or a section number "2. " (digits/dashes/parens/dot)
    .replace(/^[\s(]*[–—\d][–—\d\s).]*\.?\s*(?=[A-Za-z])/, '')
    // drop the page label in front of a Stille Stem title (see PAGE_LABEL) before the subtitle cut
    .replace(PAGE_LABEL_BARE, '')
    // drop a subtitle after a spaced title dash (" — ", " – ", " - ", " -- ", " --- ") — NOT the
    // hyphen inside a tag like "DUAL-CORE DYNAMICS".
    .replace(SUBTITLE_CUT, '')
    .trim()
    .toUpperCase();
}

// Every (stem, entry, language) pair, longest stem first so "DE ESSENTIE (MAIN ARCHETYPE)"
// matches before "DE …" and "THE SHADOW" never shadows a longer English tag.
const STEMS = NARRATIVE_TAGS
  .flatMap((t) => [{ text: t.stem, lang: 'nl', entry: t }, ...t.en.map((e) => ({ text: e, lang: 'en', entry: t }))])
  .sort((a, b) => b.text.length - a.text.length);

/**
 * Is this non-empty line a narrative section tag? Returns the registry entry plus `matched`
 * (the stem as found) and `lang` ('nl' | 'en'), or null.
 */
export function matchNarrativeTag(line) {
  const norm = normalizeTagLine(line);
  if (!norm || NOT_TAGS.test(norm)) return null;
  // Behind the Stille Stem page label the title must be the tag and nothing else, so a sentence
  // like "De Stille Stem — motivatie is wat je voelt…" never becomes a section.
  const labelled = PAGE_LABEL.test(String(line));
  // The stem must be followed by end-of-string, a space, or "(" — NOT a hyphen/letter.
  // With NOT_TAGS this keeps in-body labels like "DE SCHADUW-INJECTIE:" / "THE SHADOW INJECTION:"
  // (the Neurale Schakelbord experiments, §5.8) from being mistaken for the SCHADUW/SHADOW tags.
  const hit = STEMS.find((s) => {
    if (!norm.startsWith(s.text)) return false;
    const after = norm.charAt(s.text.length);
    return labelled ? after === '' : after === '' || after === ' ' || after === '(';
  });
  return hit ? { ...hit.entry, matched: hit.text, lang: hit.lang } : null;
}

/**
 * Routing form of a section title: an English tag's stem is swapped for its Dutch stem, the rest
 * of the title (numbering, parenthetical, names after the dash) kept as emitted. Dutch and
 * unrecognised titles come back unchanged. "THE EXTENSION — The Usurper · De Troonrover" →
 * "DE EXTENSIE — The Usurper · De Troonrover".
 */
export function canonicalTitle(title) {
  const raw = String(title || '');
  const hit = matchNarrativeTag(raw);
  if (!hit || hit.lang !== 'en') return raw;
  const at = raw.toUpperCase().indexOf(hit.matched);
  return at < 0 ? raw : raw.slice(0, at) + hit.stem + raw.slice(at + hit.matched.length);
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
      cur = { tag: hit.stem, slot: hit.slot, renderer: hit.renderer, title: stripPageLabel(line.trim()), body: [] };
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
  const supportBlock = (morphologyBody.match(/Support\s*[-–—][^]*?(?=Samengesteld|Composed|$)/i) || [])[0] || '';
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
  if ((m = body.match(/(?:Datapunten|Data\s*points):\s*(\d+)\s*\/\s*(\d+)/i)))
    out.datapoints = { value: +m[1], max: +m[2] };
  return out;
}

// OCEAN bars: "Openheid: 72/100" / "Openness: 72/100". Short Dutch labels, or the English trait
// names (the translation and the conventional Big Five name are both accepted).
const OCEAN_LABELS = {
  openheid: 'O', 'consciëntieusheid': 'C', conscientieusheid: 'C', extraversie: 'E', meegaandheid: 'A', neuroticisme: 'N',
  openness: 'O', conscientiousness: 'C', extraversion: 'E', agreeableness: 'A', neuroticism: 'N',
};
// Ordelijkheid / Orderliness is an ASPECT of C (Brief v2 Addendum A §5b); older reports used it as the
// name of C itself. Read it for C only when no trait-named C is present, so an aspect line that travels
// with its trait never overwrites the trait's own value.
const OCEAN_LEGACY_C = new Set(['ordelijkheid', 'orderliness']);
function parseOceanBlock(body) {
  const out = {};
  let legacyC = null;
  const re = /^\s*([A-Za-zëïéè]+)\s*:\s*(\d+)\s*\/\s*100/gim;
  let m;
  while ((m = re.exec(body)) !== null) {
    const key = m[1].toLowerCase();
    const letter = OCEAN_LABELS[key];
    if (letter) out[letter] = +m[2];
    else if (OCEAN_LEGACY_C.has(key) && legacyC == null) legacyC = +m[2];
  }
  if (out.C == null && legacyC != null) out.C = legacyC;
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
