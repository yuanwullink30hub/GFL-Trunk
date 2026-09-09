import { EXTENDED_ARCHETYPES, EXTENDED_ARCHETYPES_NL, resolveExtendedKey } from './scoring/index.js';

/**
 * Archetype Image Map - 132-matrix
 * --------------------------------
 * ARTWORK IS CURRENTLY REMOVED. The 72-era portraits were retired together with
 * the 72-matrix (their names no longer line up with the 132 roster), and the 132
 * artwork is still in production. Every entry below is therefore null and every
 * getter returns null, so no card, profile or PDF renders a portrait for now.
 *
 * The keys are kept deliberately: this table is the manifest of exactly which
 * combination needs which portrait. When the art lands, replace a combination's
 * null with its asset path - nothing else has to change.
 *
 * Callers already treat null as "no portrait" and skip the image entirely.
 */

/**
 * Lookup table: 132-matrix key (`${MAIN}_${SUPPORT}`) -> portrait path.
 * null = artwork not available yet (currently: all 132).
 */
const ARCHETYPE_IMAGES = {
  // RULER (Positie 12) - #1-11
  RULER_JUDGE:      null,  // #1   The Emperor
  RULER_SAGE:       null,  // #2   The Sovereign
  RULER_ARTIST:     null,  // #3   The Designer
  RULER_EXPLORER:   null,  // #4   The Entrepreneur
  RULER_INNOCENT:   null,  // #5   The Founder
  RULER_OUTLAW:     null,  // #6   The Reformer
  RULER_TRICKSTER:  null,  // #7   The Puppeteer
  RULER_HERO:       null,  // #8   The Commander
  RULER_MAGICIAN:   null,  // #9   The Overlord
  RULER_CAREGIVER:  null,  // #10  The Advocate
  RULER_LOVER:      null,  // #11  The Patron

  // JUDGE (Positie 1) - #12-22
  JUDGE_RULER:      null,  // #12  The Arbiter
  JUDGE_OUTLAW:     null,  // #13  The Whistleblower
  JUDGE_TRICKSTER:  null,  // #14  The Inquisitor
  JUDGE_SAGE:       null,  // #15  The Critic
  JUDGE_ARTIST:     null,  // #16  The Appraiser
  JUDGE_INNOCENT:   null,  // #17  The Examiner
  JUDGE_EXPLORER:   null,  // #18  The Auditor
  JUDGE_HERO:       null,  // #19  The Avenger
  JUDGE_MAGICIAN:   null,  // #20  The Enforcer
  JUDGE_CAREGIVER:  null,  // #21  The Mediator
  JUDGE_LOVER:      null,  // #22  The Reconciler

  // LOVER (Positie 2) - #23-33
  LOVER_CAREGIVER:  null,  // #23  The Soulmate
  LOVER_RULER:      null,  // #24  The Companion
  LOVER_JUDGE:      null,  // #25  The Betrothed
  LOVER_TRICKSTER:  null,  // #26  The Wingman
  LOVER_OUTLAW:     null,  // #27  The Libertine
  LOVER_SAGE:       null,  // #28  The Poet
  LOVER_ARTIST:     null,  // #29  The Muse
  LOVER_INNOCENT:   null,  // #30  The Votary
  LOVER_EXPLORER:   null,  // #31  The Moth
  LOVER_HERO:       null,  // #32  The Romantic
  LOVER_MAGICIAN:   null,  // #33  The Spellbinder

  // CAREGIVER (Positie 3) - #34-44
  CAREGIVER_LOVER:      null,  // #34  The Healer
  CAREGIVER_RULER:      null,  // #35  The Patriarch/Matriarch
  CAREGIVER_JUDGE:      null,  // #36  The Defender
  CAREGIVER_OUTLAW:     null,  // #37  The Cultivator
  CAREGIVER_TRICKSTER:  null,  // #38  The Empath
  CAREGIVER_SAGE:       null,  // #39  The Therapist
  CAREGIVER_ARTIST:     null,  // #40  The Restorer
  CAREGIVER_EXPLORER:   null,  // #41  The Pilgrim
  CAREGIVER_INNOCENT:   null,  // #42  The Devotee
  CAREGIVER_HERO:       null,  // #43  The Guardian
  CAREGIVER_MAGICIAN:   null,  // #44  The Warden

  // INNOCENT (Positie 4) - #45-55
  INNOCENT_EXPLORER:   null,  // #45  The Saint
  INNOCENT_RULER:      null,  // #46  The Shepherd
  INNOCENT_JUDGE:      null,  // #47  The Traditionalist
  INNOCENT_TRICKSTER:  null,  // #48  The Free Spirit
  INNOCENT_OUTLAW:     null,  // #49  The Torchbearer
  INNOCENT_SAGE:       null,  // #50  The Disciple
  INNOCENT_ARTIST:     null,  // #51  The Utopian
  INNOCENT_HERO:       null,  // #52  The Pioneer
  INNOCENT_MAGICIAN:   null,  // #53  The Illuminator
  INNOCENT_CAREGIVER:  null,  // #54  The Samaritan
  INNOCENT_LOVER:      null,  // #55  The Sweetheart

  // EXPLORER (Positie 5) - #56-66
  EXPLORER_INNOCENT:   null,  // #56  The Navigator
  EXPLORER_RULER:      null,  // #57  The Networker
  EXPLORER_JUDGE:      null,  // #58  The Surveyor
  EXPLORER_OUTLAW:     null,  // #59  The Innovator
  EXPLORER_TRICKSTER:  null,  // #60  The Scout
  EXPLORER_SAGE:       null,  // #61  The Philosopher
  EXPLORER_ARTIST:     null,  // #62  The Bard
  EXPLORER_HERO:       null,  // #63  The Sailor
  EXPLORER_MAGICIAN:   null,  // #64  The Nomad
  EXPLORER_LOVER:      null,  // #65  The Stargazer
  EXPLORER_CAREGIVER:  null,  // #66  The Pathfinder

  // HERO (Positie 11) - #67-77
  HERO_MAGICIAN:   null,  // #67  The Legend
  HERO_RULER:      null,  // #68  The Conqueror
  HERO_JUDGE:      null,  // #69  The Templar
  HERO_OUTLAW:     null,  // #70  The Raider
  HERO_TRICKSTER:  null,  // #71  The Spy
  HERO_SAGE:       null,  // #72  The Strategist
  HERO_ARTIST:     null,  // #73  The Duelist
  HERO_EXPLORER:   null,  // #74  The Astronaut
  HERO_INNOCENT:   null,  // #75  The Crusader
  HERO_CAREGIVER:  null,  // #76  The Protector
  HERO_LOVER:      null,  // #77  The Chevalier

  // MAGICIAN (Positie 10) - #78-88
  MAGICIAN_HERO:       null,  // #78  The Alchemist
  MAGICIAN_RULER:      null,  // #79  The Engineer
  MAGICIAN_JUDGE:      null,  // #80  The Reckoner
  MAGICIAN_OUTLAW:     null,  // #81  The Protagonist
  MAGICIAN_TRICKSTER:  null,  // #82  The Enchanter
  MAGICIAN_SAGE:       null,  // #83  The Sorcerer
  MAGICIAN_ARTIST:     null,  // #84  The Performer
  MAGICIAN_INNOCENT:   null,  // #85  The Catalyst
  MAGICIAN_EXPLORER:   null,  // #86  The Trailblazer
  MAGICIAN_LOVER:      null,  // #87  The Shaman
  MAGICIAN_CAREGIVER:  null,  // #88  The Redeemer

  // OUTLAW (Positie 6) - #89-99
  OUTLAW_TRICKSTER:  null,  // #89  The Anarchist
  OUTLAW_RULER:      null,  // #90  The Maverick
  OUTLAW_JUDGE:      null,  // #91  The Contrarian
  OUTLAW_CAREGIVER:  null,  // #92  The Liberator
  OUTLAW_LOVER:      null,  // #93  The Instigator
  OUTLAW_SAGE:       null,  // #94  The Iconoclast
  OUTLAW_ARTIST:     null,  // #95  The Punk
  OUTLAW_EXPLORER:   null,  // #96  The Renegade
  OUTLAW_INNOCENT:   null,  // #97  The Idealist
  OUTLAW_MAGICIAN:   null,  // #98  The Revolutionary
  OUTLAW_HERO:       null,  // #99  The Ronin

  // TRICKSTER (Positie 7) - #100-110
  TRICKSTER_OUTLAW:     null,  // #100 The Fool
  TRICKSTER_RULER:      null,  // #101 The Gatecrasher
  TRICKSTER_JUDGE:      null,  // #102 The Devil's Advocate
  TRICKSTER_LOVER:      null,  // #103 The Seducer
  TRICKSTER_CAREGIVER:  null,  // #104 The Chameleon
  TRICKSTER_SAGE:       null,  // #105 The Riddler
  TRICKSTER_ARTIST:     null,  // #106 The Impressionist
  TRICKSTER_EXPLORER:   null,  // #107 The Free-runner
  TRICKSTER_INNOCENT:   null,  // #108 The Joyrider
  TRICKSTER_MAGICIAN:   null,  // #109 The Shapeshifter
  TRICKSTER_HERO:       null,  // #110 The Ace

  // SAGE (Positie 8) - #111-121
  SAGE_ARTIST:     null,  // #111 The Developer
  SAGE_RULER:      null,  // #112 The Analyst
  SAGE_JUDGE:      null,  // #113 The Skeptic
  SAGE_CAREGIVER:  null,  // #114 The Mentor
  SAGE_LOVER:      null,  // #115 The Guru
  SAGE_OUTLAW:     null,  // #116 The Hermit
  SAGE_TRICKSTER:  null,  // #117 The Theorist
  SAGE_INNOCENT:   null,  // #118 The Enlightened
  SAGE_EXPLORER:   null,  // #119 The Scholar
  SAGE_HERO:       null,  // #120 The Detective
  SAGE_MAGICIAN:   null,  // #121 The Freemason

  // ARTIST (Positie 9) - #122-132
  ARTIST_SAGE:       null,  // #122 The Demiurge
  ARTIST_RULER:      null,  // #123 The Architect
  ARTIST_JUDGE:      null,  // #124 The Editor
  ARTIST_LOVER:      null,  // #125 The Troubadour
  ARTIST_CAREGIVER:  null,  // #126 The Storyteller
  ARTIST_TRICKSTER:  null,  // #127 The Oracle
  ARTIST_OUTLAW:     null,  // #128 The Provocateur
  ARTIST_EXPLORER:   null,  // #129 The Visionary
  ARTIST_INNOCENT:   null,  // #130 The Prodigy
  ARTIST_MAGICIAN:   null,  // #131 The Craftsman
  ARTIST_HERO:       null,  // #132 The Forgemaster
};

/**
 * Get the archetype portrait for a main + support combination.
 *
 * @param {string} mainKey - e.g. 'SAGE'
 * @param {string} support - support ARCHETYPE key ('OUTLAW', canonical for the
 *                           132-matrix) or a legacy support GROUP ('CHAOS')
 * @returns {string|null} Image path, or null while the artwork is unavailable
 */
export function getArchetypeImage(mainKey, support) {
  const key = resolveExtendedKey(mainKey, support);
  return (key && ARCHETYPE_IMAGES[key]) || null;
}

/**
 * Get a portrait by the combined lookup key directly.
 * Accepts a 132-matrix key ('SAGE_OUTLAW') or a legacy group key ('SAGE_CHAOS').
 * @param {string} lookupKey
 * @returns {string|null}
 */
export function getArchetypeImageByKey(lookupKey) {
  if (!lookupKey) return null;
  const k = String(lookupKey).toUpperCase();
  if (ARCHETYPE_IMAGES[k]) return ARCHETYPE_IMAGES[k];
  const sep = k.lastIndexOf('_');
  return sep > 0 ? getArchetypeImage(k.slice(0, sep), k.slice(sep + 1)) : null;
}

/**
 * Reverse lookup: the display NAME of an extended archetype -> its key.
 * Accepts either the English ("The Mentor") or Dutch ("De Mentor") name, since a
 * stored profile only keeps the resolved name string, not the key.
 *
 * This is NOT artwork and stays live while the portraits are gone - the boot
 * Levensles (LoginPage) resolves a stored name back to its combination with it.
 */
const NAME_TO_KEY = {};
const claim = (name, key) => {
  const k = String(name || '').trim().toLowerCase();
  // First claim wins, so a name shared by two combinations always resolves to the
  // same one (roster order) instead of depending on iteration order. English names
  // are unique across all 132; the Dutch canon currently shares 'De Beschermer'
  // between CAREGIVER_HERO (The Guardian) and HERO_CAREGIVER (The Protector).
  if (k && !NAME_TO_KEY[k]) NAME_TO_KEY[k] = key;
};
for (const [key, name] of Object.entries(EXTENDED_ARCHETYPES)) claim(name, key);
for (const [key, name] of Object.entries(EXTENDED_ARCHETYPES_NL)) claim(name, key);

/**
 * @param {string} name - e.g. 'The Mentor' or 'De Mentor'
 * @returns {string|null} portrait path, or null while the artwork is unavailable
 */
export function getArchetypeImageByName(name) {
  if (!name) return null;
  const key = NAME_TO_KEY[String(name).trim().toLowerCase()];
  return key ? getArchetypeImageByKey(key) : null;
}

/**
 * Resolve a stored extended-archetype display name (EN or NL) to its
 * MAIN_SUPPORTARCHETYPE key - e.g. 'The Mediator' / 'De Bemiddelaar' -> 'JUDGE_CAREGIVER'.
 * @param {string} name
 * @returns {string|null}
 */
export function getArchetypeKeyByName(name) {
  if (!name) return null;
  return NAME_TO_KEY[String(name).trim().toLowerCase()] || null;
}

export default ARCHETYPE_IMAGES;
