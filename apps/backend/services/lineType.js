/**
 * Garden For Life — Main↔Support line-type resolver
 * ==================================================
 * The colour of the line between Main and Support (Groen/Paars/Blauw/Rood) is a pure
 * function of the two wheel positions. The model kept mis-deriving it (Green vs Blue),
 * so the backend resolves it deterministically here and ships the AI:
 *   1. the resolved tag, pre-computed, inside the user payload (`formatLineTypeBlock`), and
 *   2. the full lookup table as a separate reference document (`LINE_TYPE_LOOKUP_DOC`),
 * so the model reads the answer instead of guessing the links.
 *
 * This module is the single source of truth: the resolver and the reference doc
 * (LINE_TYPE_LOOKUP_DOC, shipped to the model) are kept in lockstep here.
 */

// Wheel positions 1..12 (clockwise), six biological pillars of two.
const POSITIONS = {
  JUDGE: 1, LOVER: 2, CAREGIVER: 3, INNOCENT: 4, EXPLORER: 5, OUTLAW: 6,
  TRICKSTER: 7, SAGE: 8, ARTIST: 9, MAGICIAN: 10, HERO: 11, RULER: 12,
};

// Pillar (biological group) per position — same pillar = shared hardware = GREEN.
const PILLAR = {
  1: 'RULING', 12: 'RULING',
  2: 'RELATIONAL', 3: 'RELATIONAL',
  4: 'SEEKER', 5: 'SEEKER',
  6: 'CHAOS', 7: 'CHAOS',
  8: 'ABSTRACT', 9: 'ABSTRACT',
  10: 'AGENCY', 11: 'AGENCY',
};

// Same-pillar partner of a position (the other member of its group).
const PARTNER = { 1: 12, 12: 1, 2: 3, 3: 2, 4: 5, 5: 4, 6: 7, 7: 6, 8: 9, 9: 8, 10: 11, 11: 10 };

const posOf = (key) => POSITIONS[String(key || '').toUpperCase()] || null;

/**
 * Resolve the Main→Support line-type. Top-down, first match wins (order matters because
 * Judge+Ruler and Outlaw+Trickster are BOTH same-group AND sum-13 — same-group wins).
 * @returns {'Groene Lijn'|'Paarse Lijn'|'Blauwe Lijn'|'Rode Lijn'|'(geen kanonieke lijn)'|null}
 */
function resolveLineType(mainKey, supportKey) {
  const a = posOf(mainKey);
  const b = posOf(supportKey);
  if (!a || !b) return null;
  // 1. GROENE LIJN — same group (shared hardware)
  if (PILLAR[a] === PILLAR[b]) return 'Groene Lijn';
  // 2. PAARSE LIJN — 180° shadow axis (positions 6 apart)
  if (Math.abs(a - b) === 6) return 'Paarse Lijn';
  // 3. BLAUWE LIJN — sum-13 cross-group feedback bridge (same-group sum-13 already GREEN above)
  if (a + b === 13) return 'Blauwe Lijn';
  // 4. RODE LIJN — friction/blindspot: Support is the same-group partner of Main's 180° shadow
  const shadowPos = ((a - 1 + 6) % 12) + 1;
  if (b === PARTNER[shadowPos]) return 'Rode Lijn';
  // 5. none of the canonical lines
  return '(geen kanonieke lijn)';
}

/**
 * Pre-computed line-type block injected into the per-user AI payload. The model must READ
 * this tag and never compute the colour itself.
 */
function formatLineTypeBlock({ mainKey, supportKey, shadowKey, blindspotKey }) {
  const tag = resolveLineType(mainKey, supportKey);
  const p = (k) => posOf(k) || '?';
  // The field name "Main-Support lijntype:" is matched VERBATIM by the master prompt (§0.2,
  // §5.10) — keep the ASCII hyphen, no en-dash, so the model's literal lookup hits.
  return [
    '═══ MAIN-SUPPORT LIJNTYPE (backend-resolved — lees deze tag, leid de kleur NIET zelf af) ═══',
    `Main: ${mainKey} (positie ${p(mainKey)})  |  Support: ${supportKey} (positie ${p(supportKey)})`,
    `Main-Support lijntype: ${tag || '(geen kanonieke lijn)'}`,
    `Shadow van Main: ${shadowKey} (positie ${p(shadowKey)}) - Paarse Lijn (180 graden tegenpool)`,
    `Blindspot van Main: ${blindspotKey} (positie ${p(blindspotKey)}) - Rode Lijn`,
    'De bovenstaande tags zijn door de backend uit de statische lookup-tabel afgeleid. Gebruik ze letterlijk; bereken kleuren/links nooit zelf.',
  ].join('\n');
}

// ── Reference document shipped alongside the payload (the lookup table, verbatim) ──
const LINE_TYPE_LOOKUP_DOC = `# Backend Line-Type Lookup Table — exact pairs

The colour of the line between Main and Support is resolved by the backend from these static
tables and sent with its tag already resolved. The model never derives the colour — it reads
the tag the backend supplies.

## Wheel reference (position | archetype | group)
\`\`\`
 1 Judge      Ruling        7 Trickster  Chaos
 2 Lover      Relational    8 Sage       Abstract
 3 Caregiver  Relational    9 Artist     Abstract
 4 Innocent   Seeker       10 Magician   Agency
 5 Explorer   Seeker       11 Hero       Agency
 6 Outlaw     Chaos        12 Ruler      Ruling
\`\`\`

## Resolution order (apply top-down; first match wins)
1. GROENE LIJN — same group
2. PAARSE LIJN — 180° shadow (positions 6 apart)
3. BLAUWE LIJN — sum-13 cross-group feedback
4. RODE LIJN — friction / blindspot axis
5. (geen kanonieke lijn) — none of the above

Order matters: Judge+Ruler and Outlaw+Trickster are BOTH same-group AND sum-13 → same-group (GREEN) wins.

## GROENE LIJN — gedeelde hardware (same biological group)
Judge (1)–Ruler (12) | Lover (2)–Caregiver (3) | Innocent (4)–Explorer (5)
Outlaw (6)–Trickster (7) | Sage (8)–Artist (9) | Magician (10)–Hero (11)

## PAARSE LIJN — 180° schaduw-as (unordered)
Judge (1)–Trickster (7) | Lover (2)–Sage (8) | Caregiver (3)–Artist (9)
Innocent (4)–Magician (10) | Explorer (5)–Hero (11) | Outlaw (6)–Ruler (12)

## BLAUWE LIJN — sum-13 feedback-brug (cross-group ONLY)
Lover (2)–Hero (11) | Caregiver (3)–Magician (10) | Innocent (4)–Artist (9) | Explorer (5)–Sage (8)
(Judge (1)+Ruler (12)=13 → GROEN | Outlaw (6)+Trickster (7)=13 → GROEN)

## RODE LIJN — frictie / blindspot-as
Rule: the red-line/blindspot of a Main is the same-group partner of that Main's 180° shadow (directional, Main → blindspot).
| Main | Shadow (Paars) | Red/Blindspot |
|---|---|---|
| Judge (1) | Trickster (7) | Outlaw (6) |
| Lover (2) | Sage (8) | Artist (9) |
| Caregiver (3) | Artist (9) | Sage (8) |
| Innocent (4) | Magician (10) | Hero (11) |
| Explorer (5) | Hero (11) | Magician (10) |
| Outlaw (6) | Ruler (12) | Judge (1) |
| Trickster (7) | Judge (1) | Ruler (12) |
| Sage (8) | Lover (2) | Caregiver (3) |
| Artist (9) | Caregiver (3) | Lover (2) |
| Magician (10) | Innocent (4) | Explorer (5) |
| Hero (11) | Explorer (5) | Innocent (4) |
| Ruler (12) | Outlaw (6) | Trickster (7) |
`;

module.exports = { resolveLineType, formatLineTypeBlock, LINE_TYPE_LOOKUP_DOC, ARCHETYPE_POSITIONS: POSITIONS };
