/**
 * The loading screen shows a Levensles while the platform boots — one per day, the same one all day.
 * The overlay runs before the bundle (index.html), so it cannot import the corpus; this writes the
 * ratified archetype lessons to public/lessons.json for it to fetch.
 *
 * Source: packages/assessment-core archetypeQuotes (132 extended archetypes, NL ratified + EN
 * translation). Regenerated on every build, so a corrected lesson reaches the loading screen too.
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
// The package maps ./data/* straight onto the file, so the extension is part of the specifier.
import { ARCHETYPE_QUOTES_NL, ARCHETYPE_QUOTES_EN } from '@gfl/assessment-core/data/archetypeQuotes.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const TARGET = resolve(HERE, '..', 'public', 'lessons.json');

// The day order. The table is grouped by main archetype (11 Ruler lessons, then 11 Judge, …) and the
// loading screen simply takes the next entry each day — so it used to stay on one main archetype for
// 11 days running. Now: round-robin over the main archetypes, each group rotated by its position so the
// second archetype turns over too, then a greedy pass so a day never shares an archetype with the day
// before it (where the list still allows it). Deterministic: the same build gives the same calendar.
function dayOrder(keys) {
  const parts = (k) => k.split('_');
  const mains = [...new Set(keys.map((k) => parts(k)[0]))];
  const groups = mains.map((m, gi) => {
    const g = keys.filter((k) => parts(k)[0] === m);
    const r = gi % g.length;
    return g.slice(r).concat(g.slice(0, r));
  });
  const interleaved = [];
  for (let j = 0; j < Math.max(...groups.map((g) => g.length)); j += 1) {
    for (const g of groups) if (g[j]) interleaved.push(g[j]);
  }
  const shares = (a, b) => parts(a).some((x) => parts(b).includes(x));
  const greedy = (list) => {
    const out = [list[0]];
    const left = list.slice(1);
    while (left.length) {
      const prev = out[out.length - 1];
      let i = left.findIndex((k) => !shares(prev, k));
      if (i < 0) i = left.findIndex((k) => parts(k)[0] !== parts(prev)[0]);
      out.push(left.splice(Math.max(i, 0), 1)[0]);
    }
    return out;
  };
  // The greedy pass can run out of good choices at the end, and the calendar wraps (the last day is
  // followed by the first). Try each starting lesson; keep the first order with no neighbours sharing
  // an archetype, or else the one with the fewest.
  const clashes = (o) => o.filter((k, i) => shares(k, o[(i + 1) % o.length])).length;
  let best = null;
  for (let s = 0; s < interleaved.length; s += 1) {
    const o = greedy(interleaved.slice(s).concat(interleaved.slice(0, s)));
    const c = clashes(o);
    if (!best || c < best.c) best = { o, c };
    if (c === 0) break;
  }
  return best.o;
}

const ORDER = dayOrder(Object.keys(ARCHETYPE_QUOTES_NL));

// Keyed by archetype in the corpus; the loading screen shows them anonymously, so only the texts go
// out — no archetype names, nothing that could be read as "this is you".
const texts = (table) => {
  const seen = new Set();
  return ORDER.map((k) => String(table[k] || '').trim()).filter((s) => s && !seen.has(s) && seen.add(s));
};

const nl = texts(ARCHETYPE_QUOTES_NL);
const en = texts(ARCHETYPE_QUOTES_EN);
if (!nl.length) {
  console.error('\n✘ No Dutch lessons found in archetypeQuotes — not writing lessons.json\n');
  process.exit(1);
}

writeFileSync(TARGET, `${JSON.stringify({ nl, en }, null, 0)}\n`, 'utf8');
console.log(`✓ Loading-screen lessons → public/lessons.json (${nl.length} nl, ${en.length} en)`);
