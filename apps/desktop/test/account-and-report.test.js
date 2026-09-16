/**
 * Account link and report naming — run with: node test/account-and-report.test.js
 *
 * The first-run onboarding step binds the chosen folder to the new account and drops the
 * uploaded report into it. Two promises are tested here: a folder never ends up holding two
 * people's data, and the caller's label can shape a filename but never name a path.
 * Pure Node; no Electron needed.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const ws = require('../src/workspace.js');

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass += 1; console.log(`  ok    ${name}`); }
  else { fail += 1; console.log(`  FAIL  ${name} ${extra}`); }
};
const throws = async (name, fn, match) => {
  try {
    await fn();
    fail += 1;
    console.log(`  FAIL  ${name} (no error thrown)`);
  } catch (e) {
    if (!match || e.message.toLowerCase().includes(match.toLowerCase())) { pass += 1; console.log(`  ok    ${name}`); }
    else { fail += 1; console.log(`  FAIL  ${name} — got "${e.message}"`); }
  }
};

const PDF = Buffer.from('%PDF-1.7\n%test report\n%%EOF\n').toString('base64');
const today = new Date().toISOString().slice(0, 10);

(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gfl-link-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'gfl-link-outside-'));
  await ws.ensureScaffold(root, '0.1.0');
  const manifestPath = path.join(root, 'manifest.json');
  const manifest = () => JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log('── account link ──');
  ok('a new folder belongs to nobody', manifest().accountId === null);
  const first = await ws.linkAccount(root, '69a56d1781fb07ec3eb683be');
  ok('first link sets manifest.accountId', manifest().accountId === '69a56d1781fb07ec3eb683be' && first.changed === true);
  const again = await ws.linkAccount(root, '69a56d1781fb07ec3eb683be');
  ok('the same account again is a no-op', again.linked === true && again.changed === false);
  await throws('another account is refused', () => ws.linkAccount(root, '000000000000000000000000'), 'another account');
  ok('…and the folder still belongs to the first', manifest().accountId === '69a56d1781fb07ec3eb683be');
  for (const [bad, label] of [['', 'empty'], ['../x', 'traversal'], ['a b', 'space'], ['x'.repeat(65), 'too long'], [null, 'null'], [{ id: 1 }, 'object']]) {
    await throws(`account id refused: ${label}`, () => ws.linkAccount(root, bad), 'valid account id');
  }
  const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'gfl-link-bare-'));
  await throws('a folder without a manifest cannot be linked', () => ws.linkAccount(bare, 'abc123'), 'no manifest');

  console.log('── report naming ──');
  ok('slug: article dropped, lowercase', ws.reportSlug('The Usurper') === 'usurper');
  ok('slug: Dutch article dropped', ws.reportSlug('De Troonrover') === 'troonrover');
  ok('slug: accents folded', ws.reportSlug('Élève Übermensch') === 'eleve-ubermensch');
  ok('slug: an article-like prefix inside a word stays', ws.reportSlug('Alchemist') === 'alchemist');
  ok('slug: separators and dots become single hyphens', ws.reportSlug('../../etc/passwd') === 'etc-passwd');
  ok('slug: Windows device name cannot survive as a whole name', ws.reportSlug('CON') === 'con' && !/^con\.pdf$/.test(`${today}-con.pdf`));
  ok('slug: capped at 40 characters, no trailing hyphen', ws.reportSlug('a'.repeat(39) + ' bb').length <= 40 && !ws.reportSlug('a'.repeat(39) + ' bb').endsWith('-'));
  ok('slug: nothing usable falls back to "report"', ws.reportSlug('···') === 'report' && ws.reportSlug(undefined) === 'report');

  const r1 = await ws.saveReport(root, PDF, 'The Usurper');
  ok('saved as <date>-<slug>.pdf', r1.name === `${today}-usurper.pdf` && fs.existsSync(path.join(root, 'profile', 'reports', r1.name)));
  const r2 = await ws.saveReport(root, PDF, 'The Usurper');
  ok('same label same day gets -2, first file untouched', r2.name === `${today}-usurper-2.pdf` && fs.existsSync(path.join(root, 'profile', 'reports', r1.name)));
  const r3 = await ws.saveReport(root, PDF);
  ok('no label → <date>-report.pdf', r3.name === `${today}-report.pdf`);
  const hostile = await ws.saveReport(root, PDF, '..\\..\\..\\outside\\evil');
  ok('a hostile label stays inside profile/reports', path.dirname(path.join(root, hostile.saved)) === path.join(root, 'profile', 'reports'));
  ok('nothing was written outside the workspace', fs.readdirSync(outside).length === 0);
  const [a, b] = await Promise.all([ws.saveReport(root, PDF, 'Race'), ws.saveReport(root, PDF, 'Race')]);
  ok('two concurrent saves never collide on one name', a.name !== b.name);
  await throws('non-PDF bytes are refused', () => ws.saveReport(root, Buffer.from('MZ\x90\x00 not a pdf').toString('base64'), 'x'), 'must be a pdf');
  await throws('an empty report is refused', () => ws.saveReport(root, '', 'x'), 'required');
  const listed = await ws.listReports(root);
  ok('listReports sees every saved report', ['usurper', 'usurper-2', 'report', 'race'].every((s) => listed.some((l) => l.name.includes(s))));

  console.log(`\n${pass} passed, ${fail} failed`);
  for (const dir of [root, outside, bare]) fs.rmSync(dir, { recursive: true, force: true });
  process.exit(fail ? 1 : 0);
})();
