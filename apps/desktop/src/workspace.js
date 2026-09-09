/**
 * The local workstation — implementation of docs/LOCAL_WORKSTATION_CONTRACT.md.
 *
 * One directory, chosen by the user, holding everything that is theirs: the report, the
 * full profile, and whatever tools produce. Garden For Life keeps no copy.
 *
 * ── Why this module has no read(path)/write(path) ─────────────────────────────
 * An earlier version exposed a general-purpose filesystem API to the renderer. An
 * adversarial review found twenty-two ways to abuse it — traversal, NTFS alternate data
 * streams, Windows reserved device names, symlink-following deletes, extension bypasses —
 * and every single one existed only because the page could name a path.
 *
 * Nothing the product does requires that. The report, the profile and each tool's state
 * all live at fixed locations named by the contract. So the surface below takes no paths:
 * it takes a tool id (one validated segment) and data. The attack class is not defended
 * against, it is absent.
 *
 * Two further rules the review taught, both about not lying to the user:
 *   - an operation that fails must not leave a record claiming it succeeded, which is why
 *     revocation deletes BEFORE it writes the ledger;
 *   - concurrent callers must not silently lose each other's writes, which is why every
 *     mutation is serialised per workspace and every atomic write gets a unique temp name.
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { assertPlainSegment, safePath, realRoot, assertNotRoot, samePath } = require('./paths');

/** Bumped only when the folder LAYOUT changes in a way old apps can't read. */
const SCHEMA_VERSION = 1;

const SUBDIRS = ['profile', 'profile/reports', 'tools', 'consent', '.backups'];

/** Fixed locations. The renderer never names one of these — it asks for a thing by name. */
const PATHS = {
  manifest: 'manifest.json',
  partial: 'profile/partial.json',
  full: 'profile/full.json',
  ledger: 'consent/ledger.json',
  reports: 'profile/reports',
  tools: 'tools',
};

// ── Serialisation ──────────────────────────────────────────────────────────────

/**
 * Mutations are queued per workspace. Concurrent read-modify-write cycles on the ledger
 * lost entries outright — three simultaneous grants left one — and dropped revocation
 * stamps while the matching directory delete still went through, so the record claimed a
 * tool was active after its data was gone. IPC handlers have no queue of their own.
 */
const queues = new Map();

function serialise(root, fn) {
  const key = realRoot(root);
  const previous = queues.get(key) || Promise.resolve();
  const next = previous.then(fn, fn);
  queues.set(key, next.then(() => {}, () => {})); // a rejection must not poison the chain
  return next;
}

// ── Atomic writes ──────────────────────────────────────────────────────────────

/**
 * Temp-file-then-rename, so a crash leaves the previous file intact rather than a
 * truncated one. The temp name carries random bytes rather than just the pid: two
 * concurrent writes previously shared one temp path, and the losing rename either failed
 * or clobbered the winner while both callers were told they had succeeded.
 */
async function writeAtomic(target, data, encoding) {
  const tmp = `${target}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  await fsp.mkdir(path.dirname(target), { recursive: true });
  try {
    if (encoding === 'base64') await fsp.writeFile(tmp, Buffer.from(data, 'base64'));
    else await fsp.writeFile(tmp, String(data), 'utf8');
    await fsp.rename(tmp, target);
  } catch (err) {
    // Never leave debris in the user's folder: it is unlisted, unbounded, and would be
    // copied into every subsequent backup.
    await fsp.rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}

const writeJson = (target, data) => writeAtomic(target, JSON.stringify(data, null, 2), 'utf8');

async function readJson(target, fallback = null) {
  try {
    return JSON.parse(await fsp.readFile(target, 'utf8'));
  } catch {
    return fallback;
  }
}

/** Resolve one of the fixed locations. Never takes renderer input. */
const at = (root, key) => safePath(root, PATHS[key], key);

// ── Scaffold, manifest, migration ──────────────────────────────────────────────

async function ensureScaffold(root, appVersion) {
  await fsp.mkdir(root, { recursive: true });
  const base = realRoot(root);
  for (const dir of SUBDIRS) await fsp.mkdir(path.join(base, ...dir.split('/')), { recursive: true });

  let manifest = await readJson(at(root, 'manifest'));
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
    await writeJson(at(root, 'manifest'), manifest);
  }
  if (!fs.existsSync(at(root, 'ledger'))) await writeJson(at(root, 'ledger'), { entries: [] });
  return manifest;
}

const readManifest = (root) => readJson(at(root, 'manifest'));

/**
 * Forward-only, re-runnable, and it copies the folder aside first. A folder written by a
 * NEWER app is refused rather than downgraded — operating on it with older assumptions is
 * how the only copy of someone's data gets mangled.
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

  const backup = await backupFolder(root);
  const STEPS = {}; // STEPS[1] takes v1 → v2, as the layout evolves
  for (let v = from; v < SCHEMA_VERSION; v += 1) if (STEPS[v]) await STEPS[v](root);

  manifest.schemaVersion = SCHEMA_VERSION;
  manifest.appVersion = appVersion;
  manifest.updatedAt = new Date().toISOString();
  await writeJson(at(root, 'manifest'), manifest);
  return { migrated: true, from, to: SCHEMA_VERSION, backup, manifest };
}

// ── Backups ────────────────────────────────────────────────────────────────────

/** The app names the backup; there is no caller-supplied label to validate or abuse. */
function backupFolder(root) {
  return serialise(root, async () => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = safePath(root, `.backups/${stamp}`, 'backup path');
    const base = realRoot(root);
    const entries = (await fsp.readdir(base, { withFileTypes: true })).filter((e) => e.name !== '.backups');
    if (!entries.length) return null;

    await fsp.mkdir(dest, { recursive: true });
    for (const entry of entries) {
      // A directory symlink would make cp throw EPERM partway and leave a half-copy that
      // still counts toward the retained three. Links do not belong here; skip them.
      if (entry.isSymbolicLink()) continue;
      await fsp.cp(path.join(base, entry.name), path.join(dest, entry.name), {
        recursive: true,
        verbatimSymlinks: true,
      });
    }
    await pruneUnsafe(root);
    return dest;
  });
}

/** Keep the three most recent (§4.4). Names come from readdir, then are re-validated. */
async function pruneUnsafe(root, keep = 3) {
  const dir = safePath(root, '.backups', 'backup path');
  let entries;
  try {
    entries = (await fsp.readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory() && !e.isSymbolicLink());
  } catch {
    return;
  }
  for (const name of entries.map((e) => e.name).sort().reverse().slice(keep)) {
    let target;
    try {
      target = safePath(root, `.backups/${name}`, 'backup path');
    } catch {
      continue; // a directory planted by something else must not become a delete
    }
    assertNotRoot(root, target);
    await fsp.rm(target, { recursive: true, force: true }).catch(() => {});
  }
}

const pruneBackups = (root, keep = 3) => serialise(root, () => pruneUnsafe(root, keep));

// ── Named operations — the entire surface the renderer can reach ───────────────

const readPartial = (root) => readJson(at(root, 'partial'));
const readFullProfile = (root) => readJson(at(root, 'full'));

const writePartial = (root, data) =>
  serialise(root, () => writeJson(at(root, 'partial'), data)).then(() => ({ saved: PATHS.partial }));

const writeFullProfile = (root, data) =>
  serialise(root, () => writeJson(at(root, 'full'), data)).then(() => ({ saved: PATHS.full }));

/**
 * Save the report. The filename is derived from the clock, never from the caller, so
 * there is nothing to validate and nothing to escape with.
 */
function saveReport(root, pdfBase64) {
  return serialise(root, async () => {
    if (typeof pdfBase64 !== 'string' || !pdfBase64.length) throw new Error('A report is required');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `report-${stamp}.pdf`;
    await writeAtomic(safePath(root, `${PATHS.reports}/${name}`, 'report path'), pdfBase64, 'base64');
    return { saved: `${PATHS.reports}/${name}` };
  });
}

async function listReports(root) {
  try {
    const dir = at(root, 'reports');
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
      .map((e) => ({ name: e.name, path: `${PATHS.reports}/${e.name}` }))
      .sort((a, b) => b.name.localeCompare(a.name));
  } catch {
    return [];
  }
}

/** Read one report by the exact name listReports returned — validated as one segment. */
async function readReport(root, name) {
  const clean = assertPlainSegment(name, 'report name');
  if (!clean.toLowerCase().endsWith('.pdf')) throw new Error('That is not a report');
  const target = safePath(root, `${PATHS.reports}/${clean}`, 'report path');
  return { encoding: 'base64', data: (await fsp.readFile(target)).toString('base64') };
}

const toolDir = (root, toolId) =>
  safePath(root, `${PATHS.tools}/${assertPlainSegment(toolId, 'tool id')}`, 'tool directory');

const readToolState = (root, toolId) =>
  readJson(path.join(toolDir(root, toolId), 'state.json'), null);

const writeToolState = (root, toolId, data) =>
  serialise(root, async () => {
    const dir = toolDir(root, toolId);
    await writeJson(path.join(dir, 'state.json'), data);
    return { saved: `${PATHS.tools}/${assertPlainSegment(toolId, 'tool id')}/state.json` };
  });

/** A tool's own output, named by the tool but validated as a single plain segment. */
function writeToolOutput(root, toolId, name, data) {
  return serialise(root, async () => {
    const dir = toolDir(root, toolId);
    const clean = assertPlainSegment(name, 'output name');
    if (!/\.(json|md|txt|csv)$/i.test(clean)) throw new Error('Tool output must be json, md, txt or csv');
    await writeAtomic(path.join(dir, 'output', clean), typeof data === 'string' ? data : JSON.stringify(data, null, 2), 'utf8');
    return { saved: `${PATHS.tools}/${toolId}/output/${clean}` };
  });
}

async function listToolOutput(root, toolId) {
  try {
    const entries = await fsp.readdir(path.join(toolDir(root, toolId), 'output'), { withFileTypes: true });
    return entries.filter((e) => e.isFile()).map((e) => ({ name: e.name }));
  } catch {
    return [];
  }
}

// ── Consent ledger (§6) ────────────────────────────────────────────────────────

const readLedgerUnsafe = async (root) => {
  const parsed = await readJson(at(root, 'ledger'), null);
  return parsed && Array.isArray(parsed.entries) ? parsed : { entries: [] };
};

const readConsent = (root) => serialise(root, () => readLedgerUnsafe(root));

/**
 * Append-only. The id is validated on the way in as well as out, so the ledger can never
 * hold an id that revocation would later refuse — an unrevokable grant is worse than a
 * rejected one.
 */
function recordConsent(root, entry) {
  return serialise(root, async () => {
    const toolId = assertPlainSegment(entry && entry.toolId, 'tool id');
    const ledger = await readLedgerUnsafe(root);
    ledger.entries.push({
      toolId,
      purpose: String((entry && entry.purpose) || ''),
      dataUsed: Array.isArray(entry && entry.dataUsed) ? entry.dataUsed.map(String) : [],
      sendsToServer: Array.isArray(entry && entry.sendsToServer) ? entry.sendsToServer.map(String) : [],
      grantedAt: new Date().toISOString(),
      revokedAt: null,
    });
    await writeJson(at(root, 'ledger'), ledger);
    return ledger;
  });
}

/**
 * Revocation deletes the tool's data FIRST and records it afterwards. The reverse order
 * left the ledger permanently claiming a revocation that had not happened whenever the
 * delete threw — and an append-only trail cannot be corrected. Errors are not swallowed.
 *
 * Matching is case-insensitive where the filesystem is, so revoking "Plan" cannot leave a
 * still-granted "plan" pointing at a directory that is now gone.
 */
function revokeConsent(root, toolId) {
  return serialise(root, async () => {
    const id = assertPlainSegment(toolId, 'tool id');
    const target = toolDir(root, id);
    assertNotRoot(root, target);
    await fsp.rm(target, { recursive: true, force: true });

    const ledger = await readLedgerUnsafe(root);
    const now = new Date().toISOString();
    for (const e of ledger.entries) {
      const same = samePath(String(e.toolId || ''), id) || String(e.toolId || '') === id;
      if (!e.revokedAt && same) e.revokedAt = now;
    }
    await writeJson(at(root, 'ledger'), ledger);
    return ledger;
  });
}

module.exports = {
  SCHEMA_VERSION,
  PATHS,
  ensureScaffold,
  readManifest,
  migrate,
  backupFolder,
  pruneBackups,
  readPartial,
  writePartial,
  readFullProfile,
  writeFullProfile,
  saveReport,
  listReports,
  readReport,
  readToolState,
  writeToolState,
  writeToolOutput,
  listToolOutput,
  readConsent,
  recordConsent,
  revokeConsent,
  // exported for the tests
  writeAtomic,
  writeJson,
  toolDir,
};
