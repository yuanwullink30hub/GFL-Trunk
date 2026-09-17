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

// Keyed by archetype in the corpus; the loading screen shows them anonymously, so only the texts go
// out — no archetype names, nothing that could be read as "this is you".
const texts = (table) => [...new Set(Object.values(table).map((s) => String(s).trim()).filter(Boolean))];

const nl = texts(ARCHETYPE_QUOTES_NL);
const en = texts(ARCHETYPE_QUOTES_EN);
if (!nl.length) {
  console.error('\n✘ No Dutch lessons found in archetypeQuotes — not writing lessons.json\n');
  process.exit(1);
}

writeFileSync(TARGET, `${JSON.stringify({ nl, en }, null, 0)}\n`, 'utf8');
console.log(`✓ Loading-screen lessons → public/lessons.json (${nl.length} nl, ${en.length} en)`);
