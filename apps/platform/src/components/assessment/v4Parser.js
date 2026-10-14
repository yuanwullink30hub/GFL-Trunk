/**
 * Deltawerken — v4 result parser / translator (restructure part 2.3)
 * ==================================================================
 * Per Parser_Translator_Coding_Plan.md. Core principle: TITLE-LINES ARE TAGS.
 * The model emits each section behind an uppercase title-line, plus a
 * machine-readable `-- TAG --` data block at the end. This module holds the tag
 * registry, the page map and the title helpers; the report reader (reportReader.js)
 * does the reading itself and never parses prose semantically.
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
// Master Prompt v7 — the 19 sections a complete report carries, by routing slot (the trait blocks sit
// inside PERSOONLIJKHEIDSRAPPORT VERGELIJKING). With the closing line [EINDE RAPPORT] they are the
// completeness check of payload instruction v7 §7.
export const REPORT_V7_SLOTS = [
  'identity', 'verklaring', 'main_essence', 'support_mult', 'shadow', 'blindspot', 'extension',
  'creative_resonance', 'ocean', 'morph_vorm', 'morph_hardware', 'morph_overgang', 'stille_reflectie',
  'stille_motivatie', 'stille_beweging', 'alchemy', 'neural_board', 'ontological', 'ai_prompt',
];

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

export function normalizeTagLine(line) {
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
