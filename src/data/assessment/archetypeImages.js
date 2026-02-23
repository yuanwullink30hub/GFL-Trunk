/**
 * Archetype Image Map
 * -------------------
 * Maps each of the 72 extended archetype keys (MAIN_SUPPORTGROUP)
 * to their corresponding portrait image.
 *
 * All 72 archetypes now have unique names and unique images.
 * Pioneer (INNOCENT_ACTION) image is pending.
 */

// ── SAGE images ────────────────────────────────────────────
import imgEnlightened      from '../../images/Import ready/Enlightened.PNG';
import imgDetective        from '../../images/Import ready/Detective.PNG';
import imgMentor           from '../../images/Import ready/Mentor.png';
import imgAlchemist        from '../../images/Import ready/Alchemist.png';
import imgAnalyst          from '../../images/Import ready/Analyst.png';
import imgHermit           from '../../images/Import ready/Hermit.PNG';

// ── HERO images ────────────────────────────────────────────
import imgLegend           from '../../images/Import ready/Legend.PNG';
import imgStrategist       from '../../images/Import ready/Strategist.PNG';
import imgGuardian         from '../../images/Import ready/Guardian.png';
import imgInventor         from '../../images/Import ready/Inventor.png';
import imgCommander        from '../../images/Import ready/Commander.png';
import imgPaladin          from '../../images/Import ready/Paladin.png';

// ── LOVER images ───────────────────────────────────────────
import imgSoulmate         from '../../images/Import ready/Soulmate.png';
import imgMystic           from '../../images/Import ready/Mystic.png';
import imgHedonist         from '../../images/Import ready/Hedonist.PNG';
import imgPoet             from '../../images/Import ready/Poet.png';
import imgPartner          from '../../images/Import ready/Partner.png';
import imgCompanion        from '../../images/Import ready/Companion.png';

// ── ARTIST images ──────────────────────────────────────────
import imgDemiurge         from '../../images/Import ready/Demiurge.png';
import imgVisionair        from '../../images/Import ready/Visionair.png';
import imgEngineer         from '../../images/Import ready/Engineer.png';
import imgStoryteller      from '../../images/Import ready/Storyteller.PNG';
import imgArchitect        from '../../images/Import ready/Architect.png';
import imgDreamer          from '../../images/Import ready/Dreamer.PNG';

// ── RULER images ───────────────────────────────────────────
import imgEmperor          from '../../images/Import ready/Emperor-Emperess.png';
import imgPhilosopher      from '../../images/Import ready/Philosopher king.png';
import imgConqueror        from '../../images/Import ready/Conqueror.png';
import imgPatriarch        from '../../images/Import ready/Patriarch-Matriarch.png';
import imgEntrepreneur     from '../../images/Import ready/Entrepeneur.PNG';
import imgSovereign        from '../../images/Import ready/Sovereign.png';

// ── INNOCENT images ────────────────────────────────────────
import imgSaint            from '../../images/Import ready/Saint.png';
import imgDisciple         from '../../images/Import ready/Disciple.png';
import imgChild            from '../../images/Import ready/Child.png';
import imgUtopian          from '../../images/Import ready/Utopian.png';
import imgPioneer           from '../../images/Import ready/Pioneer.png';
import imgTraditionalist   from '../../images/Import ready/Traditionalist.png';

// ── EXPLORER images ────────────────────────────────────────
import imgNavigator        from '../../images/Import ready/Navigator.png';
import imgWanderer         from '../../images/Import ready/Wanderer.png';
import imgNetworker        from '../../images/Import ready/Networker.png';
import imgInnovator        from '../../images/Import ready/Innovator.png';
import imgScout            from '../../images/Import ready/Scout.PNG';
import imgScholar          from '../../images/Import ready/Scholar.png';

// ── OUTLAW images ──────────────────────────────────────────
import imgAnarchist        from '../../images/Import ready/Anarchist.png';
import imgIconoclast       from '../../images/Import ready/Iconoclast.PNG';
import imgLiberator        from '../../images/Import ready/Liberator.png';
import imgProvocateur      from '../../images/Import ready/Provocateur.PNG';
import imgReformer         from '../../images/Import ready/Reformer.png';
import imgRevolutionary    from '../../images/Import ready/Revolutionary.png';

// ── CAREGIVER images ───────────────────────────────────────
import imgHealer           from '../../images/Import ready/Healer.PNG';
import imgTherapist        from '../../images/Import ready/Therapist.PNG';
import imgProtector        from '../../images/Import ready/Protector.png';
import imgCultivator       from '../../images/Import ready/Cultivator.PNG';
import imgAdvocate         from '../../images/Import ready/Advocate.PNG';
import imgSamaritan        from '../../images/Import ready/Samaritan.png';

// ── MAGICIAN images ────────────────────────────────────────
import imgIllusionist      from '../../images/Import ready/Illusionist.png';
import imgShaman           from '../../images/Import ready/Shaman.png';
import imgForgemaster      from '../../images/Import ready/Forgemaster.png';
import imgEnchanter        from '../../images/Import ready/Enchanter.png';
import imgOracle           from '../../images/Import ready/Oracle.png';
import imgSorcerer         from '../../images/Import ready/Sorcerer.PNG';

// ── JUDGE images ───────────────────────────────────────────
import imgArbiter          from '../../images/Import ready/Arbiter.PNG';
import imgCritic           from '../../images/Import ready/Critic.PNG';
import imgAvenger          from '../../images/Import ready/Avenger.png';
import imgMediator         from '../../images/Import ready/Mediator.png';
import imgEvaluator        from '../../images/Import ready/Evaluator.png';
import imgShepherd         from '../../images/Import ready/Shepherd.png';

// ── TRICKSTER images ───────────────────────────────────────
import imgFool             from '../../images/Import ready/Fool.png';
import imgComedian         from '../../images/Import ready/Comedian.PNG';
import imgSaboteur         from '../../images/Import ready/Saboteur copy.png';
import imgClown            from '../../images/Import ready/Clown.png';
import imgShapeshifter     from '../../images/Import ready/Shapeshifter.png';
import imgJester           from '../../images/Import ready/Jester.PNG';


/**
 * Lookup table: extended-archetype key → imported image.
 *
 * Key format is `${MAIN}_${SUPPORT_GROUP}`, e.g. SAGE_CREATIVE.
 * All 72 archetypes now have unique names and unique images.
 * All 72 archetypes have images.
 */
const ARCHETYPE_IMAGES = {
  // ── SAGE (6/6) ─────────────────────────────────────────
  SAGE_WISDOM:         imgEnlightened,    // The Enlightened
  SAGE_ACTION:         imgDetective,      // The Detective
  SAGE_RELATIONAL:     imgMentor,         // The Mentor
  SAGE_CREATIVE:       imgAlchemist,      // The Alchemist
  SAGE_RULING:         imgAnalyst,        // The Analyst
  SAGE_SPIRIT:         imgHermit,         // The Hermit

  // ── HERO (6/6) ─────────────────────────────────────────
  HERO_ACTION:         imgLegend,         // The Legend
  HERO_WISDOM:         imgStrategist,     // The Strategist
  HERO_RELATIONAL:     imgGuardian,       // The Guardian
  HERO_CREATIVE:       imgInventor,       // The Inventor
  HERO_RULING:         imgCommander,      // The Commander
  HERO_SPIRIT:         imgPaladin,        // The Paladin

  // ── LOVER (6/6) ────────────────────────────────────────
  LOVER_RELATIONAL:    imgSoulmate,       // The Soulmate
  LOVER_WISDOM:        imgMystic,         // The Mystic
  LOVER_ACTION:        imgHedonist,       // The Hedonist
  LOVER_CREATIVE:      imgPoet,           // The Poet
  LOVER_RULING:        imgPartner,        // The Partner
  LOVER_SPIRIT:        imgCompanion,      // The Companion

  // ── ARTIST (6/6) ───────────────────────────────────────
  ARTIST_CREATIVE:     imgDemiurge,       // The Demiurge
  ARTIST_WISDOM:       imgVisionair,      // The Visionary
  ARTIST_ACTION:       imgEngineer,       // The Engineer
  ARTIST_RELATIONAL:   imgStoryteller,    // The Storyteller
  ARTIST_RULING:       imgArchitect,      // The Architect
  ARTIST_SPIRIT:       imgDreamer,        // The Dreamer

  // ── RULER (6/6) ────────────────────────────────────────
  RULER_RULING:        imgEmperor,        // The Emperor
  RULER_WISDOM:        imgPhilosopher,    // The Philosopher-King
  RULER_ACTION:        imgConqueror,      // The Conqueror
  RULER_RELATIONAL:    imgPatriarch,      // The Patriarch
  RULER_CREATIVE:      imgEntrepreneur,   // The Entrepreneur
  RULER_SPIRIT:        imgSovereign,      // The Sovereign

  // ── INNOCENT (6/6) ──────────────────────────────────────
  INNOCENT_SPIRIT:     imgSaint,          // The Saint
  INNOCENT_WISDOM:     imgDisciple,       // The Disciple
  INNOCENT_ACTION:     imgPioneer,        // The Pioneer
  INNOCENT_RELATIONAL: imgChild,          // The Child
  INNOCENT_CREATIVE:   imgUtopian,        // The Utopian
  INNOCENT_RULING:     imgTraditionalist, // The Traditionalist

  // ── EXPLORER (6/6) ────────────────────────────────────
  EXPLORER_WISDOM:     imgNavigator,      // The Navigator
  EXPLORER_ACTION:     imgWanderer,       // The Wanderer
  EXPLORER_RELATIONAL: imgNetworker,      // The Networker
  EXPLORER_CREATIVE:   imgInnovator,      // The Innovator
  EXPLORER_RULING:     imgScout,          // The Scout
  EXPLORER_SPIRIT:     imgScholar,        // The Scholar

  // ── OUTLAW (6/6) ──────────────────────────────────────
  OUTLAW_ACTION:       imgAnarchist,      // The Anarchist
  OUTLAW_WISDOM:       imgIconoclast,     // The Iconoclast
  OUTLAW_RELATIONAL:   imgLiberator,      // The Liberator
  OUTLAW_CREATIVE:     imgProvocateur,    // The Provocateur
  OUTLAW_RULING:       imgReformer,       // The Reformer
  OUTLAW_SPIRIT:       imgRevolutionary,  // The Revolutionary

  // ── CAREGIVER (6/6) ───────────────────────────────────
  CAREGIVER_RELATIONAL:imgHealer,         // The Healer
  CAREGIVER_WISDOM:    imgTherapist,      // The Therapist
  CAREGIVER_ACTION:    imgProtector,      // The Protector
  CAREGIVER_CREATIVE:  imgCultivator,     // The Cultivator
  CAREGIVER_RULING:    imgAdvocate,       // The Advocate
  CAREGIVER_SPIRIT:    imgSamaritan,      // The Samaritan

  // ── MAGICIAN (6/6) ────────────────────────────────────
  MAGICIAN_CREATIVE:   imgIllusionist,    // The Illusionist
  MAGICIAN_WISDOM:     imgShaman,         // The Shaman
  MAGICIAN_ACTION:     imgForgemaster,    // The Forgemaster
  MAGICIAN_RELATIONAL: imgEnchanter,      // The Enchanter
  MAGICIAN_RULING:     imgOracle,         // The Oracle
  MAGICIAN_SPIRIT:     imgSorcerer,       // The Sorcerer

  // ── JUDGE (6/6) ───────────────────────────────────────
  JUDGE_RULING:        imgArbiter,        // The Arbiter
  JUDGE_WISDOM:        imgCritic,         // The Critic
  JUDGE_ACTION:        imgAvenger,        // The Avenger
  JUDGE_RELATIONAL:    imgMediator,       // The Mediator
  JUDGE_CREATIVE:      imgEvaluator,      // The Evaluator
  JUDGE_SPIRIT:        imgShepherd,       // The Shepherd

  // ── TRICKSTER (6/6) ───────────────────────────────────
  TRICKSTER_SPIRIT:    imgFool,           // The Fool
  TRICKSTER_WISDOM:    imgComedian,       // The Comedian
  TRICKSTER_ACTION:    imgSaboteur,       // The Saboteur
  TRICKSTER_RELATIONAL:imgClown,          // The Clown
  TRICKSTER_CREATIVE:  imgShapeshifter,   // The Shapeshifter
  TRICKSTER_RULING:    imgJester,         // The Jester
};

/**
 * Get the archetype portrait image for a given extended-archetype key.
 *
 * @param {string} mainKey     – e.g. 'SAGE'
 * @param {string} supportGroup – e.g. 'CREATIVE'  (the functional group, NOT the support archetype key)
 * @returns {string|null} Imported image path, or null if no image is available
 */
export function getArchetypeImage(mainKey, supportGroup) {
  const lookupKey = `${mainKey}_${supportGroup}`;
  return ARCHETYPE_IMAGES[lookupKey] || null;
}

/**
 * Get archetype image by the combined lookup key directly.
 * @param {string} lookupKey – e.g. 'SAGE_CREATIVE'
 * @returns {string|null}
 */
export function getArchetypeImageByKey(lookupKey) {
  return ARCHETYPE_IMAGES[lookupKey] || null;
}

export default ARCHETYPE_IMAGES;
