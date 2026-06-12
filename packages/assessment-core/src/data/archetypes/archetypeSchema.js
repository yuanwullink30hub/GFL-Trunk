/**
 * Archetype Data Schema
 * Defines the structure for archetype definitions used in result computation.
 */

/**
 * @typedef {Object} Archetype
 * @property {string} key         - Unique key (e.g. "GROUNDED", "SAGE")
 * @property {string} name        - Display name (Dutch, e.g. "De Hoeder")
 * @property {string} nameEn      - English display name
 * @property {string} description - Full archetype description (Dutch)
 * @property {string} descriptionEn - English description
 * @property {string} shadow      - Shadow side description
 * @property {string} element     - Associated element
 * @property {string} color       - Brand color hex
 * @property {string[]} traits    - Radar chart traits this archetype strengthens
 * @property {string} imageUrl    - Profile image URL (placeholder for now)
 */

export const ARCHETYPE_SCHEMA = {
  totalArchetypes: 10,
  requiredFields: ['key', 'name', 'description', 'shadow', 'traits'],
};
