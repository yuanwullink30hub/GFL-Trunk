/**
 * Assessment Questions — Master Index
 * 
 * Re-exports all 36 questions (5 layers) from the
 * canonical source in pages/assessment/assessmentData.js.
 * 
 * The API agent should import questions from here rather than
 * directly from the page-level module.
 */

// NOTE: assessmentSubjects no longer exported from assessmentData — questions are served by the backend API
// export { assessmentSubjects as questions } from '../../../pages/assessment/assessmentData';
export { QUESTION_SCHEMA } from './questionSchema';

/**
 * Helper: Get all questions for a specific layer index (0-4).
 * @param {number} layerIndex
 * @returns {Array} questions for that layer
 */
export function getQuestionsForLayer(/* layerIndex */) {
  // Questions are now served by the backend API (MongoDB)
  return [];
}

/**
 * Helper: Get a flat list of all 36 questions with their layer context.
 * @returns {Array<{ layerIndex: number, layerName: string, ...question }>}
 */
export function getAllQuestionsFlat() {
  // Questions are now served by the backend API (MongoDB)
  return [];
}
