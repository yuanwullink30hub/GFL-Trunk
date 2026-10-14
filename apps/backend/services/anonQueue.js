/**
 * Anonymous write queue (privacy instruction §5.2 "no timing linkage"; Bleed v2 Scoring §5.4).
 *
 * Rows that must never be traceable to a session — today the tetrad observer's — are not written
 * when they arise. They wait here in memory, are shuffled, and go to the store in batches at a
 * randomised moment, so a row's write time cannot be matched to a session in any log. The queue
 * stores nothing itself, adds no timestamp, and never logs a row's contents.
 *
 * A batch is written only once it holds at least `minBatch` rows; until then the flush waits for the
 * next random moment. Rows still waiting when the process stops are lost — acceptable for anonymous
 * statistics, and safer than persisting them anywhere on the way.
 */

'use strict';

function shuffle(rows, random) {
  const a = rows.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * @param {object} opts
 * @param {(rows: object[]) => Promise<void>} opts.sink  writes one shuffled batch to the separate store
 * @param {number} [opts.minBatch=5]                    never write fewer rows than this at once
 * @param {number} [opts.minDelayMs=30 min]             random flush window, lower bound
 * @param {number} [opts.maxDelayMs=120 min]            random flush window, upper bound
 * @param {() => number} [opts.random=Math.random]
 * @param {(fn: Function, ms: number) => any} [opts.setTimer=setTimeout]
 */
function createAnonQueue({ sink, minBatch = 5, minDelayMs = 30 * 60e3, maxDelayMs = 120 * 60e3, random = Math.random, setTimer = setTimeout }) {
  let buffer = [];
  let timer = null;

  const schedule = () => {
    if (timer) return;
    const ms = minDelayMs + random() * (maxDelayMs - minDelayMs);
    timer = setTimer(() => { timer = null; flush().catch(() => {}); }, ms);
    if (timer && typeof timer.unref === 'function') timer.unref();   // never keeps the process alive
  };

  /** Write the waiting rows as one shuffled batch, if there are enough. Returns how many were written. */
  async function flush() {
    if (buffer.length < minBatch) { if (buffer.length) schedule(); return 0; }
    const batch = shuffle(buffer, random);
    buffer = [];
    try {
      await sink(batch);
      return batch.length;
    } catch (e) {
      buffer = shuffle(buffer.concat(batch), random);                 // retry later, still unordered
      schedule();
      console.warn(`[anonQueue] store write failed (${batch.length} rows kept for the next flush): ${e.message}`);
      return 0;
    }
  }

  return {
    push(row) { buffer.push(row); schedule(); },
    flush,
    get size() { return buffer.length; },
  };
}

module.exports = { createAnonQueue, shuffle };
