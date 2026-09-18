/**
 * OCEAN upload — the ten aspect scores of an uploaded Big Five report, two per trait (Brief v2
 * Addendum A §5c). Only NUMBERS leave this module, under OUR names: never the source file's labels,
 * categories or extra scales. A HEXACO "Eerlijkheid-Nederigheid" scale in the source is not a scale in
 * this model and is simply never read.
 *
 * The trait scores themselves are parsed in routes/ai.js; this reads the aspects the Master Prompt's
 * OCEAN section splits each trait into (§5.5 "de aspect-splitsing — daar zit de scherpte").
 *
 * A score counts only in the form a report prints a score in:
 *   "- IJver: 99", "IJver 99", "IJver: 99/100", "IJver (99)"          — label and number on one line
 *   "IJver:" then "99" on the next line                             — a PDF split mid-score (colon required)
 * A label on a line of its own with no colon is never paired with a following number: overview pages
 * print a column of labels and then a column of numbers, and pairing those would shift every value.
 */

'use strict';

// key → trait, our names, and the labels source reports use for it (whole words, case-insensitive).
const ASPECTS = [
  { key: 'intellect',       trait: 'O', nl: 'Intellect',     en: 'Intellect',       labels: ['intellect'] },
  { key: 'aesthetics',      trait: 'O', nl: 'Esthetiek',     en: 'Aesthetics',      labels: ['esthetiek', 'estetiek', 'aesthetics', 'aesthetic openness'] },
  { key: 'industriousness', trait: 'C', nl: 'IJver',         en: 'Industriousness', labels: ['ijver', 'vlijt', 'industriousness'] },
  { key: 'orderliness',     trait: 'C', nl: 'Ordelijkheid',  en: 'Orderliness',     labels: ['ordelijkheid', 'orderliness'] },
  { key: 'enthusiasm',      trait: 'E', nl: 'Enthousiasme',  en: 'Enthusiasm',      labels: ['enthousiasme', 'enthusiasm'] },
  { key: 'assertiveness',   trait: 'E', nl: 'Assertiviteit', en: 'Assertiveness',   labels: ['assertiviteit', 'assertiveness'] },
  { key: 'compassion',      trait: 'A', nl: 'Compassie',     en: 'Compassion',      labels: ['compassie', 'mededogen', 'medeleven', 'compassion'] },
  { key: 'politeness',      trait: 'A', nl: 'Beleefdheid',   en: 'Politeness',      labels: ['beleefdheid', 'politeness'] },
  { key: 'volatility',      trait: 'N', nl: 'Volatiliteit',  en: 'Volatility',      labels: ['emotionele volatiliteit', 'volatiliteit', 'volatility'] },
  { key: 'withdrawal',      trait: 'N', nl: 'Terugtrekking', en: 'Withdrawal',      labels: ['terughoudendheid', 'terugtrekking', 'withdrawal'] },
];

const TRAIT_ORDER = ['O', 'C', 'E', 'A', 'N'];
const TRAIT_NAMES = {
  nl: { O: 'Openheid', C: 'Consciëntieusheid', E: 'Extraversie', A: 'Meegaandheid', N: 'Neuroticisme' },
  en: { O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', N: 'Neuroticism' },
};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BULLET = String.raw`^\s*(?:[-–—•*·]\s*)?`;
// Whole-word label: "intellect" must not match "intellectuele".
const label = (a) => `(?<![\\p{L}])(?:${a.labels.map(esc).join('|')})(?![\\p{L}])`;

function compile(a) {
  return {
    sameLine: new RegExp(`${BULLET}${label(a)}\\s*[:=]?\\s*\\(?\\s*(\\d{1,3})\\s*(?:%|\\/\\s*100)?\\s*\\)?\\s*$`, 'iu'),
    colonOnly: new RegExp(`${BULLET}${label(a)}\\s*:\\s*$`, 'iu'),
  };
}
const COMPILED = ASPECTS.map((a) => ({ ...a, re: compile(a) }));

const inRange = (n) => Number.isInteger(n) && n >= 0 && n <= 100;

/**
 * @param {string} text  the (already scrubbed) text of one uploaded report
 * @returns {Record<string, number> | null}  aspect key → 0..100, or null when none is found
 */
function parseOceanAspects(text) {
  const lines = String(text || '').split(/\r?\n/);
  const out = {};
  for (const a of COMPILED) {
    // 1. a full score line anywhere in the report wins
    for (const line of lines) {
      const m = line.match(a.re.sameLine);
      if (m && inRange(+m[1])) { out[a.key] = +m[1]; break; }
    }
    if (out[a.key] != null) continue;
    // 2. "Label:" with the number alone on the next non-empty line
    for (let i = 0; i < lines.length && out[a.key] == null; i++) {
      if (!a.re.colonOnly.test(lines[i])) continue;
      const next = lines.slice(i + 1).find((l) => l.trim());
      const m = next && next.trim().match(/^(\d{1,3})\s*(?:%|\/\s*100)?$/);
      if (m && inRange(+m[1])) out[a.key] = +m[1];
    }
  }
  return Object.keys(out).length ? out : null;
}

/**
 * One line for the model, numbers only, our names, grouped per trait:
 *   "Openheid — Intellect: 75/100 · Esthetiek: 64/100 | Consciëntieusheid — IJver: 99/100 · …"
 */
function formatAspectLine(aspects, language = 'nl') {
  if (!aspects) return '';
  const en = String(language).toLowerCase() === 'en';
  const groups = TRAIT_ORDER.map((t) => {
    const cells = ASPECTS.filter((a) => a.trait === t && aspects[a.key] != null)
      .map((a) => `${en ? a.en : a.nl}: ${aspects[a.key]}/100`);
    return cells.length ? `${TRAIT_NAMES[en ? 'en' : 'nl'][t]} — ${cells.join(' · ')}` : null;
  }).filter(Boolean);
  return groups.join(' | ');
}

module.exports = { ASPECTS, parseOceanAspects, formatAspectLine };
