/**
 * Which Master Prompt a report gets. One MongoDB record per level (promptConfigs/<id>), edited in the admin
 * dashboard; this map is the only place that ties a request to a record.
 *
 *   level (request)   UI level key   name                      record id
 *   beginner          quick          Starter / Beginner        beginner
 *   intermediate      standard       Gevorderd / Intermediate  intermediate
 *   advanced          deep           Leerling / Apprentice     default   (historic id; Master Prompt v7 since 2026-10-13)
 *
 * A level without a prompt is refused before any model call (routes/ai.js promptGate). So is a report whose
 * test does not fit the prompt: the two-layer test (scoring v2_two_layer) is written for Master Prompt v7 and
 * later, the old Nature/Culture test for v6 and earlier — neither payload may reach the other's prompt.
 */

'use strict';

const LEVELS = Object.freeze(['beginner', 'intermediate', 'advanced']);
const DEFAULT_LEVEL = 'advanced';

const PROMPT_RECORDS = Object.freeze({ beginner: 'beginner', intermediate: 'intermediate', advanced: 'default' });
const SLOTS = Object.freeze(Object.keys(PROMPT_RECORDS));
const V2 = 'v2_two_layer';
const FIRST_V2_PROMPT = 7; // Master Prompt major version the two-layer test needs

/**
 * The prompt slot for a report request. Throws on an unknown level, and on the two-layer test at any
 * level but Leerling (v7 is Leerling only).
 * @param {string} [level]          'beginner' | 'intermediate' | 'advanced' (absent → advanced)
 * @param {string} [scoringVersion] 'v1_nature_culture' (or absent) | 'v2_two_layer'
 */
function promptSlotFor(level = DEFAULT_LEVEL, scoringVersion) {
  if (!LEVELS.includes(level)) throw new RangeError(`unknown level ${JSON.stringify(level)}`);
  if (scoringVersion === V2 && level !== 'advanced') throw new RangeError('the two-layer test is Leerling only');
  return level;
}

/** The promptConfigs record id of a slot. */
function promptRecordId(slot) {
  const id = PROMPT_RECORDS[slot];
  if (!id) throw new RangeError(`unknown prompt slot ${JSON.stringify(slot)}`);
  return id;
}

/** The prompt's major version from its masthead ("AI MASTER PROMPT v7.0 — …" → 7), or null when it names none. */
function promptMajor(system) {
  const m = /\bv(\d+)(?:\.\d+){1,2}\b/i.exec(String(system || '').split('\n')[0]);
  return m ? Number(m[1]) : null;
}

/**
 * Why this test may not run on this prompt, or null when it may. A prompt that names no version passes
 * (nothing to compare against).
 */
function promptMismatch(system, scoringVersion) {
  const major = promptMajor(system);
  if (major === null) return null;
  if (scoringVersion === V2 && major < FIRST_V2_PROMPT) return `the two-layer test needs Master Prompt v${FIRST_V2_PROMPT} or later (the prompt is v${major})`;
  if (scoringVersion !== V2 && major >= FIRST_V2_PROMPT) return `the Leerling prompt is v${major}, written for the two-layer test; this test version is retired`;
  return null;
}

/**
 * The slot's prompt record: { systemPromptTemplate, temperature } as stored, or null when the record is
 * missing or its prompt is empty.
 */
async function loadPromptRecord(db, slot) {
  const cfg = await db.collection('promptConfigs').findOne(
    { _id: promptRecordId(slot) },
    { projection: { systemPromptTemplate: 1, temperature: 1 } },
  );
  return cfg && typeof cfg.systemPromptTemplate === 'string' && cfg.systemPromptTemplate.trim() ? cfg : null;
}

module.exports = { LEVELS, DEFAULT_LEVEL, SLOTS, promptSlotFor, promptRecordId, promptMajor, promptMismatch, loadPromptRecord };
