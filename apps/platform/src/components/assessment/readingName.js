import { ARCHETYPES, resolveExtendedKey, liveExtendedName, EXTENDED_ARCHETYPES, EXTENDED_ARCHETYPES_NL } from '@gfl/assessment-core/data';

/**
 * The live extended-archetype name of a stored reading.
 *
 * A reading is saved with the NAME the report carried at the time ("De lonewolf", "De Eenling",
 * …) plus its canonical main and support ("De Heerser", "De Rebel"). The roster renames names and
 * keeps no aliases, so a name-only lookup goes stale and the card showed "—". Main × support
 * never goes stale: resolve through them first, and fall back to the name only when the reading
 * has no ids (pre-extraction entries, the /me fallback payload).
 */

// Base-archetype names in both languages (and the keys themselves) → canonical key.
const BASE_KEY = {};
for (const a of Object.values(ARCHETYPES)) {
  for (const n of [a.key, a.name, a.nameEn]) if (n) BASE_KEY[String(n).trim().toLowerCase()] = a.key;
}

/** 'De Heerser' | 'The Ruler' | 'RULER' → 'RULER'; unknown → null. */
export function baseKeyForName(name) {
  return BASE_KEY[String(name || '').trim().toLowerCase()] || null;
}

/**
 * @param {{ archetypeName?: string, archetypeMainId?: string, archetypeSupportId?: string }} reading
 * @param {'nl'|'en'} language
 * @returns {string} the live name, or '' when nothing resolves
 */
export function readingExtendedName(reading, language = 'nl') {
  if (!reading) return '';
  if (typeof reading === 'string') return liveExtendedName(reading, language);
  const key = resolveExtendedKey(baseKeyForName(reading.archetypeMainId), baseKeyForName(reading.archetypeSupportId));
  if (key) return (String(language).toLowerCase().startsWith('en') ? EXTENDED_ARCHETYPES[key] : EXTENDED_ARCHETYPES_NL[key]) || '';
  return liveExtendedName(reading.archetypeName || reading.archetypePrimaryId, language);
}
