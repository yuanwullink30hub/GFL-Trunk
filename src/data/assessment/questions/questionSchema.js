/**
 * Question & Answer Schema
 * Defines the structure for assessment questions and their answer options.
 * 
 * Each question belongs to a layer (0-4) and a domain.
 * Each answer maps to an archetype and carries a shadow aspect.
 */

/**
 * @typedef {Object} Answer
 * @property {string} id        - Unique answer ID (e.g. "1a", "1b")
 * @property {string} text      - Display text for the answer
 * @property {number} value     - Numeric score (1-4, higher = more transcendent)
 * @property {string} archetype - Primary archetype key (e.g. "GROUNDED", "SAGE")
 * @property {string} shadowAspect - The shadow side of choosing this answer
 */

/**
 * @typedef {Object} Question
 * @property {number} id        - Unique question ID (1-30)
 * @property {string} text      - Question text
 * @property {string} domain    - Knowledge domain (biochemistry, psychology, geometry, etc.)
 * @property {Answer[]} answers - Array of 6 answer options (A-F)
 */

/**
 * @typedef {Object} Layer
 * @property {number} id          - Layer ID (1-5)
 * @property {string} name        - Short name (Foundation, Emotional, Mental, Spiritual, Unity)
 * @property {string} title       - Stylized title (e.g. "BIOCHEMICAL RESONANCE")
 * @property {string} subtitle    - Layer subtitle
 * @property {string} color       - Hex color code
 * @property {number} layerIndex  - Zero-based layer index (0-4)
 * @property {string} fundamental - Core principle
 * @property {string} description - Layer description
 * @property {Question[]} questions - Array of 12 questions
 */

export const QUESTION_SCHEMA = {
  totalLayers: 5,
  questionsPerLayer: 12,
  answersPerQuestion: 6,
  totalQuestions: 60,
  valueRange: { min: 1, max: 6 },
  domains: [
    'biochemistry',
    'physics',
    'psychology',
    'alchemy',
    'geometry',
    'astronomy',
    'astrology',
    'religion',
  ],
};
