/**
 * Scoring Algorithm — Master Index (Neuraal Schakelbord)
 *
 * Triple Network Model Geometry — Per-Pick Geometric Bleed Engine
 *
 * Contains the scoring logic that converts raw user answers into:
 * 1. Per-archetype scores via Geometric Bleed (Core + Green + Blue + Purple + Yellow)
 * 2. Radar chart data (12 archetype anchors)
 * 3. Subgroup dynamics (6 archetype group polarity pairs)
 * 4. Primary & secondary archetype determination
 * 5. Extended Archetype name (72-outcome matrix)
 * 6. Nature vs Culture/Force dual-tracking (Meester Ontology)
 * 7. Polarization Index & Authenticity Index (Meester Metrics)
 *
 * Line Connections (from 12-point Neuro-Archetypal Wheel):
 *   Green Line:  Hardware Anker (group partner — same biological substrate)
 *   Blue Line:   Feedback Brug (same partner as Green — activation signal)
 *   Yellow A/B:  Same-cluster archetypes at distance 4 (cognitive network synergy)
 *   Red Line:    Neurale Kortsluiting (cross-network conflict, diagnostic only)
 *   Purple Line: 180° shadow (position + 6, passive shadow integration)
 *
 * Per-Pick Geometric Bleed (36 vragen × 2 picks, per-slot N/C routing):
 *   1st Nature:  +9 Core, +3 Green, +2 Blue, +1 Purple  = 15 pts
 *   1st Culture: +8 Core, +1 Blue, +2 Yellow ×2          = 13 pts
 *   2nd Nature:  +6 Core, +1 Green                       =  7 pts
 *   2nd Culture: +4 Core, +1 Yellow ×2                   =  6 pts
 *
 * Nature/Culture Dual-Tracking:
 *   Per-SLOT routing via 6 numbered rotation keys and Standard/Spiegel mode per layer.
 *   Tie-breaks are resolved by highest Nature sub-score (biological essence wins).
 *
 * Score Ceilings: Core max 540, Green max 144, Blue max 108, Purple max 36, Yellow max 216.
 * Red: NO points — purely diagnostic (AI reads from radar chart).
 */

import {
  ROTATION_KEYS, getKeyForQuestion, isNatureRouting, isNatureSlot
} from '../../../pages/assessment/assessmentData';

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
  'Ruler',      //  1 — G1: Ruling (CEN)
  'Judge',      //  2 — G1: Ruling (CEN)
  'Lover',      //  3 — G2: Relational (Limbisch)
  'Caregiver',  //  4 — G2: Relational (Limbisch)
  'Innocent',   //  5 — G3: Seeker (Openness)
  'Explorer',   //  6 — G3: Seeker (Openness)
  'Outlaw',     //  7 — G4: Chaos (Salience)
  'Trickster',  //  8 — G4: Chaos (Salience)
  'Sage',       //  9 — G5: Abstract (DMN)
  'Artist',     // 10 — G5: Abstract (DMN)
  'Magician',   // 11 — G6: Agency (Extraversie)
  'Hero',       // 12 — G6: Agency (Extraversie)
];

/**
 * All 12 archetype keys in wheel position order 1→12.
 */
export const ALL_ARCHETYPE_KEYS = [
  'RULER', 'JUDGE', 'LOVER', 'CAREGIVER',
  'INNOCENT', 'EXPLORER', 'OUTLAW', 'TRICKSTER',
  'SAGE', 'ARTIST', 'MAGICIAN', 'HERO',
];

/**
 * Archetype numbering on the 12-position wheel (Neuraal Schakelbord).
 */
export const ARCHETYPE_NUMBERS = {
  RULER: 1, JUDGE: 2, LOVER: 3, CAREGIVER: 4,
  INNOCENT: 5, EXPLORER: 6, OUTLAW: 7, TRICKSTER: 8,
  SAGE: 9, ARTIST: 10, MAGICIAN: 11, HERO: 12,
};

// ═══════════════════════════════════════════════════════════════════════
// LINE CONNECTION MAPS — Triple Network Model Geometry
// ═══════════════════════════════════════════════════════════════════════

/**
 * GREEN LINE: Hardware Anker (group partner — same biological substrate).
 * The 6 Groene Bogen / Het Moederbord.
 * Green Bleed: Nature picks echo to same-group partner (+3 for 1st, +1 for 2nd).
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
 * BLUE LINE: Feedback Brug — same partner as GREEN (shared biological substrate).
 * Blue Bleed: 1st pick echoes to same-group partner (+2 Nature, +1 Culture).
 *
 * B1 (CEN):      Ruler(12)    ↔ Judge(1)
 * B2 (Limbisch):  Lover(2)     ↔ Caregiver(3)
 * B3 (Seeker):    Innocent(4)  ↔ Explorer(5)
 * B4 (Salience):  Outlaw(6)    ↔ Trickster(7)
 * B5 (Abstract):  Sage(8)      ↔ Artist(9)
 * B6 (Agency):    Magician(10) ↔ Hero(11)
 */
export const BLUE_LINE = {
  // Blauw = identiek aan Groen (hyper-activatie van zelfde bio-groep)
  ...GREEN_LINE,
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
 * RED LINE: Neurale Kortsluiting — Frictie counter (+1).
 * Cross-network conflict pairs: same-half opposites on wheel.
 * 1↔6, 12↔7, 2↔9, 3↔8, 4↔11, 5↔10
 */
export const RED_LINE = {
  JUDGE: 'OUTLAW',       OUTLAW: 'JUDGE',         // 1 ↔ 6
  RULER: 'TRICKSTER',    TRICKSTER: 'RULER',      // 12 ↔ 7
  LOVER: 'ARTIST',       ARTIST: 'LOVER',         // 2 ↔ 9
  CAREGIVER: 'SAGE',     SAGE: 'CAREGIVER',       // 3 ↔ 8
  INNOCENT: 'HERO',      HERO: 'INNOCENT',        // 4 ↔ 11
  EXPLORER: 'MAGICIAN',  MAGICIAN: 'EXPLORER',    // 5 ↔ 10
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
 * Ontologie Routing — 6-Key Rotation System.
 *
 * Uses the 6 rotation keys (A-F) from assessmentData.js to determine
 * Nature/Culture routing per question.
 *
 * Standard mode (layers 0,2,4): Keys A,C,E → Nature; Keys B,D,F → Culture
 * Spiegel  mode (layers 1,3):   Keys A,C,E → Culture; Keys B,D,F → Nature
 */

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
 * Determine whether a question routes to Nature or Culture.
 * Uses the 6-key rotation system: question's key + layer's Standard/Spiegel mode.
 *
 * @param {number} questionNum - 1-based question number
 * @returns {'NATURE'|'CULTURE'}
 */
export function getQuestionBucket(questionNum) {
  return isNatureRouting(questionNum) ? 'NATURE' : 'CULTURE';
}

/**
 * Legacy wrapper — returns 'ALPHA' or 'BETA' for backward compatibility.
 * ALPHA = Nature-favoring keys in Standard mode.
 * @param {number} questionNum
 * @returns {'ALPHA'|'BETA'}
 */
export function getStateToggle(questionNum) {
  return isNatureRouting(questionNum) ? 'ALPHA' : 'BETA';
}

/**
 * Determine routing bucket for an answer.
 * In the new 6-key system, routing is determined by the QUESTION (not the archetype).
 * Kept for backward compatibility but now delegates to question-based routing.
 *
 * @param {string} _archetypeKey - ignored in new system
 * @param {'ALPHA'|'BETA'} stateToggle
 * @returns {'NATURE'|'CULTURE'}
 */
export function getNatureCultureBucket(_archetypeKey, stateToggle) {
  return stateToggle === 'ALPHA' ? 'NATURE' : 'CULTURE';
}

/**
 * Green Line check (Neurale Snelweg / Hardware Anker).
 * Returns true if the two archetypes are Green Line partners (same biological group).
 *
 * @param {string} key1 - archetype key
 * @param {string} key2 - archetype key
 * @returns {boolean} true if they are a Green Line pair
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
 * TIERED SCORING ENGINE v4 — Per-Pick Geometric Bleed (Neurobiological Edition).
 *
 * Processes 36 questions × 2 picks per question using 6 numbered rotation keys.
 *
 * N/C routing is PER-SLOT (not per-question):
 *   Standard mode: even slots (A=0,C=2,E=4) → Nature; odd slots (B=1,D=3,F=5) → Culture
 *   Mirror mode:   reversed
 *
 * Per-Pick Geometric Bleed:
 *   Each pick distributes points to the chosen archetype (Core) AND to
 *   geometrically connected archetypes (Bleed). No separate counters.
 *
 *   1st Nature:  +9 Core, +3 Green, +2 Blue, +1 Purple          = 15 pts
 *   1st Culture: +8 Core, +1 Blue, +2 Yellow (×2 partners)      = 13 pts
 *   2nd Nature:  +6 Core, +1 Green                               =  7 pts
 *   2nd Culture: +4 Core, +1 Yellow (×2 partners)                =  6 pts
 *
 *   Green → same-group partner (hardware echo)
 *   Blue  → same-group partner (feedback signal)
 *   Purple → 180° shadow partner (passive shadow integration)
 *   Yellow → both Yellow Triangle partners (cognitive synergy)
 *   Red   → NO points (purely diagnostic — AI reads from radar chart)
 *
 * @param {Array<{questionId: number, archetype: string, pickOrder?: number}>} responses
 * @param {'BEGINNER'|'INTERMEDIATE'|'ADVANCED'} [tier='ADVANCED']
 * @returns {Object} Full scoring result
 */
export function computeAdvancedScores(responses, tier = 'ADVANCED') {
  const tierConfig = SCORING_TIERS[tier] || SCORING_TIERS.ADVANCED;

  // ── 5-Basket Accumulation: per-archetype separated score accumulators ──
  const scores = {};
  ALL_ARCHETYPE_KEYS.forEach(key => {
    scores[key] = {
      nature_core:   0,  // Mandje 1a: Directe Nature picks (+9 of +6)
      green_hw:      0,  // Mandje 1b: Green hardware bleed ontvangen (+3 of +1)
      culture_core:  0,  // Mandje 2:  Directe Culture picks (+8 of +4)
      blue_fb:       0,  // Mandje 3:  Blue feedback bleed ontvangen (+2 of +1)
      yellow_cog:    0,  // Mandje 4:  Yellow cognitieve bleed ontvangen (+2 of +1)
      purple_shadow: 0,  // Mandje 5:  Purple schaduw drip ontvangen (+1)
    };
  });

  // Nature pick counter for Authenticity Index (pure pick count, not points)
  let naturePickCount = 0;
  let totalPickCount = 0;

  // Reverse-derive slot position (0-5) from question number + archetype
  function getSlotPos(questionNum, archetype) {
    const key = getKeyForQuestion(questionNum);
    const slots = ROTATION_KEYS[key];
    return slots ? slots.indexOf(archetype) : 0;
  }

  // Group responses by questionId
  const questionResponses = {};
  if (responses && responses.length > 0) {
    for (const response of responses) {
      const qId = typeof response.questionId === 'number'
        ? response.questionId
        : parseInt(String(response.questionId), 10);
      if (!qId || qId < 1) continue;
      if (!questionResponses[qId]) questionResponses[qId] = [];
      questionResponses[qId].push(response);
    }
  }

  // Process each question's picks with 5-Basket Geometric Bleed routing
  Object.entries(questionResponses).forEach(([qIdStr, picks]) => {
    const questionNum = parseInt(qIdStr, 10);

    // Sort by pickOrder (0=1st, 1=2nd)
    picks.sort((a, b) => (a.pickOrder || 0) - (b.pickOrder || 0));

    picks.forEach((response, pickIdx) => {
      const archetype = response.archetype;
      if (!archetype || !scores[archetype]) return;

      const isFirstPick = pickIdx === 0;
      const slotPos = getSlotPos(questionNum, archetype);
      const isNature = isNatureSlot(questionNum, slotPos);

      // Count picks for Authenticity Index
      totalPickCount++;
      if (isNature) naturePickCount++;

      if (isNature) {
        // ══════════════════════════════════════════════════
        // NATURE PICK — routes to nature_core, green_hw, blue_fb, purple_shadow
        // ══════════════════════════════════════════════════

        // Core Nature → nature_core
        scores[archetype].nature_core += isFirstPick ? 9 : 6;

        // Green Hardware → green_hw (same-group partner)
        const greenPartner = GREEN_LINE[archetype];
        if (greenPartner && scores[greenPartner]) {
          scores[greenPartner].green_hw += isFirstPick ? 3 : 1;
        }

        // Blue Feedback → blue_fb (1st pick only → same-group partner)
        if (isFirstPick && greenPartner && scores[greenPartner]) {
          scores[greenPartner].blue_fb += 2;
        }

        // Purple Shadow → purple_shadow (1st pick only → 180° shadow)
        if (isFirstPick) {
          const shadowPartner = PURPLE_LINE[archetype];
          if (shadowPartner && scores[shadowPartner]) {
            scores[shadowPartner].purple_shadow += 1;
          }
        }
      } else {
        // ══════════════════════════════════════════════════
        // CULTURE PICK — routes to culture_core, blue_fb, yellow_cog
        // ══════════════════════════════════════════════════

        // Core Culture → culture_core
        scores[archetype].culture_core += isFirstPick ? 8 : 4;

        // Blue Feedback → blue_fb (1st pick only → same-group partner)
        if (isFirstPick) {
          const bluePartner = GREEN_LINE[archetype];
          if (bluePartner && scores[bluePartner]) {
            scores[bluePartner].blue_fb += 1;
          }
        }

        // Yellow Cognitive → yellow_cog (both triangle partners)
        const yellowPartners = YELLOW_LINES[archetype];
        if (yellowPartners) {
          const yellowPts = isFirstPick ? 2 : 1;
          for (const yp of yellowPartners) {
            if (scores[yp]) scores[yp].yellow_cog += yellowPts;
          }
        }
      }
    });
  });

  // ── Compute totals from 5 baskets ──
  ALL_ARCHETYPE_KEYS.forEach(key => {
    const s = scores[key];
    s.total = s.nature_core + s.green_hw + s.culture_core + s.blue_fb + s.yellow_cog + s.purple_shadow;
  });

  // ── Determine Main & Support with Nature tie-breaking ──
  const sorted = ALL_ARCHETYPE_KEYS
    .map(key => ({ key, ...scores[key] }))
    .sort((a, b) => {
      // Primary sort: total score descending
      if (b.total !== a.total) return b.total - a.total;
      // Tie-break: highest nature_core wins (biological essence leads)
      return b.nature_core - a.nature_core;
    });

  const mainArchetype = sorted[0]?.key || 'SAGE';
  const supportArchetype = sorted[1]?.key || 'EXPLORER';

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
  // Polarization as percentage of Main score for level thresholds
  const polarizationPct = mainScore > 0 ? Math.round((polarizationIndex / mainScore) * 100) : 0;
  let polarizationLevel;
  if (polarizationPct > 60) {
    polarizationLevel = 'HIGH_POLARIZATION';
  } else if (polarizationPct < 30) {
    polarizationLevel = 'HIGH_INDIVIDUATION';
  } else {
    polarizationLevel = 'MODERATE';
  }

  // ── Authenticity Index (Nature pick count / total picks — pure pick counter) ──
  const authenticityIndex = totalPickCount > 0
    ? Math.round((naturePickCount / totalPickCount) * 100)
    : 50;
  // Also compute total Nature/Culture points for backward compat
  let totalNaturePoints = 0;
  let totalCulturePoints = 0;
  ALL_ARCHETYPE_KEYS.forEach(key => {
    const s = scores[key];
    totalNaturePoints += s.nature_core + s.green_hw + s.purple_shadow;
    totalCulturePoints += s.culture_core + s.blue_fb + s.yellow_cog;
  });
  const totalPointsAwarded = totalNaturePoints + totalCulturePoints;
  let authenticityLevel;
  if (authenticityIndex > 75) {
    authenticityLevel = 'NATURE_DOMINANT';
  } else if (authenticityIndex < 35) {
    authenticityLevel = 'CULTURE_DOMINANT';
  } else {
    authenticityLevel = 'BALANCED';
  }

  // ── Relationship flags (for UI & AI — detected from bleed accumulation) ──
  const hasShadowHarmony = isShadowPair(mainArchetype, supportArchetype);
  const hasGreenHarmony = isHarmonyPair(mainArchetype, supportArchetype);

  // ── Build radar data (wheel order 1→12) — 6-layer stacked bands ──
  const radarData = ARCHETYPE_RADAR_LABELS.map(label => {
    const key = label.toUpperCase();
    const s = scores[key] || {};
    // Cumulative band boundaries (painter's algorithm: draw shadow first, nature-core last)
    // Inside → outside: Nature Core > Bio HW > Culture Core > Feedback > Cognitief > Schaduw
    const band1 = (s.nature_core    || 0);                             // Green  — direct nature picks (innermost, dark green)
    const band2 = band1 + (s.green_hw      || 0);                     // Lime   — bio hardware bleed (+3, light green)
    const band3 = band2 + (s.culture_core  || 0);                     // Orange — direct culture picks
    const band4 = band3 + (s.blue_fb       || 0);                     // Blue   — feedback bleed (+2)
    const band5 = band4 + (s.yellow_cog    || 0);                     // Gold   — cognitive lens bleed (+2)
    const band6 = band5 + (s.purple_shadow || 0);                     // Purple — shadow drip (+1, outermost = total)
    return {
      subject: label,
      // Cumulative band boundaries for stacked radar
      green:  band1,
      lime:   band2,
      orange: band3,
      blue:   band4,
      gold:   band5,
      purple: band6,
      // Raw basket values (for tooltip)
      nature_core:   s.nature_core    || 0,
      culture_core:  s.culture_core   || 0,
      green_hw:      s.green_hw       || 0,
      blue_fb:       s.blue_fb        || 0,
      yellow_cog:    s.yellow_cog     || 0,
      purple_shadow: s.purple_shadow  || 0,
      // Backward compat
      A: band6,
      fullMark: 500,
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
      leftNature: (scores[leftKey]?.nature_core || 0) + (scores[leftKey]?.green_hw || 0),
      leftCulture: scores[leftKey]?.culture_core || 0,
      rightNature: (scores[rightKey]?.nature_core || 0) + (scores[rightKey]?.green_hw || 0),
      rightCulture: scores[rightKey]?.culture_core || 0,
    };
  });

  // ── Per-archetype detail (for AI analysis — 5-basket decomposition) ──
  const archetypeDetails = ALL_ARCHETYPE_KEYS.map(key => {
    const s = scores[key];
    return {
      key,
      position: ARCHETYPE_NUMBERS[key],
      group: ARCHETYPE_TO_GROUP[key],
      total: s.total,
      // 5-Basket decomposition
      nature_core: s.nature_core,
      green_hw: s.green_hw,
      culture_core: s.culture_core,
      blue_fb: s.blue_fb,
      yellow_cog: s.yellow_cog,
      purple_shadow: s.purple_shadow,
      // Backward compat (derived from baskets)
      nature: s.nature_core + s.green_hw,
      culture: s.culture_core,
      core: s.nature_core + s.culture_core,
      greenBleed: s.green_hw,
      blueBleed: s.blue_fb,
      purpleBleed: s.purple_shadow,
      yellowBleed: s.yellow_cog,
      natureRatio: s.total > 0
        ? Math.round(((s.nature_core + s.green_hw) / s.total) * 100)
        : 0,
    };
  });

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

    // Relationship flags (backward-compatible keys)
    hasShadowHarmony,
    hasHarmonyBonus: hasShadowHarmony || hasGreenHarmony,
    harmonyBonusApplied: 0, // No separate bonuses in Geometric Bleed — all in score array
    hasBeheersingsBonus: hasGreenHarmony,
    beheersingsBonus: 0,
    harmonyBonus: 0,
    harmonyCounter: 0,
    frictieCounter: 0,

    // Meester metrics
    polarizationIndex,
    polarizationPct,
    polarizationLevel,
    authenticityIndex,
    authenticityLevel,
    naturePickCount,
    totalPickCount,
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

    // Max possible — true theoretical max based on per-pick bleed totals
    // 1st Nature=15, 2nd Nature=7 → max per question pair = 22
    // 36 questions × 22 = 792 (ADVANCED)
    baseMaxScore: tierConfig.baseMax || 720,
    totalMaxScore: Object.keys(questionResponses).length * 22 || tierConfig.baseMax || 720,

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
