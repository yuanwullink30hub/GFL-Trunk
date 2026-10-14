/**
 * The separate statistics store (privacy instruction §5.4: anonymous rows live outside the session
 * and account databases, with their own credentials). Today it holds one collection: the tetrad
 * observer's rows (Bleed v2 Scoring §5.4).
 *
 * Configured by STATS_MONGODB_URI (its own user, its own database). Without it the observer is OFF:
 * rows are dropped unwritten and one warning says so — never the row itself.
 *
 * Each row is stored as exactly { _id, archetype, double_picks, shown }. The _id is random: MongoDB's
 * default ObjectId embeds a creation timestamp, which the storage rule forbids.
 */

'use strict';

const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { createAnonQueue } = require('./anonQueue');

const TETRAD_FIELDS = ['archetype', 'double_picks', 'shown'];

let client = null;
let warned = false;

async function collection(name) {
  if (!client) {
    client = new MongoClient(process.env.STATS_MONGODB_URI);
    await client.connect();
  }
  return client.db().collection(name);
}

/** Exactly the three fields, plus a random key; anything else is a bug and throws. */
function tetradDoc(row) {
  const keys = Object.keys(row).sort();
  if (keys.join() !== [...TETRAD_FIELDS].sort().join()) throw new Error(`tetrad row must carry exactly ${TETRAD_FIELDS.join(', ')}`);
  return { _id: crypto.randomBytes(12).toString('hex'), archetype: row.archetype, double_picks: row.double_picks, shown: row.shown };
}

const tetradQueue = createAnonQueue({
  sink: async (rows) => { await (await collection('tetrad_observer')).insertMany(rows.map(tetradDoc), { ordered: false }); },
});

/** Queue one tetrad-observer row (or drop it when no stats store is configured). */
function queueTetradRow(row) {
  if (!row) return;
  if (!process.env.STATS_MONGODB_URI) {
    if (!warned) { warned = true; console.warn('[stats] STATS_MONGODB_URI not set — tetrad observer rows are not stored'); }
    return;
  }
  tetradDoc(row);                                                     // validate now, not at flush time
  tetradQueue.push(row);
}

module.exports = { queueTetradRow, tetradDoc };
