/**
 * Scoring Algorithm — Master Index (Neuraal Schakelbord)
 * 
 * Contains the scoring logic that converts raw user answers into:
 * 1. Per-archetype scores (12 archetypes, +5 pts per answer, max 300 base)
 * 2. Harmony Bonus (+69 pts to Main & Support if same-pillar neighbors)
 * 3. Radar chart data (12 archetype anchors, 0-369 scale)
 * 4. Subgroup dynamics (6 archetype group polarity pairs)
 * 5. Primary & secondary archetype determination
 * 6. Extended Archetype name (72-outcome matrix)
 * 7. Nature vs Culture/Force dual-tracking (Advanced Ontology)
 * 8. Polarization Index & Authenticity Index (Advanced Metrics)
 * 
 * Scoring Rules:
 *   Single choice: +5 pts to the answer's archetype
 *   Dual choice: Primary +3 pts, Secondary +2 pts
 *   Base max: 60 × 5 = 300 pts
 *   Harmony Bonus: +69 to BOTH Main & Support if Neurale Zuil neighbors
 *   Shadow Integration: 180°-as measurement (no scoring bonus)
 *   Total max: 369 pts
 *
 * Advanced Dual-Tracking (Nature vs Culture/Force):
 *   Each point is routed to a Nature or CultureForce sub-score per archetype
 *   based on the Alpha/Beta state toggle and two fixed ID clusters.
 *   Tie-breaks are resolved by highest Nature sub-score (biological essence wins).
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
 * Archetype numbering on the 12-position wheel (Neuraal Schakelbord).
 */
export const ARCHETYPE_NUMBERS = {
  JUDGE: 1, LOVER: 2, CAREGIVER: 3, INNOCENT: 4,
  EXPLORER: 5, OUTLAW: 6, TRICKSTER: 7, SAGE: 8,
  ARTIST: 9, MAGICIAN: 10, HERO: 11, RULER: 12,
};

/**
 * Complementary archetype pairs for the Harmony Bonus (+69).
 * Harmony is unlocked when Main and Support are direct neighbors
 * within the same Neurale Zuil (biological pillar).
 *
 * G1 Ruling (CEN):        Judge(1)  ↔ Ruler(12)
 * G2 Relational (Limbisch): Lover(2)  ↔ Caregiver(3)
 * G3 Seeker (Openness):    Innocent(4) ↔ Explorer(5)
 * G4 Chaos (Salience):     Outlaw(6) ↔ Trickster(7)
 * G5 Abstract (DMN):       Sage(8)   ↔ Artist(9)
 * G6 Agency (Extraversie): Magician(10) ↔ Hero(11)
 */
export const COMPLEMENTARY_PAIRS = {
  JUDGE: 'RULER',       RULER: 'JUDGE',        // G1: Ruling (CEN)
  LOVER: 'CAREGIVER',   CAREGIVER: 'LOVER',    // G2: Relational (Limbisch)
  INNOCENT: 'EXPLORER', EXPLORER: 'INNOCENT',  // G3: Seeker (Openness)
  OUTLAW: 'TRICKSTER',  TRICKSTER: 'OUTLAW',   // G4: Chaos (Salience)
  SAGE: 'ARTIST',       ARTIST: 'SAGE',        // G5: Abstract (DMN)
  MAGICIAN: 'HERO',     HERO: 'MAGICIAN',      // G6: Agency (Extraversie)
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


// ═══════════════════════════════════════════════════════════════════════
// ADVANCED SCORING ENGINE — Nature/Culture Dual-Tracking (Ontology)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Ontologie Routing Clusters (fixed ID sets).
 * Cluster 1: IDs [1, 4, 8, 12, 5, 9] = Judge, Innocent, Sage, Ruler, Explorer, Artist
 * Cluster 2: IDs [2, 6, 10, 3, 7, 11] = Lover, Outlaw, Magician, Caregiver, Trickster, Hero
 */
const CLUSTER_1_IDS = new Set([1, 4, 8, 12, 5, 9]);
const CLUSTER_2_IDS = new Set([2, 6, 10, 3, 7, 11]);

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
 * 60Q Master Cycle (balanced 50/50 Nature/Culture):
 *   Subject 1 (Q1-12):  Alpha, Beta, Alpha  (blocks of 4)
 *   Subject 2 (Q13-24): Beta, Alpha, Beta
 *   Subject 3 (Q25-36): Alpha, Beta, Alpha
 *   Subject 4 (Q37-48): Beta, Alpha, Beta
 *   Subject 5 (Q49-60): Alpha, Beta, Alpha
 *
 * @param {number} questionNum - 1-based question number (1-60)
 * @returns {'ALPHA'|'BETA'}
 */
export function getStateToggle(questionNum) {
  const subjectIdx = Math.floor((questionNum - 1) / 12); // 0-4
  const blockIdx = Math.floor(((questionNum - 1) % 12) / 4); // 0-2 within subject
  const subjectStartsAlpha = subjectIdx % 2 === 0; // subjects 0,2,4 start Alpha
  const isAlpha = subjectStartsAlpha ? (blockIdx % 2 === 0) : (blockIdx % 2 !== 0);
  return isAlpha ? 'ALPHA' : 'BETA';
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
 * Harmony Bonus check using circular wheel logic.
 * Positions 12 and 1 are neighbors (circular wrap).
 *
 * @param {string} key1 - archetype key
 * @param {string} key2 - archetype key
 * @returns {boolean} true if they are direct neighbors in the same Neurale Zuil
 */
export function isHarmonyPair(key1, key2) {
  const id1 = ARCHETYPE_NUMBERS[key1];
  const id2 = ARCHETYPE_NUMBERS[key2];
  if (!id1 || !id2) return false;
  const diff = Math.abs(id1 - id2);
  // Must be neighbors (diff 1 or circular wrap diff 11)
  // AND in the same biological group
  return (diff === 1 || diff === 11) && ARCHETYPE_TO_GROUP[key1] === ARCHETYPE_TO_GROUP[key2];
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
 * ADVANCED SCORING ENGINE — Full dual-tracking computation.
 *
 * Processes all 60 answers and produces:
 * - Per-archetype total, nature, and culture scores
 * - Main & Support archetypes (with Nature tie-breaking)
 * - Harmony Bonus application (+69)
 * - Shadow & Blindspot identification
 * - Extended Archetype (72-matrix lookup)
 * - Polarization Index (Main vs Shadow gap)
 * - Authenticity Index (Nature ratio)
 * - Individuation detection (180° opposition between Main & Support)
 *
 * @param {Array<{questionId: number, answerId: string, archetype: string, selections?: Array}>} responses
 *   Each response should include the question number (questionId, 1-based)
 *   and the archetype key. For dual-choice, pass selections array with 2 entries.
 * @param {Array} [subjects] - Optional subjects array for cross-referencing questions
 * @returns {Object} Full advanced scoring result
 */
export function computeAdvancedScores(responses) {
  // Initialize per-archetype tracking
  const scores = {};
  ALL_ARCHETYPE_KEYS.forEach(key => {
    scores[key] = { total: 0, nature: 0, culture: 0 };
  });

  let totalPointsAwarded = 0;
  let totalNaturePoints = 0;
  let totalCulturePoints = 0;

  // Process each response
  if (responses && responses.length > 0) {
    for (const response of responses) {
      const questionNum = typeof response.questionId === 'number'
        ? response.questionId
        : parseInt(String(response.questionId), 10);

      if (!questionNum || questionNum < 1 || questionNum > 60) continue;

      const stateToggle = getStateToggle(questionNum);

      // Handle dual-choice: selections array or single archetype
      const selections = response.selections || [{ archetype: response.archetype, isPrimary: true }];

      for (let i = 0; i < selections.length; i++) {
        const sel = selections[i];
        const archetype = sel.archetype || response.archetype;
        if (!archetype || !scores[archetype]) continue;

        // Points: single choice = +5, dual choice = primary +3, secondary +2
        let pts;
        if (selections.length === 1) {
          pts = 5;
        } else {
          pts = i === 0 ? 3 : 2;
        }

        const bucket = getNatureCultureBucket(archetype, stateToggle);

        scores[archetype].total += pts;
        if (bucket === 'NATURE') {
          scores[archetype].nature += pts;
          totalNaturePoints += pts;
        } else {
          scores[archetype].culture += pts;
          totalCulturePoints += pts;
        }
        totalPointsAwarded += pts;
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

  // ── Harmony Bonus (+69) ──
  const hasHarmonyBonus = isHarmonyPair(mainArchetype, supportArchetype);
  if (hasHarmonyBonus) {
    scores[mainArchetype].total += 69;
    scores[supportArchetype].total += 69;
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
  if (polarizationIndex > 49) {
    polarizationLevel = 'HIGH_POLARIZATION'; // Aggressive shadow suppression
  } else if (polarizationIndex <= 15) {
    polarizationLevel = 'HIGH_INDIVIDUATION'; // Paradox mastery
  } else {
    polarizationLevel = 'MODERATE';
  }

  // ── Authenticity Index (Nature ratio) ──
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

  // ── Build radar data (post harmony bonus) ──
  const radarData = ARCHETYPE_RADAR_LABELS.map(label => {
    const key = label.toUpperCase();
    return {
      subject: label,
      A: scores[key]?.total || 0,
      nature: scores[key]?.nature || 0,
      culture: scores[key]?.culture || 0,
      fullMark: 369,
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

    // Harmony
    hasHarmonyBonus,
    harmonyBonusApplied: hasHarmonyBonus ? 69 : 0,

    // Advanced metrics
    polarizationIndex,
    polarizationLevel,
    authenticityIndex,
    authenticityLevel,
    totalNaturePoints,
    totalCulturePoints,
    totalPointsAwarded,

    // Detailed breakdown
    scores,
    archetypeDetails,
    radarData,
    subgroupDynamics,

    // Max possible
    baseMaxScore: 300,
    totalMaxScore: 369,
  };
}
