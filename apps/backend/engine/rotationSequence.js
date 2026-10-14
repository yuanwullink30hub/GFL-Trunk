/**
 * Quarterly rotation sequence (Backend Instruction Rotation Sequence v0.1.1): the display plan for one
 * level for one quarter — 36 positions, each with its subject, the question shown there and the
 * Layer-1 slot key {A..F → group 1..6}.
 *
 * A line-for-line port of `l1_key_generator_v0_2.py` (generate, generate_sequence, validate_sequence),
 * including Python's random module: MT19937 seeded from the SHA-256 of the seed string, and shuffle via
 * getrandbits — so seed + level + bank give the identical sequence in both languages (acceptance test 2;
 * engine/tests/rotationSequence.test.js checks it against the reference's own output).
 *
 * Questions rotate only inside their own subject; the slot key binds to the POSITION, not to the
 * question. Layer 2 is not part of the sequence: it is shuffled at render and never stored.
 */

'use strict';

const crypto = require('crypto');

// ── Python's random.Random(int), as far as the generator uses it ──────────────

const N = 624;

class PyRandom {
  /** @param {bigint} seed  a non-negative integer, as random.Random(seed) receives it */
  constructor(seed) {
    const key = [];
    let n = seed < 0n ? -seed : seed;
    do { key.push(Number(n & 0xffffffffn)); n >>= 32n; } while (n > 0n);
    this.mt = new Uint32Array(N);
    this.mti = N;
    this.initByArray(key);
  }

  initGenrand(s) {
    const mt = this.mt;
    mt[0] = s >>> 0;
    for (let i = 1; i < N; i++) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = (Math.imul(1812433253, prev) + i) >>> 0;
    }
    this.mti = N;
  }

  initByArray(key) {
    const mt = this.mt;
    this.initGenrand(19650218);
    let i = 1;
    let j = 0;
    for (let k = Math.max(N, key.length); k; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1664525)) + key[j] + j) >>> 0;
      i++; j++;
      if (i >= N) { mt[0] = mt[N - 1]; i = 1; }
      if (j >= key.length) j = 0;
    }
    for (let k = N - 1; k; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1566083941)) - i) >>> 0;
      i++;
      if (i >= N) { mt[0] = mt[N - 1]; i = 1; }
    }
    mt[0] = 0x80000000;
  }

  uint32() {
    const mt = this.mt;
    if (this.mti >= N) {
      for (let kk = 0; kk < N; kk++) {
        const y = (mt[kk] & 0x80000000) | (mt[(kk + 1) % N] & 0x7fffffff);
        mt[kk] = mt[(kk + 397) % N] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
      }
      this.mti = 0;
    }
    let y = mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  /** getrandbits(k) for 1 ≤ k ≤ 32 */
  getrandbits(k) { return this.uint32() >>> (32 - k); }

  /** _randbelow_with_getrandbits(n) */
  randbelow(n) {
    const k = 32 - Math.clz32(n);
    let r = this.getrandbits(k);
    while (r >= n) r = this.getrandbits(k);
    return r;
  }

  /** random.shuffle(x), in place */
  shuffle(x) {
    for (let i = x.length - 1; i > 0; i--) {
      const j = this.randbelow(i + 1);
      [x[i], x[j]] = [x[j], x[i]];
    }
  }
}

/** random.Random(int(hashlib.sha256(str(seed).encode()).hexdigest(), 16)) */
const rngFor = (seed) => new PyRandom(BigInt(`0x${crypto.createHash('sha256').update(String(seed), 'utf8').digest('hex')}`));

// ── The slot key (generate / verify) ──────────────────────────────────────────

const BLOCKS = [[0, 9], [9, 18], [18, 24], [24, 30], [30, 36]];
const SLOTS = ['A', 'B', 'C', 'D', 'E', 'F'];
const rowKey = (r) => r.join(',');
const NATURAL = Array.from({ length: 6 }, (_, k) => Array.from({ length: 6 }, (_, i) => ((i + k) % 6) + 1));
const FORBIDDEN = new Set([...NATURAL, ...NATURAL.map((r) => [...r].reverse())].map(rowKey));

function latinSquare(rng) {
  const sq = Array.from({ length: 6 }, () => Array(6).fill(0));
  const fill = (i) => {
    if (i === 36) return true;
    const r = Math.floor(i / 6);
    const c = i % 6;
    const opts = [];
    for (let g = 1; g <= 6; g++) {
      if (sq[r].includes(g)) continue;
      let free = true;
      for (let k = 0; k < r; k++) if (sq[k][c] === g) { free = false; break; }
      if (free) opts.push(g);
    }
    rng.shuffle(opts);
    for (const g of opts) {
      sq[r][c] = g;
      if (fill(i + 1)) return true;
    }
    sq[r][c] = 0;
    return false;
  };
  fill(0);
  return sq.map((row) => row.slice());
}

const sameSlot = (a, b) => a.some((x, s) => x === b[s]);

function rowsOk(rows) {
  if (new Set(rows.map(rowKey)).size !== 36) return false;                         // G4
  if (rows.some((r) => FORBIDDEN.has(rowKey(r)))) return false;                    // G6
  for (let q = 1; q < rows.length; q++) if (sameSlot(rows[q - 1], rows[q])) return false; // G3
  for (const [s, e] of BLOCKS) {                                                   // G5
    for (let slot = 0; slot < 6; slot++) {
      const col = rows.slice(s, e).map((r) => r[slot]);
      for (let g = 1; g <= 6; g++) if (col.filter((x) => x === g).length > 2) return false;
    }
  }
  return true;
}

/** Depth-first ordering of the 36 rows under G3 (consecutive) and G5 (block caps). */
function orderRows(rows, rng) {
  const blockOf = Array.from({ length: 36 }, (_, q) => BLOCKS.findIndex(([s, e]) => s <= q && q < e));
  const counts = BLOCKS.map(() => Array.from({ length: 6 }, () => Array(7).fill(0)));
  const out = [];
  const used = Array(36).fill(false);
  let budget = 200000;
  const place = (q) => {
    if (q === 36) return true;
    budget -= 1;
    if (budget < 0) return false;
    const blk = blockOf[q];
    const idx = Array.from({ length: 36 }, (_, i) => i);
    rng.shuffle(idx);
    for (const i of idx) {
      if (used[i]) continue;
      const r = rows[i];
      if (out.length && sameSlot(r, out[out.length - 1])) continue;
      if (r.some((g, slot) => counts[blk][slot][g] >= 2)) continue;
      used[i] = true; out.push(r);
      r.forEach((g, slot) => { counts[blk][slot][g] += 1; });
      if (place(q + 1)) return true;
      used[i] = false; out.pop();
      r.forEach((g, slot) => { counts[blk][slot][g] -= 1; });
    }
    return false;
  };
  return place(0) ? out : null;
}

/** The 36-row slot key for a seed: row q lists the group (1–6) in slots A..F. */
function generate(seed) {
  const rng = rngFor(seed);
  for (;;) {
    const rows = [];
    for (let k = 0; k < 6; k++) rows.push(...latinSquare(rng));                    // G1 + G2
    if (new Set(rows.map(rowKey)).size !== 36 || rows.some((r) => FORBIDDEN.has(rowKey(r)))) continue; // G4 + G6
    const ordered = orderRows(rows, rng);
    if (ordered && rowsOk(ordered)) return ordered;
  }
}

// ── The full sequence ─────────────────────────────────────────────────────────

const SUBJECTS = [['zelf_zonde', 0, 9], ['ander_attentie', 9, 18], ['massa_macht', 18, 24],
  ['wereld_wijsheid', 24, 30], ['mysterie_magie', 30, 36]];

/**
 * @param {string} seed   the quarter label by default ('2026-Q4')
 * @param {string} level  'beginner' | 'gevorderd' | 'leerling'
 * @param {Object<string, string[]>} questionsBySubject  9/9/6/6/6 question ids, in bank order
 * @returns {{position:number, subject:string, question_id:string, slots:Object<string, number>}[]}
 */
function generateSequence(seed, level, questionsBySubject) {
  const rng = rngFor(`${seed}|${level}|order`);
  const key = generate(`${seed}|${level}|slots`);
  const out = [];
  for (const [subject, s, e] of SUBJECTS) {
    const ids = [...(questionsBySubject[subject] || [])];
    if (ids.length !== e - s) throw new Error(`${subject}: expected ${e - s} questions, got ${ids.length}`);
    rng.shuffle(ids);
    ids.forEach((qid, i) => {
      const pos = s + i;
      out.push({ position: pos + 1, subject, question_id: qid, slots: Object.fromEntries(SLOTS.map((c, k) => [c, key[pos][k]])) });
    });
  }
  return out;
}

/** Issues as [code, severity, message]; an empty list is a valid sequence (instruction §3). */
function validateSequence(seq, questionsBySubject) {
  const issues = [];
  if (!Array.isArray(seq) || seq.length !== 36) return [['LEN', 'hard', 'sequence must have 36 positions']];
  const rows = seq.map((p) => SLOTS.map((c) => p.slots[c]));
  seq.forEach((p, i) => {
    if ([...rows[i]].sort().join(',') !== '1,2,3,4,5,6') issues.push(['G1', 'hard', `position ${p.position}: slots are not a permutation of 1–6`]);
  });
  for (let slot = 0; slot < 6; slot++) {
    for (let g = 1; g <= 6; g++) {
      const n = rows.filter((r) => r[slot] === g).length;
      if (n !== 6) issues.push(['G2', 'hard', `group ${g} in slot ${SLOTS[slot]} ${n}× (must be 6×)`]);
    }
  }
  if (new Set(rows.map(rowKey)).size !== 36) issues.push(['G4', 'hard', 'two positions share the same slot order']);
  for (let i = 0; i + 1 < rows.length; i++) {
    rows[i].forEach((x, slot) => {
      if (x === rows[i + 1][slot]) issues.push(['G3', 'soft', `group ${x} in slot ${SLOTS[slot]} at positions ${i + 1} and ${i + 2}`]);
    });
  }
  for (const [subject, s, e] of SUBJECTS) {
    for (let slot = 0; slot < 6; slot++) {
      const col = rows.slice(s, e).map((r) => r[slot]);
      for (let g = 1; g <= 6; g++) {
        const n = col.filter((x) => x === g).length;
        if (n > 2) issues.push(['G5', 'soft', `${subject}: group ${g} in slot ${SLOTS[slot]} ${n}×`]);
      }
    }
    const placed = seq.slice(s, e).map((p) => String(p.question_id)).sort();
    const bank = (questionsBySubject[subject] || []).map(String).sort();
    if (placed.join('\u0000') !== bank.join('\u0000')) issues.push(['SUBJ', 'hard', `${subject}: questions do not match the current bank for this subject`]);
    if (seq.slice(s, e).some((p) => p.subject !== subject)) issues.push(['SUBJ', 'hard', `${subject}: a question sits outside its own subject`]);
  }
  seq.forEach((p, i) => {
    if (FORBIDDEN.has(rowKey(rows[i]))) issues.push(['G6', 'soft', `position ${p.position}: natural order, rotation or reversal`]);
  });
  return issues;
}

/** The quarter label for a moment, in Europe/Amsterdam (quarters switch at 00:00 local time, §4). */
function quarterOf(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: 'numeric' }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year').value;
  const month = Number(parts.find((p) => p.type === 'month').value);
  return `${year}-Q${Math.ceil(month / 3)}`;
}

module.exports = { PyRandom, generate, generateSequence, validateSequence, quarterOf, SUBJECTS, SLOTS };
