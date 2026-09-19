/**
 * Put a built management-app release where the backend serves it from: the `adminAppReleases` GridFS
 * bucket in the PRODUCTION database. Nothing goes to a public server or into the web code.
 *
 *   node scripts/publish.js            → shows what would be uploaded, changes nothing
 *   node scripts/publish.js --confirm  → uploads latest.yml + the installer, keeps the previous version
 *   node scripts/publish.js --confirm --keep=1  → same, and removes every older installer
 *
 * Reads MONGODB_URI from apps/backend/.env. The backend (routes/admin.js, routes/files.js) always
 * serves the newest upload of each file name; the website's management download and the app's update
 * check both pick it up at once, no deploy needed.
 */
const fs = require('fs');
const path = require('path');

const HERE = path.resolve(__dirname, '..');
const RELEASE = path.join(HERE, 'release');
const BUCKET = 'adminAppReleases';
// Installers kept in the bucket after an upload (newest first). `--keep=1` keeps only the new one.
const keepArg = process.argv.find((a) => a.startsWith('--keep='));
const KEEP_INSTALLERS = keepArg ? Math.max(1, parseInt(keepArg.slice('--keep='.length), 10) || 2) : 2;

function readEnvUri() {
  const envFile = path.resolve(HERE, '..', 'backend', '.env');
  const text = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
  const line = text.split(/\r?\n/).find((l) => /^\s*MONGODB_URI\s*=/.test(l));
  return process.env.MONGODB_URI || (line ? line.replace(/^\s*MONGODB_URI\s*=\s*/, '').trim().replace(/^['"]|['"]$/g, '') : '');
}

async function main() {
  const confirm = process.argv.includes('--confirm');
  const ymlPath = path.join(RELEASE, 'latest.yml');
  if (!fs.existsSync(ymlPath)) throw new Error('release/latest.yml not found — run `npm run dist:win` first');
  const yml = fs.readFileSync(ymlPath, 'utf8');
  const version = (yml.match(/^version:\s*(.+)$/m) || [])[1];
  const installerName = (yml.match(/^path:\s*(.+)$/m) || [])[1];
  if (!version || !installerName) throw new Error('latest.yml has no version/path');
  const installerPath = path.join(RELEASE, installerName.trim());
  if (!fs.existsSync(installerPath)) throw new Error(`installer ${installerName} not found in release/`);
  const size = fs.statSync(installerPath).size;

  console.log(`Release ${version}: ${installerName} (${(size / 1e6).toFixed(1)} MB) + latest.yml → GridFS bucket "${BUCKET}"`);
  if (!confirm) { console.log('Dry run. Add --confirm to upload to the production database.'); return; }

  const uri = readEnvUri();
  if (!uri) throw new Error('MONGODB_URI not set (apps/backend/.env)');
  const { MongoClient, GridFSBucket } = require(require.resolve('mongodb', { paths: [path.resolve(HERE, '..', 'backend')] }));
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const bucket = new GridFSBucket(client.db(), { bucketName: BUCKET });
    const upload = (name, source, contentType) => new Promise((resolve, reject) => {
      const stream = bucket.openUploadStream(name, { metadata: { version, contentType } });
      source.pipe(stream).on('finish', resolve).on('error', reject);
    });
    await upload(installerName.trim(), fs.createReadStream(installerPath), 'application/octet-stream');
    await upload('latest.yml', fs.createReadStream(ymlPath), 'text/yaml');
    console.log('✓ uploaded');

    // Keep the newest latest.yml and the newest KEEP_INSTALLERS installers.
    const files = await bucket.find({}).sort({ uploadDate: -1 }).toArray();
    const seenYml = [];
    const installers = [];
    for (const f of files) {
      if (f.filename === 'latest.yml') { seenYml.push(f); continue; }
      installers.push(f);
    }
    const stale = [...seenYml.slice(1), ...installers.slice(KEEP_INSTALLERS)];
    for (const f of stale) await bucket.delete(f._id);
    if (stale.length) console.log(`✓ removed ${stale.length} older file(s)`);
  } finally {
    await client.close();
  }
}

main().catch((err) => { console.error('✘', err.message); process.exit(1); });
