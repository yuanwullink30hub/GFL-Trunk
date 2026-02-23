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
 * Arranged as complementary pairs (adjacent) for balanced visual layout.
 */
export const ARCHETYPE_RADAR_LABELS = [
  'Sage', 'Explorer',       // Wisdom pair
  'Hero', 'Outlaw',         // Action pair
  'Lover', 'Caregiver',     // Relational pair
  'Artist', 'Magician',     // Creative pair
  'Ruler', 'Judge',         // Ruling pair
  'Innocent', 'Trickster',  // Spirit pair
];

/**
 * All 12 archetype keys in radar label order.
 */
export const ALL_ARCHETYPE_KEYS = [
  'SAGE', 'EXPLORER', 'HERO', 'OUTLAW',
  'LOVER', 'CAREGIVER', 'ARTIST', 'MAGICIAN',
  'RULER', 'JUDGE', 'INNOCENT', 'TRICKSTER',
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
  SAGE: 'TRICKSTER',   TRICKSTER: 'SAGE',
  RULER: 'OUTLAW',     OUTLAW: 'RULER',
  HERO: 'CAREGIVER',   CAREGIVER: 'HERO',
  INNOCENT: 'EXPLORER', EXPLORER: 'INNOCENT',
  ARTIST: 'JUDGE',     JUDGE: 'ARTIST',
  MAGICIAN: 'LOVER',   LOVER: 'MAGICIAN',
};

/**
 * Map archetype key → functional group.
 */
export const ARCHETYPE_TO_GROUP = {
  SAGE: 'WISDOM',     EXPLORER: 'WISDOM',
  HERO: 'ACTION',     OUTLAW: 'ACTION',
  LOVER: 'RELATIONAL', CAREGIVER: 'RELATIONAL',
  ARTIST: 'CREATIVE', MAGICIAN: 'CREATIVE',
  RULER: 'RULING',    JUDGE: 'RULING',
  INNOCENT: 'SPIRIT', TRICKSTER: 'SPIRIT',
};

/**
 * Extended Archetype Matrix: 12 Main × 6 Support Groups = 72 outcomes.
 * Key format: "MAINKEY_GROUPNAME"
 */
export const EXTENDED_ARCHETYPES = {
  // Main: SAGE
  SAGE_WISDOM: 'The Enlightened', SAGE_ACTION: 'The Detective',
  SAGE_RELATIONAL: 'The Mentor', SAGE_CREATIVE: 'The Alchemist',
  SAGE_RULING: 'The Analyst', SAGE_SPIRIT: 'The Hermit',
  // Main: HERO
  HERO_ACTION: 'The Legend', HERO_WISDOM: 'The Strategist',
  HERO_RELATIONAL: 'The Guardian', HERO_CREATIVE: 'The Inventor',
  HERO_RULING: 'The Commander', HERO_SPIRIT: 'The Paladin',
  // Main: LOVER
  LOVER_RELATIONAL: 'The Soulmate', LOVER_WISDOM: 'The Mystic',
  LOVER_ACTION: 'The Hedonist', LOVER_CREATIVE: 'The Poet',
  LOVER_RULING: 'The Partner', LOVER_SPIRIT: 'The Companion',
  // Main: ARTIST
  ARTIST_CREATIVE: 'The Demiurge', ARTIST_WISDOM: 'The Visionary',
  ARTIST_ACTION: 'The Engineer', ARTIST_RELATIONAL: 'The Storyteller',
  ARTIST_RULING: 'The Architect', ARTIST_SPIRIT: 'The Dreamer',
  // Main: RULER
  RULER_RULING: 'The Emperor', RULER_WISDOM: 'The Philosopher-King',
  RULER_ACTION: 'The Conqueror', RULER_RELATIONAL: 'The Patriarch',
  RULER_CREATIVE: 'The Entrepreneur', RULER_SPIRIT: 'The Sovereign',
  // Main: INNOCENT
  INNOCENT_SPIRIT: 'The Saint', INNOCENT_WISDOM: 'The Disciple',
  INNOCENT_ACTION: 'The Pioneer', INNOCENT_RELATIONAL: 'The Child',
  INNOCENT_CREATIVE: 'The Utopian', INNOCENT_RULING: 'The Traditionalist',
  // Main: EXPLORER
  EXPLORER_WISDOM: 'The Navigator', EXPLORER_ACTION: 'The Wanderer',
  EXPLORER_RELATIONAL: 'The Networker', EXPLORER_CREATIVE: 'The Innovator',
  EXPLORER_RULING: 'The Scout', EXPLORER_SPIRIT: 'The Scholar',
  // Main: OUTLAW
  OUTLAW_ACTION: 'The Anarchist', OUTLAW_WISDOM: 'The Iconoclast',
  OUTLAW_RELATIONAL: 'The Liberator', OUTLAW_CREATIVE: 'The Provocateur',
  OUTLAW_RULING: 'The Reformer', OUTLAW_SPIRIT: 'The Revolutionary',
  // Main: CAREGIVER
  CAREGIVER_RELATIONAL: 'The Healer', CAREGIVER_WISDOM: 'The Therapist',
  CAREGIVER_ACTION: 'The Protector', CAREGIVER_CREATIVE: 'The Cultivator',
  CAREGIVER_RULING: 'The Advocate', CAREGIVER_SPIRIT: 'The Samaritan',
  // Main: MAGICIAN
  MAGICIAN_CREATIVE: 'The Illusionist', MAGICIAN_WISDOM: 'The Shaman',
  MAGICIAN_ACTION: 'The Forgemaster', MAGICIAN_RELATIONAL: 'The Enchanter',
  MAGICIAN_RULING: 'The Oracle', MAGICIAN_SPIRIT: 'The Sorcerer',
  // Main: JUDGE
  JUDGE_RULING: 'The Arbiter', JUDGE_WISDOM: 'The Critic',
  JUDGE_ACTION: 'The Avenger', JUDGE_RELATIONAL: 'The Mediator',
  JUDGE_CREATIVE: 'The Evaluator', JUDGE_SPIRIT: 'The Shepherd',
  // Main: TRICKSTER
  TRICKSTER_SPIRIT: 'The Fool', TRICKSTER_WISDOM: 'The Comedian',
  TRICKSTER_ACTION: 'The Saboteur', TRICKSTER_RELATIONAL: 'The Clown',
  TRICKSTER_CREATIVE: 'The Shapeshifter', TRICKSTER_RULING: 'The Jester',
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
