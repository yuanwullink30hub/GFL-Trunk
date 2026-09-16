/**
 * Corpus Manifest resolver — Corpus Lookup Table v1.1 (heading-keyed, fold-proof).
 *
 *   manifest(active_set, main, support, culture_picks, { language, shadow, blindspot }) →
 *     { corpus_manifest_version, language, shadow_pack, documents, token_estimate, text }
 *
 * Dumb by design: active set + culture picks + the payload's resolved shadow and blindspot in, object list
 * out. Every rule is a lookup.
 *
 *   Ship = ALWAYS-block (Frame Extract · the claim · the nine anchors · Nature and Culture · M1/M2 · wheel mechanics)
 *        + one GROUP-block per hardware group with ≥ 1 active-set member (siblings dedupe)
 *        + the SCHADUW-PAKKET (table v1.1 §8; consumer 5.3 DE BLINDSPOT), never double-shipped:
 *            §1 + §6 of the shadow's group — only when that group is not in the active set
 *            §6 of the blindspot's group — always, unless the slice already carries that §6
 *              (its group block, or the shadow's §1 + §6 when shadow and blindspot share a group: Ruling/Chaos)
 *        + ONE extension cell (Main × Support)
 *        + one TNM entry per culture-picked active archetype, preamble once
 *   — and nothing else.
 *
 * Objects (ids):
 *   always/frame_extract      Frame Extract v1.0, entire document
 *   always/claim              "1 — The claim, stated plainly"
 *   always/anchors            "3 — The load-bearing spine (the nine anchors that carry everything)"
 *   always/nature_culture     "5 — Nature and Culture: the two layers the matrix reads"
 *   always/methodology_principles  the Rosetta masthead's "METHODOLOGY PRINCIPLES" paragraph (M1 / M2)
 *   always/wheel_mechanics    "The Wheel-Mechanics Layer — Operating Refinements (Rosetta v1.1–v1.2)"
 *   group/<key>               chapter header + §1–§7 + §10 of that hardware group (both siblings)
 *   shadow_pack/shadow/<A>    "1 — Group Identity & Geometry" + "6 — Biochemical Architecture" of A's hardware group
 *   shadow_pack/blindspot/<A> "6 — Biochemical Architecture" of A's hardware group, nothing else
 *   extension/<Main>×<Support> the single ratified row: nummer, naam EN, naam NL, Gift, Curse, Levensles
 *   tnm/preamble              Introduction + Overview + every "Cognitive Weaknesses & Fallacies" + Per-Archetype Layer
 *   tnm/entry/<Archetype>     that archetype's per-archetype Yellow-Triangle entry
 *
 * Headings, not line numbers: every key below is bound to a Rosetta section index once, from the
 * EN twin (the NL twin shares the indices), and binding fails loudly if a key no longer resolves.
 * [STAGED] guard, applied at bind time before any object is built (either twin):
 *   - a banner standing on its own (e.g. the Epilogue's GEO-2L block) drops the whole section;
 *   - a banner inline in a table row (Seeker §1, "Hardware seam (red)") drops only that cell's staged
 *     text — the banner and the non-canon claim after it — so the rest of the section still ships
 *     (human ruling, 2026-09-16: the section must be sent);
 *   - a Rosetta v1.4.11 dependency marker ("[STAGED-afhankelijk — …]") is stripped together with the clause it
 *     tags (the staged Seeker re-type stated outside its banners); the rest of the section ships (human rulings,
 *     2026-09-16: the marker is editorial status the model has no use for, the clause is staged content).
 *
 * Human rulings (2026-09-16), now written into the table's §1/§2: the claim, the nine anchors, Nature and Culture
 * and the methodology principles are model-bearing and ship in EVERY call regardless of the archetypes —
 * front sections 1, 3 and 5 are off the NEVER-list, and the masthead's M1/M2 paragraph is in the ALWAYS-block.
 *
 * NEVER ships (Lookup Table §2), asserted by gate 3: Chapters 1–12 and the other front sections, The
 * Return, the Epilogue, §8 extension tables, §9 lessen tables, §11 web-audits, §12 falsification
 * conditions, [STAGED] material, the cell schema, changelogs / masthead, d_relational_operations.
 * The extension and lesson text reaches the model ONLY through the extension cell (single source).
 * The geometry reference images are not corpus text; services/aiProviders.js attaches them.
 */

'use strict';

const VERSIONS = require('../config/versions');
const { loadCorpus } = require('../services/corpusData');
const { redLinePartner } = require('../services/lineType');

const tokens = (text) => Math.ceil(text.length / 4);
const section = (s) => `### ${s.title}\n\n${s.body}`.trim();
/** Heading normalisation: dash variants, whitespace and case never break a binding. */
const norm = (t) => String(t || '').replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim().toLowerCase();

// ── The Lookup Table, as data ────────────────────────────────────────────────────────────────
const ALWAYS_WHEEL = 'The Wheel-Mechanics Layer — Operating Refinements (Rosetta v1.1–v1.2)';
/** Front-matter sections in the ALWAYS-block, in Rosetta order: [object id, heading key]. */
const ALWAYS_FRONT = [
  ['claim', '1 — The claim, stated plainly'],
  ['anchors', '3 — The load-bearing spine (the nine anchors that carry everything)'],
  ['nature_culture', '5 — Nature and Culture: the two layers the matrix reads'],
];
/** Masthead paragraph key (the masthead is paragraphs, not titled sections; the NL twin shares positions). */
const ALWAYS_PRINCIPLES = 'METHODOLOGY PRINCIPLES';
const GROUPS = [
  { key: 'ruling', chapter: 'HARDWARE GROUP 1 — THE RULING GROUP', members: ['Judge', 'Ruler'] },
  { key: 'chaos', chapter: 'HARDWARE GROUP 2 — THE CHAOS GROUP', members: ['Outlaw', 'Trickster'] },
  { key: 'agency', chapter: 'HARDWARE GROUP 3 — THE AGENCY GROUP', members: ['Magician', 'Hero'] },
  { key: 'seeker', chapter: 'HARDWARE GROUP 4 — THE SEEKER GROUP', members: ['Innocent', 'Explorer'] },
  { key: 'abstract', chapter: 'HARDWARE GROUP 5 — THE ABSTRACT GROUP', members: ['Sage', 'Artist'] },
  { key: 'relational', chapter: 'HARDWARE GROUP 6 — THE RELATIONAL GROUP', members: ['Lover', 'Caregiver'] },
];
/** §3: the chapter headings a GROUP-block ships, in order (the chapter header comes first). */
const GROUP_HEADINGS = [
  ['1', 'Group Identity & Geometry'],
  ['2', 'Group-Anchor Specification'],
  ['3', 'The 12-Function Wheel'],
  ['4', 'OCEAN Precision'],
  ['5', 'Workplace, Relations & Individuation'],
  ['6', 'Biochemical Architecture'],
  ['7', 'The R-class Cost-Curve'],
  ['10', 'Supervisory Signature'],
];
const TNM_PREAMBLE = [
  'Introduction: What Are the Yellow Triangles?',
  'Overview: The Four Triangles',
  'Cognitive Weaknesses & Fallacies',          // heading key — matches the section under every triangle
  'Per-Archetype Layer — Profile sec 1–2 Supply',
];
const TNM_ENTRIES = {
  Judge: '1. Judge (De Rechter) — Triangle 1', Ruler: '12. Ruler (De Heerser) — Triangle 4',
  Lover: '2. Lover (De Minnaar) — Triangle 2', Caregiver: '3. Caregiver (De Verzorger) — Triangle 3',
  Innocent: '4. Innocent (De Onschuldige) — Triangle 4', Explorer: '5. Explorer (De Ontdekker) — Triangle 1',
  Outlaw: '6. Outlaw (De Rebel) — Triangle 2', Trickster: '7. Trickster (De Nar) — Triangle 3',
  Sage: '8. Sage (De Wijze) — Triangle 4', Artist: '9. Artist (De Kunstenaar) — Triangle 1',
  Magician: '10. Magician (De Magier) — Triangle 2', Hero: '11. Hero (De Held) — Triangle 3',
};
/** §2 NEVER-list heading patterns (normalised), for the gate-3 absence assertions. */
const NEVER_PATTERNS = [
  // the general descent: Chapters 1–12 with their N.x sections, and the seven front sections
  /^chapter \d+ - /, /^\d+\.\d+ /, /^arc position$/, /^the frame - closing philosophy/,
  /^2 - the shape of the descent/, /^4 - the supervisory mechanism/, /^6 - what stays open/,
  /^6\.5 - operating refinements since v1/, /^7 - why this frame is stated first/,
  /^the return - to the frame/, /^epilogue - the hardware database/,
  // §8 / §9 duplicates, §11 / §12 audit machinery
  /extensions \(132-grain/, /^8 - the six extensions/, /^9 - crystallised lessons/,
  /^11 - web-audit extension/, /^web-audit validation/, /^12 - falsification conditions/,
];
/**
 * The banner form ("[STAGED — Tier-2, not canon …" / "[GESTAGED — …"), not a mere mention of staged items and
 * not the Rosetta v1.4.11 dependency marker "[STAGED-afhankelijk — …]" (no space before its hyphen): that marker
 * tags a single canon clause that leans on the staged re-type and does not stage its section.
 */
const STAGED = /\[(?:STAGED|GESTAGED)(?:\s*[—–]|\s+-)/;
/** Inline staged span: optional bold markers, the banner, then the rest of its table cell (up to " |"). */
const STAGED_INLINE = /\s*\*{0,2}\[(?:STAGED|GESTAGED)(?:\s*[—–]|\s+-)[^\]]*\]\*{0,2}[^|\n]*/g;
const inlineOnly = (text) => text.split('\n').filter((l) => STAGED.test(l)).every((l) => l.trim().startsWith('|'));
const stripInline = (text) => text.replace(STAGED_INLINE, ' ');
/**
 * The dependency marker. Its own italic pair goes with it; a lone closing asterisk belongs to the enclosing italic
 * note ("*Note: … paths. [STAGED-afhankelijk — …]*") and stays.
 */
const STAGED_DEPENDENT = / ?(\*)?\[STAGED-afhankelijk\s*[—–-][^\]]*\](\*)?/g;
/**
 * The clauses those markers tag: the staged Seeker re-type ("the Seeker has no hardware antagonist") stated outside
 * its banners — HG3 §1 seam cell, HG4 chapter opening, HG4 §5 note. Dropped with their markers, the rest of each
 * section ships (human ruling, 2026-09-16). Exact text per twin; binding fails unless each matches exactly once.
 */
const STAGED_DEPENDENT_CLAUSES = {
  en: [
    ' This, not the Seeker, is Agency’s hardware antagonist.',
    ' — the Seeker has no hardware antagonist; it couples Limbic and reinforces Motor',
    '; the Agency opposition is emergent (it runs away when the Limbic decouples), not a hardware antagonist',
  ],
  nl: [
    ' Dit, niet de Zoeker, is de hardware-antagonist van Actie.',
    ' — de Zoeker heeft geen hardware-antagonist; zij koppelt Limbisch en versterkt Motor',
    '; de Actie-oppositie is emergent (zij loopt weg wanneer de Limbische ontkoppelt), geen hardware-antagonist',
  ],
};
const stripDependent = (text, language) => STAGED_DEPENDENT_CLAUSES[language]
  .reduce((t, clause) => t.split(clause).join(''), text)
  .replace(STAGED_DEPENDENT, (m, open, close) => (open ? '' : close || ''));

let _bind = null;
/** Bind every Lookup Table heading to a section index, once. Fails if a key does not resolve. */
function bindings() {
  if (_bind) return _bind;
  const en = loadCorpus('en').framework_rosetta;
  const nl = loadCorpus('nl').framework_rosetta;
  if (en.length !== nl.length) throw new Error(`corpusResolver: EN/NL Rosetta differ in length (${en.length}/${nl.length})`);
  const titles = en.map((s) => norm(s.title));
  const staged = new Set();        // whole section dropped
  const stagedInline = new Set();  // section ships with its inline staged cells stripped
  const dependent = new Set();     // section ships with its dependency markers stripped
  en.forEach((s, i) => {
    const twins = [`${s.title}\n${s.body}`, `${nl[i].title}\n${nl[i].body}`];
    if (twins.some((t) => t.includes('[STAGED-afhankelijk'))) dependent.add(i);
    if (!twins.some((t) => STAGED.test(t))) return;
    if (twins.every((t) => !STAGED.test(t) || inlineOnly(t))) stagedInline.add(i);
    else staged.add(i);
  });
  const unbound = [];
  for (const [lang, ros] of [['en', en], ['nl', nl]]) {
    for (const clause of STAGED_DEPENDENT_CLAUSES[lang]) {
      const hits = [...dependent].reduce((n, i) => n + ros[i].body.split(clause).length - 1, 0);
      if (hits !== 1) unbound.push(`${lang} staged-dependent clause matched ${hits}× (expected 1): "${clause.trim()}"`);
    }
    for (const i of dependent) {
      if (!STAGED_DEPENDENT_CLAUSES[lang].some((c) => ros[i].body.includes(c))) unbound.push(`${lang} section ${i}: [STAGED-afhankelijk] marker without a listed clause`);
    }
  }
  const one = (key, from = 0, to = titles.length) => {
    const k = norm(key);
    for (let i = from; i < to; i++) if (titles[i] === k || titles[i].startsWith(k)) return i;
    unbound.push(key);
    return -1;
  };

  const wheel = one(ALWAYS_WHEEL);
  const front = ALWAYS_FRONT.map(([id, key]) => [id, one(key, 0, one('Chapter 1 — The Substrate'))]);
  const mastEn = loadCorpus('en').framework_masthead;
  const mastNl = loadCorpus('nl').framework_masthead;
  if (mastEn.length !== mastNl.length) throw new Error(`corpusResolver: EN/NL masthead differ in length (${mastEn.length}/${mastNl.length})`);
  const principles = mastEn.findIndex((p) => norm(p).replace(/^\*+/, '').startsWith(norm(ALWAYS_PRINCIPLES)));
  if (principles < 0) unbound.push(`masthead › ${ALWAYS_PRINCIPLES}`);
  const chapterStarts = GROUPS.map((g) => one(g.chapter));
  const tnmStart = one('THE FOUR YELLOW TRIANGLES — TNM POPULATION');
  const groups = {};
  GROUPS.forEach((g, gi) => {
    const start = chapterStarts[gi];
    const end = gi + 1 < GROUPS.length ? chapterStarts[gi + 1] : tnmStart;
    const indices = [start];
    for (const [n, heading] of GROUP_HEADINGS) {
      const k = norm(`${n} - ${heading}`);
      let idx = -1;
      for (let i = start + 1; i < end; i++) if (titles[i].startsWith(k)) { idx = i; break; }
      if (idx >= 0) indices.push(idx);
      else unbound.push(`${g.chapter} › ${n} — ${heading}`);
    }
    const at = (num) => indices[1 + GROUP_HEADINGS.findIndex(([n]) => n === num)];
    groups[g.key] = { ...g, indices, identity: at('1'), biochem: at('6'), dropped: indices.filter((i) => staged.has(i)) };
  });

  const preamble = [];
  for (const key of TNM_PREAMBLE) {
    const k = norm(key);
    const hits = [];
    for (let i = tnmStart; i < titles.length; i++) if (titles[i] === k || titles[i].startsWith(k)) hits.push(i);
    if (!hits.length) unbound.push(key);
    preamble.push(...hits);
  }
  const entries = {};
  for (const [name, key] of Object.entries(TNM_ENTRIES)) entries[name] = one(key, tnmStart);

  if (unbound.length) throw new Error(`corpusResolver: Lookup Table bindings do not resolve in the corpus — ${unbound.join('; ')}`);
  _bind = { wheel, front, principles, groups, tnm: { preamble, entries }, staged: [...staged], stagedInline: [...stagedInline], dependent: [...dependent] };
  return _bind;
}

const _registry = {};
/** Pre-split objects per language → id → { id, kind, title, text } (memoised). */
function registry(language) {
  const lang = String(language || '').toLowerCase() === 'en' ? 'en' : 'nl';
  if (_registry[lang]) return _registry[lang];
  const corpus = loadCorpus(lang);
  const ros = corpus.framework_rosetta;
  const b = bindings();
  const keep = (indices) => indices.filter((i) => !b.staged.includes(i));
  const shipped = (i) => {
    let body = ros[i].body;
    if (b.stagedInline.includes(i)) body = stripInline(body);
    if (b.dependent.includes(i)) body = stripDependent(body, lang);
    return body === ros[i].body ? ros[i] : { ...ros[i], body };
  };
  const join = (indices) => keep(indices).map((i) => section(shipped(i))).join('\n\n');
  const docs = new Map();
  const add = (id, kind, title, text) => docs.set(id, { id, kind, title, text });

  add('always/frame_extract', 'always', corpus.frame_extract[0].title, corpus.frame_extract.map(section).join('\n\n'));
  for (const [id, i] of b.front) add(`always/${id}`, 'always', ros[i].title, join([i]));
  add('always/methodology_principles', 'always', 'Methodology principles (M1 / M2)', corpus.framework_masthead[b.principles]);
  add('always/wheel_mechanics', 'always', ros[b.wheel].title, join([b.wheel]));
  for (const g of Object.values(b.groups)) add(`group/${g.key}`, 'group', ros[g.indices[0]].title, join(g.indices));

  const L = lang === 'en'
    ? { n: 'Number', en: 'Name EN', nl: 'Name NL', gift: 'Gift', curse: 'Curse', lesson: 'Life lesson', pack: 'Shadow pack', shadow: 'shadow', blindspot: 'blindspot' }
    : { n: 'Nummer', en: 'Naam EN', nl: 'Naam NL', gift: 'Gift', curse: 'Curse', lesson: 'Levensles', pack: 'Schaduw-pakket', shadow: 'schaduw', blindspot: 'blindspot' };
  for (const g of Object.values(b.groups)) {
    for (const member of g.members) {
      for (const [role, indices] of [['shadow', [g.identity, g.biochem]], ['blindspot', [g.biochem]]]) {
        const title = `${L.pack} — ${L[role]}: ${member}`;
        add(`shadow_pack/${role}/${member}`, 'shadow_pack', title, `### ${title} (${ros[g.indices[0]].title})\n\n${join(indices)}`);
      }
    }
  }
  for (const [main, a] of Object.entries(corpus.archetypes)) {
    for (const e of a.extensions) {
      add(`extension/${main}×${e.support}`, 'extension', `#${e.n} ${e.name} · ${e.name_nl}`, [
        `### ${lang === 'en' ? 'Extension' : 'Extensie'} #${e.n} — ${e.name} · ${e.name_nl} (${main} × ${e.support})`,
        `${L.n}: ${e.n}`, `${L.en}: ${e.name}`, `${L.nl}: ${e.name_nl}`, `Main: ${main}`, `Support: ${e.support}`,
        `${L.gift}: ${e.gift}`, `${L.curse}: ${e.curse}`, `${L.lesson}: ${e.levensles}`,
      ].join('\n'));
    }
  }

  add('tnm/preamble', 'tnm', ros[b.tnm.preamble[0]].title, join(b.tnm.preamble));
  for (const [name, i] of Object.entries(b.tnm.entries)) add(`tnm/entry/${name}`, 'tnm', ros[i].title, join([i]));

  _registry[lang] = { lang, docs, corpus };
  return _registry[lang];
}

/** Normalise any case-form archetype key to the corpus TitleCase name. */
function nameOf(corpus, key) {
  const k = String(key || '');
  return Object.keys(corpus.archetypes).find((n) => n.toUpperCase() === k.toUpperCase()) || null;
}

/**
 * manifest(active_set, main, support, culture_picks, { language, shadow, blindspot }) → ordered object list +
 * corpus_manifest_version. active_set: the engine's active set incl. Main (the pull set, 3–5); culture_picks:
 * archetypes that received a Culture pick; shadow / blindspot: the payload's resolved wheel facts (the bleed
 * engine's shadowArchetype / blindspotArchetype), read, not derived. A pair that is not this Main's wheel
 * fails loudly rather than ship another group's material. Emits a token estimate (≈ chars/4) for logging
 * per-report corpus weight.
 */
function manifest(active_set, main, support, culture_picks = [], { language = 'nl', shadow, blindspot } = {}) {
  const { lang, docs, corpus } = registry(language);
  const b = bindings();
  const mainName = nameOf(corpus, main);
  const supportName = nameOf(corpus, support);
  if (!mainName) throw new Error(`corpusResolver: unknown Main "${main}"`);
  const shadowName = nameOf(corpus, shadow);
  const blindspotName = nameOf(corpus, blindspot);
  if (!shadowName || !blindspotName) {
    throw new Error(`corpusResolver: the Schaduw-pakket needs the payload's shadow and blindspot (got shadow=${shadow}, blindspot=${blindspot})`);
  }
  if (shadowName !== corpus.archetypes[mainName].shadow_archetype || blindspotName !== redLinePartner(mainName)) {
    throw new Error(`corpusResolver: shadow ${shadowName} / blindspot ${blindspotName} are not ${mainName}'s wheel`);
  }
  const active = [];
  for (const a of [main, ...(active_set || [])]) { const n = nameOf(corpus, a); if (n && !active.includes(n)) active.push(n); }

  const ids = ['always/frame_extract', ...b.front.map(([id]) => `always/${id}`), 'always/methodology_principles', 'always/wheel_mechanics'];
  for (const n of active) {
    const g = Object.values(b.groups).find((x) => x.members.includes(n));
    if (!ids.includes(`group/${g.key}`)) ids.push(`group/${g.key}`);
  }
  // The Schaduw-pakket, checked AFTER the groups are pulled so nothing ships twice: the shadow's §1 + §6 only
  // when its group block is absent; the blindspot's §6 unless a group block or the shadow object already
  // carries it (Ruling/Chaos Mains: shadow and blindspot share a group).
  const groupOf = (n) => Object.values(b.groups).find((x) => x.members.includes(n)).key;
  const pack = { shadow: shadowName, blindspot: blindspotName, objects: [] };
  const shadowGroup = groupOf(shadowName);
  const blindspotGroup = groupOf(blindspotName);
  if (!ids.includes(`group/${shadowGroup}`)) pack.objects.push(`shadow_pack/shadow/${shadowName}`);
  if (!ids.includes(`group/${blindspotGroup}`) && !(pack.objects.length && shadowGroup === blindspotGroup)) {
    pack.objects.push(`shadow_pack/blindspot/${blindspotName}`);
  }
  ids.push(...pack.objects);
  if (supportName && docs.has(`extension/${mainName}×${supportName}`)) ids.push(`extension/${mainName}×${supportName}`);

  const picked = new Set((culture_picks || []).map((c) => nameOf(corpus, c)).filter(Boolean));
  const tnm = active.filter((n) => picked.has(n));
  if (tnm.length) {
    ids.push('tnm/preamble');
    for (const n of tnm) ids.push(`tnm/entry/${n}`);
  }

  const documents = ids.map((id) => ({ id, kind: docs.get(id).kind, title: docs.get(id).title, tokens: tokens(docs.get(id).text) }));
  const text = ids.map((id) => `════ CORPUS ${id} ════\n${docs.get(id).text}`).join('\n\n');
  return {
    corpus_manifest_version: VERSIONS.corpus_manifest_version,
    language: lang,
    shadow_pack: pack,
    documents,
    token_estimate: tokens(text),
    text,
  };
}

module.exports = { manifest, registry, bindings, GROUPS, GROUP_HEADINGS, NEVER_PATTERNS, STAGED, stripInline, stripDependent, norm };
