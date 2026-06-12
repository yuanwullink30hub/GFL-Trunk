/**
 * Archetype Image Map
 * -------------------
 * Maps each of the 72 extended archetype keys (MAIN_SUPPORTGROUP)
 * to their corresponding portrait image.
 *
 * Support Groups (Neurobiological):
 *   RULING, RELATIONAL, SEEKER, CHAOS, ABSTRACT, AGENCY
 *
 * 12 Main × 6 Support Groups = 72 entries.
 * All 72 archetypes have unique names and unique images.
 */

// ── JUDGE images ───────────────────────────────────────────
const imgArbiter = '/images/Import ready/Arbiter.PNG';
const imgMediator = '/images/Import ready/Mediator.png';
const imgExaminer = '/images/Import ready/Examiner.png';
const imgWhistleblower = '/images/Import ready/Whistleblower.png';
const imgCritic = '/images/Import ready/Critic.PNG';
const imgAvenger = '/images/Import ready/Avenger.png';

// ── LOVER images ───────────────────────────────────────────
const imgSoulmate = '/images/Import ready/Soulmate.png';
const imgPoet = '/images/Import ready/Poet.png';
const imgSeducer = '/images/Import ready/Seducer.PNG';
const imgMystic = '/images/Import ready/Mystic.png';
const imgRomantic = '/images/Import ready/Romantist.png';
const imgCompanion = '/images/Import ready/Companion.png';

// ── CAREGIVER images ───────────────────────────────────────
const imgHealer = '/images/Import ready/Healer.PNG';
const imgPathfinder = '/images/Import ready/Pathfinder.png';
const imgCultivator = '/images/Import ready/Cultivator.png';
const imgTherapist = '/images/Import ready/Therapist.PNG';
const imgProtector = '/images/Import ready/Protector.png';
const imgAdvocate = '/images/Import ready/Advocate.PNG';

// ── INNOCENT images ────────────────────────────────────────
const imgSaint = '/images/Import ready/Saint.png';
const imgFreeSpirit = '/images/Import ready/Free spirit.PNG';
const imgDisciple = '/images/Import ready/Disciple.png';
const imgPioneer = '/images/Import ready/Pioneer.png';
const imgShepherd = '/images/Import ready/Shepherd.png';
const imgSamaritan = '/images/Import ready/Samaritan.png';

// ── EXPLORER images ────────────────────────────────────────
const imgNavigator = '/images/Import ready/Navigator.png';
const imgInnovator = '/images/Import ready/Innovator.png';
const imgScholar = '/images/Import ready/Scholar.png';
const imgSailor = '/images/Import ready/Sailor.png';
const imgScout = '/images/Import ready/Scout.PNG';
const imgNetworker = '/images/Import ready/Networker.png';

// ── OUTLAW images ──────────────────────────────────────────
const imgAnarchist = '/images/Import ready/Anarchist.png';
const imgIconoclast = '/images/Import ready/Iconoclast.PNG';
const imgRevolutionary = '/images/Import ready/Revolutionary.png';
const imgReformer = '/images/Import ready/Reformer.png';
const imgLiberator = '/images/Import ready/Liberator.png';
const imgRenegade = '/images/Import ready/Renegade.PNG';

// ── TRICKSTER images ───────────────────────────────────────
const imgFool = '/images/Import ready/Fool.png';
const imgComedian = '/images/Import ready/Comedian.PNG';
const imgSaboteur = '/images/Import ready/Saboteur copy.png';
const imgJester = '/images/Import ready/Jester.PNG';
const imgClown = '/images/Import ready/Clown.png';
const imgShapeshifter = '/images/Import ready/Shapeshifter.png';

// ── SAGE images ────────────────────────────────────────────
const imgEnlightened = '/images/Import ready/Enlightened.PNG';
const imgDetective = '/images/Import ready/Detective.PNG';
const imgAnalyst = '/images/Import ready/Analyst.png';
const imgMentor = '/images/Import ready/Mentor.png';
const imgDreamer = '/images/Import ready/Dreamer.PNG';
const imgHermit = '/images/Import ready/Hermit.PNG';

// ── ARTIST images ──────────────────────────────────────────
const imgDemiurge = '/images/Import ready/Demiurge.png';
const imgForgemaster = '/images/Import ready/Forgemaster.png';
const imgArchitect = '/images/Import ready/Architect.png';
const imgStoryteller = '/images/Import ready/Storyteller.PNG';
const imgVisionary = '/images/Import ready/Visionair.png';
const imgIllusionist = '/images/Import ready/Illusionist.png';

// ── MAGICIAN images ────────────────────────────────────────
const imgAlchemist = '/images/Import ready/Alchemist.png';
const imgEngineer = '/images/Import ready/Engineer.png';
const imgShaman = '/images/Import ready/Shaman.png';
const imgOracle = '/images/Import ready/Oracle.png';
const imgEnchanter = '/images/Import ready/Enchanter.png';
const imgSorcerer = '/images/Import ready/Sorcerer.PNG';

// ── HERO images ────────────────────────────────────────────
const imgLegend = '/images/Import ready/Legend.PNG';
const imgCommander = '/images/Import ready/Commander.png';
const imgGuardian = '/images/Import ready/Guardian.png';
const imgInventor = '/images/Import ready/Inventor.png';
const imgRonin = '/images/Import ready/Ronin.PNG';
const imgStrategist = '/images/Import ready/Strategist.PNG';

// ── RULER images ───────────────────────────────────────────
const imgEmperor = '/images/Import ready/Emperor-Emperess.png';
const imgPatriarch = '/images/Import ready/Patriarch-Matriarch.png';
const imgEntrepreneur = '/images/Import ready/Entrepeneur.PNG';
const imgMaverick = '/images/Import ready/Maverick.png';
const imgPhilosopher = '/images/Import ready/Philosopher king.png';
const imgConqueror = '/images/Import ready/Conqueror.png';


/**
 * Lookup table: extended-archetype key → imported image.
 *
 * Key format: `${MAIN}_${SUPPORT_GROUP}`
 * Groups: RULING, RELATIONAL, SEEKER, CHAOS, ABSTRACT, AGENCY
 */
const ARCHETYPE_IMAGES = {
  // ── JUDGE (Positie 1) ──────────────────────────────────
  JUDGE_RULING:          imgArbiter,        // The Arbiter
  JUDGE_RELATIONAL:      imgMediator,       // The Mediator
  JUDGE_SEEKER:          imgExaminer,       // The Examiner
  JUDGE_CHAOS:           imgWhistleblower,  // The Whistleblower
  JUDGE_ABSTRACT:        imgCritic,         // The Critic
  JUDGE_AGENCY:          imgAvenger,        // The Avenger

  // ── LOVER (Positie 2) ──────────────────────────────────
  LOVER_RELATIONAL:      imgSoulmate,       // The Soulmate
  LOVER_SEEKER:          imgPoet,           // The Poet
  LOVER_CHAOS:           imgSeducer,        // The Seducer
  LOVER_ABSTRACT:        imgMystic,         // The Mystic
  LOVER_AGENCY:          imgRomantic,       // The Romantic
  LOVER_RULING:          imgCompanion,      // The Companion

  // ── CAREGIVER (Positie 3) ──────────────────────────────
  CAREGIVER_RELATIONAL:  imgHealer,         // The Healer
  CAREGIVER_SEEKER:      imgPathfinder,     // The Pathfinder
  CAREGIVER_CHAOS:       imgCultivator,     // The Cultivator
  CAREGIVER_ABSTRACT:    imgTherapist,      // The Therapist
  CAREGIVER_AGENCY:      imgProtector,      // The Protector
  CAREGIVER_RULING:      imgAdvocate,       // The Advocate

  // ── INNOCENT (Positie 4) ───────────────────────────────
  INNOCENT_SEEKER:       imgSaint,          // The Saint
  INNOCENT_CHAOS:        imgFreeSpirit,     // The Free Spirit
  INNOCENT_ABSTRACT:     imgDisciple,       // The Disciple
  INNOCENT_AGENCY:       imgPioneer,        // The Pioneer
  INNOCENT_RULING:       imgShepherd,       // The Shepherd
  INNOCENT_RELATIONAL:   imgSamaritan,      // The Samaritan

  // ── EXPLORER (Positie 5) ──────────────────────────────
  EXPLORER_SEEKER:       imgNavigator,      // The Navigator
  EXPLORER_CHAOS:        imgInnovator,      // The Innovator
  EXPLORER_ABSTRACT:     imgScholar,        // The Scholar
  EXPLORER_AGENCY:       imgSailor,         // The Sailor
  EXPLORER_RULING:       imgScout,          // The Scout
  EXPLORER_RELATIONAL:   imgNetworker,      // The Networker

  // ── OUTLAW (Positie 6) ────────────────────────────────
  OUTLAW_CHAOS:          imgAnarchist,      // The Anarchist
  OUTLAW_ABSTRACT:       imgIconoclast,     // The Iconoclast
  OUTLAW_AGENCY:         imgRevolutionary,  // The Revolutionary
  OUTLAW_RULING:         imgReformer,       // The Reformer
  OUTLAW_RELATIONAL:     imgLiberator,      // The Liberator
  OUTLAW_SEEKER:         imgRenegade,       // The Renegade

  // ── TRICKSTER (Positie 7) ─────────────────────────────
  TRICKSTER_CHAOS:       imgFool,           // The Fool
  TRICKSTER_ABSTRACT:    imgComedian,       // The Comedian
  TRICKSTER_AGENCY:      imgSaboteur,       // The Saboteur
  TRICKSTER_RULING:      imgJester,         // The Jester
  TRICKSTER_RELATIONAL:  imgClown,          // The Clown
  TRICKSTER_SEEKER:      imgShapeshifter,   // The Shapeshifter

  // ── SAGE (Positie 8) ──────────────────────────────────
  SAGE_ABSTRACT:         imgEnlightened,    // The Enlightened
  SAGE_AGENCY:           imgDetective,      // The Detective
  SAGE_RULING:           imgAnalyst,        // The Analyst
  SAGE_RELATIONAL:       imgMentor,         // The Mentor
  SAGE_SEEKER:           imgDreamer,        // The Dreamer
  SAGE_CHAOS:            imgHermit,         // The Hermit

  // ── ARTIST (Positie 9) ────────────────────────────────
  ARTIST_ABSTRACT:       imgDemiurge,       // The Demiurge
  ARTIST_AGENCY:         imgForgemaster,    // The Forgemaster
  ARTIST_RULING:         imgArchitect,      // The Architect
  ARTIST_RELATIONAL:     imgStoryteller,    // The Storyteller
  ARTIST_SEEKER:         imgVisionary,      // The Visionary
  ARTIST_CHAOS:          imgIllusionist,    // The Illusionist

  // ── MAGICIAN (Positie 10) ─────────────────────────────
  MAGICIAN_AGENCY:       imgAlchemist,      // The Alchemist
  MAGICIAN_RULING:       imgEngineer,       // The Engineer
  MAGICIAN_RELATIONAL:   imgShaman,         // The Shaman
  MAGICIAN_SEEKER:       imgOracle,         // The Oracle
  MAGICIAN_CHAOS:        imgEnchanter,      // The Enchanter
  MAGICIAN_ABSTRACT:     imgSorcerer,       // The Sorcerer

  // ── HERO (Positie 11) ─────────────────────────────────
  HERO_AGENCY:           imgLegend,         // The Legend
  HERO_RULING:           imgCommander,      // The Commander
  HERO_RELATIONAL:       imgGuardian,       // The Guardian
  HERO_SEEKER:           imgInventor,       // The Inventor
  HERO_CHAOS:            imgRonin,          // The Ronin
  HERO_ABSTRACT:         imgStrategist,     // The Strategist

  // ── RULER (Positie 12) ────────────────────────────────
  RULER_RULING:          imgEmperor,        // The Emperor
  RULER_RELATIONAL:      imgPatriarch,      // The Patriarch
  RULER_SEEKER:          imgEntrepreneur,   // The Entrepreneur
  RULER_CHAOS:           imgMaverick,       // The Maverick
  RULER_ABSTRACT:        imgPhilosopher,    // The Philosopher-King
  RULER_AGENCY:          imgConqueror,      // The Conqueror
};

/**
 * Get the archetype portrait image for a given extended-archetype key.
 *
 * @param {string} mainKey      – e.g. 'SAGE'
 * @param {string} supportGroup – e.g. 'ABSTRACT'  (the functional group, NOT the support archetype key)
 * @returns {string|null} Imported image path, or null if no image is available
 */
export function getArchetypeImage(mainKey, supportGroup) {
  const lookupKey = `${mainKey}_${supportGroup}`;
  return ARCHETYPE_IMAGES[lookupKey] || null;
}

/**
 * Get archetype image by the combined lookup key directly.
 * @param {string} lookupKey – e.g. 'SAGE_ABSTRACT'
 * @returns {string|null}
 */
export function getArchetypeImageByKey(lookupKey) {
  return ARCHETYPE_IMAGES[lookupKey] || null;
}

export default ARCHETYPE_IMAGES;
