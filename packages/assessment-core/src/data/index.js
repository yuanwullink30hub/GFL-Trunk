/**
 * Garden for Life — Assessment Document Library
 * 
 * Master barrel export for all assessment data modules.
 * The API agent should import everything from this single entry point:
 * 
 *   import { questions, ARCHETYPES, LAYERS, RADAR_TRAITS, ... } from '../data/assessment';
 * 
 * Folder structure:
 *   questions/    — 36 questions across 5 layers (6 answers each, 72 picks total)
 *   archetypes/   — 12 archetype definitions (Set A + Set B) with traits, shadows & group pairings
 *   layers/       — Layer metadata (colors, elements, chakras, domains)
 *   scoring/      — Scoring algorithms (radar, subgroups, archetype determination)
 *   analysis/     — Pre-written analysis text templates per archetype
 *   research/     — Source documents & papers (non-JS, for agent context)
 */

// Questions
export { QUESTION_SCHEMA, getQuestionsForLayer, getAllQuestionsFlat } from './questions';

// Archetypes
export { ARCHETYPES, ARCHETYPE_KEYS, ARCHETYPE_GROUPS, ARCHETYPE_SCHEMA, getArchetype } from './archetypes';

// Layers
export { LAYERS, getLayer, subjectMetadata } from './layers';

// Scoring
export {
  RADAR_TRAITS,
  SUBGROUP_POLARITIES,
  ARCHETYPE_TRAIT_MAP,
  computeRadarScores,
  computeSubgroups,
  determineArchetype,
  // Archetype-based scoring (12-point radar)
  ARCHETYPE_RADAR_LABELS,
  ALL_ARCHETYPE_KEYS,
  COMPLEMENTARY_PAIRS,
  SHADOW_PAIRS,
  ARCHETYPE_TO_GROUP,
  ARCHETYPE_NUMBERS,
  EXTENDED_ARCHETYPES,
  EXTENDED_ARCHETYPES_NL,
  getExtendedArchetype,
  getExtendedArchetypeNl,
  isComplementaryPair,
  // Line Connection Maps (Triple Network Geometry)
  GREEN_LINE,
  BLUE_LINE,
  YELLOW_LINES,
  RED_LINE,
  PURPLE_LINE,
  SCORING_TIERS,
  // Advanced Scoring Engine (Ontology)
  GROUP_NEURAL_FOCUS,
  getStateToggle,
  getNatureCultureBucket,
  getQuestionBucket,
  isHarmonyPair,
  isShadowPair,
  computeAdvancedScores,
} from './scoring';

// Archetype Levensles Quotes — the 72 combination life-lessons. Kept standalone
// (fetched and sent to the AI directly so it needn't search the corpus for them).
export { getArchetypeQuote, getArchetypeQuoteByKey } from './archetypeQuotes';
export { getArchetypeKeyByName } from './archetypeImages';

// ── Restructure part 1 ──────────────────────────────────────────────────────
// Biochemical profiles, OCEAN deep-dives, extended archetype descriptions and the
// analysis templates were removed here — that archetype content now lives in the
// single source of truth: canon/deltawerken_corpus.json. Consumers of the removed
// exports (results modal / PDF / EyedentityPage) are rewired in a later part.
