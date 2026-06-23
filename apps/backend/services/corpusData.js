/**
 * Deltawerken — Corpus reader (restructure part 2.2)
 * ==================================================
 * Reads the canon corpus (deltawerken_corpus.json) and exposes the two
 * per-archetype inputs the C-magnitude path needs:
 *   - stored_D   : the 5-state D-curve (0..100) per archetype (Matrix v3.3 D_states)
 *   - C [Effect] : the Support's per-function modulation DIRECTION (+1 / -1 / null)
 *
 * It also normalises between the two key formats in play:
 *   - backend / scoring keys are UPPERCASE  (RULER, OUTLAW, TRICKSTER)
 *   - corpus archetype keys are TitleCase   (Ruler, Outlaw, Trickster)
 *
 * NOTE (2.2 wiring, deferred): the corpus currently lives in @gfl/assessment-core.
 * The backend reads it by relative path for now; final location/access (workspace
 * dep vs. a backend copy) is an open wiring decision. The EDGE structure the
 * C-magnitude path also needs (edge_to_main + red sign) comes from the Connection
 * Matrix v2.1, which is NOT in the corpus — that adapter is blocked separately.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const CORPUS_PATH = path.join(
  __dirname, '..', '..', '..',
  'packages', 'assessment-core', 'src', 'data', 'canon', 'deltawerken_corpus.json'
);

let _corpus = null;
let _corpusText = null;

/** Load + memoise the parsed canon corpus. */
function loadCorpus() {
  if (_corpus) return _corpus;
  _corpus = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf8'));
  return _corpus;
}

/**
 * Raw corpus file text (memoised) — the byte-stable block sent to the model as
 * cached context. Read from disk verbatim (not re-stringified) so the cached
 * prefix is identical across calls and the prompt cache reliably hits.
 */
function getCorpusText() {
  if (_corpusText) return _corpusText;
  _corpusText = fs.readFileSync(CORPUS_PATH, 'utf8');
  return _corpusText;
}

// ── Key normalisation: UPPERCASE (backend/scoring) <-> TitleCase (corpus) ──
function buildKeyMap(corpus) {
  const upperToTitle = {};
  const titleToUpper = {};
  for (const titleKey of Object.keys(corpus.archetypes || {})) {
    const upper = titleKey.toUpperCase();
    upperToTitle[upper] = titleKey;
    titleToUpper[titleKey] = upper;
  }
  return { upperToTitle, titleToUpper };
}

/** Resolve any case-form to the corpus TitleCase key. */
function toCorpusKey(corpus, key) {
  if (!key) return undefined;
  if (corpus.archetypes[key]) return key; // already TitleCase
  const { upperToTitle } = buildKeyMap(corpus);
  return upperToTitle[String(key).toUpperCase()];
}

// ── D-states: ordered [D1..D5] scalar array per archetype ──
const D_ORDER = ['D1 Coherent baseline', 'D2 Strained', 'D3 Entrenched', 'D4 Acute', 'D5 Collapse'];

/** [D1..D5] (0..100) for one archetype, by any case-form key. */
function getStoredDFor(corpus, key) {
  const tk = toCorpusKey(corpus, key);
  if (!tk) return null;
  const ds = corpus.archetypes[tk].D_states || {};
  return D_ORDER.map((label) => {
    const cell = ds[label];
    return cell && typeof cell.value === 'number' ? cell.value : 0;
  });
}

/** stored_D map for ALL 12, keyed UPPERCASE (the format precompute()/scoring use). */
function getStoredD(corpus = loadCorpus()) {
  const out = {};
  for (const titleKey of Object.keys(corpus.archetypes)) {
    out[titleKey.toUpperCase()] = getStoredDFor(corpus, titleKey);
  }
  return out;
}

// ── C-channel [Effect] direction: +1 / -1 / null(no channel) per function ──
// Corpus encodes it as a string: "post-test +" | "post-test −" | "no channel".
// (The minus is U+2212; handle the ASCII "-" too, defensively.)
function parseEffectDirection(value) {
  if (typeof value !== 'string') return null;
  const v = value.toLowerCase();
  if (v.includes('no channel')) return null;
  if (!v.includes('post-test')) return null;
  // The sign is the trailing token. NB: do NOT treat the ASCII hyphen in
  // "post-test" as a minus — the corpus minus is U+2212 ("−").
  if (v.includes('+') || v.includes('increase')) return +1;
  if (v.includes('−') || v.includes('decrease')) return -1;
  return null;
}

/** Support's [Effect] direction map { function -> +1|-1|null } by any case-form key. */
function getCEffectDirection(corpus, supportKey) {
  const tk = toCorpusKey(corpus, supportKey);
  if (!tk) return {};
  const channels = corpus.archetypes[tk].C_channels || {};
  const out = {};
  for (const [func, cell] of Object.entries(channels)) {
    out[func] = parseEffectDirection(cell && cell.value);
  }
  return out;
}

module.exports = {
  CORPUS_PATH,
  loadCorpus,
  getCorpusText,
  toCorpusKey,
  getStoredDFor,
  getStoredD,
  getCEffectDirection,
  parseEffectDirection,
};
