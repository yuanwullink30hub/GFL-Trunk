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
  // 4. RODE LIJN — hardware seam / blindspot: positions sum to 7 (mod 12)
  if ((a + b) % 12 === 7) return 'Rode Lijn';
  // 5. none of the canonical lines
  return '(geen kanonieke lijn)';
}

const NAME = Object.fromEntries(Object.entries(POSITIONS).map(([k, p]) => [p, k.charAt(0) + k.slice(1).toLowerCase()]));
const wrap = (p) => ((((p - 1) % 12) + 12) % 12) + 1;

/**
 * The Main's Red Line partner (hardware seam / blindspot): the position that sums with it to 7 (mod 12).
 * Returns the TitleCase archetype name (the corpus key form), or null for an unknown Main.
 */
function redLinePartner(mainKey) {
  const p = posOf(mainKey);
  return p ? NAME[wrap(7 - p)] : null;
}

/**
 * The resolved connection links of the whole wheel, stored here — one row per position, TitleCase names. Only
 * the Main's own row ships (mainLinks; Corpus Lookup Table v1.1 §8, human ruling 2026-09-16):
 *   green  = the other member of the hardware group      blue   = positions summing to 13
 *   purple = 180° across (the shadow, 6 apart)            red    = positions summing to 7 (mod 12) (blindspot)
 *   yellow = the two positions 4 apart; triangle 1 = 1·5·9, 2 = 2·6·10, 3 = 3·7·11, 4 = 4·8·12
 * For Ruling and Chaos the blue partner is also the green partner.
 */
function wheelLinks() {
  return Object.keys(NAME).map(Number).sort((a, b) => a - b).map((p) => ({
    archetype: NAME[p],
    position: p,
    green: NAME[Number(Object.keys(PILLAR).find((q) => Number(q) !== p && PILLAR[q] === PILLAR[p]))],
    blue: NAME[13 - p],
    purple: NAME[wrap(p + 6)],
    red: NAME[wrap(7 - p)],
    yellow: [wrap(p + 4), wrap(p + 8)].sort((a, b) => a - b).map((q) => NAME[q]),
    triangle: ((p - 1) % 4) + 1,
  }));
}

/**
 * The Main's links as the payload ships them, read from the stored wheel and never derived by the model: one green,
 * one blue, one purple and one red partner, and the two yellow partners. Null for an unknown Main.
 */
function mainLinks(mainKey) {
  const p = posOf(mainKey);
  const row = p ? wheelLinks().find((r) => r.position === p) : null;
  return row ? { main: row.archetype, green: row.green, blue: row.blue, purple: row.purple, red: row.red, yellow: row.yellow } : null;
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

## RODE LIJN — frictie / blindspot-as (hardware seam)
Rule: positions sum to 7 (mod 12) — the red-line/blindspot of a Main is its seam partner.
Judge (1)–Outlaw (6) | Lover (2)–Explorer (5) | Caregiver (3)–Innocent (4)
Ruler (12)–Trickster (7) | Hero (11)–Sage (8) | Magician (10)–Artist (9)
`;

module.exports = { resolveLineType, formatLineTypeBlock, redLinePartner, wheelLinks, mainLinks, LINE_TYPE_LOOKUP_DOC, ARCHETYPE_POSITIONS: POSITIONS };
