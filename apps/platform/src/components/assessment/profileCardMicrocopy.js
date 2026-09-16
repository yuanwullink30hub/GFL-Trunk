/**
 * Profile-card microcopy lookup — keyed on archetype id (cardPayload.v1 `archetypePrimaryId`).
 *
 * ⚠ ALL COPY BELOW IS PLACEHOLDER (profile_card_dev_handoff §8.3). The final microcopy is
 * twelve per-archetype text pairs, written separately (Layer 1-anchored writing task) and
 * delivered as `profile_card_microcopy_nl.json` — swap the entries here when it lands.
 * Rendering resolves text at render-time from this lookup, so copy updates propagate
 * without re-extraction (extraction spec §2.1).
 *
 * Shape per archetype id:
 *   configurationName — orb caption line 1 (uppercase; "DE HERVORMER" style). The caption
 *                        belongs to the ORB, not the person (SR-1).
 *   tendency          — orb caption line 2 (italic tendency microcopy, ~24ch max width)
 *   expression        — EXPRESSIEPROFIEL body (probabilistic phrasing; fragments to
 *                        emphasize in amber are wrapped in *asterisks*)
 *
 * i18n: copy values are { nl, en } pairs; `getCardMicrocopy(id, language)` resolves them.
 */

const PLACEHOLDER_TENDENCY = {
  nl: 'PLACEHOLDER — tendens-microcopy volgt uit de schrijfronde.',
  en: 'PLACEHOLDER — tendency microcopy follows from the writing round.',
};
const PLACEHOLDER_EXPRESSION = {
  nl: 'PLACEHOLDER — dit expressieprofiel beschrijft straks in *waarschijnlijke tendensen* hoe deze configuratie zich doorgaans uitdrukt. De definitieve twaalf teksten worden apart geschreven en hier ingeladen.',
  en: 'PLACEHOLDER — this expression profile will soon describe, in *likely tendencies*, how this configuration usually expresses itself. The definitive twelve texts are written separately and loaded in here.',
};

import { readingExtendedName } from './readingName';

// Default entry: used whenever the archetype id has no dedicated copy yet.
const DEFAULT_ENTRY = {
  configurationName: null, // null → the archetype's live roster name in the UI language
  tendency: PLACEHOLDER_TENDENCY,
  expression: PLACEHOLDER_EXPRESSION,
};

// Per-archetype overrides land here as the writing task delivers them.
const MICROCOPY = {
  // 'De Hervormer': { configurationName: { nl: 'DE HERVORMER', en: 'THE REFORMER' }, tendency: {…}, expression: {…} },
};

// Resolve an { nl, en } copy pair (or a plain string, for back-compat) to one language.
const pick = (v, language) => {
  if (v && typeof v === 'object') return v[language] || v.nl || v.en || '';
  return v;
};

// `reading` is a card reading ({ archetypePrimaryId, archetypeMainId, archetypeSupportId }) or,
// for back-compat, a stored extended-archetype name. The name is resolved through the live
// roster — main × support first, so a renamed name still finds its copy (readingName.js).
export function getCardMicrocopy(reading, language = 'nl') {
  const r = typeof reading === 'string' ? { archetypeName: reading } : (reading || {});
  const liveNl = readingExtendedName({ ...r, archetypeName: r.archetypeName || r.archetypePrimaryId }, 'nl');
  const entry = MICROCOPY[liveNl] || DEFAULT_ENTRY;
  const name = pick(entry.configurationName, language)
    || readingExtendedName({ ...r, archetypeName: r.archetypeName || r.archetypePrimaryId }, language);
  return {
    configurationName: (name || '—').toUpperCase(),
    tendency: pick(entry.tendency, language),
    expression: pick(entry.expression, language),
  };
}
