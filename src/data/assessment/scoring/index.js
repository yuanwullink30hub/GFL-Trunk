/**
 * Scoring Algorithm — Master Index
 * 
 * Contains the scoring logic that converts raw user answers into:
 * 1. Per-archetype scores (12 archetypes, +5 pts per answer, max 300 base)
 * 2. Harmony Bonus (+69 pts to Main & Support if complementary pair)
 * 3. Radar chart data (12 archetype anchors, 0-369 scale)
 * 4. Subgroup dynamics (6 archetype group polarity pairs)
 * 5. Primary & secondary archetype determination
 * 6. Extended Archetype name (72-outcome matrix)
 * 
 * Scoring Rules:
 *   Single choice: +5 pts to the answer's archetype
 *   Dual choice: Primary +3 pts, Secondary +2 pts
 *   Base max: 60 × 5 = 300 pts
 *   Harmony Bonus: +69 to BOTH Main & Support if complementary pair
 *   Total max: 369 pts
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
 * The 6 subgroup polarity pairs — mapped to the 6 Archetype Functional Groups.
 * Each pair shows the tension between the Set A and Set B archetype in that group.
 */
export const SUBGROUP_POLARITIES = [
  { id: 1, leftLabel: 'Sage',     rightLabel: 'Explorer',  group: 'Wisdom',     axis: 'Waarheidsvinding' },
  { id: 2, leftLabel: 'Hero',     rightLabel: 'Outlaw',    group: 'Action',     axis: 'Transformatie door Actie' },
  { id: 3, leftLabel: 'Lover',    rightLabel: 'Caregiver', group: 'Relational', axis: 'Relatie & Verbinding' },
  { id: 4, leftLabel: 'Artist',   rightLabel: 'Magician',  group: 'Creative',   axis: 'Manifestatie & Creatie' },
  { id: 5, leftLabel: 'Ruler',    rightLabel: 'Judge',     group: 'Ruling',     axis: 'Autoriteit & Structuur' },
  { id: 6, leftLabel: 'Innocent', rightLabel: 'Trickster', group: 'Spirit',     axis: 'Eerlijkheid & Perspectief' },
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
 * Dual-choice scoring: Primary (1st pick) +3 pts, Secondary (2nd pick) +2 pts.
 * 
 * @param {Object} layerAnswers - { layerIndex: { questionId: [answerId1, answerId2?] }, ... }
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
        selections.forEach((aid, idx) => {
          const selectedAnswer = question.answers.find(a => a.id === aid);
          if (!selectedAnswer) return;
          const archetype = selectedAnswer.archetype;
          const pts = idx === 0 ? 3 : 2; // Primary +3, Secondary +2
          if (archetype) {
            archetypeScores[archetype] = (archetypeScores[archetype] || 0) + pts;
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
      fullMark: 369,
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
  // Tally archetype hits (dual-choice: each selection counts as 1 hit)
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
 * Clockwise "Value Web" starting at 12 o'clock (Ruler).
 * Smooth Big-5 transitions: Structure → Empathy → Creativity → Rebellion → Power → back.
 */
export const ARCHETYPE_RADAR_LABELS = [
  'Ruler',      // 12 — High Conscientiousness, High Extraversion
  'Judge',      //  1 — High Conscientiousness, Low Agreeableness
  'Sage',       //  2 — High Conscientiousness, High Openness
  'Innocent',   //  3 — High Agreeableness, Introverted
  'Caregiver',  //  4 — High Agreeableness, High Conscientiousness
  'Lover',      //  5 — High Agreeableness, High Extraversion
  'Artist',     //  6 — High Openness, High Agreeableness
  'Explorer',   //  7 — High Openness, Low Conscientiousness
  'Trickster',  //  8 — High Openness, High Extraversion, Low Conscientiousness
  'Outlaw',     //  9 — Low Agreeableness, Low Conscientiousness
  'Magician',   // 10 — High Openness, High Extraversion
  'Hero',       // 11 — High Extraversion, High Conscientiousness
];

/**
 * All 12 archetype keys in radar label order (Value Web clockwise).
 */
export const ALL_ARCHETYPE_KEYS = [
  'RULER', 'JUDGE', 'SAGE', 'INNOCENT',
  'CAREGIVER', 'LOVER', 'ARTIST', 'EXPLORER',
  'TRICKSTER', 'OUTLAW', 'MAGICIAN', 'HERO',
];

/**
 * Complementary archetype pairs for the Harmony Bonus (+69).
 * When Main and Support archetypes form a pair, both scores get +69.
 */
export const COMPLEMENTARY_PAIRS = {
  SAGE: 'EXPLORER',   EXPLORER: 'SAGE',
  HERO: 'OUTLAW',     OUTLAW: 'HERO',
  LOVER: 'CAREGIVER', CAREGIVER: 'LOVER',
  ARTIST: 'MAGICIAN', MAGICIAN: 'ARTIST',
  RULER: 'JUDGE',     JUDGE: 'RULER',
  INNOCENT: 'TRICKSTER', TRICKSTER: 'INNOCENT',
};

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
  RULER_RULING: 'The Emperor', RULER_RELATIONAL: 'The Patriarch',
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
