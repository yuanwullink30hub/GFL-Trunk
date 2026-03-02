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
import imgArbiter          from '../../images/Import ready/Arbiter.PNG';
import imgMediator         from '../../images/Import ready/Mediator.png';
import imgExaminer         from '../../images/Import ready/Examiner.png';
import imgWhistleblower    from '../../images/Import ready/Whistleblower.png';
import imgCritic           from '../../images/Import ready/Critic.PNG';
import imgAvenger          from '../../images/Import ready/Avenger.png';

// ── LOVER images ───────────────────────────────────────────
import imgSoulmate         from '../../images/Import ready/Soulmate.png';
import imgPoet             from '../../images/Import ready/Poet.png';
import imgSeducer          from '../../images/Import ready/Seducer.PNG';
import imgMystic           from '../../images/Import ready/Mystic.png';
import imgRomantic         from '../../images/Import ready/Romantist.png';
import imgCompanion        from '../../images/Import ready/Companion.png';

// ── CAREGIVER images ───────────────────────────────────────
import imgHealer           from '../../images/Import ready/Healer.PNG';
import imgPathfinder       from '../../images/Import ready/Pathfinder.png';
import imgCultivator       from '../../images/Import ready/Cultivator.PNG';
import imgTherapist        from '../../images/Import ready/Therapist.PNG';
import imgProtector        from '../../images/Import ready/Protector.png';
import imgAdvocate         from '../../images/Import ready/Advocate.PNG';

// ── INNOCENT images ────────────────────────────────────────
import imgSaint            from '../../images/Import ready/Saint.png';
import imgFreeSpirit       from '../../images/Import ready/Free spirit.PNG';
import imgDisciple         from '../../images/Import ready/Disciple.png';
import imgPioneer          from '../../images/Import ready/Pioneer.png';
import imgShepherd         from '../../images/Import ready/Shepherd.png';
import imgSamaritan        from '../../images/Import ready/Samaritan.png';

// ── EXPLORER images ────────────────────────────────────────
import imgNavigator        from '../../images/Import ready/Navigator.png';
import imgInnovator        from '../../images/Import ready/Innovator.png';
import imgScholar          from '../../images/Import ready/Scholar.png';
import imgSailor           from '../../images/Import ready/Sailor.png';
import imgScout            from '../../images/Import ready/Scout.PNG';
import imgNetworker        from '../../images/Import ready/Networker.png';

// ── OUTLAW images ──────────────────────────────────────────
import imgAnarchist        from '../../images/Import ready/Anarchist.png';
import imgIconoclast       from '../../images/Import ready/Iconoclast.PNG';
import imgRevolutionary    from '../../images/Import ready/Revolutionary.png';
import imgReformer         from '../../images/Import ready/Reformer.png';
import imgLiberator        from '../../images/Import ready/Liberator.png';
import imgRenegade         from '../../images/Import ready/Renegade.PNG';

// ── TRICKSTER images ───────────────────────────────────────
import imgFool             from '../../images/Import ready/Fool.png';
import imgComedian         from '../../images/Import ready/Comedian.PNG';
import imgSaboteur         from '../../images/Import ready/Saboteur copy.png';
import imgJester           from '../../images/Import ready/Jester.PNG';
import imgClown            from '../../images/Import ready/Clown.png';
import imgShapeshifter     from '../../images/Import ready/Shapeshifter.png';

// ── SAGE images ────────────────────────────────────────────
import imgEnlightened      from '../../images/Import ready/Enlightened.PNG';
import imgDetective        from '../../images/Import ready/Detective.PNG';
import imgAnalyst          from '../../images/Import ready/Analyst.png';
import imgMentor           from '../../images/Import ready/Mentor.png';
import imgDreamer          from '../../images/Import ready/Dreamer.PNG';
import imgHermit           from '../../images/Import ready/Hermit.PNG';

// ── ARTIST images ──────────────────────────────────────────
import imgDemiurge         from '../../images/Import ready/Demiurge.png';
import imgForgemaster      from '../../images/Import ready/Forgemaster.png';
import imgArchitect        from '../../images/Import ready/Architect.png';
import imgStoryteller      from '../../images/Import ready/Storyteller.PNG';
import imgVisionary        from '../../images/Import ready/Visionair.png';
import imgIllusionist      from '../../images/Import ready/Illusionist.png';

// ── MAGICIAN images ────────────────────────────────────────
import imgAlchemist        from '../../images/Import ready/Alchemist.png';
import imgEngineer         from '../../images/Import ready/Engineer.png';
import imgShaman           from '../../images/Import ready/Shaman.png';
import imgOracle           from '../../images/Import ready/Oracle.png';
import imgEnchanter        from '../../images/Import ready/Enchanter.png';
import imgSorcerer         from '../../images/Import ready/Sorcerer.PNG';

// ── HERO images ────────────────────────────────────────────
import imgLegend           from '../../images/Import ready/Legend.PNG';
import imgCommander        from '../../images/Import ready/Commander.png';
import imgGuardian         from '../../images/Import ready/Guardian.png';
import imgInventor         from '../../images/Import ready/Inventor.png';
import imgRonin            from '../../images/Import ready/Ronin.PNG';
import imgStrategist       from '../../images/Import ready/Strategist.PNG';

// ── RULER images ───────────────────────────────────────────
import imgEmperor          from '../../images/Import ready/Emperor-Emperess.png';
import imgPatriarch        from '../../images/Import ready/Patriarch-Matriarch.png';
import imgEntrepreneur     from '../../images/Import ready/Entrepeneur.PNG';
import imgMaverick         from '../../images/Import ready/Maverick.png';
import imgPhilosopher      from '../../images/Import ready/Philosopher king.png';
import imgConqueror        from '../../images/Import ready/Conqueror.png';


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
