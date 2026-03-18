/**
 * Layer Metadata — Master Index
 * 
 * Centralizes layer configuration for the 5 assessment domains:
 *   1. Zelf / Zonde
 *   2. Ander / Attentie
 *   3. Massa / Macht
 *   4. Wereld / Wijsheid
 *   5. Mysterie / Magie
 * 
 * Each layer contains 6–9 questions. Total: 36 questions.
 * Re-exports from the canonical assessmentTypes.js source where appropriate.
 */

export { subjectMetadata } from '../../../pages/assessment/assessmentTypes';

/**
 * Extended layer definitions with all display/scoring context.
 * layerIndex is 0-based (0 = Zelf/outermost, 4 = Mysterie/innermost).
 */
export const LAYERS = [
  {
    layerIndex: 0,
    name: 'Zelf / Zonde',
    title: 'ZELF / ZONDE',
    subtitle: 'De innerlijke wereld en haar grenzen',
    color: '#22d3ee',
    element: 'Aarde',
    chakra: 'Root',
    principle: 'Structuur & Stabiliteit',
    shadowTheme: 'Isolatie, Zelfbescherming, Schuldgevoel',
    fundamental: 'Fysiologische Standaarden',
    domains: ['zelf', 'zonde'],
  },
  {
    layerIndex: 1,
    name: 'Ander / Attentie',
    title: 'ANDER / ATTENTIE',
    subtitle: 'De buitenwereld en haar uitdagingen',
    color: '#a855f7',
    element: 'Vuur',
    chakra: 'Sacral',
    principle: 'Actie & Kracht',
    shadowTheme: 'Competitie, Status, Burnout',
    fundamental: 'Zelfvertrouwen, Karakter',
    domains: ['ander', 'attentie'],
  },
  {
    layerIndex: 2,
    name: 'Massa / Macht',
    title: 'MASSA / MACHT',
    subtitle: 'Het collectief en de cultuur',
    color: '#f472b6',
    element: 'Lucht',
    chakra: 'Heart',
    principle: 'Patroon & Communicatie',
    shadowTheme: 'Dogma, Intellectuele Arrogantie',
    fundamental: 'Doel, Passie, Visie',
    domains: ['massa', 'macht'],
  },
  {
    layerIndex: 3,
    name: 'Wereld / Wijsheid',
    title: 'WERELD / WIJSHEID',
    subtitle: 'Relaties en de biochemische make-up',
    color: '#fbbf24',
    element: 'Water',
    chakra: 'Third Eye',
    principle: 'Harmonie & Verbinding',
    shadowTheme: 'Co-afhankelijkheid, Asymmetrische afhankelijkheid',
    fundamental: 'Zelfrealisatie, Transformatie',
    domains: ['wereld', 'wijsheid'],
  },
  {
    layerIndex: 4,
    name: 'Mysterie / Magie',
    title: 'MYSTERIE / MAGIE',
    subtitle: 'Het transcendente en het natuurlijke',
    color: '#f97316',
    element: 'Quintessence',
    chakra: 'Crown',
    principle: 'Integratie & Transcendentie',
    shadowTheme: 'Escapisme, Dissociatie, Superioriteit',
    fundamental: 'Intimiteit, Gemeenschap',
    domains: ['mysterie', 'magie'],
  },
];

/**
 * Get layer metadata by index (0-4).
 * @param {number} layerIndex
 * @returns {Object|undefined}
 */
export function getLayer(layerIndex) {
  return LAYERS.find(l => l.layerIndex === layerIndex);
}
