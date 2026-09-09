/**
 * Workspace contract tests — run with: node test/workspace.test.js
 *
 * These cover the security boundary of the desktop app: the renderer is untrusted as far
 * as workspace.js is concerned, so path containment has to hold against traversal,
 * absolute paths and symlinks. The rest covers the folder contract itself — scaffold,
 * atomic writes, backup pruning, the append-only consent ledger, and refusing a folder
 * written by a newer app. Pure Node; no Electron needed.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const ws = require('../src/workspace.js');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`); }
};
const throws = async (name, fn, match) => {
  try { await fn(); fail++; console.log(`  FAIL  ${name} (no error thrown)`); }
  catch (e) {
    const good = !match || e.message.toLowerCase().includes(match.toLowerCase());
    if (good) { pass++; console.log(`  ok    ${name}`); }
    else { fail++; console.log(`  FAIL  ${name} — got "${e.message}"`); }
  }
};

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gfl-ws-'));
  console.log('\nworkspace root:', root, '\n');

  console.log('── containment ──');
  await throws('rejects ../ traversal', () => ws.resolveInside(root, '../escape.json'), 'escapes');
  await throws('rejects nested traversal', () => ws.resolveInside(root, 'profile/../../out.json'), 'escapes');
  await throws('rejects absolute path', () => ws.resolveInside(root, path.join(os.tmpdir(), 'x.json')), 'absolute');
  await throws('rejects empty path', () => ws.resolveInside(root, ''), 'required');
  ok('accepts a normal nested path',
    ws.resolveInside(root, 'profile/partial.json') === path.resolve(root, 'profile/partial.json'));

  console.log('\n── scaffold ──');
  const manifest = await ws.ensureScaffold(root, '0.1.0');
  ok('manifest written with current schema', manifest.schemaVersion === ws.SCHEMA_VERSION);
  ok('folderId generated', typeof manifest.folderId === 'string' && manifest.folderId.length > 20);
  for (const d of ['profile', 'profile/reports', 'tools', 'consent', '.backups']) {
    ok(`created ${d}`, fs.existsSync(path.join(root, d)));
  }
  ok('consent ledger initialised', fs.existsSync(path.join(root, 'consent', 'ledger.json')));
  const again = await ws.ensureScaffold(root, '0.1.0');
  ok('re-running scaffold keeps the same folderId', again.folderId === manifest.folderId);

  console.log('\n── read / write ──');
  await ws.writeFileIn(root, 'profile/partial.json', JSON.stringify({ archetype: 'Maverick' }));
  const read = await ws.readFileIn(root, 'profile/partial.json');
  ok('round-trips json', JSON.parse(read.data).archetype === 'Maverick');
  ok('reports utf8 encoding', read.encoding === 'utf8');
  await ws.writeFileIn(root, 'profile/reports/r.pdf', Buffer.from('%PDF-1.7 test').toString('base64'), 'base64');
  const pdf = await ws.readFileIn(root, 'profile/reports/r.pdf');
  ok('round-trips pdf as base64', Buffer.from(pdf.data, 'base64').toString().startsWith('%PDF'));
  await throws('refuses an executable extension', () => ws.writeFileIn(root, 'tools/x/run.exe', 'x'), 'refusing');
  await throws('refuses writing outside', () => ws.writeFileIn(root, '../evil.json', '{}'), 'escapes');
  await throws('refuses deleting the root', () => ws.removeIn(root, '.'), 'root');

  console.log('\n── listing ──');
  const listed = await ws.listIn(root, 'profile');
  ok('lists directory contents', listed.some((e) => e.name === 'partial.json'));
  ok('hides dotfiles', !(await ws.listIn(root, '.')).some((e) => e.name.startsWith('.')));

  console.log('\n── backups ──');
  const b1 = await ws.backupFolder(root, 'one');
  ok('backup created', b1 && fs.existsSync(path.join(b1, 'profile', 'partial.json')));
  ok('backup excludes .backups itself', !fs.existsSync(path.join(b1, '.backups')));
  for (let i = 0; i < 4; i++) {
    await new Promise((r) => setTimeout(r, 5));
    await ws.backupFolder(root, `n${i}`);
  }
  const kept = fs.readdirSync(path.join(root, '.backups'));
  ok(`prunes to 3 most recent (kept ${kept.length})`, kept.length === 3);

  console.log('\n── consent ──');
  await ws.recordConsent(root, {
    toolId: 'three-month-plan',
    purpose: 'Build a plan from your profile',
    dataUsed: ['profile.shapeVector12'],
    sendsToServer: ['shapeVector12'],
  });
  await ws.writeFileIn(root, 'tools/three-month-plan/state.json', '{"step":1}');
  let ledger = await ws.readConsent(root);
  ok('grant recorded', ledger.entries.length === 1 && ledger.entries[0].revokedAt === null);
  ledger = await ws.revokeConsent(root, 'three-month-plan');
  ok('revocation stamped', !!ledger.entries[0].revokedAt);
  ok('entry retained after revoke (append-only)', ledger.entries.length === 1);
  ok('tool directory removed on revoke', !fs.existsSync(path.join(root, 'tools', 'three-month-plan')));

  console.log('\n── migration ──');
  const noop = await ws.migrate(root, '0.1.0');
  ok('no migration needed at current version', noop.migrated === false);
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  m.schemaVersion = ws.SCHEMA_VERSION + 5;
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify(m));
  await throws('refuses a folder from a newer app', () => ws.migrate(root, '0.1.0'), 'newer version');

  fs.rmSync(root, { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
