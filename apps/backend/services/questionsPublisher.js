/**
 * Publish the assessment questions as one public file, so the platform loads them for every visitor without the
 * backend having to be up (owner, 14 Oct). When the admin editor publishes the two-layer bank
 * (POST /api/questions/bank/:level/publish), and on demand (POST /api/questions/publish), this writes
 * questions/questions.json to R2 — served at
 * https://downloads.gardenforlife.nl/questions/questions.json (QUESTIONS_PUBLIC_URL to override).
 *
 * The file holds what GET /api/questions and GET /api/questions/two-layer return today:
 *   layers     the old test's question layers from the database (read-only since 16 Oct), without internal fields
 *   twoLayer   { enabled: true, plans, plansByLevel }: each bank's plan for the current quarter and the seven after
 *              it (by quarter label), so a quarter switch needs no backend either — the platform picks the plan for
 *              its own quarter (Europe/Amsterdam). `plans` is Leerling's (what every app version reads);
 *              `plansByLevel` holds every level with a bank of its own (leerling, gevorderd since 21 Oct)
 *
 * Without R2 configured (services/r2.js) publishing is a logged no-op and the platform keeps asking the backend.
 */

'use strict';

const { collections } = require('../db');
const { putObject, r2Enabled } = require('./r2');
const { twoLayerPlanFor, quartersFrom, LEVELS } = require('./twoLayerBank');

const KEY = 'questions/questions.json';
const PUBLIC_URL = (process.env.QUESTIONS_PUBLIC_URL || 'https://downloads.gardenforlife.nl/questions/questions.json');
const QUARTERS_AHEAD = 8;

/** The public file's content. */
async function buildQuestionsFile(now = new Date()) {
  const layers = (await collections.questions().find({}).sort({ layerIndex: 1 }).toArray())
    .map(({ _id, updatedAt, updatedBy, createdAt, ...rest }) => rest);
  const quarters = quartersFrom(now, QUARTERS_AHEAD);
  const plansByLevel = Object.fromEntries(LEVELS.map((level) => [level, Object.fromEntries(quarters.map((q) => [q, twoLayerPlanFor(q, level)]))]));
  const twoLayer = { enabled: true, plans: plansByLevel.leerling, plansByLevel };
  return { schema: 1, publishedAt: now.toISOString(), layers, seeded: layers.length > 0, twoLayer };
}

/**
 * Build and upload the file. Resolves { published: true, bytes } or { published: false, reason }; never throws,
 * so a failed file upload never undoes a publish (the published bank is in the database already).
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

module.exports = { buildQuestionsFile, publishQuestions, PUBLIC_URL };
