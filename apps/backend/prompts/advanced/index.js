/**
 * Leerling (Level 3) — Prompt Builder
 *
 * Master-Specificatie: GardenForLife Leerling Assessment — Ontologie-Engine
 * — AI Generatieprompt (Compliance-versie)
 *
 * Builds the system prompt and user message for the Leerling tier.
 * 36 vragen × 2 picks, per-slot N/C routing, Per-Pick Geometric Bleed scoring engine.
 * Only sends the AI the data it needs for the specific user's Main + Support,
 * NOT the full 12-archetype dataset.
 */

const { formatAspectLine } = require('../../services/oceanUpload');

// ═══════════════════════════════════════════════════════════════
// STATIC REFERENCE DATA (never sent to AI — used to assemble)
// ═══════════════════════════════════════════════════════════════

const GROUP_NEURAL_FOCUS = {
  RULING:     'CEN: Externe structuur & Wet',
  RELATIONAL: 'Limbic: Emotionele fusie',
  SEEKER:     'Openness: Pure ervaring',
  CHAOS:      'Salience: Disruptie & Waarheid',
  ABSTRACT:   'DMN: Interne reflectie',
  AGENCY:     'Extraversie: Wilskracht',
};

/** Purple Line pairs — 180° shadow (position + 6) */
const PURPLE_LINE = {
  JUDGE: 'TRICKSTER', TRICKSTER: 'JUDGE',
  LOVER: 'SAGE', SAGE: 'LOVER',
  CAREGIVER: 'ARTIST', ARTIST: 'CAREGIVER',
  INNOCENT: 'MAGICIAN', MAGICIAN: 'INNOCENT',
  EXPLORER: 'HERO', HERO: 'EXPLORER',
  OUTLAW: 'RULER', RULER: 'OUTLAW',
};

/**
 * 132 Extended Archetypes matrix: MAIN_SUPPORTARCHETYPE → name.
 * Official roster per "Extended Archetypes — Official Roster (132)":
 * 12 mains × 11 support archetypes. Replaces the old 72 group-keyed matrix
 * (two supports in the same hardware group are now distinct extensions).
 */
const EXTENDED_MATRIX = {
  // Main: RULER (Positie 12) - #1-11
  RULER_JUDGE:      'Emperor',
  RULER_SAGE:       'Sovereign',
  RULER_ARTIST:     'Designer',
  RULER_EXPLORER:   'Entrepreneur',
  RULER_INNOCENT:   'Founder',
  RULER_OUTLAW:     'Reformer',
  RULER_TRICKSTER:  'Puppeteer',
  RULER_HERO:       'Commander',
  RULER_MAGICIAN:   'Overlord',
  RULER_CAREGIVER:  'Advocate',
  RULER_LOVER:      'Patron',

  // Main: JUDGE (Positie 1) - #12-22
  JUDGE_RULER:      'Arbiter',
  JUDGE_OUTLAW:     'Whistleblower',
  JUDGE_TRICKSTER:  'Inquisitor',
  JUDGE_SAGE:       'Critic',
  JUDGE_ARTIST:     'Appraiser',
  JUDGE_INNOCENT:   'Examiner',
  JUDGE_EXPLORER:   'Auditor',
  JUDGE_HERO:       'Avenger',
  JUDGE_MAGICIAN:   'Enforcer',
  JUDGE_CAREGIVER:  'Mediator',
  JUDGE_LOVER:      'Reconciler',

  // Main: LOVER (Positie 2) - #23-33
  LOVER_CAREGIVER:  'Soulmate',
  LOVER_RULER:      'Companion',
  LOVER_JUDGE:      'Betrothed',
  LOVER_TRICKSTER:  'Wingman',
  LOVER_OUTLAW:     'Libertine',
  LOVER_SAGE:       'Poet',
  LOVER_ARTIST:     'Muse',
  LOVER_INNOCENT:   'Votary',
  LOVER_EXPLORER:   'Moth',
  LOVER_HERO:       'Romantic',
  LOVER_MAGICIAN:   'Spellbinder',

  // Main: CAREGIVER (Positie 3) - #34-44
  CAREGIVER_LOVER:      'Healer',
  CAREGIVER_RULER:      'Patriarch / Matriarch',
  CAREGIVER_JUDGE:      'Defender',
  CAREGIVER_OUTLAW:     'Cultivator',
  CAREGIVER_TRICKSTER:  'Empath',
  CAREGIVER_SAGE:       'Therapist',
  CAREGIVER_ARTIST:     'Restorer',
  CAREGIVER_EXPLORER:   'Pilgrim',
  CAREGIVER_INNOCENT:   'Devotee',
  CAREGIVER_HERO:       'Guardian',
  CAREGIVER_MAGICIAN:   'Warden',

  // Main: INNOCENT (Positie 4) - #45-55
  INNOCENT_EXPLORER:   'Saint',
  INNOCENT_RULER:      'Shepherd',
  INNOCENT_JUDGE:      'Traditionalist',
  INNOCENT_TRICKSTER:  'Free Spirit',
  INNOCENT_OUTLAW:     'Torchbearer',
  INNOCENT_SAGE:       'Disciple',
  INNOCENT_ARTIST:     'Utopian',
  INNOCENT_HERO:       'Pioneer',
  INNOCENT_MAGICIAN:   'Illuminator',
  INNOCENT_CAREGIVER:  'Samaritan',
  INNOCENT_LOVER:      'Sweetheart',

  // Main: EXPLORER (Positie 5) - #56-66
  EXPLORER_INNOCENT:   'Navigator',
  EXPLORER_RULER:      'Networker',
  EXPLORER_JUDGE:      'Surveyor',
  EXPLORER_OUTLAW:     'Innovator',
  EXPLORER_TRICKSTER:  'Scout',
  EXPLORER_SAGE:       'Philosopher',
  EXPLORER_ARTIST:     'Bard',
  EXPLORER_HERO:       'Sailor',
  EXPLORER_MAGICIAN:   'Nomad',
  EXPLORER_LOVER:      'Stargazer',
  EXPLORER_CAREGIVER:  'Pathfinder',

  // Main: HERO (Positie 11) - #67-77
  HERO_MAGICIAN:   'Legend',
  HERO_RULER:      'Conqueror',
  HERO_JUDGE:      'Templar',
  HERO_OUTLAW:     'Raider',
  HERO_TRICKSTER:  'Agent',
  HERO_SAGE:       'Strategist',
  HERO_ARTIST:     'Duelist',
  HERO_EXPLORER:   'Astronaut',
  HERO_INNOCENT:   'Crusader',
  HERO_CAREGIVER:  'Protector',
  HERO_LOVER:      'Chevalier',

  // Main: MAGICIAN (Positie 10) - #78-88
  MAGICIAN_HERO:       'Alchemist',
  MAGICIAN_RULER:      'Engineer',
  MAGICIAN_JUDGE:      'Reckoner',
  MAGICIAN_OUTLAW:     'Protagonist',
  MAGICIAN_TRICKSTER:  'Enchanter',
  MAGICIAN_SAGE:       'Sorcerer',
  MAGICIAN_ARTIST:     'Performer',
  MAGICIAN_INNOCENT:   'Catalyst',
  MAGICIAN_EXPLORER:   'Trailblazer',
  MAGICIAN_LOVER:      'Shaman',
  MAGICIAN_CAREGIVER:  'Redeemer',

  // Main: OUTLAW (Positie 6) - #89-99
  OUTLAW_TRICKSTER:  'Anarchist',
  OUTLAW_RULER:      'Usurper',
  OUTLAW_JUDGE:      'Contrarian',
  OUTLAW_CAREGIVER:  'Liberator',
  OUTLAW_LOVER:      'Instigator',
  OUTLAW_SAGE:       'Iconoclast',
  OUTLAW_ARTIST:     'Punk',
  OUTLAW_EXPLORER:   'Renegade',
  OUTLAW_INNOCENT:   'Idealist',
  OUTLAW_MAGICIAN:   'Revolutionary',
  OUTLAW_HERO:       'Ronin',

  // Main: TRICKSTER (Positie 7) - #100-110
  TRICKSTER_OUTLAW:     'Fool',
  TRICKSTER_RULER:      'Gatecrasher',
  TRICKSTER_JUDGE:      "Devil's Advocate",
  TRICKSTER_LOVER:      'Seducer',
  TRICKSTER_CAREGIVER:  'Chameleon',
  TRICKSTER_SAGE:       'Riddler',
  TRICKSTER_ARTIST:     'Impressionist',
  TRICKSTER_EXPLORER:   'Free-runner',
  TRICKSTER_INNOCENT:   'Joyrider',
  TRICKSTER_MAGICIAN:   'Shapeshifter',
  TRICKSTER_HERO:       'Ace',

  // Main: SAGE (Positie 8) - #111-121
  SAGE_ARTIST:     'Developer',
  SAGE_RULER:      'Analyst',
  SAGE_JUDGE:      'Skeptic',
  SAGE_CAREGIVER:  'Mentor',
  SAGE_LOVER:      'Guru',
  SAGE_OUTLAW:     'Hermit',
  SAGE_TRICKSTER:  'Theorist',
  SAGE_INNOCENT:   'Enlightened',
  SAGE_EXPLORER:   'Scholar',
  SAGE_HERO:       'Detective',
  SAGE_MAGICIAN:   'Freemason',

  // Main: ARTIST (Positie 9) - #122-132
  ARTIST_SAGE:       'Demiurge',
  ARTIST_RULER:      'Architect',
  ARTIST_JUDGE:      'Editor',
  ARTIST_LOVER:      'Troubadour',
  ARTIST_CAREGIVER:  'Storyteller',
  ARTIST_TRICKSTER:  'Oracle',
  ARTIST_OUTLAW:     'Provocateur',
  ARTIST_EXPLORER:   'Visionary',
  ARTIST_INNOCENT:   'Source',
  ARTIST_MAGICIAN:   'Craftsman',
  ARTIST_HERO:       'Forgemaster',
};

/**
 * Dutch names for the same 132 matrix (official NL canon). Selected when the
 * test is taken in Dutch, so the extension name the model is told matches the
 * Dutch corpus it receives and the Dutch name the user sees on their profile.
 */
const EXTENDED_MATRIX_NL = {
  // Main: RULER (Positie 12) - #1-11
  RULER_JUDGE:      'De Keizer',
  RULER_SAGE:       'De Soevereine',
  RULER_ARTIST:     'De Ontwerper',
  RULER_EXPLORER:   'De Ondernemer',
  RULER_INNOCENT:   'De Oprichter',
  RULER_OUTLAW:     'De Hervormer',
  RULER_TRICKSTER:  'De Poppenspeler',
  RULER_HERO:       'De Commandant',
  RULER_MAGICIAN:   'De Oppermeester',
  RULER_CAREGIVER:  'De Advocaat',
  RULER_LOVER:      'De Beschermheer',

  // Main: JUDGE (Positie 1) - #12-22
  JUDGE_RULER:      'De Arbiter',
  JUDGE_OUTLAW:     'De Klokkenluider',
  JUDGE_TRICKSTER:  'De Inquisitoir',
  JUDGE_SAGE:       'De Criticus',
  JUDGE_ARTIST:     'De Taxateur',
  JUDGE_INNOCENT:   'De Examinator',
  JUDGE_EXPLORER:   'De Controleur',
  JUDGE_HERO:       'De Wreker',
  JUDGE_MAGICIAN:   'De Handhaver',
  JUDGE_CAREGIVER:  'De Bemiddelaar',
  JUDGE_LOVER:      'De Verzoener',

  // Main: LOVER (Positie 2) - #23-33
  LOVER_CAREGIVER:  'De Zielsverwant',
  LOVER_RULER:      'De Compagnon',
  LOVER_JUDGE:      'De Verloofde',
  LOVER_TRICKSTER:  'De Wingman',
  LOVER_OUTLAW:     'De Genotzoeker',
  LOVER_SAGE:       'De Dichter',
  LOVER_ARTIST:     'De Muze',
  LOVER_INNOCENT:   'De Getrouwe',
  LOVER_EXPLORER:   'De Nachtvlinder',
  LOVER_HERO:       'De Romanticus',
  LOVER_MAGICIAN:   'De Betoveraar',

  // Main: CAREGIVER (Positie 3) - #34-44
  CAREGIVER_LOVER:      'De Genezer',
  CAREGIVER_RULER:      'De Patriarch / Matriarch',
  CAREGIVER_JUDGE:      'De Verdediger',
  CAREGIVER_OUTLAW:     'De Kweker',
  CAREGIVER_TRICKSTER:  'De Empaat',
  CAREGIVER_SAGE:       'De Therapeut',
  CAREGIVER_ARTIST:     'De Hersteller',
  CAREGIVER_EXPLORER:   'De Pilgrim',
  CAREGIVER_INNOCENT:   'De Toegewijde',
  CAREGIVER_HERO:       'De Wachter',
  CAREGIVER_MAGICIAN:   'De Bewaker',

  // Main: INNOCENT (Positie 4) - #45-55
  INNOCENT_EXPLORER:   'De Heilige',
  INNOCENT_RULER:      'De Herder',
  INNOCENT_JUDGE:      'De Traditionalist',
  INNOCENT_TRICKSTER:  'De Vrije Geest',
  INNOCENT_OUTLAW:     'De Fakkeldrager',
  INNOCENT_SAGE:       'De Discipel',
  INNOCENT_ARTIST:     'De Utopist',
  INNOCENT_HERO:       'De Pionier',
  INNOCENT_MAGICIAN:   'De Verlichter',
  INNOCENT_CAREGIVER:  'De Samaritaan',
  INNOCENT_LOVER:      'De Lieveling',

  // Main: EXPLORER (Positie 5) - #56-66
  EXPLORER_INNOCENT:   'De Navigator',
  EXPLORER_RULER:      'De Netwerker',
  EXPLORER_JUDGE:      'De Verkenner',
  EXPLORER_OUTLAW:     'De Vernieuwer',
  EXPLORER_TRICKSTER:  'De Scout',
  EXPLORER_SAGE:       'De Filosoof',
  EXPLORER_ARTIST:     'De Bard',
  EXPLORER_HERO:       'De Zeeman',
  EXPLORER_MAGICIAN:   'De Nomade',
  EXPLORER_LOVER:      'De Sterrenkijker',
  EXPLORER_CAREGIVER:  'De Padvinder',

  // Main: HERO (Positie 11) - #67-77
  HERO_MAGICIAN:   'De Legende',
  HERO_RULER:      'De Veroveraar',
  HERO_JUDGE:      'De Tempelier',
  HERO_OUTLAW:     'De Plunderaar',
  HERO_TRICKSTER:  'De Spion',
  HERO_SAGE:       'De Strateeg',
  HERO_ARTIST:     'De Duellist',
  HERO_EXPLORER:   'De Astronaut',
  HERO_INNOCENT:   'De Kruisvaarder',
  HERO_CAREGIVER:  'De Beschermer',
  HERO_LOVER:      'De Ridder',

  // Main: MAGICIAN (Positie 10) - #78-88
  MAGICIAN_HERO:       'De Alchemist',
  MAGICIAN_RULER:      'De Ingenieur',
  MAGICIAN_JUDGE:      'De Berekenaar',
  MAGICIAN_OUTLAW:     'De Hoofdrolspeler',
  MAGICIAN_TRICKSTER:  'De Magiër',
  MAGICIAN_SAGE:       'De Tovenaar',
  MAGICIAN_ARTIST:     'De Presteerder',
  MAGICIAN_INNOCENT:   'De Katalysator',
  MAGICIAN_EXPLORER:   'De Baanbreker',
  MAGICIAN_LOVER:      'De Sjamaan',
  MAGICIAN_CAREGIVER:  'De Verlosser',

  // Main: OUTLAW (Positie 6) - #89-99
  OUTLAW_TRICKSTER:  'De Anarchist',
  OUTLAW_RULER:      'De Troonrover',
  OUTLAW_JUDGE:      'De Dwarsligger',
  OUTLAW_CAREGIVER:  'De Bevrijder',
  OUTLAW_LOVER:      'De Aanstichter',
  OUTLAW_SAGE:       'De Beeldenstormer',
  OUTLAW_ARTIST:     'De Punker',
  OUTLAW_EXPLORER:   'De Vogelvrije',
  OUTLAW_INNOCENT:   'De Idealist',
  OUTLAW_MAGICIAN:   'De Revolutionair',
  OUTLAW_HERO:       'De Ronin',

  // Main: TRICKSTER (Positie 7) - #100-110
  TRICKSTER_OUTLAW:     'De Dwaas',
  TRICKSTER_RULER:      'De Poortbreker',
  TRICKSTER_JUDGE:      'De Advocaat van de Duivel',
  TRICKSTER_LOVER:      'De Verleider',
  TRICKSTER_CAREGIVER:  'De Kameleon',
  TRICKSTER_SAGE:       'De Raadselmeester',
  TRICKSTER_ARTIST:     'De Imitator',
  TRICKSTER_EXPLORER:   'De Freerunner',
  TRICKSTER_INNOCENT:   'De Joyrider',
  TRICKSTER_MAGICIAN:   'De Gedaanteverwisselaar',
  TRICKSTER_HERO:       'De Aas',

  // Main: SAGE (Positie 8) - #111-121
  SAGE_ARTIST:     'De Ontwikkelaar',
  SAGE_RULER:      'De Analist',
  SAGE_JUDGE:      'De Skepticus',
  SAGE_CAREGIVER:  'De Mentor',
  SAGE_LOVER:      'De Goeroe',
  SAGE_OUTLAW:     'De Kluizenaar',
  SAGE_TRICKSTER:  'De Theoreticus',
  SAGE_INNOCENT:   'De Verlichte',
  SAGE_EXPLORER:   'De Geleerde',
  SAGE_HERO:       'De Speurder',
  SAGE_MAGICIAN:   'De Vrijmetselaar',

  // Main: ARTIST (Positie 9) - #122-132
  ARTIST_SAGE:       'De Demiurg',
  ARTIST_RULER:      'De Architect',
  ARTIST_JUDGE:      'De Redacteur',
  ARTIST_LOVER:      'De Troubadour',
  ARTIST_CAREGIVER:  'De Verhalenverteller',
  ARTIST_TRICKSTER:  'Het Orakel',
  ARTIST_OUTLAW:     'De Provocateur',
  ARTIST_EXPLORER:   'De Visionair',
  ARTIST_INNOCENT:   'De Bron',
  ARTIST_MAGICIAN:   'De Ambachtsman',
  ARTIST_HERO:       'De Meestersmid',
};

/** Pick the roster for a report language (nl -> Dutch canon, anything else -> English). */
function matrixFor(language) {
  return String(language || '').toLowerCase().startsWith('nl') ? EXTENDED_MATRIX_NL : EXTENDED_MATRIX;
}


/**
 * Harmonic match = Support IS the Main's 180° shadow partner (Purple Line).
 * In the old 72 matrix this was tracked per support-GROUP; on the 132 matrix
 * it is exact per support archetype.
 */
const HARMONIC_KEYS = new Set(
  Object.entries(PURPLE_LINE).map(([main, shadow]) => `${main}_${shadow}`)
);

const ARCHETYPE_POSITIONS = {
  JUDGE: 1, LOVER: 2, CAREGIVER: 3, INNOCENT: 4, EXPLORER: 5, OUTLAW: 6,
  TRICKSTER: 7, SAGE: 8, ARTIST: 9, MAGICIAN: 10, HERO: 11, RULER: 12,
};

/** Yellow Triangle Profile metadata — used in buildUserMessage and buildSystemPrompt */
const YELLOW_TRIANGLE_PROFILES = [
  {
    id: 1, name: 'De Analytische Estheet', members: ['JUDGE', 'EXPLORER', 'ARTIST'],
    networks: 'CEN (executieve controle) + Openness (ontdekking) + DMN (reflectie)',
    superpower: 'Convergent-divergent integratie — ontdekken (Explorer), beoordelen (Judge), vertalen naar betekenis (Artist).',
    fallacies: 'Esthetische Bias (schoonheid = waarheid), Paralysis by Perfection, Intellectueel Elitisme.',
    growth: 'Aangeleerd in kenniswerkers, academici, ontwerpers — voelt als tweede natuur maar is geconditioneerd.',
  },
  {
    id: 2, name: 'De Gepassioneerde Alchemist', members: ['LOVER', 'OUTLAW', 'MAGICIAN'],
    networks: 'Limbisch (emotionele fusie) + Salience (disruptie) + Agency (transformatie)',
    superpower: 'Emotionele alchemie — voelen wat niet klopt (Lover), breken (Outlaw), herbouwen met intentie (Magician).',
    fallacies: 'Messias-Complex, Emotionele Reactiviteit als Strategie, Burn-and-Build Cyclus.',
    growth: 'Startup-cultuur, activisme, therapeutische settings — dopamine-cocktail van rebellie + transformatie.',
  },
  {
    id: 3, name: 'De Strategische Bewaker', members: ['CAREGIVER', 'TRICKSTER', 'HERO'],
    networks: 'Limbisch (zorg) + Salience (speelse disruptie) + Agency (actie/bescherming)',
    superpower: 'Beschermende intelligentie — zien wie pijn lijdt (Caregiver), onverwachte route vinden (Trickster), uitvoeren (Hero).',
    fallacies: 'Nobele Manipulator, Humor als Vermijding, Martelaar-Held Fusie (architectuur van burn-out).',
    growth: 'NL verzorgingscultuur, teamgerichte settings — oxytocine + dopamine + testosteron combinatie.',
  },
  {
    id: 4, name: 'De Wijze Meester-Bouwer', members: ['INNOCENT', 'SAGE', 'RULER'],
    networks: 'Openness (vertrouwen) + DMN (inzicht) + CEN (structurele controle)',
    superpower: 'Institutionele intelligentie — vertrouwen (Innocent), begrijpen (Sage), structureren (Ruler) voor duurzaam bestuur.',
    fallacies: 'Systeemblindheid (kan systeem niet deconstrueren), Conservatieve Bias, Paternalistische Val.',
    growth: 'Bestuursstructuren, kerkelijk leiderschap, familiebedrijven — meest cultureel gerespecteerd maar kwetsbaar voor chaos.',
  },
];

const GROUP_FOR_ARCHETYPE = {
  JUDGE: 'RULING', RULER: 'RULING',
  LOVER: 'RELATIONAL', CAREGIVER: 'RELATIONAL',
  INNOCENT: 'SEEKER', EXPLORER: 'SEEKER',
  OUTLAW: 'CHAOS', TRICKSTER: 'CHAOS',
  SAGE: 'ABSTRACT', ARTIST: 'ABSTRACT',
  MAGICIAN: 'AGENCY', HERO: 'AGENCY',
};

// ═══════════════════════════════════════════════════════════════
// English title set (Master Prompt W8 "aangeleverde koppenset") — one-to-one with the Dutch
// TITEL (exact) lines of DEEL 5 / the tags of DEEL 6, and one-to-one with what the platform
// parser (apps/platform/src/components/assessment/v4Parser.js) routes. Gate-tested against it.
// ═══════════════════════════════════════════════════════════════
const EN_SECTION_TITLES = Object.freeze({
  narrative: [
    'THE IDENTITY',
    'THE EXPLANATION',
    'THE ESSENCE (MAIN ARCHETYPE)',
    'THE MULTIPLICATION (SUPPORT ARCHETYPE)',
    'THE SHADOW (180° OPPOSITE OF MAIN)',
    'THE BLINDSPOT (RED-LINE MATCH)',
    // v6.2.1 order: the extension and its resonance sit on the radar page, before OCEAN. The title
    // carries the name alone — no number, no second language (§5.4).
    'THE EXTENSION — [name]',
    'CREATIVE RESONANCE',
    'PERSONALITY REPORT COMPARISON — OCEAN',
    '  then one block per trait, titled: TRAIT O — Openness · TRAIT C — Conscientiousness · TRAIT E — Extraversion · TRAIT A — Agreeableness · TRAIT N — Neuroticism',
    'THE SHAPE',
    'THE HARDWARE UNDER PRESSURE',
    'THE TRANSITION TO THE QUIET VOICE',
    'REFLECTION',
    'MOTIVATION',
    'MOVEMENT',
    // Master Prompt v7.2 page 5.7b — handed over only with a v7.2+ prompt (triangleTitles below)
    'THE COGNITIVE TRIANGLE',
    'THE FALLACIES OF THE TRIANGLE',
    'THE ALCHEMY OF INDIVIDUATION',
    'THE NEURAL SWITCHBOARD',
    'ONTOLOGICAL EVOLUTION',
    'THE FULL AI PROMPT',
  ],
  traitTitles: ['TRAIT O — Openness', 'TRAIT C — Conscientiousness', 'TRAIT E — Extraversion', 'TRAIT A — Agreeableness', 'TRAIT N — Neuroticism'],
  machineHeader: 'PROFILE DATA FOR AI PROCESSING',
  machineTags: [
    'IDENTITY', 'SCORES (12-POINT WHEEL)', '5-BASKET DECOMPOSITION', 'NATURE / CULTURE DISTRIBUTION PER GROUP',
    'DERIVED INDICES', 'OCEAN PROFILE (EXTERNALLY UPLOADED)', 'COGNITIVE TRIANGLE', 'HARDWARE SIGNALS',
    'EXTENDED ARCHETYPE PROFILE', 'SHADOW INTEGRATION', 'BLINDSPOT',
  ],
  experimentLabels: ['The Focus Lever:', 'The Shadow Injection:', 'The Blindspot Check:'],
  // The two page-5.7b titles: a prompt before v7.2 has no such sections, so it never gets their titles.
  triangleTitles: ['THE COGNITIVE TRIANGLE', 'THE FALLACIES OF THE TRIANGLE'],
});

// ═══════════════════════════════════════════════════════════════
// buildUserMessage — full personalized assessment data for this user
// ═══════════════════════════════════════════════════════════════

function buildUserMessage({
  archetypeKey, supportArchetype, supportGroup, mainGroup,
  extendedArchetypeName,
  shadowArchetype, blindspotArchetype, isIndividuated,
  polarizationIndex, polarizationPct, polarizationLevel,
  authenticityIndex,
  totalNaturePoints, totalCulturePoints,
  archetypeDetails, uploadedFileContents,
  subgroups, responses,
  uploadedOceanScores,
  uploadedOceanAspects,
  language,
}) {
  const mainPos      = ARCHETYPE_POSITIONS[archetypeKey] || '?';
  const supportPos   = ARCHETYPE_POSITIONS[supportArchetype] || '?';
  const shadowPos    = ARCHETYPE_POSITIONS[shadowArchetype] || '?';
  const blindspotPos = ARCHETYPE_POSITIONS[blindspotArchetype] || '?';
  const matrixKey    = `${archetypeKey}_${supportArchetype}`;
  const isHarmonic   = HARMONIC_KEYS.has(matrixKey);

  const hasReport = uploadedFileContents && uploadedFileContents.length > 0;
  const parts = [];

  const en = String(language || 'nl').toLowerCase() === 'en';
  parts.push(`Genereer het volledige rapport voor deze gebruiker volgens de systeeminstructies.\n`);

  // Master Prompt W8: the section titles are language-invariant and come "per de aangeleverde
  // koppenset". The Dutch set is the prompt's own TITEL (exact) lines; the English set is this
  // block — the exact titles the report parser routes on (platform v4Parser.js), nothing else.
  if (en) {
    parts.push(`\n═══ SECTION TITLES — ENGLISH REPORT (the delivered title set, W8) ═══`);
    parts.push(`Emit each title LITERALLY as its own line, in this order, uppercase as written — these are the parser tags.`);
    parts.push(`The word budgets and every HARD LIMIT of DEEL 5 apply unchanged.`);
    // the old test's prompts (v6 and earlier) have no triangle page
    parts.push(...EN_SECTION_TITLES.narrative.filter((x) => !EN_SECTION_TITLES.triangleTitles.includes(x))
      .map((x) => (x.startsWith('  ') ? x : `- ${x}`)));
    parts.push(`Machine block (DEEL 6): the header line "${EN_SECTION_TITLES.machineHeader}", then exactly these tags:`);
    parts.push(EN_SECTION_TITLES.machineTags.map((x) => `-- ${x} --`).join(' | '));
    parts.push(`Neural switchboard experiment labels (line starts): ${EN_SECTION_TITLES.experimentLabels.join(' · ')}`);
  }

  // ═══ ARCHETYPE PROFIEL ═══
  parts.push(`\n═══════════════════════════════════════`);
  parts.push(`ARCHETYPE PROFIEL (LEERLING ONTOLOGY)`);
  parts.push(`═══════════════════════════════════════\n`);

  parts.push(`Main Archetype: ${archetypeKey} (Positie ${mainPos})`);
  parts.push(`Main Groep: ${mainGroup || GROUP_FOR_ARCHETYPE[archetypeKey]} (${GROUP_NEURAL_FOCUS[mainGroup || GROUP_FOR_ARCHETYPE[archetypeKey]] || ''})`);
  parts.push(`Support Archetype: ${supportArchetype} (Positie ${supportPos})`);
  parts.push(`Support Groep: ${supportGroup || GROUP_FOR_ARCHETYPE[supportArchetype]} (${GROUP_NEURAL_FOCUS[supportGroup || GROUP_FOR_ARCHETYPE[supportArchetype]] || ''})`);
  parts.push(`Extended Archetype (132-matrix): ${extendedArchetypeName || matrixFor(language)[matrixKey] || '?'}${isHarmonic ? ' (Harmonic Match ✦)' : ''}`);

  const mainDetails   = archetypeDetails && archetypeDetails.find(a => a.key === archetypeKey);
  const shadowDetails = archetypeDetails && archetypeDetails.find(a => a.key === shadowArchetype);
  if (mainDetails) {
    parts.push(`Main Archetype 5-Mandjes: nature_core=${mainDetails.nature_core || 0}, green_hw=${mainDetails.green_hw || 0}, culture_core=${mainDetails.culture_core || 0}, blue_fb=${mainDetails.blue_fb || 0}, yellow_cog=${mainDetails.yellow_cog || 0}, purple_shadow=${mainDetails.purple_shadow || 0}`);
  }
  if (shadowDetails) {
    parts.push(`Shadow Archetype 5-Mandjes: nature_core=${shadowDetails.nature_core || 0}, green_hw=${shadowDetails.green_hw || 0}, culture_core=${shadowDetails.culture_core || 0}, blue_fb=${shadowDetails.blue_fb || 0}, yellow_cog=${shadowDetails.yellow_cog || 0}, purple_shadow=${shadowDetails.purple_shadow || 0}`);
  }

  parts.push(`Shadow (180° van Main): ${shadowArchetype} (Positie ${shadowPos})`);
  parts.push(`Blindspot (Rode Lijn van Main): ${blindspotArchetype} (Positie ${blindspotPos})`);
  if (isIndividuated) {
    parts.push(`⚡ INDIVIDUATIE: Main (${archetypeKey}) en Support (${supportArchetype}) zijn 180° tegenpolen — Meesterschap over de Paradox!`);
  }


  // ═══ GEAVANCEERDE METRICS ═══
  parts.push(`\n── GEAVANCEERDE METRICS ──`);
  // The indices in the Master Prompt's own terms (L4 — read, never computed; R-c 3.2 bands the
  // Main–Shadow gap as a percentage of Main: > 60 · 30–60 · < 30).
  if (polarizationIndex != null) {
    const mainTot = mainDetails ? Number(mainDetails.total) || 0 : null;
    const shadowTot = shadowDetails ? Number(shadowDetails.total) || 0 : null;
    const pct = polarizationPct;   // computed once on the server (engine/polarNorm.js), never here
    const band = polarizationLevel === 'HIGH_POLARIZATION' ? 'gap > 60% van Main — schaduw onderdrukt'
      : polarizationLevel === 'HIGH_INDIVIDUATION' ? 'gap < 30% — actieve integratie'
      : 'gap 30–60% — gezonde spanning';
    const scores = mainTot != null && shadowTot != null ? ` (Main ${mainTot} − Shadow ${shadowTot})` : '';
    parts.push(`Polarization Index: ${polarizationIndex} punten${scores}${pct != null ? ` = ${pct}% van Main` : ''} → band: ${band}`);
  }
  if (authenticityIndex != null) {
    parts.push(`Authenticity Index: ${authenticityIndex}% Nature (over 72 picks) — Nature punten: ${totalNaturePoints || 0} / Culture punten: ${totalCulturePoints || 0}`);
  }
  // D-10: OCEAN reaches the model only as the user's upload — the values the backend parsed from
  // it, in the labels the machine block uses; never geometry-derived values.
  if (uploadedOceanScores && Object.keys(uploadedOceanScores).length) {
    const labels = en
      ? { O: 'Openness', C: 'Conscientiousness', E: 'Extraversion', A: 'Agreeableness', N: 'Neuroticism' }
      // OUR names, never the source file's: C is Consciëntieusheid (Ordelijkheid is an aspect of it).
      : { O: 'Openheid', C: 'Consciëntieusheid', E: 'Extraversie', A: 'Meegaandheid', N: 'Neuroticisme' };
    const cells = ['O', 'C', 'E', 'A', 'N'].filter((d) => uploadedOceanScores[d] != null)
      .map((d) => `${labels[d]}: ${uploadedOceanScores[d]}/100`);
    parts.push(`${en ? 'OCEAN (uploaded by the user)' : 'OCEAN (geüpload door de gebruiker)'}: ${cells.join(' | ')}`);
    // The two aspects per trait, numbers under our names — the same upload, never its text (§5c).
    const aspectLine = formatAspectLine(uploadedOceanAspects, en ? 'en' : 'nl');
    if (aspectLine) parts.push(`${en ? 'OCEAN aspects (uploaded by the user)' : 'OCEAN-aspecten (geüpload door de gebruiker)'}: ${aspectLine}`);
  }

  // ═══ DUAL-CORE DYNAMICS ═══
  if (subgroups && subgroups.length > 0) {
    const GROUP_NEURAL_NAMES = {
      Ruling: 'CEN Dominantie', Relational: 'Limbic Coupling',
      Seeker: 'Hoge Openness', Chaos: 'Salience Netwerk',
      Abstract: 'DMN Hyper-connectie', Agency: 'Extraversie/Wilskracht',
    };
    parts.push(`\n── DUAL-CORE DYNAMICS PER NEURAAL NETWERK ──`);
    parts.push(`(Nature = biologische kern; Culture = aangeleerde strategie; /30 max per kolom)`);
    parts.push(`Netwerk               | Links        | Rechts       | Nat  | Cult | Nat% `);
    parts.push(`----------------------|--------------|--------------|------|------|------`);
    for (const sg of subgroups) {
      const natTotal  = (sg.leftNature  || 0) + (sg.rightNature  || 0);
      const cultTotal = (sg.leftCulture || 0) + (sg.rightCulture || 0);
      const total     = natTotal + cultTotal;
      const ratio     = total > 0 ? Math.round((natTotal / total) * 100) : 0;
      const netName   = (GROUP_NEURAL_NAMES[sg.group] || sg.group || '').padEnd(21);
      const left      = (sg.leftLabel  || '').padEnd(12);
      const right     = (sg.rightLabel || '').padEnd(12);
      const natStr    = String(natTotal).padStart(4);
      const cultStr   = String(cultTotal).padStart(4);
      const ratioStr  = String(ratio).padStart(4) + '%';
      parts.push(`${netName} | ${left} | ${right} | ${natStr} | ${cultStr} | ${ratioStr}`);
    }
    parts.push(`\nLEESPROTOCOL DUAL-CORE: Nat% >60% = biologische stroom dominant. Nat% <40% = aangeleerde strategie dominant. 40-60% = actieve integratie.`);
  }

  // ═══ ARCHETYPE SCOREOVERZICHT (5-Mandje Decompositie) ═══
  if (archetypeDetails && archetypeDetails.length > 0) {
    parts.push(`\n── ARCHETYPE SCOREOVERZICHT (5-Mandje Decompositie) ──`);
    parts.push(`Archetype       | Pos | Groep       | Totaal | N_Core | G_HW  | C_Core | B_FB  | Y_Cog | P_Shad | Nature%`);
    parts.push(`----------------|-----|-------------|--------|--------|-------|--------|-------|-------|--------|--------`);
    for (const a of archetypeDetails) {
      const name  = (a.key || '').padEnd(15);
      const pos   = String(a.position || '').padStart(3);
      const group = (a.group || '').padEnd(11);
      const total = String(a.total || 0).padStart(6);
      const nc    = String(a.nature_core || 0).padStart(6);
      const gh    = String(a.green_hw || 0).padStart(5);
      const cc    = String(a.culture_core || 0).padStart(6);
      const bf    = String(a.blue_fb || 0).padStart(5);
      const yc    = String(a.yellow_cog || 0).padStart(5);
      const ps    = String(a.purple_shadow || 0).padStart(6);
      const ratio = String(a.natureRatio || 0).padStart(7) + '%';
      parts.push(`${name} | ${pos} | ${group} | ${total} | ${nc} | ${gh} | ${cc} | ${bf} | ${yc} | ${ps} | ${ratio}`);
    }
    parts.push(`\nLEESPROTOCOL: Hoge nature_core = biologische identiteit. Hoge culture_core = aangeleerde strategie. Hoge green_hw/blue_fb = hardware echo. Hoge yellow_cog = cognitief netwerk. Hoge purple_shadow = onbewuste tegenpool. Hoog totaal + lage nature_core = ECHO, geen identiteit.`);

    // ── GELE DRIEHOEKEN ACTIVATIE ──
    parts.push(`\n── GELE DRIEHOEKEN — CULTUREFORCE ACTIVATIE ──`);
    parts.push(`Driehoek                 | Leden                       | Y_Cog Totaal | Activatie`);
    parts.push(`-------------------------|-----------------------------|--------------|-----------`);

    const triangleActivations = YELLOW_TRIANGLE_PROFILES.map(tri => {
      const memberScores = tri.members.map(m => {
        const d = archetypeDetails.find(a => a.key === m);
        return { key: m, yellowCog: d ? (d.yellow_cog || 0) : 0 };
      });
      const totalYellow = memberScores.reduce((s, m) => s + m.yellowCog, 0);
      const dominance = totalYellow === 0 ? 'AFWEZIG' : totalYellow < 30 ? 'ZWAK' : totalYellow < 80 ? 'ACTIEF' : 'DOMINANT';
      return { ...tri, memberScores, totalYellow, dominance };
    }).sort((a, b) => b.totalYellow - a.totalYellow);

    for (const tri of triangleActivations) {
      const name    = tri.name.padEnd(24);
      const members = tri.members.join(' · ').padEnd(27);
      const total   = String(tri.totalYellow).padStart(12);
      parts.push(`${name} | ${members} | ${total} | ${tri.dominance}`);
    }

    const dominant = triangleActivations[0];
    const absent   = triangleActivations[triangleActivations.length - 1];

    parts.push(`\nDOMINANT COGNITIEF NETWERK: ${dominant.name} (Driehoek ${dominant.id})`);
    parts.push(`  Netwerken: ${dominant.networks}`);
    // The lens CONTENT — superpower, fallacies, cultural context — comes from the corpus slice only
    // (human ruling 2026-09-16); the activation numbers above are assessment data.
    if (dominant.totalYellow > 0) {
      for (const ms of dominant.memberScores) {
        const d  = archetypeDetails.find(a => a.key === ms.key);
        const nc = d ? (d.nature_core || 0) : 0;
        const src = nc > 30
          ? 'NATURE+CULTURE (biologische grondtoon versterkt door cognitief netwerk)'
          : 'CULTURE-ONLY (puur aangeleerde lens — energiekosten bij druk)';
        parts.push(`  ${ms.key}: yellow_cog=${ms.yellowCog}, nature_core=${nc} → ${src}`);
      }
    }

    if (absent.totalYellow === 0) {
      parts.push(`\nCOGNITIEVE BLINDE VLEK: ${absent.name} (Driehoek ${absent.id}) — NIET geactiveerd`);
      parts.push(`  Dit netwerk is zowel biologisch als aangeleerd afwezig.`);
      parts.push(`  Netwerken: ${absent.networks}`);
    }

    const [t1, t2] = triangleActivations;
    if ((t1.id === 1 && t2.id === 2) || (t1.id === 2 && t2.id === 1)) {
      parts.push(`\nCROSS-DRIEHOEK: Analytische Estheet ↔ Gepassioneerde Alchemist (Denken vs. Voelen).`);
    } else if ((t1.id === 3 && t2.id === 4) || (t1.id === 4 && t2.id === 3)) {
      parts.push(`\nCROSS-DRIEHOEK: Strategische Bewaker ↔ Wijze Meester-Bouwer (Bewegen vs. Bewaken).`);
    }
  }

  // ═══ INDIVIDUELE ANTWOORDEN ═══
  if (responses && responses.length > 0) {
    parts.push(`\n── INDIVIDUELE ANTWOORDEN (${responses.length} vragen) ──`);
    const summary = responses.map(r =>
      `Q${r.questionId}: archetype=${r.archetype}${r.shadowAspect ? ', schaduw=' + r.shadowAspect : ''}`
    ).join('\n');
    parts.push(summary);
  }

  // ═══ UPLOADED RAPPORT ═══
  // NEVER the report's text. Only its numbers travel — the two OCEAN lines above, under our names
  // (Addendum A §5c). The text carried the source's own labels and extra scales (a HEXACO
  // "Eerlijkheid-Nederigheid" the model then wrote about) and whatever personal details the scrubber
  // did not recognise.
  if (hasReport) {
    // No file names: the OCEAN lines above are the upload, and only when its numbers could be read.
    if (uploadedOceanScores && Object.keys(uploadedOceanScores).length) {
      parts.push(en
        ? '\n⚠️ EXTERNAL OCEAN REPORT UPLOADED — only the numbers above travel; no labels, categories or extra scales from the source.'
        : '\n⚠️ EXTERN OCEAN-RAPPORT GEÜPLOAD — alleen de getallen hierboven reizen mee; geen labels, categorieën of extra schalen uit de bron.');
    }
  }

  // ═══ OCEAN WITHOUT AN UPLOAD — how to write the comparison section ═══
  // Only when no OCEAN numbers came in (the same test the PDF uses for its no-upload page). The Master
  // Prompt gives this case one line; this hook pins the shape the owner chose as the baseline
  // (2026-09-30): opening, five short trait tendencies, closing — one page, never a number.
  const hasOceanNumbers = !!(uploadedOceanScores && Object.keys(uploadedOceanScores).length);
  if (!hasOceanNumbers) parts.push(oceanWithoutUploadRequest({ en }));

  // ═══ KAART MICROCOPY — the public profile card's two texts ═══
  // A hook from the repo, not a Master Prompt section (owner, 2026-09-18): the report follows the
  // Master Prompt alone; this asks for the card's two fields on top. routes/ai.js lifts the block out
  // of the output before anyone reads the report and stores it for the card (kaartDrafts).
  parts.push(kaartMicrocopyRequest({ en, archetypeKey, supportArchetype }));

  return parts.join('\n');
}

/**
 * How to write PERSOONLIJKHEIDSRAPPORT VERGELIJKING when no OCEAN report was uploaded. The Master
 * Prompt's §5.5 says only "one paragraph"; the owner took a real no-upload report (2026-09-30: an
 * opening of ~85 words, five trait blocks of ~55–80, a closing of ~50) as the shape to keep, so the
 * section is this, every time, and fits one page. Headings "TRAIT X — Name" are what the PDF reader
 * files under the section (v4Parser isOceanMemberHeading); no score in them, because there is none.
 */
function oceanWithoutUploadRequest({ en }) {
  if (en) {
    return [
      '',
      '═══ OCEAN WITHOUT AN UPLOAD — PERSONALITY REPORT COMPARISON ═══',
      'No external OCEAN report was uploaded with this profile. Write the section PERSONALITY REPORT COMPARISON in exactly this shape — for this case it replaces the one-paragraph rule at the end of §5.5; the rest of §5.5 (the fixed anchor layer, what each trait does not see, no per-trait disclaimers) still applies.',
      '1. OPENING, 70–100 words: no external Big Five report was uploaded; this model does not measure traits and cannot infer their values from the wheel — the two instruments sit on independent axes (two configurations can share a trait level and express it in opposite behaviour). What follows is therefore not a reading of scores: it describes, in deliberately hedged tendency language, how THIS Main × Support configuration would tend to express each trait if it were present, and what a real measurement would add.',
      '2. FIVE TRAIT BLOCKS, in this order, each under its own subheading with the name only and no score: "TRAIT O — Openness", "TRAIT C — Conscientiousness", "TRAIT E — Extraversion", "TRAIT A — Agreeableness", "TRAIT N — Neuroticism". Each 55–80 words, in three steps: (a) the hardware the trait rests on (the fixed anchor layer of §5.5); (b) how configurations like this one tend to express it, through the Main, the Support and the weightings that matter here — a tendency, never a level; (c) what a measurement would show that the wheel cannot (the "does not see" line of §5.5).',
      '3. CLOSING, 40–60 words: an accurate trait reading requires a real Big Five instrument; this model translates how traits would be expressed through a configuration, it does not measure or certify them; taking a validated OCEAN test and uploading it turns this section into a cross-validation between two independent measurements.',
      'Together 420–540 words, so the section fits one page. No numbers, scores, percentages or estimates anywhere (W6) — "tends to", never "you score". No disclaimer inside the blocks: the page prints the instrument disclaimer above the section itself.',
    ].join('\n');
  }
  return [
    '',
    '═══ OCEAN ZONDER UPLOAD — PERSOONLIJKHEIDSRAPPORT VERGELIJKING ═══',
    'Bij dit profiel is geen extern OCEAN-rapport geüpload. Schrijf de sectie PERSOONLIJKHEIDSRAPPORT VERGELIJKING precies in deze vorm — voor dit geval vervangt dit de één-alinea-regel aan het eind van §5.5; de rest van §5.5 (de vaste ankerlaag, wat elke trait niet ziet, geen disclaimers per trait) blijft gelden.',
    '1. OPENING, 70–100 woorden: er is geen extern Big Five-rapport geüpload; dit model meet geen traits en kan hun waarden niet uit het wiel afleiden — de twee instrumenten staan op onafhankelijke assen (twee configuraties kunnen hetzelfde traitniveau delen en het tegengesteld uitdrukken). Wat volgt is dus geen lezing van scores: het beschrijft, in bewust voorzichtige tendenstaal, hoe DEZE Main × Support-configuratie elke trait zou neigen uit te drukken als die aanwezig is, en wat een echte meting zou toevoegen.',
    '2. VIJF TRAIT-BLOKKEN, in deze volgorde, elk onder een eigen subkop met alleen de naam en geen score: "TRAIT O — Openheid", "TRAIT C — Consciëntieusheid", "TRAIT E — Extraversie", "TRAIT A — Meegaandheid", "TRAIT N — Neuroticisme". Elk 55–80 woorden, in drie stappen: (a) de hardware waarop de trait rust (de vaste ankerlaag van §5.5); (b) hoe configuraties als deze de trait neigen uit te drukken, via de Main, de Support en de wegingen die hier tellen — een tendens, nooit een niveau; (c) wat een meting zou laten zien dat het wiel niet kan zien (de "ziet niet"-regel van §5.5).',
    '3. AFSLUITING, 40–60 woorden: een accurate traitlezing vraagt een echt Big Five-instrument; dit model vertaalt hoe traits zich door een configuratie zouden uitdrukken, het meet of certificeert ze niet; wie een gevalideerde OCEAN-test doet en die uploadt, maakt van deze sectie een kruisvalidatie tussen twee onafhankelijke metingen.',
    'Samen 420–540 woorden, zodat de sectie op één pagina past. Nergens getallen, scores, percentages of schattingen (W6) — "neigt tot", nooit "je scoort". Geen disclaimer in de blokken: de pagina zet de instrument-disclaimer zelf boven de sectie.',
  ].join('\n');
}

/**
 * The request for the public profile card's two texts: the gave in plain words, and the shape of
 * the profile. The wording is the owner-approved v4.3 "Kaart Microcopy" section, adapted to the v6
 * laws. It comes LAST, after the machine block, and is explicitly outside the report — so it touches
 * neither the voltooiingspoort nor W2's template.
 */
function kaartMicrocopyRequest({ en, archetypeKey, supportArchetype }) {
  if (en) {
    return [
      '',
      '═══ CARD MICROCOPY — the two texts of the public profile card ═══',
      'After the complete report, as the VERY LAST thing — after the machine block — write this one block. It is not a report section: the backend lifts it out of your output before anyone reads the report and places it on the public profile card. It therefore sits outside the completion gate and outside W2\'s template (W1, W3, W7 and W9 do apply).',
      'Exactly this format — the heading on its own line, then the two labelled fields, nothing else:',
      '## CARD MICROCOPY',
      'CARD_GIFT: [2–3 sentences in plain, clear language: a deeper description of THIS person\'s gift. The starting point is the gift in the extension cell in your slice (this configuration\'s ratified text), deepened in your own words for this profile — NO copy or paraphrase of that gift text or of the life lesson, and NEVER the curse (a trigger does not belong on a public card). No jargon and no network names — concretely what this gift is in practice, how it shows and what it yields. Address the reader directly ("your gift…").]',
      `CARD_GEOMETRY: [4–6 sentences. Work in TWO steps: STEP 1 (internal, not in the output): read this profile's shape from what you are given — the active set with their roles (Main ${archetypeKey}, Support ${supportArchetype}, the co-drivers); the Main's resolved links in the payload (green, blue, purple, red, yellow) and so where the friction axis lies; the spread of the twelve wheel scores and their nature_core (concentrated or spread, identity or echo); the Nature/Culture balance and the polarisation band; and the register curve — baseline against transform, inversions — in band language, never in numbers (W1). STEP 2 (the output): TRANSLATE that reading into text that is clear and easy to read for someone with no knowledge of the model. NO network names, NO line types, NO model jargon in the final text — the canon carries the meaning, the words are everyday. Describe the SHAPE: where the strength lies and how the two main energies relate. This is a PUBLIC SHOWCASE CARD, not a reflection journal: NO growth points, attention points, reflection tasks or advice — only who this is and what this profile carries. FRAMING RULE: every configuration is a full way of navigating — describe middle positions and even distributions as a quality too (suppleness, access to both sides, moving with), NEVER as a lack, shortfall, weakness or "low". Not one deficit word. Probabilistic language; no determinism; no closing disclaimer (the card already carries one).]`,
    ].join('\n');
  }
  return [
    '',
    '═══ KAART MICROCOPY — de twee teksten van de openbare profielkaart ═══',
    'Na het volledige rapport, ALS ALLERLAATSTE — ná het machineblok — schrijf je dit ene blok. Het is geen rapportsectie: de backend haalt het uit je output voordat iemand het rapport leest en zet het op de openbare profielkaart. Het staat daarom buiten de voltooiingspoort en buiten het sjabloon van W2 (W1, W3, W7 en W9 gelden wél).',
    'Exact dit formaat — de kop op een eigen regel, dan de twee gelabelde velden, niets anders:',
    '## KAART MICROCOPY',
    'KAART_GIFT: [2–3 zinnen in eenvoudige, heldere taal: een verdiepende beschrijving van de gave van déze gebruiker. Vertrekpunt is de gave uit de extensie-cel in je slice (de geratificeerde tekst van deze configuratie), in eigen woorden verdiept voor dit profiel — GEEN kopie of parafrase van die gave-tekst of van de levensles, en NOOIT de vloek (een trigger hoort niet op een openbare kaart). Geen jargon en geen netwerknamen — concreet wat deze gave in de praktijk is, hoe ze zich toont en wat ze oplevert. Schrijf direct aan de gebruiker ("jouw gave…").]',
    `KAART_GEOMETRIE: [4–6 zinnen. Werk in TWEE stappen: STAP 1 (intern, niet in de output): lees de vorm van dit profiel uit wat je geleverd krijgt — de actieve set met hun rollen (Main ${archetypeKey}, Support ${supportArchetype}, de co-drivers); de opgeloste links van de Main in de payload (groen, blauw, paars, rood, geel) en dus waar de frictie-as ligt; de spreiding van de twaalf wielscores en hun nature_core (geconcentreerd of verspreid, identiteit of echo); de Nature/Culture-verhouding en de polarisatieband; en de registercurve — basislijn tegenover transform, inversies — in bandtaal, nooit in getallen (W1). STAP 2 (de output): VERTAAL die lezing naar tekst die helder en makkelijk leesbaar is voor iemand zonder enige modelkennis. GEEN netwerknamen, GEEN lijntypes, GEEN modeljargon in de eindtekst — de betekenis draagt de canon, de woorden zijn alledaags. Beschrijf de VORM: waar de kracht zit en hoe de twee hoofdenergieën zich tot elkaar verhouden. Dit is een PUBLIEKE SHOWKAART, geen reflectiedagboek: GEEN groeipunten, aandachtspunten, reflectie-opdrachten of adviezen — alleen wie dit is en wat dit profiel draagt. FRAMING-REGEL: elke configuratie is een volwaardige manier van navigeren — beschrijf óók middenposities en gelijke verdelingen als kwaliteit (souplesse, toegang tot beide kanten, meebewegen), NOOIT als tekort, gemis, zwakte of "laag". Geen enkel deficit-woord. Probabilistische taal; geen determinisme; geen afsluitende disclaimer (die staat al op de kaart).]`,
  ].join('\n');
}

module.exports = { buildUserMessage, EN_SECTION_TITLES, YELLOW_TRIANGLE_PROFILES, oceanWithoutUploadRequest };
