/**
 * OCEAN Deep-Dive Data — Barrel Export
 *
 * Provides two data layers for the AI prompt system:
 *
 *   1. Core Profiles (coreProfiles.js)
 *      12 archetypes × full OCEAN architecture, workplace, relationships, individuation
 *
 *   2. Extended Profiles (extendedProfiles.js)
 *      72 extended archetypes (12 × 6 support groups) with OCEAN shifts + stress triggers
 *
 * Usage:
 *   import { getOceanCoreProfile, getExtendedOceanProfile } from '../data/assessment';
 */

// Core OCEAN Profiles (12 archetypes)
export { OCEAN_CORE_PROFILES, getOceanCoreProfile } from './coreProfiles';

// Extended OCEAN Profiles (72 combinations) + stress triggers
export {
  EXTENDED_OCEAN_PROFILES,
  getExtendedOceanProfile,
  getExtendedOceanProfiles,
} from './extendedProfiles';
