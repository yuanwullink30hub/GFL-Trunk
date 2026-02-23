/**
 * Assessment Questions — Master Index
 * 
 * Re-exports all 60 questions (5 layers × 12 questions) from the
 * canonical source in pages/assessment/assessmentData.js.
 * 
 * The API agent should import questions from here rather than
 * directly from the page-level module.
 */

export { assessmentSubjects as questions } from '../../../pages/assessment/assessmentData';
export { QUESTION_SCHEMA } from './questionSchema';

/**
 * Helper: Get all questions for a specific layer index (0-4).
 * @param {number} layerIndex
 * @returns {Array} questions for that layer
 */
export function getQuestionsForLayer(layerIndex) {
  // Lazy import to avoid circular deps at module level
  const { assessmentSubjects } = require('../../../pages/assessment/assessmentData');
  const layer = assessmentSubjects.find(s => s.layerIndex === layerIndex);
  return layer ? layer.questions : [];
}

/**
 * Helper: Get a flat list of all 60 questions with their layer context.
 * @returns {Array<{ layerIndex: number, layerName: string, ...question }>}
 */
export function getAllQuestionsFlat() {
  const { assessmentSubjects } = require('../../../pages/assessment/assessmentData');
  return assessmentSubjects.flatMap(layer =>
    layer.questions.map(q => ({
      layerIndex: layer.layerIndex,
      layerName: layer.name,
      layerTitle: layer.title,
      ...q,
    }))
  );
}
