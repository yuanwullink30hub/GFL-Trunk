/**
 * Python-semantics helpers for the ported runtime engine.
 *
 * The engine's acceptance numbers (tests/backend_test_fixtures_v1.json) were produced by
 * CPython. Three places where JavaScript differs would drift them:
 *   - round(x, n): CPython rounds the EXACT binary value half-to-even; Math.round and
 *     toFixed do not.                                              → pyRound
 *   - float(s):    CPython rejects '' and non-numeric text (ValueError); Number('') is 0.
 *                                                                  → pyFloat
 *   - random.Random(seed): Mersenne Twister MT19937 with CPython's int seeding,
 *     random(), uniform(), getrandbits(), _randbelow(), choice(), randint(), sample().
 *                                                                  → PyRandom
 */

'use strict';

/** CPython float.__round__(ndigits): half-to-even on the exact binary value. */
function pyRound(x, n = 0) {
  if (!Number.isFinite(x) || x === 0) return x;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, x);
  const hi = view.getUint32(0);
  const lo = view.getUint32(4);
  const negative = hi >>> 31 === 1;
  const expBits = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let exp;
  if (expBits === 0) exp = -1074;
  else { mant |= 1n << 52n; exp = expBits - 1075; }
  let num = mant;
  let den = 1n;
  if (exp >= 0) num <<= BigInt(exp); else den <<= BigInt(-exp);
  if (n >= 0) num *= 10n ** BigInt(n); else den *= 10n ** BigInt(-n);
  let q = num / den;
  const twice = 2n * (num % den);
  if (twice > den || (twice === den && (q & 1n) === 1n)) q += 1n;
  const out = Number(`${q}${n > 0 ? `e-${n}` : n < 0 ? `e${-n}` : ''}`);
  return negative ? -out : out;
}

/** CPython str(v) for the cell values the loaders stringify. */
function pyStr(v) {
  if (v === null || v === undefined) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  return String(v);
}

const FLOAT_RE = /^[+-]?(?:(?:\d(?:_?\d)*)(?:\.(?:\d(?:_?\d)*)?)?|\.\d(?:_?\d)*)(?:[eE][+-]?\d(?:_?\d)*)?$/;

/** CPython float(x): numbers pass through; strings must be numeric (else ValueError). */
function pyFloat(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  const s = String(v).trim();
  if (FLOAT_RE.test(s)) return Number(s.replace(/_/g, ''));
  const lower = s.toLowerCase().replace(/^[+-]/, '');
  if (lower === 'inf' || lower === 'infinity') return s.startsWith('-') ? -Infinity : Infinity;
  if (lower === 'nan') return NaN;
  const err = new Error(`could not convert string to float: '${s}'`);
  err.name = 'ValueError';
  throw err;
}

/** Truthiness of a cell value as `if not r[0]` sees it. */
function pyFalsy(v) {
  return v === null || v === undefined || v === '' || v === 0 || v === false;
}

// ── Mersenne Twister MT19937 — CPython's random.Random ──────────────────────
const N = 624;
const M = 397;
const MATRIX_A = 0x9908b0df;
const UPPER = 0x80000000;
const LOWER = 0x7fffffff;

class PyRandom {
  constructor(seed) {
    this.mt = new Uint32Array(N);
    this.mti = N + 1;
    this.seed(seed);
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
    for (let k = Math.max(N, key.length); k > 0; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1664525)) + key[j] + j) >>> 0;
      i++; j++;
      if (i >= N) { mt[0] = mt[N - 1]; i = 1; }
      if (j >= key.length) j = 0;
    }
    for (let k = N - 1; k > 0; k--) {
      const prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
      mt[i] = ((mt[i] ^ Math.imul(prev, 1566083941)) - i) >>> 0;
      i++;
      if (i >= N) { mt[0] = mt[N - 1]; i = 1; }
    }
    mt[0] = 0x80000000;
  }

  /** CPython seeds an int by its absolute value split into 32-bit words (LSW first). */
  seed(a) {
    let n = BigInt(Math.abs(Number(a)));
    const key = [];
    if (n === 0n) key.push(0);
    while (n > 0n) { key.push(Number(n & 0xffffffffn)); n >>= 32n; }
    this.initByArray(key);
  }

  genrandUint32() {
    const mt = this.mt;
    if (this.mti >= N) {
      let kk = 0;
      for (; kk < N - M; kk++) {
        const y = (mt[kk] & UPPER) | (mt[kk + 1] & LOWER);
        mt[kk] = (mt[kk + M] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)) >>> 0;
      }
      for (; kk < N - 1; kk++) {
        const y = (mt[kk] & UPPER) | (mt[kk + 1] & LOWER);
        mt[kk] = (mt[kk + (M - N)] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)) >>> 0;
      }
      const y = (mt[N - 1] & UPPER) | (mt[0] & LOWER);
      mt[N - 1] = (mt[M - 1] ^ (y >>> 1) ^ (y & 1 ? MATRIX_A : 0)) >>> 0;
      this.mti = 0;
    }
    let y = mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    return y >>> 0;
  }

  random() {
    const a = this.genrandUint32() >>> 5;
    const b = this.genrandUint32() >>> 6;
    return (a * 67108864 + b) * (1.0 / 9007199254740992);
  }

  uniform(a, b) {
    return a + (b - a) * this.random();
  }

  getrandbits(k) {
    if (k === 0) return 0;
    if (k > 32) throw new Error('getrandbits: k > 32 not needed by the engine');
    return this.genrandUint32() >>> (32 - k);
  }

  randbelow(n) {
    const k = n.toString(2).length;
    let r = this.getrandbits(k);
    while (r >= n) r = this.getrandbits(k);
    return r;
  }

  choice(seq) {
    if (!seq.length) throw new Error('Cannot choose from an empty sequence');
    return seq[this.randbelow(seq.length)];
  }

  randint(a, b) {
    return a + this.randbelow(b - a + 1);
  }

  /** sample() — the small-population (pool) branch, which is the only one the engine reaches. */
  sample(population, k) {
    const n = population.length;
    if (!(k >= 0 && k <= n)) throw new Error('Sample larger than population or is negative');
    let setsize = 21;
    if (k > 5) setsize += 4 ** Math.ceil(Math.log(k * 3) / Math.log(4));
    if (n > setsize) throw new Error('sample(): set branch not ported (population too large)');
    const pool = population.slice();
    const result = new Array(k);
    for (let i = 0; i < k; i++) {
      const j = this.randbelow(n - i);
      result[i] = pool[j];
      pool[j] = pool[n - i - 1];
    }
    return result;
  }
}

module.exports = { pyRound, pyStr, pyFloat, pyFalsy, PyRandom };
