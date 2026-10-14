/**
 * Exact arithmetic for gate G6 (owner, 13 Oct 2026): the Bleed v2 scoring counts in whole units and every
 * threshold compares integers. Config values are exact decimal or fraction strings ("1/3", "0.1", "9"),
 * never binary floats — a float would parse to a 2⁵³-scale denominator and trip the unit's fail-loud check.
 */

'use strict';

const babs = (x) => (x < 0n ? -x : x);
const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };

/** A reduced fraction of BigInts. */
function frac(n, d = 1n) {
  if (d === 0n) throw new Error('fraction with denominator 0');
  if (d < 0n) { n = -n; d = -d; }
  const g = bgcd(n, d) || 1n;
  return { n: n / g, d: d / g };
}

/** "9" · "1/3" · "0.1" · "8.5" → exact fraction. Anything that is not such a string throws. */
function parseFraction(s) {
  if (typeof s !== 'string') throw new Error(`exact config value must be a string, got ${typeof s} ${String(s)}`);
  const t = s.trim();
  let m = /^(-?\d+)\/(\d+)$/.exec(t);
  if (m) return frac(BigInt(m[1]), BigInt(m[2]));
  m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(t);
  if (!m) throw new Error(`not an exact decimal or fraction: ${JSON.stringify(s)}`);
  const decimals = m[3] || '';
  const n = BigInt(m[2] + decimals) * (m[1] ? -1n : 1n);
  return frac(n, 10n ** BigInt(decimals.length));
}

const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
const div = (a, b) => frac(a.n * b.d, a.d * b.n);
const fromInt = (k) => frac(BigInt(k));

/** A small exact threshold as plain numbers [a, b] (a/b), for integer cross-multiplication. */
function threshold(s) {
  const f = parseFraction(s);
  return [Number(f.n), Number(f.d)];
}

/** round half UP of 100 × a / b, exactly, for integers a ≥ 0, b > 0 (0 when b is 0): (200a + b) div 2b. */
function pctHalfUp(a, b) {
  if (!b) return 0;
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) throw new Error(`pctHalfUp needs integers, got ${a} / ${b}`);
  const p = 200 * a + b, q = 2 * b;
  return (p - (p % q)) / q;
}

module.exports = { frac, parseFraction, mul, div, fromInt, bgcd, threshold, pctHalfUp };
