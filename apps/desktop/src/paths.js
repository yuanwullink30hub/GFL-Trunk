/**
 * Path containment for the workspace — the security boundary between an untrusted
 * renderer and the user's disk.
 *
 * This module exists because the first attempt got it wrong in a way that reads as
 * correct: it resolved symlinks and then operated on the RESOLVED path, so a delete
 * followed a link and destroyed its target; and when a path did not exist yet, resolution
 * failed and it fell back to the unresolved path, so the check passed and `mkdir -p`
 * walked straight out of the folder. Both were demonstrated, not theorised.
 *
 * The principle here is different and much duller: **the workspace contains no symlinks.**
 * Every component of every path is validated as a plain name, and every existing component
 * is lstat'd and refused if it is a link. Nothing is ever dereferenced, so nothing can be
 * dereferenced into. A workspace we create ourselves has no legitimate need for links, so
 * refusing them outright costs nothing and removes the entire class of bug.
 */
const fs = require('fs');
const path = require('path');

/** Windows treats these as devices regardless of extension or directory. */
const RESERVED = new Set([
  'con', 'prn', 'aux', 'nul',
  ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
]);

/** Filesystems that compare names case-insensitively — so our guards must too. */
const CASE_INSENSITIVE = process.platform === 'win32' || process.platform === 'darwin';

/** Normalise a path for comparison. Case-folds only where the filesystem does. */
function comparable(p) {
  const resolved = path.resolve(p);
  return CASE_INSENSITIVE ? resolved.toLowerCase() : resolved;
}

/** True when two paths name the same location on this filesystem. */
function samePath(a, b) {
  return comparable(a) === comparable(b);
}

/**
 * Validate one path component. Rejects traversal, separators, drive letters, NTFS
 * alternate data streams (the ':' in `payload.exe:hidden`), control characters, Windows
 * reserved device names, and the trailing dots and spaces Windows silently strips —
 * which would otherwise let `evil.json.` become `evil.json` after the check passed.
 *
 * `allowLeadingDot` is for our own internal directories (.backups); caller-supplied
 * identifiers use the stricter form.
 */
function assertSegment(segment, what = 'path segment', { allowLeadingDot = false } = {}) {
  const s = String(segment == null ? '' : segment);
  if (!s) throw new Error(`A ${what} is required`);
  if (s.length > 64) throw new Error(`That ${what} is too long`);
  if (s === '.' || s === '..') throw new Error(`Invalid ${what}`);
  const pattern = allowLeadingDot ? /^[A-Za-z0-9._-]+$/ : /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
  if (!pattern.test(s)) {
    throw new Error(`Invalid ${what}: only letters, digits, dot, dash and underscore are allowed`);
  }
  if (/[. ]$/.test(s)) throw new Error(`Invalid ${what}: it may not end with a dot or space`);
  const stem = s.split('.')[0].toLowerCase();
  if (RESERVED.has(stem)) throw new Error(`Invalid ${what}: "${stem}" is a reserved device name`);
  return s;
}

/** A caller-supplied identifier — tool id, backup label. Stricter: no leading dot. */
function assertPlainSegment(value, what) {
  return assertSegment(value, what, { allowLeadingDot: false });
}

/**
 * Split a relative path into validated components. Because every component is checked
 * against the pattern above, `..` cannot appear and the result cannot escape by
 * construction — containment does not depend on string comparison after the fact.
 */
function segmentsOf(relPath, what = 'path') {
  if (typeof relPath !== 'string' || !relPath.length) throw new Error(`A ${what} is required`);
  if (path.isAbsolute(relPath) || /^[A-Za-z]:/.test(relPath)) {
    throw new Error('Absolute paths are not permitted');
  }
  const parts = relPath.split(/[\\/]+/).filter((p) => p.length && p !== '.');
  if (!parts.length) throw new Error(`A ${what} is required`);
  return parts.map((p) => assertSegment(p, `${what} component`, { allowLeadingDot: true }));
}

/**
 * Walk from the root down the given components, refusing any existing level that is a
 * symlink. lstat, never stat: stat follows links and would report the target's type,
 * which is exactly the mistake being avoided. Levels that do not exist yet are fine —
 * they cannot be links, and the parent chain above them has already been checked.
 */
function assertNoLinks(root, parts) {
  let current = path.resolve(root);
  const rootStat = fs.lstatSync(current, { throwIfNoEntry: false });
  if (rootStat && rootStat.isSymbolicLink()) {
    // The root itself being a link is legitimate — the user may have picked one — but we
    // resolve it ONCE here so every later comparison is against the real location.
    current = fs.realpathSync(current);
  }
  for (const part of parts) {
    current = path.join(current, part);
    const st = fs.lstatSync(current, { throwIfNoEntry: false });
    if (!st) return current; // does not exist; nothing below it can exist either
    if (st.isSymbolicLink()) {
      throw new Error(`Refusing to follow a link inside the workspace: ${part}`);
    }
  }
  return current;
}

/**
 * The one function every disk operation goes through. Returns an absolute path that is
 * provably inside the workspace, with no symlink anywhere in its chain.
 */
function safePath(root, relPath, what = 'path') {
  const parts = segmentsOf(relPath, what);
  const target = assertNoLinks(root, parts);
  // Belt and braces: the segment validation already makes escape impossible, but a
  // second check costs nothing and would catch a future change to the parser.
  const realRootPath = realRoot(root);
  const rel = path.relative(realRootPath, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Path escapes the workspace');
  return target;
}

/** The workspace root with its own symlinks resolved — the only safe comparison target. */
function realRoot(root) {
  try {
    return fs.realpathSync(path.resolve(root));
  } catch {
    return path.resolve(root);
  }
}

/** Refuse an operation that would land on the workspace root itself. */
function assertNotRoot(root, target) {
  if (samePath(target, realRoot(root)) || samePath(target, root)) {
    throw new Error('Refusing to delete the workspace root');
  }
}

module.exports = {
  CASE_INSENSITIVE,
  comparable,
  samePath,
  assertSegment,
  assertPlainSegment,
  segmentsOf,
  assertNoLinks,
  safePath,
  realRoot,
  assertNotRoot,
};
