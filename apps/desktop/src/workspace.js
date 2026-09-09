/**
 * The local workstation — implementation of docs/LOCAL_WORKSTATION_CONTRACT.md.
 *
 * One directory, chosen by the user, holding everything that is theirs: the report,
 * the full profile, and whatever tools produce. Garden For Life keeps no copy, so the
 * two rules that matter most here are containment (never touch anything outside the
 * chosen root) and never destroying data in place (§4 — the folder is the only copy).
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

/** Bumped only when the folder LAYOUT changes in a way old apps can't read. */
const SCHEMA_VERSION = 1;

/** Files a tool may write. Anything a person can't open in a text editor is refused. */
const ALLOWED_EXTENSIONS = new Set(['.json', '.pdf', '.md', '.txt', '.csv']);

const SUBDIRS = ['profile', 'profile/reports', 'tools', 'consent', '.backups'];

// ── Containment ────────────────────────────────────────────────────────────────

/**
 * Resolve a caller-supplied relative path against the workspace root, refusing anything
 * that escapes it. This is the single security boundary of the whole bridge: the renderer
 * is untrusted input as far as this module is concerned, so `../`, absolute paths and
 * symlinks that point outside all have to die here rather than deeper in.
 */
function resolveInside(root, relPath) {
  if (typeof relPath !== 'string' || !relPath.length) {
    throw new Error('A path is required');
  }
  if (path.isAbsolute(relPath)) {
    throw new Error('Absolute paths are not permitted');
  }
  const rootResolved = path.resolve(root);
  const target = path.resolve(rootResolved, relPath);
  const rel = path.relative(rootResolved, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path escapes the workspace');
  }
  return target;
}

/** The workspace root with symlinks resolved — the only form safe to compare against. */
function realRoot(root) {
  try {
    return fs.realpathSync(path.resolve(root));
  } catch {
    return path.resolve(root);
  }
}

/**
 * Containment check for a path that already exists: resolves symlinks before comparing,
 * so a link inside the folder cannot be used to reach outside it.
 */
function assertRealPathInside(root, target) {
  let real;
  try {
    real = fs.realpathSync(target);
  } catch {
    return target; // does not exist yet — the resolved path was already checked
  }
  const rootReal = fs.realpathSync(path.resolve(root));
  const rel = path.relative(rootReal, real);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error('Path resolves outside the workspace');
  }
  return real;
}

/**
 * A single path segment supplied by the renderer — a tool id, a backup label. Anything
 * that is not a plain name is refused outright rather than sanitised, because sanitising
 * invites the question "did I catch every form of it?" and the answer is usually no.
 * Rejects: empty, '.', '..', separators, drive letters, NUL, and anything exotic.
 */
function assertPlainSegment(value, what) {
  const segment = String(value == null ? '' : value);
  if (!segment) throw new Error(`A ${what} is required`);
  if (segment.length > 64) throw new Error(`That ${what} is too long`);
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment)) {
    throw new Error(`Invalid ${what}: only letters, digits, dot, dash and underscore are allowed`);
  }
  if (segment === '.' || segment === '..') throw new Error(`Invalid ${what}`);
  return segment;
}

function assertAllowedExtension(target) {
  const ext = path.extname(target).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Refusing to write ${ext || 'a file with no extension'} — the folder holds readable formats only`);
  }
}

// ── Scaffold and manifest ──────────────────────────────────────────────────────

function manifestPath(root) {
  return path.join(root, 'manifest.json');
}

async function readManifest(root) {
  try {
    return JSON.parse(await fsp.readFile(manifestPath(root), 'utf8'));
  } catch {
    return null;
  }
}

async function writeManifest(root, manifest) {
  await writeJsonAtomic(manifestPath(root), manifest);
}

/**
 * Create the directory structure and manifest if they aren't there yet. Safe to run on
 * every launch: existing folders and an existing manifest are left untouched.
 */
async function ensureScaffold(root, appVersion) {
  await fsp.mkdir(root, { recursive: true });
  for (const dir of SUBDIRS) {
    await fsp.mkdir(path.join(root, dir), { recursive: true });
  }

  let manifest = await readManifest(root);
  if (!manifest) {
    manifest = {
      schemaVersion: SCHEMA_VERSION,
      folderId: crypto.randomUUID(),
      accountId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appVersion,
      tools: {},
    };
    await writeManifest(root, manifest);
  }

  const consent = path.join(root, 'consent', 'ledger.json');
  if (!fs.existsSync(consent)) {
    await writeJsonAtomic(consent, { entries: [] });
  }
  return manifest;
}

// ── Writing without destroying ─────────────────────────────────────────────────

/**
 * Write via a temp file and rename. A crash mid-write then leaves the previous file
 * intact rather than a truncated one — §4's "a failed write leaves the original alone",
 * applied at the level of a single file.
 */
async function writeJsonAtomic(target, data) {
  const tmp = `${target}.${process.pid}.tmp`;
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fsp.rename(tmp, target);
}

/**
 * Copy the whole folder aside before anything structural happens to it (§4.1).
 * Returns the backup directory, or null when there was nothing to copy.
 */
async function backupFolder(root, label) {
  // The label reaches us from the renderer. A stamp prefix does NOT neutralise it —
  // path.join happily normalises '<stamp>-../../..' straight out of the workspace — so
  // it is validated as a plain segment, and the result is contained a second time.
  const suffix = label === undefined || label === null || label === '' ? '' : `-${assertPlainSegment(label, 'backup label')}`;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = resolveInside(root, path.join('.backups', `${stamp}${suffix}`));
  const entries = await fsp.readdir(root, { withFileTypes: true });
  const copyable = entries.filter((e) => e.name !== '.backups');
  if (!copyable.length) return null;

  await fsp.mkdir(dest, { recursive: true });
  for (const entry of copyable) {
    await fsp.cp(path.join(root, entry.name), path.join(dest, entry.name), { recursive: true });
  }
  await pruneBackups(root);
  return dest;
}

/** Keep the three most recent backups (§4.4) — small files, cheap insurance. */
async function pruneBackups(root, keep = 3) {
  const dir = path.join(root, '.backups');
  let entries;
  try {
    entries = (await fsp.readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory());
  } catch {
    return;
  }
  const stale = entries.map((e) => e.name).sort().reverse().slice(keep);
  for (const name of stale) {
    await fsp.rm(path.join(dir, name), { recursive: true, force: true }).catch(() => {});
  }
}

// ── Migration ──────────────────────────────────────────────────────────────────

/**
 * Bring an older folder up to SCHEMA_VERSION. Forward-only and re-runnable (§4.2), and
 * every run copies the folder aside first. A folder from a NEWER app is refused rather
 * than downgraded — writing to it with older assumptions is how data gets mangled.
 */
async function migrate(root, appVersion) {
  const manifest = await readManifest(root);
  if (!manifest) return { migrated: false, manifest: await ensureScaffold(root, appVersion) };

  const from = Number(manifest.schemaVersion) || 0;
  if (from > SCHEMA_VERSION) {
    throw new Error(
      `This folder was written by a newer version of Garden For Life (layout v${from}). ` +
      'Update the app before opening it — an older version could damage it.'
    );
  }
  if (from === SCHEMA_VERSION) return { migrated: false, manifest };

  const backup = await backupFolder(root, `pre-v${SCHEMA_VERSION}`);
  // Steps are registered here as the layout evolves: STEPS[1] takes v1 → v2, and so on.
  const STEPS = {};
  let current = from;
  while (current < SCHEMA_VERSION) {
    const step = STEPS[current];
    if (step) await step(root);
    current += 1;
  }
  manifest.schemaVersion = SCHEMA_VERSION;
  manifest.appVersion = appVersion;
  manifest.updatedAt = new Date().toISOString();
  await writeManifest(root, manifest);
  return { migrated: true, from, to: SCHEMA_VERSION, backup, manifest };
}

// ── The operations the bridge exposes ──────────────────────────────────────────

async function readFileIn(root, relPath) {
  const target = assertRealPathInside(root, resolveInside(root, relPath));
  const ext = path.extname(target).toLowerCase();
  if (ext === '.pdf') return { encoding: 'base64', data: (await fsp.readFile(target)).toString('base64') };
  return { encoding: 'utf8', data: await fsp.readFile(target, 'utf8') };
}

async function writeFileIn(root, relPath, data, encoding = 'utf8') {
  const target = resolveInside(root, relPath);
  assertAllowedExtension(target);
  assertRealPathInside(root, path.dirname(target));
  await fsp.mkdir(path.dirname(target), { recursive: true });
  const tmp = `${target}.${process.pid}.tmp`;
  await fsp.writeFile(tmp, encoding === 'base64' ? Buffer.from(data, 'base64') : String(data), encoding === 'base64' ? undefined : 'utf8');
  await fsp.rename(tmp, target);
  return { path: relPath };
}

async function listIn(root, relPath = '.') {
  const target = assertRealPathInside(root, resolveInside(root, relPath === '.' ? '.' : relPath));
  const entries = await fsp.readdir(target, { withFileTypes: true });
  return entries
    .filter((e) => !e.name.startsWith('.'))
    .map((e) => ({ name: e.name, directory: e.isDirectory() }));
}

async function removeIn(root, relPath) {
  // '.' and '' name the root itself; refuse before resolving so the guard below never
  // has to be the only thing standing between a renderer and the whole folder.
  if (relPath === '.' || relPath === '' || relPath === './') {
    throw new Error('Refusing to delete the workspace root');
  }
  const target = assertRealPathInside(root, resolveInside(root, relPath));
  // BOTH sides must be realpath-resolved. assertRealPathInside returns a resolved path,
  // so comparing it against an unresolved root fails open wherever the root is reached
  // through a symlink or junction — which is every workspace under macOS /tmp or /var,
  // and any redirected Windows folder.
  if (target === realRoot(root)) throw new Error('Refusing to delete the workspace root');
  await fsp.rm(target, { recursive: true, force: true });
  return { removed: relPath };
}

// ── Consent ledger (§6) ────────────────────────────────────────────────────────

async function readConsent(root) {
  try {
    return JSON.parse(await fsp.readFile(path.join(root, 'consent', 'ledger.json'), 'utf8'));
  } catch {
    return { entries: [] };
  }
}

/**
 * Append-only: a grant is added, and a revocation is recorded by stamping revokedAt on
 * the existing entry. Nothing is ever removed, so the ledger stays an audit trail.
 */
async function recordConsent(root, entry) {
  const ledger = await readConsent(root);
  ledger.entries.push({
    // Validated on the way IN as well, so the ledger can never hold an id that
    // revocation would refuse — an unrevokable grant is worse than a rejected one.
    toolId: assertPlainSegment(entry && entry.toolId, 'tool id'),
    purpose: String(entry.purpose || ''),
    dataUsed: Array.isArray(entry.dataUsed) ? entry.dataUsed.map(String) : [],
    sendsToServer: Array.isArray(entry.sendsToServer) ? entry.sendsToServer.map(String) : [],
    grantedAt: new Date().toISOString(),
    revokedAt: null,
  });
  await writeJsonAtomic(path.join(root, 'consent', 'ledger.json'), ledger);
  return ledger;
}

async function revokeConsent(root, toolId) {
  const id = assertPlainSegment(toolId, 'tool id');
  const ledger = await readConsent(root);
  const now = new Date().toISOString();
  for (const e of ledger.entries) {
    if (e.toolId === id && !e.revokedAt) e.revokedAt = now;
  }
  await writeJsonAtomic(path.join(root, 'consent', 'ledger.json'), ledger);
  // Revocation removes that tool's working data (§6) — its own directory, nothing else.
  // The id is contained the same way every other path in this module is: validated as a
  // plain segment, resolved inside the root, and checked again after symlink resolution.
  // Errors are NOT swallowed here — a revocation that failed to delete must not report
  // success, or the ledger says the data is gone while it is still on disk.
  const toolDir = assertRealPathInside(root, resolveInside(root, path.join('tools', id)));
  if (toolDir === realRoot(root)) throw new Error('Refusing to delete the workspace root');
  await fsp.rm(toolDir, { recursive: true, force: true });
  return ledger;
}

module.exports = {
  SCHEMA_VERSION,
  ALLOWED_EXTENSIONS,
  resolveInside,
  assertPlainSegment,
  realRoot,
  ensureScaffold,
  readManifest,
  writeManifest,
  writeJsonAtomic,
  backupFolder,
  pruneBackups,
  migrate,
  readFileIn,
  writeFileIn,
  listIn,
  removeIn,
  readConsent,
  recordConsent,
  revokeConsent,
};
