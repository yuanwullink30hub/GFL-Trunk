/**
 * Report reader — the model's analysis text → the report's sections, with nothing lost and nothing
 * misplaced (owner, 2026-09-18: "dynamic reading … so we never lose part of the text or misplace them").
 *
 * The model writes the sections of Master Prompt DEEL 5 in a fixed order. Models drift, though: a
 * typo, a dropped article, a trailing colon, a raw "---" dash, a title cut short, a heading of their
 * own. The reader copes with that instead of losing the text under it:
 *
 *   1. Headings are SCORED per line — exact (3), the tag plus other words (2), fuzzy (1) — and a
 *      section keeps only its best candidates. A body line that merely STARTS with a section name
 *      ("DE BLINDSPOT VAN JE SCHADUW") can never take the place of the real heading, and a fuzzy
 *      match is only taken where the expected order has a hole for it.
 *   2. A `##` heading splits only when it IS a section (or one of the named, discarded blocks);
 *      anything else — a heading the model invented — becomes a subheading of the section it stands
 *      in. It used to become a section of its own, which the renderer then dropped, body and all.
 *   3. A lost first heading is recovered: when DE IDENTITEIT is missing and the model just started
 *      writing, that text IS De Identiteit — not a preamble to throw away.
 *   4. A ledger: every line of the model's text is carried by a section or discarded by a NAMED rule
 *      (Kaart microcopy, a render-side echo, a shorter duplicate, …). Anything else is `unaccounted`
 *      — the tripwire for the next surprise, logged by the renderer.
 *
 * The title helpers the renderer routes on live here too, so the reader and the renderer agree on
 * what a title means.
 */

import {
  NARRATIVE_TAGS, matchNarrativeTag, normalizeTagLine, canonicalTitle, stripPageLabel,
  bareHeading, isOceanMemberHeading, isContractSubheading,
} from './v4Parser.js';

// ── Title helpers (shared with the renderer) ─────────────────────────────────────────────────────

// ── Utility: strip "SECTIE N:" / "**SECTIE N**" prefix + surrounding ** bold markers ──
export const cleanTitle = (title) => {
  if (!title) return title;
  let t = title.trim();
  // Strip outer ** bold markers wrapping the whole string (e.g. "**De Identiteit**")
  t = t.replace(/^\*\*(.+)\*\*$/, '$1').trim();
  // Strip "SECTIE N" prefix in all forms: "SECTIE 1:", "SECTIE 1.", "**SECTIE 1**:", "**SECTIE 1**"
  t = t.replace(/^\*?\*?SECTIE\s+\d+\*?\*?[\s:.—-]*\s*/i, '').trim();
  // Strip bare numeric prefixes like "12. " or "12: " or "13A. " that the AI may include
  t = t.replace(/^\d+[a-zA-Z]?[\s.:—-]+\s*/i, '').trim();
  // Strip any remaining stray ** at start or end
  t = t.replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
  // A raw prompt dash the model copied ("DE EXTENSIE --- De Ronin") shows as a plain " - "
  t = t.replace(/\s-{2,3}\s/g, ' - ');
  return t;
};

// ── Report language. Section TITLES that are parser tags need nothing here: parseAiSections
//    canonicalises an English tag ("THE SHADOW …") to its Dutch stem ("DE SCHADUW …") in
//    `title`, so every collector below keys on the Dutch words, and keeps the emitted title in
//    `displayTitle` for display. What follows are the non-tag titles the renderer filters on,
//    in both report languages. ──
export const COMPARISON_TITLE = /persoonlijkheidsrapport.*vergelijk|ocean.*vergelijk|vergelijk.*profiel|personality\s*report.*comparison|ocean.*comparison|comparison.*profile/i;
export const COMPARISON_SUBSECTION = /^(spanningsvelden|vergelijkingsrapport|vergelijkings\s*rapport|conclusie|convergente|divergente|stap\s+\d|tension\s*fields|comparison\s*report|conclusion|convergent|divergent|step\s+\d)/i;
/** "Radar-lezing" / "Radar reading" — the radar chart covers it; never rendered. */
export const RADAR_READING_TITLE = /radar.?(?:lezing|reading)/i;
/** Stray AI-emitted sections outside the page-map. */
export const STRAY_TITLE = /(?:samenvattende\s+)?kernlezing|centrale\s+spanning|(?:summary\s+)?core\s+reading|central\s+tension/i;
/** The model's machine block and the render-side OCEAN titles — the renderer draws its own. */
export const RENDER_SIDE_TITLE = /profiel\s*data|ai[\s-]*verwerking|ocean.?gereedschap|ocean.?profiel|profile\s*data|ai[\s-]*processing|ocean.?(?:tool|instrument)|ocean.?profile/i;
/** v3 "5 geometrische elementen" leftover — not a v4.1+ section. */
export const V3_ELEMENTS_TITLE = /geometrische\s+element|vijf\s+(?:geometrische\s+)?element|geometric\s+element|five\s+(?:geometric\s+)?element/i;
/** v5.2 §5.7 "DE EXTENSIE — [naam EN] · [naam NL]" (canonical form of "THE EXTENSION — …"). */
export const isExtensionTitle = (title) => /^de\s+extensie\b/i.test(cleanTitle(title || ''));
/** The title as the model emitted it — what the card and the PDF show. Routing uses `title`. */
export const shownTitle = (s) => (s && (s.displayTitle || s.title)) || '';

// ── Headings: which lines start a section ────────────────────────────────────────────────────────

// Master Prompt v6.2.x DEEL 5 — the emit order, by v4Parser slot. Only used where order is the
// evidence: accepting a fuzzy heading, and recovering a lost first heading.
const EMIT_ORDER = [
  'identity', 'verklaring', 'main_essence', 'support_mult', 'shadow', 'blindspot',
  'extension', 'prof_resonance', 'creative_resonance',
  'ocean', 'ocean_o', 'ocean_c', 'ocean_e', 'ocean_a', 'ocean_n',
  'morph_vorm', 'morph_hardware', 'morph_overgang',
  'stille_reflectie', 'stille_motivatie', 'stille_beweging',
  'alchemy', 'neural_board', 'ontological', 'ai_prompt',
];
const orderOf = (slot) => EMIT_ORDER.indexOf(slot);

// Blocks the model writes that are deliberately NOT report sections — they keep splitting off, and
// the renderer's filters drop them, now on the ledger: the machine block, Kaart microcopy, echoes of
// the prompt's page labels, and legacy (v3/v4) headings.
const DISCARD_BOUNDARY = [
  RENDER_SIDE_TITLE, RADAR_READING_TITLE, STRAY_TITLE, V3_ELEMENTS_TITLE, COMPARISON_SUBSECTION,
  /leerling\s+ontologisch|^(?:introductie|inleiding|introduction)$|(?:kaart|card)\s*microcopy|profiel\s*(?:dynamiek|element)|(?:5|vijf)\s*element/i,
  /groep\s+dynamiek|neurobiologische\s+interpretatie|cognitieve\s*driehoek|aangeleerde\s*lens|^1[23]\s*[ab][\s.:]/i,
  /plastische\s+morfologie|^(?:\d+(?:\.\d+)?\s+)?pagina\b|dual.?core|^de\s+stille\s+stem$|^the\s+quiet\s+voice$|de\s+support\s+die\s+de\s+kern\s+bewerkt/i,
];
const isDiscardBoundary = (title) => DISCARD_BOUNDARY.some((re) => re.test(cleanTitle(title || '')));

/** A heading's own words: markdown, a leading number and a trailing colon off. */
const headingText = (line) => String(line || '')
  .replace(/^\s*#+\s*/, '').replace(/\*+/g, '').replace(/^\s*\d+[A-Za-z]?[.)]\s+/, '').replace(/\s*:\s*$/, '').trim();

function lev(a, b) {
  if (a === b) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = d[0]; d[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const t = d[i];
      d[i] = Math.min(d[i] + 1, d[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[a.length];
}
const ARTICLE = /^(?:DE|HET|THE)$/;
const content = (words) => (ARTICLE.test(words[0] || '') ? words.slice(1) : words);
const typoOk = (w, s) => w === s || lev(w, s) <= (s.length >= 8 ? 2 : s.length >= 5 ? 1 : 0);

// Every stem once, with its language: { words (article off), stem, slot, lang }.
const STEM_WORDS = NARRATIVE_TAGS.flatMap((t) => [[t.stem, 'nl'], ...t.en.map((e) => [e, 'en'])]
  .map(([stem, lang]) => ({ stem, lang, slot: t.slot, words: content(stem.split(/\s+/)) })));

/**
 * The drift a model produces on a title that isn't a tag as written: a typo, a dropped article, or —
 * for an explicit `##` heading only — a title cut short ("## De Alchemie"). One slot or nothing.
 */
function fuzzyTag(text, explicit) {
  const norm = normalizeTagLine(text);
  const paren = (norm.match(/\s*(\([^)]*\))\s*$/) || [])[1] || '';
  const words = content(norm.replace(/\s*\([^)]*\)\s*$/, '').split(/\s+/).filter(Boolean));
  if (!words.length) return null;
  const hits = new Map();
  for (const s of STEM_WORDS) {
    const whole = words.length === s.words.length && words.every((w, i) => typoOk(w, s.words[i]));
    const cut = explicit && words.length < s.words.length && words.every((w, i) => w === s.words[i])
      && words.some((w) => w.length >= 5);                 // "ALCHEMIE", never a lone "DE" or "VAN"
    if (whole || cut) hits.set(s.slot, s);
  }
  if (hits.size !== 1) return null;                        // none, or ambiguous
  const s = [...hits.values()][0];
  // Shown as the proper title; a trailing parenthetical the model wrote is kept.
  const original = s.lang === 'en' ? s.stem : (NARRATIVE_TAGS.find((t) => t.slot === s.slot) || {}).stem || s.stem;
  return { slot: s.slot, lang: s.lang, title: paren ? `${original} ${paren}` : original };
}

/** Score one line as a section heading: { slot, quality 3|2|1, title, lang } or null. */
function identify(line, explicit) {
  const text = headingText(line);
  if (!text) return null;
  const hit = matchNarrativeTag(text);
  if (hit) {
    const rest = normalizeTagLine(text).slice(hit.matched.length).trim();
    return { slot: hit.slot, lang: hit.lang, title: text, quality: !rest || /^\(.*\)$/.test(rest) ? 3 : 2 };
  }
  const fz = fuzzyTag(text, explicit);
  return fz ? { ...fz, quality: 1 } : null;
}

/** Short enough, and not a sentence: a line that can be a title. */
function titleShaped(line) {
  const t = line.trim();
  if (!t || t.length > 70 || t.startsWith('|') || t.startsWith('-- ')) return false;
  if (/[.!?]$/.test(t)) return false;
  return t.split(/\s+/).length <= 10;
}
/** Written the way the prompt asks titles to be written: in capitals, or as a bold line. */
function capsOrBold(line) {
  const t = line.trim();
  if (/^\*\*[^*]+\*\*$/.test(t)) return true;
  const letters = t.replace(/[^A-Za-zÀ-ÿ]/g, '');
  return letters.length > 0 && letters.replace(/[^A-ZÀ-Þ]/g, '').length / letters.length >= 0.8;
}

/**
 * Decide which lines start a section, and rewrite them as `## ` headings. Bare title lines are
 * promoted (as before), fuzzy titles are corrected, a same-section candidate that is not the best is
 * left as body text (a `##` one becomes a bold subheading), and a lost first heading is recovered.
 */
function normalizeHeadings(text, ledger) {
  const lines = String(text || '').split('\n');
  const cands = [];
  lines.forEach((line, i) => {
    const explicit = /^\s*#{2,3}\s/.test(line);
    if (!explicit && (!titleShaped(line) || /^\s*#/.test(line))) return;
    const id = identify(line, explicit);
    if (!id) return;
    if (id.quality === 1 && !explicit && !capsOrBold(line)) return;      // fuzzy: only a real-looking title
    cands.push({ i, explicit, ...id });
  });

  // A section keeps its best candidates only.
  const best = {};
  for (const c of cands) best[c.slot] = Math.max(best[c.slot] || 0, c.quality);
  const strong = cands.filter((c) => c.quality >= 2 && c.quality === best[c.slot]);
  const accepted = new Set(strong);
  // A fuzzy candidate stands only for a section that has no better one, where the order has room.
  for (const c of cands) {
    if (c.quality !== 1 || best[c.slot] !== 1) continue;
    const before = strong.filter((s) => s.i < c.i).pop();
    const after = strong.find((s) => s.i > c.i);
    const fits = (!before || orderOf(before.slot) < orderOf(c.slot)) && (!after || orderOf(c.slot) < orderOf(after.slot));
    if (fits) accepted.add(c);
  }

  const out = lines.slice();
  for (const c of cands) {
    if (accepted.has(c)) {
      // Written back in its clean form — no markdown, number or trailing colon — so every later step
      // reads it as the section heading it is ("DE VORM:" would otherwise not match its own tag).
      if (c.quality === 1) ledger && ledger.fuzzy.push({ from: lines[c.i].trim(), to: c.title });
      out[c.i] = `## ${c.title}`;
    } else if (c.explicit) {
      // a lesser same-section `##` heading: a subheading where it stands, not a second section
      const t = bareHeading(lines[c.i]);
      ledger && ledger.demoted.push({ heading: t, why: 'a better heading exists for this section' });
      out[c.i] = `**${t}**`;
    }
  }

  // A lost first heading: when De Identiteit has no heading at all and the text opens with a body of
  // its own before the first section, that body is De Identiteit.
  const firstIdx = out.findIndex((l) => /^\s*#{2,3}\s/.test(l));
  const hasIdentity = [...accepted].some((c) => c.slot === 'identity');
  if (!hasIdentity && firstIdx > 0) {
    const lead = out.slice(0, firstIdx).join(' ').trim();
    const words = lead ? lead.split(/\s+/).length : 0;
    if (words >= 40) {
      const firstSlot = ([...accepted].sort((a, b) => a.i - b.i)[0] || {}).slot;
      if (!firstSlot || orderOf(firstSlot) > orderOf('identity')) {
        const en = [...accepted].some((c) => c.lang === 'en');
        const title = en ? 'THE IDENTITY' : 'DE IDENTITEIT';
        ledger && ledger.recovered.push({ section: title, words });
        const at = out.findIndex((l) => l.trim());
        out.splice(at, 0, `## ${title}`);
      }
    }
  }
  return out.join('\n');
}

// ── Subsections stay inside their section (Brief v2 Addendum A §1–§3) ──
// parseAiSections splits on every ##/### heading, so a subheading the model writes as a heading
// ("### Cognitieve aanleg", "### Meegaandheid", the eight AI-prompt blocks) became a top-level
// section and fell out of its parent — the trait blocks away from their OCEAN page, the prompt
// blocks away from the prompt. Such headings are demoted to bold lines, which writePdfMarkdown
// renders at the subheading level:
//   • the fixed subheadings of De Essentie / De Vermenigvuldiging, wherever they appear;
//   • everything inside PERSOONLIJKHEIDSRAPPORT VERGELIJKING — ONE section, value block and five
//     trait blocks together; an OCEAN trait heading with no comparison title in front opens it;
//   • everything inside DE VOLLEDIGE AI PROMPT, up to the machine block;
//   • and any heading that is not a section at all — the model's own — wherever it stands.
// A narrative tag always splits and closes the container.
const PROFILE_DATA_HEADER = /^(?:profiel\s*data\s*voor\s*ai|profile\s*data\s*for\s*ai)\b/i;
function groupSubsections(text, ledger) {
  if (!text) return text;
  let container = null; // 'ocean' | 'prompt' | null
  const out = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*#{2,3}\s+(.+)$/);
    if (!m) { out.push(line); continue; }
    const title = bareHeading(m[1]);
    if (isOceanMemberHeading(title)) {
      if (container !== 'ocean') { out.push('## PERSOONLIJKHEIDSRAPPORT VERGELIJKING'); container = 'ocean'; }
      out.push(`**${title}**`);
      continue;
    }
    const tag = matchNarrativeTag(m[1]);
    if (tag) {
      container = tag.slot === 'ocean' ? 'ocean' : tag.slot === 'ai_prompt' ? 'prompt' : null;
      out.push(line);
      continue;
    }
    if (PROFILE_DATA_HEADER.test(title)) { container = null; out.push(line); continue; }
    if (container || isContractSubheading(title)) { out.push(`**${title}**`); continue; }
    if (!isDiscardBoundary(m[1])) {
      // Not a section and not a named block: the model's own heading. It stays with its section.
      ledger && ledger.demoted.push({ heading: title, why: 'not a section — kept as a subheading' });
      out.push(`**${title}**`);
      continue;
    }
    out.push(line);
  }
  return out.join('\n');
}

// ── Kaart Microcopy (## Kaart Microcopy): AI-authored profile-card fields.
// KAART_GIFT / KAART_GEOMETRIE never reach this client: routes/ai.js strips them from
// the analysis and parks them in kaartDrafts, keyed by the orb code's hash, so the card
// copy provably came from our model. Only the stripper below remains, as a safety net.
// Remove the Kaart Microcopy material from the analysis BEFORE any rendering path sees it —
// guarantees the card fields never appear on a report page/PDF section, even when the model
// drops the section heading and appends the labels to a previous section's body.
// Both report languages: "Kaart Microcopy" / KAART_GIFT / KAART_GEOMETRIE and the English
// "Card Microcopy" / CARD_GIFT / CARD_GEOMETRY.
export function stripKaartFields(text, ledger = null) {
  const cut = (m) => { if (ledger) ledger.discarded.push({ rule: 'Kaart microcopy (profile card, not the report)', title: '', text: m }); return ''; };
  let t = String(text || '');
  t = t.replace(/^#{2,3}\s*(?:\d+[A-Za-z]?\.\s*)?(?:kaart|card)\s*microcopy\s*$[\s\S]*?(?=\n#{2,3}\s|$)/gim, cut);
  t = t.replace(/^\s*(?:KAART|CARD)_GIFT:\s*[\s\S]*?(?=\n\s*(?:KAART_GEOMETRIE|CARD_GEOMETRY):|\n#{2,3}\s|$)/gim, cut);
  t = t.replace(/^\s*(?:KAART_GEOMETRIE|CARD_GEOMETRY):\s*[\s\S]*?(?=\n#{2,3}\s|$)/gim, cut);
  return t;
}

// ── Sections ─────────────────────────────────────────────────────────────────────────────────────

export function parseAiSections(analysisText, ledger = null) {
  if (!analysisText || typeof analysisText !== 'string') return null;
  const drop = (rule, title, text) => { if (ledger && String(text || '').trim()) ledger.discarded.push({ rule, title, text }); };
  analysisText = groupSubsections(normalizeHeadings(analysisText, ledger), ledger);

  // Split on ## or ### top-level headings (with or without numbering).
  // The AI prompt requests `## N.` but models sometimes return `### N.` instead.
  // The `[A-Za-z]?` handles alphanumeric section numbers like `4B.`
  const sectionRegex = /^#{2,3}\s+(?:\d+[A-Za-z]?\.\s+)?(.+)/gm;
  const matches = [];
  let match;

  // `title` is the ROUTING form: an English report's tag is canonicalised to its Dutch stem, so
  // every page collector below and in the renderer keys on one vocabulary. `displayTitle` is the
  // title exactly as the model emitted it — what the card and the PDF show (shownTitle).
  while ((match = sectionRegex.exec(analysisText)) !== null) {
    // "DE STILLE STEM — MOTIVATIE" → "MOTIVATIE": the card and PDF add their own Stille Stem prefix.
    const emitted = stripPageLabel(match[1].trim());
    matches.push({ title: canonicalTitle(emitted), displayTitle: emitted, start: match.index, headerEnd: match.index + match[0].length });
  }

  if (matches.length === 0) {
    // No section headers found — return full text as single section
    return [{ title: 'AI Analyse', content: analysisText.trim() }];
  }
  // Whatever stands before the first section, when it wasn't recovered as De Identiteit above.
  drop('before the first section (W4: the report starts at its first heading)', '', analysisText.slice(0, matches[0].start));

  // Patterns to strip disclaimer-like text the AI may inject into any section
  const disclaimerPatterns = [
    /^>?\s*\**Meta[- ]?Disclaimer\**:?[^\n]*\n?/gim,
    /^>?\s*\**Schaduw[- ]?archetype\**:?[^\n]*\n?/gim,
    /^>?\s*\**Blindspot[- ]?archetype\**:?[^\n]*\n?/gim,
    /^>?\s*\**Archetype:?\**:?\s+\w+.*Positie\s+\d+[^\n]*\n?/gim,
    /^>?\s*\**Archetype:?\**:?\s+\w+.*180.*tegenpool[^\n]*\n?/gim,
    /^>?\s*\**Archetype:?\**:?\s+\w+.*[Rr]ode\s+[Ll]ijn[^\n]*\n?/gim,
    /^>?\s*Dit rapport is gegenereerd door het Garden [Ff]or Life[^\n]*\n?/gm,
    /^>?\s*De gebruikte neurobiologische termen zijn metaforen[^\n]*\n?/gm,
    /^>?\s*Raadpleeg een professional voor medisch[^\n]*\n?/gm,
    /^>?\s*Dit is een zelfreflectie-instrument[^\n]*\n?/gm,
    /^>?\s*Dit rapport is geen in beton gegoten diagnose[^\n]*\n?/gm,
    /^>?\s*\**Disclaimer\**:?\s*Dit rapport[^\n]*\n?/gim,
    // English report
    /^>?\s*\**Shadow[- ]?archetype\**:?[^\n]*\n?/gim,
    /^>?\s*\**Archetype:?\**:?\s+\w+.*Position\s+\d+[^\n]*\n?/gim,
    /^>?\s*\**Archetype:?\**:?\s+\w+.*180.*opposite[^\n]*\n?/gim,
    /^>?\s*\**Archetype:?\**:?\s+\w+.*[Rr]ed\s+[Ll]ine[^\n]*\n?/gim,
    /^>?\s*This report (?:was|is) generated by (?:the )?Garden [Ff]or Life[^\n]*\n?/gm,
    /^>?\s*The neurobiological terms used are metaphors[^\n]*\n?/gm,
    /^>?\s*Consult a professional for medical[^\n]*\n?/gm,
    /^>?\s*This is a self-reflection (?:tool|instrument)[^\n]*\n?/gm,
    /^>?\s*This report is not a[^\n]*diagnosis[^\n]*\n?/gm,
    /^>?\s*\**Disclaimer\**:?\s*This report[^\n]*\n?/gim,
  ];

  const stripDisclaimer = (text, title) => {
    let cleaned = text;
    for (const pat of disclaimerPatterns) {
      cleaned = cleaned.replace(pat, (m) => { drop('a disclaimer the renderer draws itself', title, m); return ''; });
    }
    // Remove orphaned blockquote-only lines (> followed by empty or near-empty content)
    cleaned = cleaned.replace(/^>\s*$/gm, '');
    // Strip horizontal rules (---, ***, ===)
    cleaned = cleaned.replace(/^[-*=]{3,}\s*$/gm, '');
    // Collapse excessive blank lines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    return cleaned.trim();
  };

  const parts = [];
  const seenContent = new Set();

  // Identify the comparison section and the AI-Agent-Prompt section so we can
  // (a) absorb all comparison sub-sections into one block, and (b) tag it as PDF-only.
  const reportMatchIdx = matches.findIndex(m => COMPARISON_TITLE.test(m.title));
  const agentPromptIdx = matches.findIndex(m =>
    /ai.?agent|persoonlijke.*agent|agent.*prompt|genereer.*prompt|volledige.*prompt|ai.?prompt|reflectie.*prompt|ai.*reflectie|^11[^\d]/i.test(m.title)
  );
  // 12A/12B resonantie sections (placed below radar chart in PDF) — also match legacy 13A/13B.
  // De Extensie (v5.2 §5.7) shares their page: flagged the same way, placed first by the renderer.
  const resonantieTest = (t) => /^1[23]\s*[ab][\s.:]/i.test(t) || /professionele\s+resonantie/i.test(t) || /creatieve\s+resonantie/i.test(t) || isExtensionTitle(t);

  // Find the first section after comparison that is NOT a comparison sub-section
  // (comparison sub-sections get absorbed into the parent comparison block)
  const firstAfterComp = reportMatchIdx >= 0
    ? matches.findIndex((m, idx) =>
        idx > reportMatchIdx &&
        !COMPARISON_SUBSECTION.test(m.title.trim())
      )
    : -1;

  // Profiel Dynamiek element detection (Sectie 4B) — match by title keyword
  const profileKeyFromTitle = (t) => {
    if (/neuroticisme\s*trigger/i.test(t)) return 'neuroticismTrigger';
    if (/superkracht/i.test(t)) return 'workplaceSuperpower';
    if (/conflictstijl/i.test(t)) return 'conflictStyle';
    if (/relatiepatroon/i.test(t)) return 'relationshipPattern';
    if (/individuatiepad/i.test(t)) return 'individuationPath';
    return null;
  };
  const bodyOf = (i) => analysisText.slice(matches[i].headerEnd, i + 1 < matches.length ? matches[i + 1].start : analysisText.length);

  for (let i = 0; i < matches.length; i++) {
    const { title, displayTitle } = matches[i];
    // Skip any "Leerling Ontologisch Rapport" preamble the AI may inject
    if (/leerling\s+ontologisch/i.test(title)) { drop('legacy preamble heading', title, bodyOf(i)); continue; }
    // Skip any standalone "Introductie" / "Inleiding" / "Introduction" the AI may generate
    if (/^(introductie|inleiding|introduction)$/i.test(title)) { drop('an introduction the renderer draws itself', title, bodyOf(i)); continue; }
    // Skip "Kaart Microcopy" / "Card Microcopy" — machine-consumed profile-card fields,
    // held server-side in kaartDrafts by the backend; never rendered as a report page.
    if (/(?:kaart|card)\s*microcopy/i.test(title)) { drop('Kaart microcopy (profile card, not the report)', title, bodyOf(i)); continue; }
    // Skip umbrella "Profiel Dynamiek" / "Profiel Elementen" / "5 Elementen" / "De 5 Elementen"
    // headers — the individual elements are parsed by profileKeyFromTitle below. When the AI
    // bundles them under one heading, extract sub-elements from the body. (Without "element"
    // here, a bare "Profiel Elementen" umbrella leaks through as an empty-body ghost page.)
    if (/profiel\s*(?:dynamiek|element)|(?:5|vijf)\s*element/i.test(title)) {
      const rawBody = bodyOf(i).trim();
      // Try to split on bold sub-headings like **NEUROTICISME TRIGGER** or **Superkracht**
      const subParts = rawBody.split(/\*\*([^*]+)\*\*/g);
      // subParts: [textBefore, heading1, textAfter1, heading2, textAfter2, ...]
      let kept = 0;
      for (let sp = 1; sp < subParts.length; sp += 2) {
        const subTitle = subParts[sp].trim();
        const subContent = (subParts[sp + 1] || '').trim();
        const pk = profileKeyFromTitle(subTitle);
        if (pk && subContent) {
          kept++;
          parts.push({
            title: subTitle,
            content: stripDisclaimer(subContent, subTitle),
            isProfileElement: true,
            profileKey: pk,
            isAgentPrompt: false,
            isComparison: false,
            isResonantie: false,
          });
        }
      }
      if (!kept) drop('legacy profile block (v3)', title, rawBody);
      continue;
    }

    // Comparison sub-sections (Spanningsvelden, Vergelijkingsrapport, Conclusie, etc.)
    // that the AI hallucinated as separate ## headers after the main comparison header:
    // skip them — their content is absorbed into the parent comparison section below.
    if (
      reportMatchIdx >= 0 && i > reportMatchIdx &&
      i !== reportMatchIdx &&
      (firstAfterComp < 0 || i < firstAfterComp) &&
      COMPARISON_SUBSECTION.test(title.trim())
    ) continue;

    const isAgentPrompt = (agentPromptIdx >= 0 && i === agentPromptIdx);
    const isComparison  = (reportMatchIdx >= 0 && i === reportMatchIdx);
    const isResonantie  = resonantieTest(title);

    // Profiel Dynamiek elements (4B) — detect by title keyword, extract as prose sections
    const profileKey = profileKeyFromTitle(title);
    if (profileKey) {
      parts.push({
        title,
        displayTitle,
        content: stripDisclaimer(bodyOf(i).trim(), title),
        isProfileElement: true,
        profileKey,
        isAgentPrompt: false,
        isComparison: false,
        isResonantie: false,
      });
      continue;
    }

    // Content range: comparison section absorbs everything up to the next real section,
    // other sections take content until the next header.
    let contentStart = matches[i].headerEnd;
    let contentEnd;
    if (isComparison) {
      // Absorb all sub-sections until the first non-comparison section after it
      contentEnd = firstAfterComp >= 0 ? matches[firstAfterComp].start : analysisText.length;
    } else {
      contentEnd = (i + 1 < matches.length ? matches[i + 1].start : analysisText.length);
    }
    let content = stripDisclaimer(analysisText.slice(contentStart, contentEnd).trim(), title);

    // STRICT: drop render-side note echoes. The model sometimes parrots the spec's parenthetical
    // render-side / page labels as a fake section body — e.g. "(Pagina A - met D-curvegrafiek)"
    // or "(Dual-Core grafiek - render-side - draagt de Nature/Culture-data per zuil.)". Real
    // sections are long prose (>300 chars); these stubs are tiny and mention render-side artefacts.
    const bare = content.replace(/[*#>_`~]/g, '').trim();
    if (bare.length < 200 && /render.?side|(?:pagina|page)\s+[ab]\b|d-?curve.?(?:grafiek|chart|graph)|(?:grafiek|chart|graph)\s*[-–)]|dual.?core\s+(?:grafiek|chart|graph)|6-?(?:groeps|group)|nature\s*\/\s*culture/i.test(bare)) {
      drop('an echo of a render-side page label', title, content);
      continue;
    }

    // Deduplicate exact content repeats (keys on title + opening so distinct sections that share
    // a structural lead aren't wrongly dropped). Per-title "keep the longest" + the min-word drop
    // happen in a post-pass below.
    const contentKey = cleanTitle(title).toLowerCase() + '::' + content.slice(0, 120).toLowerCase().replace(/\s+/g, ' ');
    if (seenContent.has(contentKey)) { drop('an exact repeat of a section', title, content); continue; }
    seenContent.add(contentKey);

    parts.push({
      title,
      displayTitle,
      content,
      isAgentPrompt,
      isComparison,
      isResonantie,
    });
  }

  // ── Min-word catcher + keep-longest-per-title ──
  // When the model emits a title twice (a real paragraph + a short "echo"), keep ONLY the longest
  // instance — that's always the real read. Also drop any narrative section whose body is too
  // short to be a real read (a few-word echo/stub). Profile elements (4B) are exempt.
  const wordCount = (s) => (s.content || '').trim().split(/\s+/).filter(Boolean).length;
  const MIN_WORDS = 8;
  const longestByTitle = {};
  for (const p of parts) {
    if (p.isProfileElement) continue;
    const k = cleanTitle(p.title || '').toLowerCase();
    if (!longestByTitle[k] || wordCount(p) > wordCount(longestByTitle[k])) longestByTitle[k] = p;
  }
  return parts.filter((p) => {
    if (p.isProfileElement) return true;
    if (wordCount(p) < MIN_WORDS) { drop('too short to be a section (under 8 words)', p.title, p.content); return false; }
    if (longestByTitle[cleanTitle(p.title || '').toLowerCase()] !== p) { drop('a shorter copy of a section written twice', p.title, p.content); return false; }
    return true;
  });
}

// ── The ledger ───────────────────────────────────────────────────────────────────────────────────

const lineKey = (l) => String(l || '').replace(/^\s*#+\s*/, '').replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
const hasWords = (l) => /[A-Za-zÀ-ÿ0-9]{2,}/.test(l);

/** Lines of the model's text that no section carries and no named rule discarded. */
function unaccountedLines(raw, sections, ledger) {
  const carried = new Set();
  const add = (text) => String(text || '').split('\n').forEach((l) => carried.add(lineKey(l)));
  for (const s of sections || []) { add(s.displayTitle || s.title); add(s.title); add(s.content); }
  for (const d of ledger.discarded) add(d.text);
  for (const f of ledger.fuzzy) add(f.from);
  return String(raw || '').split('\n').map(lineKey).filter((l) => {
    if (!l || !hasWords(l) || carried.has(l)) return false;
    if (/^[-*=_]{3,}$/.test(l)) return false;                            // a horizontal rule
    // a section heading line: it became a section boundary, shown by the renderer's own heading
    return !(titleShaped(l) && (matchNarrativeTag(headingText(l)) || isDiscardBoundary(headingText(l))));
  });
}

/**
 * De Stille Stem's reads open their parts with run-in labels — "Hoe dat voelt: …", and in Motivatie
 * "Werk: …", "Vrienden: …", "Intiem: …" (English: How that feels / Work / Friends / Intimate). Each
 * becomes a subheading line (`### Label`) with its text as the paragraph below it, so the card and both
 * PDFs draw it at the subheading level, in the section's colour, like every other subheading. A bold
 * label ("**Werk:**") and the older full-stop form ("Vrienden. Zij zien…") are read the same way.
 */
const STILLE_LEAD_LABEL = /^\s*(?:\*\*)?\s*(Hoe dat voelt|Werk|Vrienden|Intiem|How (?:that|it) feels|Work|Friends|Intima(?:te|cy))\s*(?:\*\*)?\s*[:.]\s*(?:\*\*)?\s*(.*)$/i;
export function liftStilleLabels(content) {
  return String(content || '').split('\n').map((line) => {
    const m = line.match(STILLE_LEAD_LABEL);
    if (!m) return line;
    const rest = m[2].trim();
    return rest ? `### ${m[1]}\n\n${rest}` : `### ${m[1]}`;
  }).join('\n');
}

/**
 * Read a whole report: sections for the card and the PDF, and the ledger that accounts for every
 * line — `recovered` (a lost first heading), `fuzzy` (a heading read through drift), `demoted` (a
 * heading kept as a subheading), `discarded` ({ rule, title, text }), `unaccounted` (should be empty).
 */
export function readReport(analysisText) {
  const ledger = { recovered: [], fuzzy: [], demoted: [], discarded: [], unaccounted: [] };
  const raw = String(analysisText || '');
  const sections = parseAiSections(stripKaartFields(raw, ledger), ledger) || [];
  ledger.unaccounted = unaccountedLines(raw, sections, ledger);
  // After the accounting (which compares against the model's own lines): the Stille Stem run-in labels
  // become subheadings.
  for (const s of sections) {
    const tag = matchNarrativeTag(s.title || '');
    if (tag && /^stille_/.test(tag.slot)) s.content = liftStilleLabels(s.content);
  }
  // What the renderer leaves out on purpose, on the ledger too (`byRenderer`), so the log shows the
  // whole story: the model's own machine block (the renderer prints its own), and the sections it
  // filters by title.
  for (const s of sections) {
    const t = cleanTitle(s.title || '');
    const rule = RENDER_SIDE_TITLE.test(t) ? "the model's machine block / a render-side title — the renderer draws its own"
      : RADAR_READING_TITLE.test(s.title || '') ? 'a radar reading — the radar chart covers it'
      : STRAY_TITLE.test(s.title || '') ? 'a section outside the report (stray)'
      : V3_ELEMENTS_TITLE.test(t) ? 'a v3 section' : null;
    if (rule) ledger.discarded.push({ rule, title: s.title, text: s.content, byRenderer: true });
    if (s.isAgentPrompt) {
      const m = (s.content || '').match(/\n[ \t]*[#*>\-─═ \t]*(?:PROFIEL\s*DATA\s*VOOR\s*AI(?:[ \t-]*VERWERKING)?|PROFILE\s*DATA\s*FOR\s*AI(?:[ \t-]*PROCESSING)?)[ \t*:.—–\-─═]*(?:\n[\s\S]*)?$/i);
      if (m) ledger.discarded.push({ rule: "the model's machine block after the AI prompt — the renderer prints its own", title: s.title, text: m[0], byRenderer: true });
    }
  }
  return { sections, ledger };
}

/** One console line per report: what the reader did, and anything it could not place. */
export function logReaderLedger(ledger) {
  if (!ledger || typeof console === 'undefined') return;
  const chars = (t) => String(t || '').replace(/\s+/g, '').length;
  const byRule = {};
  for (const d of ledger.discarded) byRule[d.rule] = (byRule[d.rule] || 0) + chars(d.text);
  const summary = {
    recovered: ledger.recovered, fuzzy: ledger.fuzzy, demoted: ledger.demoted.map((d) => d.heading),
    discardedChars: byRule, unaccounted: ledger.unaccounted.length,
  };
  // eslint-disable-next-line no-console
  console.info('[report reader]', summary);
  if (ledger.unaccounted.length) {
    // eslint-disable-next-line no-console
    console.warn('[report reader] text no section carries and no rule discarded:', ledger.unaccounted);
  }
}
