/**
 * The two-layer question bank as the admin editor works on it (owner, 16 Oct 2026): drafts in MongoDB, one
 * document per question per level, and a published snapshot per level that the live test reads.
 *
 *   questionBankDrafts      _id "<level>:<question_id>" — question_id, level, subject, position, text,
 *                           l1 { <group>: text }, l2 { <archetype>: text }, version, updatedAt, updatedBy
 *   questionBankPublished   _id "<level>" — the bank in the file format (engine/data/question_bank_*.json),
 *                           revision, publishedAt, publishedBy
 *
 * Every save is pinned to the version the editor last saw: a stale write is refused (409) with the current
 * document, so two open tabs never overwrite each other. Drafts never reach respondents; only publish() does
 * (it swaps the bank services/twoLayerBank.js serves and republishes the public questions file).
 * A level's drafts are seeded once from the ratified bank file when the editor first opens it.
 */

'use strict';

const { getDB } = require('../db');
const { GROUPS: GROUP_POSITIONS, NAMES } = require('../engine/bleedV2');

const BANK_FILES = { leerling: '../engine/data/question_bank_leerling_v1_0.json' };
const LEVELS = Object.freeze(Object.keys(BANK_FILES));
/** Canonical order: groups as on the wheel, each with its two archetypes (the bank file's order). */
const GROUPS = Object.keys(GROUP_POSITIONS);
const ARCHETYPES = GROUPS.flatMap((g) => GROUP_POSITIONS[g].map((p) => NAMES[p - 1]));
const GROUP_OF = Object.fromEntries(GROUPS.flatMap((g) => GROUP_POSITIONS[g].map((p) => [NAMES[p - 1], g])));
const MAX_TEXT = 2000;
const REFUSAL_LABEL = 'Geen van deze past';

const drafts = () => getDB().collection('questionBankDrafts');
const published = () => getDB().collection('questionBankPublished');

class BankError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; Object.assign(this, extra); }
}

function assertLevel(level) {
  if (!LEVELS.includes(level)) throw new BankError(404, `no editable bank for level ${JSON.stringify(level)}`);
}

/** A bank-file question → a draft document. */
function draftOf(level, q, now) {
  return {
    _id: `${level}:${q.question_id}`,
    level,
    question_id: q.question_id,
    subject: q.subject,
    position: q.position,
    text: q.text,
    l1: Object.fromEntries(q.l1_answers.map((a) => [a.group, a.text])),
    l2: Object.fromEntries(q.l2_answers.map((a) => [a.archetype, a.text])),
    version: 1,
    createdAt: now,
    updatedAt: now,
    updatedBy: 'seed',
  };
}

/** A draft → the bank-file question (canonical order). */
function bankQuestionOf(d) {
  return {
    question_id: d.question_id,
    level: d.level,
    subject: d.subject,
    position: d.position,
    text: d.text || '',
    l1_answers: GROUPS.map((g) => ({ group: g, text: (d.l1 && d.l1[g]) || '' })),
    l2_answers: ARCHETYPES.map((a) => ({ archetype: a, group: GROUP_OF[a], text: (d.l2 && d.l2[a]) || '' })),
  };
}

/** Seed a level's drafts from its ratified bank file, once. Safe when two requests race (duplicate ids skip). */
async function ensureSeeded(level) {
  assertLevel(level);
  if (await drafts().countDocuments({ level }, { limit: 1 })) return false;
  const bank = require(BANK_FILES[level]);
  const now = new Date();
  try {
    await drafts().insertMany(bank.questions.map((q) => draftOf(level, q, now)), { ordered: false });
  } catch (e) {
    if (e.code !== 11000) throw e;
  }
  return true;
}

/** The level's drafts in canonical position order, without the Mongo id. */
async function listDrafts(level) {
  assertLevel(level);
  await ensureSeeded(level);
  return (await drafts().find({ level }).sort({ position: 1 }).toArray()).map(({ _id, ...d }) => d);
}

/**
 * Save part of one question: { version, text?, l1?: { <group>: text }, l2?: { <archetype>: text } }.
 * Resolves the updated draft; throws BankError 400 (bad input), 404 (no such question) or 409 (stale version,
 * with `current` = the stored draft).
 */
async function saveDraft(level, questionId, body, by) {
  assertLevel(level);
  if (!body || typeof body !== 'object') throw new BankError(400, 'body must be an object');
  const { version, ...fields } = body;
  if (!Number.isInteger(version) || version < 1) throw new BankError(400, 'version must be a positive integer');
  const set = {};
  const text = (v, what) => {
    if (typeof v !== 'string') throw new BankError(400, `${what} must be a string`);
    if (v.length > MAX_TEXT) throw new BankError(400, `${what} is longer than ${MAX_TEXT} characters`);
    return v;
  };
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'text') set.text = text(v, 'text');
    else if (k === 'l1' || k === 'l2') {
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new BankError(400, `${k} must be an object`);
      const allowed = k === 'l1' ? GROUPS : ARCHETYPES;
      for (const [key, val] of Object.entries(v)) {
        if (!allowed.includes(key)) throw new BankError(400, `unknown ${k === 'l1' ? 'group' : 'archetype'} ${JSON.stringify(key)}`);
        set[`${k}.${key}`] = text(val, `${k}.${key}`);
      }
    } else throw new BankError(400, `unknown field ${JSON.stringify(k)}`);
  }
  if (!Object.keys(set).length) throw new BankError(400, 'nothing to save');

  const _id = `${level}:${questionId}`;
  const doc = await drafts().findOneAndUpdate(
    { _id, version },
    { $set: { ...set, updatedAt: new Date(), updatedBy: by || null }, $inc: { version: 1 } },
    { returnDocument: 'after' },
  );
  if (doc) { const { _id: _, ...d } = doc; return d; }
  const current = await drafts().findOne({ _id });
  if (!current) throw new BankError(404, `no question ${JSON.stringify(questionId)} in the ${level} bank`);
  const { _id: __, ...c } = current;
  throw new BankError(409, 'the question changed since you loaded it', { current: c });
}

/** The drafts as a bank, plus what keeps it from publishing (every question needs its text and all 18 answers). */
async function buildBank(level) {
  const list = await listDrafts(level);
  const questions = list.map(bankQuestionOf);
  const problems = [];
  for (const q of questions) {
    const where = `Q${q.position}`;
    if (!q.text.trim()) problems.push(`${where}: de vraag is leeg`);
    for (const a of q.l1_answers) if (!a.text.trim()) problems.push(`${where}: ${a.group} (laag 1) is leeg`);
    for (const a of q.l2_answers) if (!a.text.trim()) problems.push(`${where}: ${a.archetype} (laag 2) is leeg`);
  }
  return { bank: { level, l1_refusal_label: REFUSAL_LABEL, questions }, problems };
}

/** The level's published snapshot, or null when the editor never published it. */
async function getPublished(level) {
  assertLevel(level);
  return published().findOne({ _id: level });
}

/**
 * Publish the drafts as the live bank. Throws BankError 400 with `problems` when the bank is incomplete.
 * Resolves the snapshot { level, revision, publishedAt, publishedBy, bank }.
 */
async function publishBank(level, by) {
  const { bank, problems } = await buildBank(level);
  if (problems.length) throw new BankError(400, 'the bank is incomplete', { problems });
  const now = new Date();
  return published().findOneAndUpdate(
    { _id: level },
    { $set: { level, bank, publishedAt: now, publishedBy: by || null }, $inc: { revision: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
}

module.exports = {
  LEVELS, GROUPS, ARCHETYPES, GROUP_OF, BankError,
  ensureSeeded, listDrafts, saveDraft, buildBank, getPublished, publishBank, bankQuestionOf,
};
