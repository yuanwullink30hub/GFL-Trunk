/**
 * Scoring Algorithm — Master Index (Neuraal Schakelbord)
 *
 * Triple Network Model Geometry — Tiered Scoring Engine
 *
 * Contains the scoring logic that converts raw user answers into:
 * 1. Per-archetype scores with line-based distribution (Green, Yellow, Red, Purple)
 * 2. Beheersings Bonus (+33 pts to Main if Green Line pair)
 * 2b. Harmony Bonus (+69 pts to Main if Purple Line / 180° shadow)
 * 3. Radar chart data (12 archetype anchors, 0-369 scale)
 * 4. Subgroup dynamics (6 archetype group polarity pairs)
 * 5. Primary & secondary archetype determination
 * 6. Extended Archetype name (72-outcome matrix)
 * 7. Nature vs Culture/Force dual-tracking (Advanced Ontology)
 * 8. Polarization Index & Authenticity Index (Advanced Metrics)
 *
 * Line Connections (from 12-point Neuro-Archetypal Wheel):
 *   Green Line:  Hardware Anker (group partner — same biological substrate)
 *   Blue Line:   Symbiotische Brug (horizontal axis — positions summing to 13)
 *   Yellow A/B:  Same-cluster archetypes at distance 4 (cognitive network synergy)
 *   Red Line:    Neurale Kortsluiting (vertical axis — biological hardware conflict)
 *   Purple Line: 180° shadow (position + 6, neurological tension)
 *
 * 3 Scoring Tiers:
 *   Level 1 (Beginner):     10 pts/click — Nature: +5 Core, +3 Green, +2 Purple(friction)
 *                                           Culture: +3 Core, +3 Yellow A, +3 Yellow B, +1 Red(friction)
 *   Level 2 (Intermediate): 10 pts/click — Nature: +7 Core, +3 Green
 *                                           Culture: +4 Core, +3 Yellow A, +3 Yellow B
 *   Level 3 (Advanced):     12/11 pts    — Nature: +7 Core, +3 Green, +1 Purple(shadow), +1 Red(blindspot)
 *                                           Culture: +5 Core, +3 Yellow A, +3 Yellow B
 *
 * Advanced Dual-Tracking (Nature vs Culture/Force):
 *   Each point is routed to a Nature or CultureForce sub-score per archetype
 *   based on the Alpha/Beta state toggle and two fixed ID clusters.
 *   Tie-breaks are resolved by highest Nature sub-score (biological essence wins).
 *
 * Beheersings Bonus: +33 to Main if Main & Support are Green Line pair (Neurale Snelweg)
 * Harmony Bonus:     +69 to Main if Main & Support are 180° shadow opposites (Purple Line)
 * Total max: Beginner 600, Intermediate 600, Advanced 720 (excl. bonuses)
 */

/**
 * The 12 radar traits displayed on the result chart.
 * LEGACY — kept for backward compatibility.
 * The primary radar now uses ARCHETYPE_RADAR_LABELS (12 archetype names).
 */
export const RADAR_TRAITS = [
  'Bewustzijn',   // Consciousness
  'Empathie',     // Empathy
  'Logica',       // Logic
  'Intuïtie',     // Intuition
  'Actie',        // Action
  'Geduld',       // Patience
  'Veerkracht',   // Resilience
  'Innovatie',    // Innovation
  'Traditie',     // Tradition
  'Gemeenschap',  // Community
  'Reflectie',    // Reflection
  'Spirit',       // Spirit
];

/**
 * The 6 subgroup polarity pairs — mapped to the 6 Neurale Zuilen (Neural Pillars).
 * Each pair shows the tension between the two archetypes in that pillar.
 */
export const SUBGROUP_POLARITIES = [
  { id: 1, leftLabel: 'Judge',     rightLabel: 'Ruler',     group: 'Ruling',     axis: 'Autoriteit & Structuur' },
  { id: 2, leftLabel: 'Lover',     rightLabel: 'Caregiver', group: 'Relational', axis: 'Relatie & Verbinding' },
  { id: 3, leftLabel: 'Innocent',  rightLabel: 'Explorer',  group: 'Seeker',     axis: 'Waarheid & Ontdekking' },
  { id: 4, leftLabel: 'Outlaw',    rightLabel: 'Trickster', group: 'Chaos',      axis: 'Disruptie & Perspectief' },
  { id: 5, leftLabel: 'Sage',      rightLabel: 'Artist',    group: 'Abstract',   axis: 'Wijsheid & Creatie' },
  { id: 6, leftLabel: 'Magician',  rightLabel: 'Hero',      group: 'Agency',     axis: 'Manifestatie & Actie' },
];

/**
 * Map from archetype key to which radar traits it boosts.
 * LEGACY — kept for backward compatibility.
 * The primary radar now uses per-archetype scores directly.
 */
export const ARCHETYPE_TRAIT_MAP = {
  // Set A (Odd questions)
  SAGE:      ['Bewustzijn', 'Logica', 'Reflectie'],
  HERO:      ['Actie', 'Veerkracht', 'Geduld'],
  LOVER:     ['Empathie', 'Gemeenschap', 'Geduld'],
  ARTIST:    ['Intuïtie', 'Innovatie', 'Spirit'],
  RULER:     ['Logica', 'Traditie', 'Geduld'],
  INNOCENT:  ['Spirit', 'Gemeenschap', 'Reflectie'],
  // Set B (Even questions)
  EXPLORER:  ['Innovatie', 'Actie', 'Bewustzijn'],
  OUTLAW:    ['Actie', 'Veerkracht', 'Innovatie'],
  CAREGIVER: ['Empathie', 'Gemeenschap', 'Geduld'],
  MAGICIAN:  ['Intuïtie', 'Spirit', 'Veerkracht'],
  JUDGE:     ['Logica', 'Traditie', 'Bewustzijn'],
  TRICKSTER: ['Innovatie', 'Bewustzijn', 'Spirit'],
};

/**
 * Compute radar chart data from raw answers.
 * Single-choice scoring: each selected answer adds 5 pts to its archetype.
 * 
 * @param {Object} layerAnswers - { layerIndex: { questionId: answerId }, ... }
 * @param {Array}  questions    - Full question definitions (from questions/index.js)
 * @returns {Array<{ subject: string, A: number, fullMark: number }>}
 */
export function computeRadarScores(layerAnswers, questions) {
  const archetypeScores = {};
  ALL_ARCHETYPE_KEYS.forEach(key => { archetypeScores[key] = 0; });

  if (layerAnswers && questions) {
    Object.entries(layerAnswers).forEach(([layerIdxStr, layerData]) => {
      if (!layerData || typeof layerData !== 'object') return;
      const layerIdx = parseInt(layerIdxStr, 10);
      const layer = questions.find(q => q.layerIndex === layerIdx);
      if (!layer) return;
      Object.entries(layerData).forEach(([questionIdStr, answerVal]) => {
        const questionId = parseInt(questionIdStr, 10) || questionIdStr;
        const question = layer.questions.find(q => q.id === questionId);
        if (!question) return;
        // Normalize to array (backward compat with single-value)
        const selections = Array.isArray(answerVal) ? answerVal : [answerVal];
        selections.forEach((aid) => {
          const selectedAnswer = question.answers.find(a => a.id === aid);
          if (!selectedAnswer) return;
          const archetype = selectedAnswer.archetype;
          if (archetype) {
            archetypeScores[archetype] = (archetypeScores[archetype] || 0) + 5;
          }
        });
      });
    });
  }

  return ARCHETYPE_RADAR_LABELS.map(label => {
    const key = label.toUpperCase();
    return {
      subject: label,
      A: archetypeScores[key] || 0,
      fullMark: 720,
    };
  });
}

/**
 * Compute subgroup polarity scores from archetype distribution.
 * Shows the balance between Set A and Set B archetype within each functional group.
 * 
 * @param {Object} layerAnswers - { layerIndex: { questionId: answerId }, ... }
 * @param {Array}  questions    - Full question definitions
 * @returns {Array<{ id, leftLabel, leftScore, rightLabel, rightScore, group, axis }>}
 */
export function computeSubgroups(layerAnswers, questions) {
  // Tally archetype hits (each selection counts as 1 hit)
  const archetypeCounts = {};
  if (layerAnswers && questions) {
    Object.entries(layerAnswers).forEach(([layerIdxStr, layerData]) => {
      if (!layerData || typeof layerData !== 'object') return;
      const layerIdx = parseInt(layerIdxStr, 10);
      const layer = questions.find(q => q.layerIndex === layerIdx);
      if (!layer) return;
      Object.entries(layerData).forEach(([questionIdStr, answerVal]) => {
        const questionId = parseInt(questionIdStr, 10) || questionIdStr;
        const question = layer.questions.find(q => q.id === questionId);
        if (!question) return;
        const selections = Array.isArray(answerVal) ? answerVal : [answerVal];
        selections.forEach(aid => {
          const selectedAnswer = question.answers.find(a => a.id === aid);
          if (!selectedAnswer) return;
          const archetype = selectedAnswer.archetype;
          if (archetype) archetypeCounts[archetype] = (archetypeCounts[archetype] || 0) + 1;
        });
      });
    });
  }
  
  return SUBGROUP_POLARITIES.map(p => {
    const leftKey = p.leftLabel.toUpperCase();
    const rightKey = p.rightLabel.toUpperCase();
    const leftCount = archetypeCounts[leftKey] || 0;
    const rightCount = archetypeCounts[rightKey] || 0;
    const total = leftCount + rightCount || 1;
    return {
      ...p,
      leftScore: Math.round((leftCount / total) * 100),
      rightScore: Math.round((rightCount / total) * 100),
    };
  });
}

/**
 * Determine primary archetype from answer distribution.
 * 
 * @param {Object} layerAnswers - { layerIndex: { questionId: answerId }, ... }
 * @param {Array}  questions - Full question definitions
 * @returns {{ primary: string, secondary: string, counts: Object }}
 */
export function determineArchetype(layerAnswers, questions) {
  const counts = {};
  
  if (layerAnswers && questions) {
    Object.entries(layerAnswers).forEach(([layerIdxStr, layerData]) => {
      if (!layerData || typeof layerData !== 'object') return;
      const layerIdx = parseInt(layerIdxStr, 10);
      const layer = questions.find(q => q.layerIndex === layerIdx);
      if (!layer) return;
      Object.entries(layerData).forEach(([questionIdStr, answerVal]) => {
        const questionId = parseInt(questionIdStr, 10) || questionIdStr;
        const question = layer.questions.find(q => q.id === questionId);
        if (!question) return;
        const selections = Array.isArray(answerVal) ? answerVal : [answerVal];
        selections.forEach((aid, idx) => {
          const selectedAnswer = question.answers.find(a => a.id === aid);
          if (!selectedAnswer) return;
          const archetype = selectedAnswer.archetype;
          // Weight: primary choice counts more than secondary
          const weight = idx === 0 ? 3 : 2;
          if (archetype) counts[archetype] = (counts[archetype] || 0) + weight;
        });
      });
    });
  }
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return {
    primary: sorted[0]?.[0] || 'SAGE',
    secondary: sorted[1]?.[0] || 'EXPLORER',
    counts,
  };
}


// ═══════════════════════════════════════════════════════════════════════
// ARCHETYPE-BASED SCORING — Direct 12-point radar & harmony bonus
// ═══════════════════════════════════════════════════════════════════════

/**
 * The 12 archetype labels for radar chart anchors.
 * Wheel position order 1→12 (Neuraal Schakelbord).
 */
export const ARCHETYPE_RADAR_LABELS = [
  'Judge',      //  1 — G1: Ruling (CEN)
  'Lover',      //  2 — G2: Relational (Limbisch)
  'Caregiver',  //  3 — G2: Relational (Limbisch)
  'Innocent',   //  4 — G3: Seeker (Openness)
  'Explorer',   //  5 — G3: Seeker (Openness)
  'Outlaw',     //  6 — G4: Chaos (Salience)
  'Trickster',  //  7 — G4: Chaos (Salience)
  'Sage',       //  8 — G5: Abstract (DMN)
  'Artist',     //  9 — G5: Abstract (DMN)
  'Magician',   // 10 — G6: Agency (Extraversie)
  'Hero',       // 11 — G6: Agency (Extraversie)
  'Ruler',      // 12 — G1: Ruling (CEN)
];

/**
 * All 12 archetype keys in wheel position order 1→12.
 */
export const ALL_ARCHETYPE_KEYS = [
  'JUDGE', 'LOVER', 'CAREGIVER', 'INNOCENT',
  'EXPLORER', 'OUTLAW', 'TRICKSTER', 'SAGE',
  'ARTIST', 'MAGICIAN', 'HERO', 'RULER',
];

/**
 * Archetype numbering on the 12-position wheel (Neuraal Schakelbord).
 */
export const ARCHETYPE_NUMBERS = {
  JUDGE: 1, LOVER: 2, CAREGIVER: 3, INNOCENT: 4,
  EXPLORER: 5, OUTLAW: 6, TRICKSTER: 7, SAGE: 8,
  ARTIST: 9, MAGICIAN: 10, HERO: 11, RULER: 12,
};

/**
 * Blue Line pairs — Symbiotische Brug (horizontal axis).
 * Feedback circuits that complement each other — positions sum to 13.
 * Triggers +33 Beheersings Bonus when Main & Support form a Blue Line pair.
 *
 * Ruler(12)    ↔ Judge(1)
 * Lover(2)     ↔ Hero(11)
 * Caregiver(3) ↔ Magician(10)
 * Innocent(4)  ↔ Artist(9)
 * Explorer(5)  ↔ Sage(8)
 * Outlaw(6)    ↔ Trickster(7)
 */
export const BLUE_LINE = {
  RULER: 'JUDGE',       JUDGE: 'RULER',        // 12 ↔ 1
  LOVER: 'HERO',        HERO: 'LOVER',         // 2 ↔ 11
  CAREGIVER: 'MAGICIAN', MAGICIAN: 'CAREGIVER', // 3 ↔ 10
  INNOCENT: 'ARTIST',   ARTIST: 'INNOCENT',    // 4 ↔ 9
  EXPLORER: 'SAGE',     SAGE: 'EXPLORER',      // 5 ↔ 8
  OUTLAW: 'TRICKSTER',  TRICKSTER: 'OUTLAW',   // 6 ↔ 7
};

// Legacy alias
export const COMPLEMENTARY_PAIRS = { ...BLUE_LINE };

/**
 * Shadow archetype pairs (psychological tension / integration point).
 */
export const SHADOW_PAIRS = {
  // 180° Individuation pairs (position + 6 on wheel)
  JUDGE: 'TRICKSTER',    TRICKSTER: 'JUDGE',      // 1 ↔ 7
  LOVER: 'SAGE',         SAGE: 'LOVER',           // 2 ↔ 8
  CAREGIVER: 'ARTIST',   ARTIST: 'CAREGIVER',     // 3 ↔ 9
  INNOCENT: 'MAGICIAN',  MAGICIAN: 'INNOCENT',    // 4 ↔ 10
  EXPLORER: 'HERO',      HERO: 'EXPLORER',        // 5 ↔ 11
  OUTLAW: 'RULER',       RULER: 'OUTLAW',         // 6 ↔ 12
};

/**
 * Map archetype key → functional group (neurobiological).
 */
export const ARCHETYPE_TO_GROUP = {
  // Ruling (CEN Dominantie)
  JUDGE: 'RULING',    RULER: 'RULING',
  // Relational (Limbic Coupling)
  LOVER: 'RELATIONAL', CAREGIVER: 'RELATIONAL',
  // Seeker (Hoge Openness)
  INNOCENT: 'SEEKER',  EXPLORER: 'SEEKER',
  // Chaos (Salience Network)
  OUTLAW: 'CHAOS',    TRICKSTER: 'CHAOS',
  // Abstract (DMN Hyper-connectie)
  SAGE: 'ABSTRACT',   ARTIST: 'ABSTRACT',
  // Agency (Extraversie/Wilskracht)
  MAGICIAN: 'AGENCY', HERO: 'AGENCY',
};

// ═══════════════════════════════════════════════════════════════════════
// LINE CONNECTION MAPS — Triple Network Model Geometry
// ═══════════════════════════════════════════════════════════════════════

/**
 * GREEN LINE: Hardware Anker (group partner — same biological substrate).
 * The 6 Groene Bogen / Het Moederbord.
 * Nature +3 distribution flows to this partner.
 *
 * G1 (CEN):      Ruler(12)    ↔ Judge(1)
 * G2 (Limbisch):  Lover(2)     ↔ Caregiver(3)
 * G3 (Seeker):    Innocent(4)  ↔ Explorer(5)
 * G4 (Salience):  Outlaw(6)    ↔ Trickster(7)
 * G5 (Abstract):  Sage(8)      ↔ Artist(9)
 * G6 (Agency):    Magician(10) ↔ Hero(11)
 */
export const GREEN_LINE = {
  JUDGE: 'RULER',       RULER: 'JUDGE',        // G1: CEN
  LOVER: 'CAREGIVER',   CAREGIVER: 'LOVER',    // G2: Limbisch
  INNOCENT: 'EXPLORER', EXPLORER: 'INNOCENT',  // G3: Seeker
  OUTLAW: 'TRICKSTER',  TRICKSTER: 'OUTLAW',   // G4: Salience
  SAGE: 'ARTIST',       ARTIST: 'SAGE',        // G5: Abstract
  MAGICIAN: 'HERO',     HERO: 'MAGICIAN',      // G6: Agency
};

/**
 * YELLOW LINES A & B: Same-cluster archetypes at distance 4 on the wheel.
 * Cognitive network synergy — shared meta-network (Cluster 1 or 2).
 *
 * Cluster 1 (CEN+Openness+DMN): Judge(1), Innocent(4), Explorer(5), Sage(8), Artist(9), Ruler(12)
 * Cluster 2 (Limbic+Salience+Agency): Lover(2), Caregiver(3), Outlaw(6), Trickster(7), Magician(10), Hero(11)
 */
export const YELLOW_LINES = {
  JUDGE:     ['EXPLORER', 'ARTIST'],     // 1 → 5(dist4), 9(dist4)
  LOVER:     ['OUTLAW', 'MAGICIAN'],     // 2 → 6(dist4), 10(dist4)
  CAREGIVER: ['TRICKSTER', 'HERO'],      // 3 → 7(dist4), 11(dist4)
  INNOCENT:  ['SAGE', 'RULER'],          // 4 → 8(dist4), 12(dist4)
  EXPLORER:  ['JUDGE', 'ARTIST'],        // 5 → 1(dist4), 9(dist4)
  OUTLAW:    ['LOVER', 'MAGICIAN'],      // 6 → 2(dist4), 10(dist4)
  TRICKSTER: ['CAREGIVER', 'HERO'],      // 7 → 3(dist4), 11(dist4)
  SAGE:      ['INNOCENT', 'RULER'],      // 8 → 4(dist4), 12(dist4)
  ARTIST:    ['JUDGE', 'EXPLORER'],      // 9 → 1(dist4), 5(dist4)
  MAGICIAN:  ['LOVER', 'OUTLAW'],        // 10 → 2(dist4), 6(dist4)
  HERO:      ['CAREGIVER', 'TRICKSTER'], // 11 → 3(dist4), 7(dist4)
  RULER:     ['INNOCENT', 'SAGE'],       // 12 → 4(dist4), 8(dist4)
};

/**
 * RED LINE: Neurale Kortsluiting (vertical axis — biological hardware conflict).
 * Connects archetypes whose biological networks clash when activated together.
 */
export const RED_LINE = {
  RULER: 'TRICKSTER',    TRICKSTER: 'RULER',      // 12 ↔ 7
  JUDGE: 'OUTLAW',       OUTLAW: 'JUDGE',         // 1 ↔ 6
  LOVER: 'EXPLORER',     EXPLORER: 'LOVER',       // 2 ↔ 5
  CAREGIVER: 'INNOCENT', INNOCENT: 'CAREGIVER',   // 3 ↔ 4
  HERO: 'SAGE',          SAGE: 'HERO',            // 11 ↔ 8
  ARTIST: 'MAGICIAN',    MAGICIAN: 'ARTIST',      // 9 ↔ 10
};

/**
 * PURPLE LINE: 180° shadow on the wheel (position + 6).
 * Same as SHADOW_PAIRS — extreme neurological tension/counterpart.
 */
export const PURPLE_LINE = { ...SHADOW_PAIRS };

/**
 * Scoring Tier Definitions.
 * Each tier defines the point distribution for Nature and Culture picks.
 */
export const SCORING_TIERS = {
  BEGINNER: {
    id: 'BEGINNER',
    label: 'Beginner (Gedrag)',
    description: 'Basis motor — laagdrempelige meting, 10 pts/klik (Nature 5+3+2, Culture 3+3+3+1)',
    nature:  { core: 5, green: 3, purple: 2 },
    culture: { core: 3, yellowA: 3, yellowB: 3, red: 1 },
    baseMax: 600,
  },
  INTERMEDIATE: {
    id: 'INTERMEDIATE',
    label: 'Intermediate (Motivatie)',
    description: 'Genormaliseerde motor — 10 pts/klik, scherpe pieken',
    nature:  { core: 7, green: 3 },
    culture: { core: 4, yellowA: 3, yellowB: 3 },
    baseMax: 600,
  },
  ADVANCED: {
    id: 'ADVANCED',
    label: 'Advanced (Ontologie)',
    description: 'Schaduw/Frictie motor — 12/11 pts/klik + shadow + blindspot integration',
    nature:  { core: 7, green: 3, purple: 1, red: 1 },
    culture: { core: 5, yellowA: 3, yellowB: 3 },
    baseMax: 720,
  },
};

/**
 * Extended Archetype Matrix: 12 Main × 6 Support Groups = 72 outcomes.
 * Key format: "MAINKEY_GROUPNAME"
 * Based on neuro-archetypal framework with 6 biological support groups:
 * RULING, RELATIONAL, SEEKER, CHAOS, ABSTRACT, AGENCY
 */
export const EXTENDED_ARCHETYPES = {
  // Main: JUDGE (Positie 1)
  JUDGE_RULING: 'The Arbiter', JUDGE_RELATIONAL: 'The Mediator',
  JUDGE_SEEKER: 'The Examiner', JUDGE_CHAOS: 'The Whistleblower',
  JUDGE_ABSTRACT: 'The Critic', JUDGE_AGENCY: 'The Avenger',

  // Main: LOVER (Positie 2)
  LOVER_RELATIONAL: 'The Soulmate', LOVER_SEEKER: 'The Poet',
  LOVER_CHAOS: 'The Seducer', LOVER_ABSTRACT: 'The Mystic',
  LOVER_AGENCY: 'The Romantic', LOVER_RULING: 'The Companion',

  // Main: CAREGIVER (Positie 3)
  CAREGIVER_RELATIONAL: 'The Healer', CAREGIVER_SEEKER: 'The Pathfinder',
  CAREGIVER_CHAOS: 'The Cultivator', CAREGIVER_ABSTRACT: 'The Therapist',
  CAREGIVER_AGENCY: 'The Protector', CAREGIVER_RULING: 'The Advocate',

  // Main: INNOCENT (Positie 4)
  INNOCENT_SEEKER: 'The Saint', INNOCENT_CHAOS: 'The Free Spirit',
  INNOCENT_ABSTRACT: 'The Disciple', INNOCENT_AGENCY: 'The Pioneer',
  INNOCENT_RULING: 'The Shepherd', INNOCENT_RELATIONAL: 'The Samaritan',

  // Main: EXPLORER (Positie 5)
  EXPLORER_SEEKER: 'The Navigator', EXPLORER_CHAOS: 'The Innovator',
  EXPLORER_ABSTRACT: 'The Scholar', EXPLORER_AGENCY: 'The Sailor',
  EXPLORER_RULING: 'The Scout', EXPLORER_RELATIONAL: 'The Networker',

  // Main: OUTLAW (Positie 6)
  OUTLAW_CHAOS: 'The Anarchist', OUTLAW_ABSTRACT: 'The Iconoclast',
  OUTLAW_AGENCY: 'The Revolutionary', OUTLAW_RULING: 'The Reformer',
  OUTLAW_RELATIONAL: 'The Liberator', OUTLAW_SEEKER: 'The Renegade',

  // Main: TRICKSTER (Positie 7)
  TRICKSTER_CHAOS: 'The Fool', TRICKSTER_ABSTRACT: 'The Comedian',
  TRICKSTER_AGENCY: 'The Saboteur', TRICKSTER_RULING: 'The Jester',
  TRICKSTER_RELATIONAL: 'The Clown', TRICKSTER_SEEKER: 'The Shapeshifter',

  // Main: SAGE (Positie 8)
  SAGE_ABSTRACT: 'The Enlightened', SAGE_AGENCY: 'The Detective',
  SAGE_RULING: 'The Analyst', SAGE_RELATIONAL: 'The Mentor',
  SAGE_SEEKER: 'The Dreamer', SAGE_CHAOS: 'The Hermit',

  // Main: ARTIST (Positie 9)
  ARTIST_ABSTRACT: 'The Demiurge', ARTIST_AGENCY: 'The Forgemaster',
  ARTIST_RULING: 'The Architect', ARTIST_RELATIONAL: 'The Storyteller',
  ARTIST_SEEKER: 'The Visionary', ARTIST_CHAOS: 'The Illusionist',

  // Main: MAGICIAN (Positie 10)
  MAGICIAN_AGENCY: 'The Alchemist', MAGICIAN_RULING: 'The Engineer',
  MAGICIAN_RELATIONAL: 'The Shaman', MAGICIAN_SEEKER: 'The Oracle',
  MAGICIAN_CHAOS: 'The Enchanter', MAGICIAN_ABSTRACT: 'The Sorcerer',

  // Main: HERO (Positie 11)
  HERO_AGENCY: 'The Legend', HERO_RULING: 'The Commander',
  HERO_RELATIONAL: 'The Guardian', HERO_SEEKER: 'The Inventor',
  HERO_CHAOS: 'The Ronin', HERO_ABSTRACT: 'The Strategist',

  // Main: RULER (Positie 12)
  RULER_RULING: 'The Emperor', RULER_RELATIONAL: 'The Patriarch/Matriarch',
  RULER_SEEKER: 'The Entrepreneur', RULER_CHAOS: 'The Maverick',
  RULER_ABSTRACT: 'The Philosopher-King', RULER_AGENCY: 'The Conqueror',
};

/**
 * Get the Extended Archetype name from main + support archetype keys.
 * @param {string} mainKey - e.g. 'SAGE'
 * @param {string} supportKey - e.g. 'OUTLAW'
 * @returns {string} Extended archetype name, e.g. 'The Detective'
 */
export function getExtendedArchetype(mainKey, supportKey) {
  const supportGroup = ARCHETYPE_TO_GROUP[supportKey] || 'WISDOM';
  const lookupKey = `${mainKey}_${supportGroup}`;
  return EXTENDED_ARCHETYPES[lookupKey] || mainKey;
}

/**
 * Check whether two archetypes form a complementary (harmony) pair.
 * @param {string} key1
 * @param {string} key2
 * @returns {boolean}
 */
export function isComplementaryPair(key1, key2) {
  return COMPLEMENTARY_PAIRS[key1] === key2;
}


// ═══════════════════════════════════════════════════════════════════════
// ADVANCED SCORING ENGINE — Nature/Culture Dual-Tracking (Ontology)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Ontologie Routing Clusters (fixed ID sets).
 * Cluster 1: IDs [1, 4, 8, 12, 5, 9] = Judge, Innocent, Sage, Ruler, Explorer, Artist
 * Cluster 2: IDs [2, 6, 10, 3, 7, 11] = Lover, Outlaw, Magician, Caregiver, Trickster, Hero
 */
const CLUSTER_1_IDS = new Set([1, 4, 8, 12, 5, 9]);
// Cluster 2 is the complement of Cluster 1 (checked via !CLUSTER_1_IDS.has())

/**
 * Reverse map: archetype key → wheel position ID.
 */
const KEY_TO_ID = {};
Object.entries(ARCHETYPE_NUMBERS).forEach(([key, id]) => { KEY_TO_ID[key] = id; });

/**
 * Neural Focus per group (for AI analysis context).
 */
export const GROUP_NEURAL_FOCUS = {
  RULING:     'CEN: Externe structuur & Wet',
  RELATIONAL: 'Limbic: Emotionele fusie',
  SEEKER:     'Openness: Pure ervaring',
  CHAOS:      'Salience: Disruptie & Waarheid',
  ABSTRACT:   'DMN: Interne reflectie',
  AGENCY:     'Extraversie: Wilskracht',
};

/**
 * Determine the Alpha/Beta state toggle for a given question number (1-60).
 *
 * Keys 1 & 2 (De Grondhouding) → ALPHA: Cluster 1 = Nature, Cluster 2 = Culture
 * Keys 3 & 4 (De Spiegeling)   → BETA:  Cluster 2 = Nature, Cluster 1 = Culture
 *
 * The 4-key cycle repeats every 4 questions (Q1→Key1, Q2→Key2, Q3→Key3, Q4→Key4, Q5→Key1, ...).
 * Each complete 4-question cycle is perfectly balanced 50/50 Nature/Culture.
 *
 * @param {number} questionNum - 1-based question number (1-60)
 * @returns {'ALPHA'|'BETA'}
 */
export function getStateToggle(questionNum) {
  const patternIndex = (questionNum - 1) % 4;
  // Keys 1&2 (patterns 0&1) → ALPHA, Keys 3&4 (patterns 2&3) → BETA
  return patternIndex < 2 ? 'ALPHA' : 'BETA';
}

/**
 * Determine whether a score goes to Nature or CultureForce bucket.
 *
 * @param {string} archetypeKey - e.g. 'JUDGE'
 * @param {'ALPHA'|'BETA'} stateToggle
 * @returns {'NATURE'|'CULTURE'}
 */
export function getNatureCultureBucket(archetypeKey, stateToggle) {
  const id = KEY_TO_ID[archetypeKey];
  if (!id) return 'NATURE'; // fallback
  const isCluster1 = CLUSTER_1_IDS.has(id);
  if (stateToggle === 'ALPHA') {
    return isCluster1 ? 'NATURE' : 'CULTURE';
  } else {
    return isCluster1 ? 'CULTURE' : 'NATURE';
  }
}

/**
 * Green Line Bonus check (Neurale Snelweg / Hardware Anker).
 * Returns true if the two archetypes are Green Line partners (same biological group).
 * Triggers +33 Beheersings Bonus when Main & Support share the same neural substrate.
 *
 * @param {string} key1 - archetype key
 * @param {string} key2 - archetype key
 * @returns {boolean} true if they are a Green Line pair (+33 Beheersings Bonus)
 */
export function isHarmonyPair(key1, key2) {
  return GREEN_LINE[key1] === key2;
}

/**
 * Check if two archetypes are 180° shadow opposites on the 12-point wheel.
 *
 * @param {string} key1
 * @param {string} key2
 * @returns {boolean}
 */
export function isShadowPair(key1, key2) {
  const id1 = ARCHETYPE_NUMBERS[key1];
  const id2 = ARCHETYPE_NUMBERS[key2];
  if (!id1 || !id2) return false;
  return Math.abs(id1 - id2) === 6;
}

/**
 * TIERED SCORING ENGINE — Line-based dual-tracking computation.
 *
 * Processes all 60 answers using the Triple Network Model geometry.
 * Points are distributed across connected archetypes via line connections
 * (Green, Yellow A/B, Red, Purple) based on the selected scoring tier.
 *
 * Produces:
 * - Per-archetype total, nature, and culture scores (with line-based distribution)
 * - Main & Support archetypes (with Nature tie-breaking)
 * - Harmony Bonus application (+69)
 * - Shadow & Blindspot identification
 * - Extended Archetype (72-matrix lookup)
 * - Polarization Index (Main vs Shadow gap)
 * - Authenticity Index (Nature ratio)
 * - Individuation detection (180° opposition between Main & Support)
 *
 * @param {Array<{questionId: number, answerId: string, archetype: string}>} responses
 *   Each response includes questionId (1-based) and archetype key.
 * @param {'BEGINNER'|'INTERMEDIATE'|'ADVANCED'} [tier='INTERMEDIATE'] - Scoring tier
 * @returns {Object} Full scoring result
 */
export function computeAdvancedScores(responses, tier = 'INTERMEDIATE') {
  const tierConfig = SCORING_TIERS[tier] || SCORING_TIERS.INTERMEDIATE;

  // Initialize per-archetype tracking
  const scores = {};
  ALL_ARCHETYPE_KEYS.forEach(key => {
    scores[key] = { total: 0, nature: 0, culture: 0 };
  });

  let totalNaturePoints = 0;
  let totalCulturePoints = 0;

  // Helper to add points to an archetype and route to the correct bucket
  function addPoints(archetypeKey, pts, bucket) {
    if (!scores[archetypeKey]) return;
    scores[archetypeKey].total += pts;
    if (bucket === 'NATURE') {
      scores[archetypeKey].nature += pts;
      totalNaturePoints += pts;
    } else {
      scores[archetypeKey].culture += pts;
      totalCulturePoints += pts;
    }
  }

  // Process each response
  if (responses && responses.length > 0) {
    for (const response of responses) {
      const questionNum = typeof response.questionId === 'number'
        ? response.questionId
        : parseInt(String(response.questionId), 10);

      if (!questionNum || questionNum < 1 || questionNum > 60) continue;

      const archetype = response.archetype;
      if (!archetype || !scores[archetype]) continue;

      const stateToggle = getStateToggle(questionNum);
      const bucket = getNatureCultureBucket(archetype, stateToggle);

      // ── Line-based point distribution per tier ──
      if (bucket === 'NATURE') {
        // Nature Pick → DNA-Meter (Hardware/Essentie/Flow)
        const cfg = tierConfig.nature;

        // Core points to the chosen archetype
        addPoints(archetype, cfg.core, 'NATURE');

        // Green Line: Hardware Anker (+3 Nature overflow to group partner)
        const greenPartner = GREEN_LINE[archetype];
        if (greenPartner && cfg.green) {
          addPoints(greenPartner, cfg.green, 'NATURE');
        }

        // Purple Line: 180° shadow (friction or shadow integration)
        const purplePartner = PURPLE_LINE[archetype];
        if (purplePartner && cfg.purple) {
          // Beginner: +2 (friction — oer-reflex suppresses shadow)
          // Advanced: +1 (shadow integration / Vonk van Individuatie)
          addPoints(purplePartner, cfg.purple, 'NATURE');
        }

        // Red Line: blindspot (Advanced Nature only — beheersing van projecties)
        const redPartnerNature = RED_LINE[archetype];
        if (redPartnerNature && cfg.red) {
          addPoints(redPartnerNature, cfg.red, 'NATURE');
        }
      } else {
        // Culture/Force Pick → Pantser-Meter (Software/Aangeleerd/Dwang)
        const cfg = tierConfig.culture;

        // Core points to the chosen archetype
        addPoints(archetype, cfg.core, 'CULTURE');

        // Yellow Line A: cognitive synergy partner 1
        const yellowPartners = YELLOW_LINES[archetype];
        if (yellowPartners && cfg.yellowA) {
          addPoints(yellowPartners[0], cfg.yellowA, 'CULTURE');
        }

        // Yellow Line B: cognitive synergy partner 2
        if (yellowPartners && cfg.yellowB) {
          addPoints(yellowPartners[1], cfg.yellowB, 'CULTURE');
        }

        // Red Line: neural short-circuit / friction (Beginner Culture)
        const redPartner = RED_LINE[archetype];
        if (redPartner && cfg.red) {
          addPoints(redPartner, cfg.red, 'CULTURE');
        }
      }
    }
  }

  // ── Determine Main & Support with Nature tie-breaking ──
  const sorted = ALL_ARCHETYPE_KEYS
    .map(key => ({ key, ...scores[key] }))
    .sort((a, b) => {
      // Primary sort: total score descending
      if (b.total !== a.total) return b.total - a.total;
      // Tie-break: highest Nature sub-score wins (biological essence leads)
      return b.nature - a.nature;
    });

  const mainArchetype = sorted[0]?.key || 'SAGE';
  const supportArchetype = sorted[1]?.key || 'EXPLORER';

  // ── Bonuses ──
    // +33 Beheersings Bonus: Main & Support connected via Green Line (Neurale Snelweg / same bio group)
  const hasBeheersingsBonus = isHarmonyPair(mainArchetype, supportArchetype);
  if (hasBeheersingsBonus) {
    scores[mainArchetype].total += 33;
  }

  // +69 Harmony Bonus: Main & Support connected via Purple Line (180° shadow)
  const hasShadowHarmony = isShadowPair(mainArchetype, supportArchetype);
  if (hasShadowHarmony) {
    scores[mainArchetype].total += 69;
  }

  // ── Shadow & Blindspot ──
  const shadowArchetype = SHADOW_PAIRS[mainArchetype] || null;
  const blindspotArchetype = SHADOW_PAIRS[supportArchetype] || null;

  // ── Extended Archetype (72-matrix) ──
  const supportGroup = ARCHETYPE_TO_GROUP[supportArchetype];
  const mainGroup = ARCHETYPE_TO_GROUP[mainArchetype];
  const extendedArchetypeName = getExtendedArchetype(mainArchetype, supportArchetype);

  // ── Detect 180° Individuation (Main & Support are shadow opposites) ──
  const isIndividuated = isShadowPair(mainArchetype, supportArchetype);

  // ── Polarization Index (Main vs Shadow gap) ──
  const mainScore = scores[mainArchetype]?.total || 0;
  const shadowScore = shadowArchetype ? (scores[shadowArchetype]?.total || 0) : 0;
  const polarizationIndex = mainScore - shadowScore;
  let polarizationLevel;
  if (hasBeheersingsBonus || hasShadowHarmony) {
    polarizationLevel = 'BONUS_ACTIVE'; // Bonus overrides polarization analysis
  } else if (polarizationIndex > 222) {
    polarizationLevel = 'HIGH_POLARIZATION'; // Shadow suppression — focus on blinde vlek
  } else if (polarizationIndex < 123) {
    polarizationLevel = 'HIGH_INDIVIDUATION'; // Paradox mastery
  } else {
    polarizationLevel = 'MODERATE';
  }

  // ── Authenticity Index (Nature ratio over total allocated score) ──
  const totalPointsAwarded = totalNaturePoints + totalCulturePoints;
  const authenticityIndex = totalPointsAwarded > 0
    ? Math.round((totalNaturePoints / totalPointsAwarded) * 100)
    : 50;
  let authenticityLevel;
  if (authenticityIndex > 75) {
    authenticityLevel = 'NATURE_DOMINANT'; // Biological flow navigation
  } else if (authenticityIndex < 35) {
    authenticityLevel = 'CULTURE_DOMINANT'; // Survival/adaptation mode (>65% Culture)
  } else {
    authenticityLevel = 'BALANCED';
  }

  // ── Build radar data (post bonus, wheel order 1→12) ──
  // fullMark = baseMax + 69 (max possible bonus)
  const radarFullMark = (tierConfig.baseMax || 720) + 69;
  const radarData = ARCHETYPE_RADAR_LABELS.map(label => {
    const key = label.toUpperCase();
    return {
      subject: label,
      A: scores[key]?.total || 0,
      nature: scores[key]?.nature || 0,
      culture: scores[key]?.culture || 0,
      fullMark: radarFullMark,
    };
  });

  // ── Subgroup polarity (6 neural pillars) ──
  const subgroupDynamics = SUBGROUP_POLARITIES.map(p => {
    const leftKey = p.leftLabel.toUpperCase();
    const rightKey = p.rightLabel.toUpperCase();
    const leftTotal = scores[leftKey]?.total || 0;
    const rightTotal = scores[rightKey]?.total || 0;
    const total = leftTotal + rightTotal || 1;
    return {
      ...p,
      leftScore: leftTotal,
      rightScore: rightTotal,
      leftPercent: Math.round((leftTotal / total) * 100),
      rightPercent: Math.round((rightTotal / total) * 100),
      leftNature: scores[leftKey]?.nature || 0,
      leftCulture: scores[leftKey]?.culture || 0,
      rightNature: scores[rightKey]?.nature || 0,
      rightCulture: scores[rightKey]?.culture || 0,
    };
  });

  // ── Nature ratio per archetype (for AI analysis) ──
  const archetypeDetails = ALL_ARCHETYPE_KEYS.map(key => ({
    key,
    position: ARCHETYPE_NUMBERS[key],
    group: ARCHETYPE_TO_GROUP[key],
    total: scores[key].total,
    nature: scores[key].nature,
    culture: scores[key].culture,
    natureRatio: scores[key].total > 0
      ? Math.round((scores[key].nature / scores[key].total) * 100)
      : 0,
  }));

  return {
    // Core result
    mainArchetype,
    supportArchetype,
    mainGroup,
    supportGroup,
    extendedArchetypeName,

    // Shadow analysis
    shadowArchetype,
    blindspotArchetype,
    shadowScore,
    isIndividuated,

    // Bonuses
    hasBeheersingsBonus,          // +33 Blue Line (Symbiotische Brug)
    beheersingsBonus: hasBeheersingsBonus ? 33 : 0,
    hasShadowHarmony,             // +69 Purple Line (180° shadow integration)
    harmonyBonus: hasShadowHarmony ? 69 : 0,
    // Legacy compatibility fields
    hasHarmonyBonus: hasBeheersingsBonus || hasShadowHarmony,
    harmonyBonusApplied: (hasBeheersingsBonus ? 33 : 0) + (hasShadowHarmony ? 69 : 0),

    // Advanced metrics
    polarizationIndex,
    polarizationLevel,
    authenticityIndex,
    authenticityLevel,
    totalNaturePoints,
    totalCulturePoints,
    totalPointsAwarded,

    // Tier info
    tier: tierConfig.id,
    tierLabel: tierConfig.label,

    // Detailed breakdown
    scores,
    archetypeDetails,
    radarData,
    subgroupDynamics,

    // Max possible (excl. bonuses)
    baseMaxScore: tierConfig.baseMax || 720,
    totalMaxScore: (tierConfig.baseMax || 720) + 69, // with max bonus (Purple Line)

    // OCEAN scores (0–100), mathematically derived from archetype weights
    oceanScores: computeOceanScores(scores),
  };
}

// ═══════════════════════════════════════════════════════════════
// OCEAN Score Calculator (0-100)
//
// Each archetype has a fixed OCEAN profile (1-10 per dimension).
// The user's archetype scores weight their contribution to each
// OCEAN dimension. Result is a weighted average normalized to 0-100.
//
// Formula per dimension D:
//   raw_D = Σ (archetype_total × archetype_ocean_D) / Σ archetype_total
//   score_D = (raw_D - 1) / 9 × 100   (maps 1-10 → 0-100)
// ═══════════════════════════════════════════════════════════════

const ARCHETYPE_OCEAN_MAP = {
  JUDGE:     { O: 4, C: 9, E: 4, A: 3, N: 3 },
  LOVER:     { O: 7, C: 4, E: 7, A: 9, N: 7 },
  CAREGIVER: { O: 5, C: 7, E: 5, A: 9, N: 7 },
  INNOCENT:  { O: 7, C: 6, E: 5, A: 9, N: 3 },
  EXPLORER:  { O: 9, C: 3, E: 6, A: 4, N: 4 },
  OUTLAW:    { O: 7, C: 3, E: 6, A: 1, N: 7 },
  TRICKSTER: { O: 9, C: 2, E: 7, A: 4, N: 4 },
  SAGE:      { O: 9, C: 6, E: 3, A: 4, N: 5 },
  ARTIST:    { O: 9, C: 4, E: 5, A: 5, N: 7 },
  MAGICIAN:  { O: 9, C: 4, E: 5, A: 4, N: 3 },
  HERO:      { O: 4, C: 9, E: 7, A: 4, N: 3 },
  RULER:     { O: 4, C: 9, E: 6, A: 4, N: 3 },
};

/**
 * Compute OCEAN personality scores (0-100) from archetype score breakdown.
 *
 * @param {Object} scores - Per-archetype score object { [key]: { total, nature, culture } }
 * @returns {{ O: number, C: number, E: number, A: number, N: number }}
 */
export function computeOceanScores(scores) {
  const dims = ['O', 'C', 'E', 'A', 'N'];
  let totalWeight = 0;
  const weighted = { O: 0, C: 0, E: 0, A: 0, N: 0 };

  for (const key of ALL_ARCHETYPE_KEYS) {
    const w = scores[key]?.total || 0;
    totalWeight += w;
    const profile = ARCHETYPE_OCEAN_MAP[key];
    if (!profile) continue;
    for (const d of dims) {
      weighted[d] += w * profile[d];
    }
  }

  if (totalWeight === 0) {
    return { O: 50, C: 50, E: 50, A: 50, N: 50 };
  }

  const result = {};
  for (const d of dims) {
    const raw = weighted[d] / totalWeight; // 1-10 scale
    result[d] = Math.round(((raw - 1) / 9) * 100); // normalize to 0-100
  }
  return result;
}
