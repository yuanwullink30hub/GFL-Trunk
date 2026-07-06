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
 */

const PLACEHOLDER_TENDENCY = 'PLACEHOLDER — tendens-microcopy volgt uit de schrijfronde.';
const PLACEHOLDER_EXPRESSION = 'PLACEHOLDER — dit expressieprofiel beschrijft straks in *waarschijnlijke tendensen* hoe deze configuratie zich doorgaans uitdrukt. De definitieve twaalf teksten worden apart geschreven en hier ingeladen.';

// Default entry: used whenever the archetype id has no dedicated copy yet.
const DEFAULT_ENTRY = {
  configurationName: null, // null → renderer falls back to the archetype id itself
  tendency: PLACEHOLDER_TENDENCY,
  expression: PLACEHOLDER_EXPRESSION,
};

// Per-archetype overrides land here as the writing task delivers them.
const MICROCOPY = {
  // 'De Hervormer': { configurationName: 'DE HERVORMER', tendency: '…', expression: '…' },
};

export function getCardMicrocopy(archetypePrimaryId) {
  const entry = MICROCOPY[archetypePrimaryId] || DEFAULT_ENTRY;
  return {
    configurationName: (entry.configurationName || archetypePrimaryId || '—').toUpperCase(),
    tendency: entry.tendency,
    expression: entry.expression,
  };
}
