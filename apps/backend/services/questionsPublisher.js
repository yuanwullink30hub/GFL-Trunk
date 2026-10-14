/**
 * Publish the assessment questions as one public file, so the platform loads them for every visitor without the
 * backend having to be up (owner, 14 Oct). On every admin save of the questions (routes/questions.js), and on
 * demand (POST /api/questions/publish), this writes questions/questions.json to R2 — served at
 * https://downloads.gardenforlife.nl/questions/questions.json (QUESTIONS_PUBLIC_URL to override).
 *
 * The file holds what GET /api/questions and GET /api/questions/two-layer return today:
 *   layers     the question layers from the database (the admin's edits), without internal fields
 *   twoLayer   { enabled: false } while config.twoLayerTest is off; otherwise the bank's plan for the current
 *              quarter and the seven after it (plans by quarter label), so a quarter switch needs no backend
 *              either — the platform picks the plan for its own quarter (Europe/Amsterdam)
 *
 * Without R2 configured (services/r2.js) publishing is a logged no-op and the platform keeps asking the backend.
 */

'use strict';

const config = require('../config');
const { collections } = require('../db');
const { putObject, r2Enabled } = require('./r2');
const { twoLayerPlanFor, quartersFrom } = require('./twoLayerBank');

const KEY = 'questions/questions.json';
const PUBLIC_URL = (process.env.QUESTIONS_PUBLIC_URL || 'https://downloads.gardenforlife.nl/questions/questions.json');
const QUARTERS_AHEAD = 8;

/** The public file's content. */
async function buildQuestionsFile(now = new Date()) {
  const layers = (await collections.questions().find({}).sort({ layerIndex: 1 }).toArray())
    .map(({ _id, updatedAt, updatedBy, createdAt, ...rest }) => rest);
  let twoLayer = { enabled: false };
  if (config.twoLayerTest) {
    const plans = Object.fromEntries(quartersFrom(now, QUARTERS_AHEAD).map((q) => [q, twoLayerPlanFor(q)]));
    twoLayer = { enabled: true, plans };
  }
  return { schema: 1, publishedAt: now.toISOString(), layers, seeded: layers.length > 0, twoLayer };
}

/**
 * Build and upload the file. Resolves { published: true, bytes } or { published: false, reason }; never throws,
 * so a failed publish never fails the admin's save (the save itself is in the database already).
 */
async function publishQuestions() {
  if (!r2Enabled()) return { published: false, reason: 'R2 is not configured' };
  try {
    const file = await buildQuestionsFile();
    const { bytes } = await putObject(KEY, JSON.stringify(file), {
      contentType: 'application/json; charset=utf-8',
      // A minute at the edge: an edit is live everywhere within about a minute of the save.
      cacheControl: 'public, max-age=60',
    });
    console.log(`[Questions] published ${KEY} (${bytes} bytes, ${file.layers.length} layers, two-layer ${file.twoLayer.enabled ? 'on' : 'off'})`);
    return { published: true, bytes, url: PUBLIC_URL };
  } catch (err) {
    console.error('[Questions] publish failed:', err.message);
    return { published: false, reason: err.message };
  }
}

/** After a save: publish in the background, logged; the response does not wait for it. */
function publishAfterSave() {
  publishQuestions().catch(() => {});
}

module.exports = { buildQuestionsFile, publishQuestions, publishAfterSave, PUBLIC_URL };
