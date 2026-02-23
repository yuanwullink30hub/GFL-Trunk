/**
 * Layer Metadata — Master Index
 * 
 * Centralizes layer configuration for the 5 assessment domains:
 *   1. Introversie / Nurture / Zonde
 *   2. Extraversie / Business / Prestatie
 *   3. Cultuur / Wijsheid / Ideaal
 *   4. Huwelijk / Sociale Balans / De Ziel
 *   5. Spiritualiteit / Humility / Magic / Natural
 * 
 * Each layer contains 12 questions. Total: 60 questions.
 * Re-exports from the canonical assessmentTypes.js source where appropriate.
 */

export { subjectMetadata } from '../../../pages/assessment/assessmentTypes';

/**
 * Extended layer definitions with all display/scoring context.
 * layerIndex is 0-based (0 = Foundation/outermost, 4 = Unity/innermost).
 */
export const LAYERS = [
  {
    layerIndex: 0,
    name: 'Foundation',
    title: 'INTROVERSIE / NURTURE / ZONDE',
    subtitle: 'De innerlijke wereld en haar grenzen',
    color: '#22d3ee',
    element: 'Aarde',
    chakra: 'Root',
    principle: 'Structuur & Stabiliteit',
    shadowTheme: 'Isolatie, Zelfbescherming, Schuldgevoel',
    fundamental: 'Fysiologische Standaarden',
    domains: ['introversie', 'nurture', 'zonde'],
  },
  {
    layerIndex: 1,
    name: 'Emotional',
    title: 'EXTRAVERSIE / BUSINESS / PRESTATIE',
    subtitle: 'De buitenwereld en haar uitdagingen',
    color: '#a855f7',
    element: 'Vuur',
    chakra: 'Sacral',
    principle: 'Actie & Kracht',
    shadowTheme: 'Competitie, Status, Burnout',
    fundamental: 'Zelfvertrouwen, Karakter',
    domains: ['extraversie', 'business', 'prestatie'],
  },
  {
    layerIndex: 2,
    name: 'Mental',
    title: 'CULTUUR / WIJSHEID / IDEAAL',
    subtitle: 'Het denken en de verbeelding',
    color: '#f472b6',
    element: 'Lucht',
    chakra: 'Heart',
    principle: 'Patroon & Communicatie',
    shadowTheme: 'Dogma, Intellectuele Arrogantie',
    fundamental: 'Doel, Passie, Visie',
    domains: ['cultuur', 'wijsheid', 'ideaal'],
  },
  {
    layerIndex: 3,
    name: 'Spiritual',
    title: 'HUWELIJK / SOCIALE BALANS / DE ZIEL',
    subtitle: 'Relaties en de biochemische make-up',
    color: '#fbbf24',
    element: 'Water',
    chakra: 'Third Eye',
    principle: 'Harmonie & Verbinding',
    shadowTheme: 'Co-afhankelijkheid, Asymmetrische afhankelijkheid',
    fundamental: 'Zelfrealisatie, Transformatie',
    domains: ['huwelijk', 'sociale_balans', 'de_ziel'],
  },
  {
    layerIndex: 4,
    name: 'Unity',
    title: 'SPIRITUALITEIT / HUMILITY / MAGIC / NATURAL',
    subtitle: 'Het transcendente en het natuurlijke',
    color: '#f97316',
    element: 'Quintessence',
    chakra: 'Crown',
    principle: 'Integratie & Transcendentie',
    shadowTheme: 'Escapisme, Dissociatie, Superioriteit',
    fundamental: 'Intimiteit, Gemeenschap',
    domains: ['spiritualiteit', 'humility', 'magie', 'natuur'],
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
