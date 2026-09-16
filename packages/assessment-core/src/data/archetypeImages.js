import { resolveExtendedKey, extendedKeyForName } from './scoring/index.js';

/**
 * Archetype Image Map - 132-matrix, male + female
 * -----------------------------------------------
 * Every unique archetype gets two portraits: a male and a female version (132 x 2).
 * The artwork is still in production: a slot stays null until its portrait lands. The 72-era
 * portraits were deleted with the 72-matrix.
 *
 * Every portrait has two files in apps/platform/public/images/Import ready/:
 *   - web/<name>.webp  the web copy (max 1100px tall, alpha kept) - what the card and the PDF draw
 *   - <name>.png       the full-resolution original - what the PDF's image link opens
 * Declare a slot with art('<name>.webp', '<name>.png').
 *
 * The keys are kept deliberately: this table is the manifest of exactly which
 * combination needs which two portraits. When the art lands, replace a slot's null
 * with art(...) - nothing else has to change. Filling only one of the two is
 * fine: resolvePortrait() falls back to the variant that exists, unless the caller asks
 * for the exact variant ({ fallback: false }).
 *
 * The user picks Masculine / Feminine on the results card before downloading (the toggle is
 * always shown); the card and the PDF resolve the EXACT chosen variant, so they always show
 * the same image and never a portrait under the other label - a variant whose art has not
 * landed yet simply shows no portrait.
 */

const PORTRAIT_DIR = '/images/Import ready/';

/** A portrait: web copy (rendered) + full-resolution original (downloaded). */
const art = (web, full) => ({ web: `${PORTRAIT_DIR}web/${web}`, full: `${PORTRAIT_DIR}${full}` });

/**
 * Lookup table: 132-matrix key (`${MAIN}_${SUPPORT}`) -> { male, female } portraits (art()).
 * null = artwork not available yet.
 */
const ARCHETYPE_IMAGES = {
  // RULER (Positie 12) - #1-11
  RULER_JUDGE:      { male: null, female: null },  // #1   The Emperor
  RULER_SAGE:       { male: art('sovereign male.webp', 'sovereign male.png'), female: null },  // #2   The Sovereign
  RULER_ARTIST:     { male: null, female: null },  // #3   The Designer
  RULER_EXPLORER:   { male: null, female: null },  // #4   The Entrepreneur
  RULER_INNOCENT:   { male: null, female: null },  // #5   The Founder
  RULER_OUTLAW:     { male: null, female: null },  // #6   The Reformer
  RULER_TRICKSTER:  { male: null, female: null },  // #7   The Puppeteer
  RULER_HERO:       { male: null, female: null },  // #8   The Commander
  RULER_MAGICIAN:   { male: null, female: null },  // #9   The Overlord
  RULER_CAREGIVER:  { male: null, female: null },  // #10  The Advocate
  RULER_LOVER:      { male: null, female: null },  // #11  The Patron

  // JUDGE (Positie 1) - #12-22
  JUDGE_RULER:      { male: null, female: null },  // #12  The Arbiter
  JUDGE_OUTLAW:     { male: null, female: null },  // #13  The Whistleblower
  JUDGE_TRICKSTER:  { male: null, female: null },  // #14  The Inquisitor
  JUDGE_SAGE:       { male: null, female: null },  // #15  The Critic
  JUDGE_ARTIST:     { male: null, female: null },  // #16  The Appraiser
  JUDGE_INNOCENT:   { male: null, female: null },  // #17  The Examiner
  JUDGE_EXPLORER:   { male: null, female: null },  // #18  The Auditor
  JUDGE_HERO:       { male: null, female: null },  // #19  The Avenger
  JUDGE_MAGICIAN:   { male: null, female: null },  // #20  The Enforcer
  JUDGE_CAREGIVER:  { male: null, female: null },  // #21  The Mediator
  JUDGE_LOVER:      { male: null, female: null },  // #22  The Reconciler

  // LOVER (Positie 2) - #23-33
  LOVER_CAREGIVER:  { male: null, female: null },  // #23  The Soulmate
  LOVER_RULER:      { male: null, female: null },  // #24  The Companion
  LOVER_JUDGE:      { male: null, female: null },  // #25  The Betrothed
  LOVER_TRICKSTER:  { male: null, female: null },  // #26  The Wingman
  LOVER_OUTLAW:     { male: null, female: null },  // #27  The Libertine
  LOVER_SAGE:       { male: null, female: null },  // #28  The Poet
  LOVER_ARTIST:     { male: null, female: null },  // #29  The Muse
  LOVER_INNOCENT:   { male: null, female: null },  // #30  The Votary
  LOVER_EXPLORER:   { male: null, female: null },  // #31  The Moth
  LOVER_HERO:       { male: null, female: null },  // #32  The Romantic
  LOVER_MAGICIAN:   { male: null, female: null },  // #33  The Spellbinder

  // CAREGIVER (Positie 3) - #34-44
  CAREGIVER_LOVER:      { male: null, female: null },  // #34  The Healer
  CAREGIVER_RULER:      { male: null, female: null },  // #35  The Patriarch / Matriarch
  CAREGIVER_JUDGE:      { male: null, female: null },  // #36  The Defender
  CAREGIVER_OUTLAW:     { male: null, female: null },  // #37  The Cultivator
  CAREGIVER_TRICKSTER:  { male: null, female: null },  // #38  The Empath
  CAREGIVER_SAGE:       { male: null, female: null },  // #39  The Therapist
  CAREGIVER_ARTIST:     { male: null, female: null },  // #40  The Restorer
  CAREGIVER_EXPLORER:   { male: null, female: null },  // #41  The Pilgrim
  CAREGIVER_INNOCENT:   { male: null, female: null },  // #42  The Devotee
  CAREGIVER_HERO:       { male: null, female: null },  // #43  The Guardian
  CAREGIVER_MAGICIAN:   { male: null, female: null },  // #44  The Warden

  // INNOCENT (Positie 4) - #45-55
  INNOCENT_EXPLORER:   { male: null, female: null },  // #45  The Saint
  INNOCENT_RULER:      { male: null, female: null },  // #46  The Shepherd
  INNOCENT_JUDGE:      { male: null, female: null },  // #47  The Traditionalist
  INNOCENT_TRICKSTER:  { male: null, female: null },  // #48  The Free Spirit
  INNOCENT_OUTLAW:     { male: null, female: null },  // #49  The Torchbearer
  INNOCENT_SAGE:       { male: null, female: null },  // #50  The Disciple
  INNOCENT_ARTIST:     { male: null, female: null },  // #51  The Utopian
  INNOCENT_HERO:       { male: null, female: null },  // #52  The Pioneer
  INNOCENT_MAGICIAN:   { male: null, female: null },  // #53  The Illuminator
  INNOCENT_CAREGIVER:  { male: null, female: null },  // #54  The Samaritan
  INNOCENT_LOVER:      { male: null, female: null },  // #55  The Sweetheart

  // EXPLORER (Positie 5) - #56-66
  EXPLORER_INNOCENT:   { male: null, female: null },  // #56  The Navigator
  EXPLORER_RULER:      { male: null, female: null },  // #57  The Networker
  EXPLORER_JUDGE:      { male: null, female: null },  // #58  The Surveyor
  EXPLORER_OUTLAW:     { male: null, female: null },  // #59  The Innovator
  EXPLORER_TRICKSTER:  { male: null, female: null },  // #60  The Scout
  EXPLORER_SAGE:       { male: null, female: null },  // #61  The Philosopher
  EXPLORER_ARTIST:     { male: null, female: null },  // #62  The Bard
  EXPLORER_HERO:       { male: null, female: null },  // #63  The Sailor
  EXPLORER_MAGICIAN:   { male: null, female: null },  // #64  The Nomad
  EXPLORER_LOVER:      { male: null, female: null },  // #65  The Stargazer
  EXPLORER_CAREGIVER:  { male: null, female: null },  // #66  The Pathfinder

  // HERO (Positie 11) - #67-77
  HERO_MAGICIAN:   { male: null, female: null },  // #67  The Legend
  HERO_RULER:      { male: null, female: null },  // #68  The Conqueror
  HERO_JUDGE:      { male: null, female: null },  // #69  The Templar
  HERO_OUTLAW:     { male: null, female: null },  // #70  The Raider
  HERO_TRICKSTER:  { male: null, female: null },  // #71  The Agent
  HERO_SAGE:       { male: null, female: null },  // #72  The Strategist
  HERO_ARTIST:     { male: null, female: null },  // #73  The Duelist
  HERO_EXPLORER:   { male: null, female: null },  // #74  The Astronaut
  HERO_INNOCENT:   { male: null, female: null },  // #75  The Crusader
  HERO_CAREGIVER:  { male: null, female: null },  // #76  The Protector
  HERO_LOVER:      { male: null, female: null },  // #77  The Chevalier

  // MAGICIAN (Positie 10) - #78-88
  MAGICIAN_HERO:       { male: null, female: null },  // #78  The Alchemist
  MAGICIAN_RULER:      { male: null, female: null },  // #79  The Engineer
  MAGICIAN_JUDGE:      { male: null, female: null },  // #80  The Reckoner
  MAGICIAN_OUTLAW:     { male: null, female: null },  // #81  The Protagonist
  MAGICIAN_TRICKSTER:  { male: null, female: null },  // #82  The Enchanter
  MAGICIAN_SAGE:       { male: null, female: null },  // #83  The Sorcerer
  MAGICIAN_ARTIST:     { male: null, female: null },  // #84  The Performer
  MAGICIAN_INNOCENT:   { male: null, female: null },  // #85  The Catalyst
  MAGICIAN_EXPLORER:   { male: null, female: null },  // #86  The Trailblazer
  MAGICIAN_LOVER:      { male: null, female: null },  // #87  The Shaman
  MAGICIAN_CAREGIVER:  { male: null, female: null },  // #88  The Redeemer

  // OUTLAW (Positie 6) - #89-99
  OUTLAW_TRICKSTER:  { male: null, female: null },  // #89  The Anarchist
  OUTLAW_RULER:      { male: null, female: null },  // #90  The Usurper
  OUTLAW_JUDGE:      { male: null, female: null },  // #91  The Contrarian
  OUTLAW_CAREGIVER:  { male: null, female: null },  // #92  The Liberator
  OUTLAW_LOVER:      { male: null, female: null },  // #93  The Instigator
  OUTLAW_SAGE:       { male: null, female: null },  // #94  The Iconoclast
  OUTLAW_ARTIST:     { male: null, female: null },  // #95  The Punk
  OUTLAW_EXPLORER:   { male: null, female: null },  // #96  The Renegade
  OUTLAW_INNOCENT:   { male: null, female: null },  // #97  The Idealist
  OUTLAW_MAGICIAN:   { male: null, female: null },  // #98  The Revolutionary
  OUTLAW_HERO:       { male: null, female: null },  // #99  The Ronin

  // TRICKSTER (Positie 7) - #100-110
  TRICKSTER_OUTLAW:     { male: null, female: null },  // #100 The Fool
  TRICKSTER_RULER:      { male: null, female: null },  // #101 The Gatecrasher
  TRICKSTER_JUDGE:      { male: null, female: null },  // #102 The Devil's Advocate
  TRICKSTER_LOVER:      { male: null, female: null },  // #103 The Seducer
  TRICKSTER_CAREGIVER:  { male: null, female: null },  // #104 The Chameleon
  TRICKSTER_SAGE:       { male: null, female: null },  // #105 The Riddler
  TRICKSTER_ARTIST:     { male: null, female: null },  // #106 The Impressionist
  TRICKSTER_EXPLORER:   { male: null, female: null },  // #107 The Free-runner
  TRICKSTER_INNOCENT:   { male: null, female: null },  // #108 The Joyrider
  TRICKSTER_MAGICIAN:   { male: null, female: null },  // #109 The Shapeshifter
  TRICKSTER_HERO:       { male: null, female: null },  // #110 The Ace

  // SAGE (Positie 8) - #111-121
  SAGE_ARTIST:     { male: null, female: null },  // #111 The Developer
  SAGE_RULER:      { male: null, female: null },  // #112 The Analyst
  SAGE_JUDGE:      { male: null, female: null },  // #113 The Skeptic
  SAGE_CAREGIVER:  { male: null, female: null },  // #114 The Mentor
  SAGE_LOVER:      { male: null, female: null },  // #115 The Guru
  SAGE_OUTLAW:     { male: null, female: null },  // #116 The Hermit
  SAGE_TRICKSTER:  { male: null, female: null },  // #117 The Theorist
  SAGE_INNOCENT:   { male: null, female: null },  // #118 The Enlightened
  SAGE_EXPLORER:   { male: null, female: null },  // #119 The Scholar
  SAGE_HERO:       { male: null, female: null },  // #120 The Detective
  SAGE_MAGICIAN:   { male: null, female: null },  // #121 The Freemason

  // ARTIST (Positie 9) - #122-132
  ARTIST_SAGE:       { male: null, female: null },  // #122 The Demiurge
  ARTIST_RULER:      { male: null, female: null },  // #123 The Architect
  ARTIST_JUDGE:      { male: null, female: null },  // #124 The Editor
  ARTIST_LOVER:      { male: null, female: null },  // #125 The Troubadour
  ARTIST_CAREGIVER:  { male: null, female: null },  // #126 The Storyteller
  ARTIST_TRICKSTER:  { male: null, female: null },  // #127 The Oracle
  ARTIST_OUTLAW:     { male: null, female: null },  // #128 The Provocateur
  ARTIST_EXPLORER:   { male: null, female: null },  // #129 The Visionary
  ARTIST_INNOCENT:   { male: null, female: null },  // #130 The Source
  ARTIST_MAGICIAN:   { male: null, female: null },  // #131 The Craftsman
  ARTIST_HERO:       { male: null, female: null },  // #132 The Forgemaster
};

/** The two portrait variants every archetype has. */
export const PORTRAIT_VARIANTS = ['female', 'male'];

/**
 * Variant shown until the user picks one on the results card. The assessment collects
 * no gender, so this is a plain default the user can swap - nothing is inferred.
 */
export const DEFAULT_PORTRAIT_VARIANT = 'female';

const normVariant = (v) => (PORTRAIT_VARIANTS.includes(v) ? v : DEFAULT_PORTRAIT_VARIANT);

/**
 * Which portraits exist for a combination, and which one to show for a preferred variant.
 *
 * Falls back to the other variant when only one has been added, and reports the variant
 * actually returned so a caller (the results card, the PDF) never labels a female portrait
 * as male or vice versa.
 *
 * @param {string} mainKey   - e.g. 'SAGE'
 * @param {string} support   - support ARCHETYPE key, e.g. 'OUTLAW'
 * @param {string} [preferred] - 'male' | 'female'
 * @param {{ fallback?: boolean }} [options] - fallback: false returns only the preferred variant (null while
 *   its art is missing) - the results card and PDF use this so the image always matches the toggle
 * @returns {{ url: string|null, fullUrl: string|null, variant: string|null, available: { male: boolean, female: boolean } }}
 *   url = the web copy to render; fullUrl = the full-resolution original (for download links)
 */
export function resolvePortrait(mainKey, support, preferred = DEFAULT_PORTRAIT_VARIANT, { fallback = true } = {}) {
  const key = resolveExtendedKey(mainKey, support);
  const slot = (key && ARCHETYPE_IMAGES[key]) || {};
  const available = { male: !!slot.male, female: !!slot.female };
  const want = normVariant(preferred);
  const other = want === 'male' ? 'female' : 'male';
  const variant = slot[want] ? want : fallback && slot[other] ? other : null;
  if (!variant) return { url: null, fullUrl: null, variant: null, available };
  return { url: slot[variant].web, fullUrl: slot[variant].full, variant, available };
}

/**
 * Get the archetype portrait for a main + support combination.
 *
 * @param {string} mainKey - e.g. 'SAGE'
 * @param {string} support - support ARCHETYPE key, e.g. 'OUTLAW'
 * @param {string} [variant] - 'male' | 'female' (falls back to the other if missing)
 * @returns {string|null} Web-copy image path, or null while the artwork is unavailable
 */
export function getArchetypeImage(mainKey, support, variant = DEFAULT_PORTRAIT_VARIANT) {
  return resolvePortrait(mainKey, support, variant).url;
}

/**
 * Get a portrait by the combined lookup key directly.
 * Accepts a 132-matrix key, e.g. 'SAGE_OUTLAW'.
 * @param {string} lookupKey
 * @param {string} [variant] - 'male' | 'female'
 * @returns {string|null}
 */
export function getArchetypeImageByKey(lookupKey, variant = DEFAULT_PORTRAIT_VARIANT) {
  if (!lookupKey) return null;
  const k = String(lookupKey).toUpperCase();
  const sep = k.lastIndexOf('_');
  return sep > 0 ? getArchetypeImage(k.slice(0, sep), k.slice(sep + 1), variant) : null;
}

/**
 * @param {string} name - e.g. 'The Mentor' or 'De Mentor' (live roster names only)
 * @param {string} [variant] - 'male' | 'female'
 * @returns {string|null} portrait path, or null while the artwork is unavailable
 */
export function getArchetypeImageByName(name, variant = DEFAULT_PORTRAIT_VARIANT) {
  const key = extendedKeyForName(name);
  return key ? getArchetypeImageByKey(key, variant) : null;
}

/**
 * resolvePortrait() by display name - e.g. for the account dashboard's full-resolution download.
 * @param {string} name - e.g. 'The Sovereign' or 'De Soeverein' (live roster names only)
 * @param {string} [variant] - 'male' | 'female'
 * @returns {{ url: string|null, fullUrl: string|null, variant: string|null, available: { male: boolean, female: boolean } }}
 */
export function resolvePortraitByName(name, variant = DEFAULT_PORTRAIT_VARIANT) {
  const key = extendedKeyForName(name);
  const sep = key ? key.lastIndexOf('_') : -1;
  return sep > 0
    ? resolvePortrait(key.slice(0, sep), key.slice(sep + 1), variant)
    : { url: null, fullUrl: null, variant: null, available: { male: false, female: false } };
}

/**
 * Resolve a stored extended-archetype display name (EN or NL) to its
 * MAIN_SUPPORTARCHETYPE key - e.g. 'The Mediator' / 'De Bemiddelaar' -> 'JUDGE_CAREGIVER'.
 * Only live roster names resolve; a retired name returns null.
 * @param {string} name
 * @returns {string|null}
 */
export function getArchetypeKeyByName(name) {
  return extendedKeyForName(name);
}

export default ARCHETYPE_IMAGES;
