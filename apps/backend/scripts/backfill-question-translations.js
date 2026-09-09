/**
 * BACKFILL: add the English copy (`*En` fields) to the assessment questions that
 * already live in MongoDB — WITHOUT touching a single character of Dutch.
 *
 * Why not POST /api/questions/seed?force=1 ?
 *   Because force re-seed does deleteMany({}) + insertMany(getDefaultLayers()), which
 *   throws away every edit an admin has made through the website. Worse, the seed in
 *   routes/questions.js is a DIFFERENT, older corpus than what is actually in the
 *   database (60 questions vs the live 36, different wording, and a `layerId` field
 *   the live documents do not have). Re-seeding would replace the real question bank.
 *
 * Source of truth for the English is therefore a translation file keyed by the ids
 * that the live documents actually carry:
 *
 *     data/questionTranslations.en.json
 *       layers[<layerIndex>].nameEn / titleEn / subtitleEn / descriptionEn / fundamentalEn
 *       layers[<layerIndex>].questions[<question id>].textEn
 *       layers[<layerIndex>].questions[<question id>].answers[<answer id>]
 *
 * Nothing is ever deleted, and no Dutch field (`name`, `title`, `subtitle`,
 * `fundamental`, `description`, `text`) or key/logic field (`id`, `value`, `archetype`,
 * `domain`, `layerIndex`, `color`) is written. Re-running is a no-op.
 *
 * Ids present in the DB but absent from the translation file — or the other way round —
 * are REPORTED, never guessed at.
 *
 * Uses MongoClient directly rather than ../db's connectDB(): connectDB() creates
 * indexes and runs user migrations at startup, which would be writes — and --dry-run
 * must write nothing at all.
 *
 * Run from apps/backend:
 *   node scripts/backfill-question-translations.js --dry-run   # report only, writes nothing
 *   node scripts/backfill-question-translations.js             # apply
 */
const path = require('path');
const fs = require('fs');
const config = require('../config'); // loads .env → config.mongoUri
const { MongoClient } = require('mongodb');

const DRY = process.argv.includes('--dry-run') || process.argv.includes('-n');
const TRANSLATIONS_PATH = path.join(__dirname, '..', 'data', 'questionTranslations.en.json');

const LAYER_FIELDS = [
  ['name', 'nameEn'],
  ['title', 'titleEn'],
  ['subtitle', 'subtitleEn'],
  ['fundamental', 'fundamentalEn'],
  ['description', 'descriptionEn'],
];

const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;

(async () => {
  if (!config.mongoUri) throw new Error('MONGODB_URI not set in .env');
  if (!fs.existsSync(TRANSLATIONS_PATH)) {
    throw new Error(`Translation file not found: ${TRANSLATIONS_PATH}`);
  }

  const tx = JSON.parse(fs.readFileSync(TRANSLATIONS_PATH, 'utf8'));
  const txLayers = tx.layers || {};

  const client = new MongoClient(config.mongoUri);
  await client.connect();
  const questions = client.db().collection('questions');

  const dbLayers = await questions.find({}).sort({ layerIndex: 1 }).toArray();
  console.log(`${DRY ? '[DRY RUN] ' : ''}Found ${dbLayers.length} layer document(s) in MongoDB.`);

  const mismatches = [];
  let layersTouched = 0;
  let questionsSet = 0;
  let answersSet = 0;
  let fieldsSet = 0;

  const seenQuestionKeys = new Set();

  for (const doc of dbLayers) {
    const li = String(doc.layerIndex);
    const txLayer = txLayers[li];
    if (!txLayer) {
      mismatches.push(`layer index ${li} ("${doc.name}") is in the DB but not in the translation file — skipped entirely`);
      continue;
    }

    const setOps = {};

    // ── Layer-level copy ──
    for (const [nlKey, enKey] of LAYER_FIELDS) {
      const en = txLayer[enKey];
      if (!nonEmpty(en)) {
        mismatches.push(`layer ${li}: translation file has no ${enKey}`);
        continue;
      }
      if (doc[enKey] !== en) setOps[enKey] = en;
    }

    // ── Questions + answers (positional paths, matched by stable id) ──
    (doc.questions || []).forEach((q, qi) => {
      const qKey = `${li}#${q.id}`;
      seenQuestionKeys.add(qKey);
      const txq = (txLayer.questions || {})[String(q.id)];
      if (!txq) {
        mismatches.push(`question ${q.id} in layer ${li} is in the DB but not in the translation file — textEn left untouched`);
        return;
      }
      if (nonEmpty(txq.textEn) && q.textEn !== txq.textEn) {
        setOps[`questions.${qi}.textEn`] = txq.textEn;
        questionsSet++;
      }

      (q.answers || []).forEach((a, ai) => {
        const en = (txq.answers || {})[String(a.id)];
        if (!nonEmpty(en)) {
          mismatches.push(`answer "${a.id}" (layer ${li}, Q${q.id}) is in the DB but not in the translation file — textEn left untouched`);
          return;
        }
        if (a.textEn !== en) {
          setOps[`questions.${qi}.answers.${ai}.textEn`] = en;
          answersSet++;
        }
      });
    });

    const count = Object.keys(setOps).length;
    if (count === 0) {
      console.log(`  ✓ layer ${li} (${doc.name}) — already up to date`);
      continue;
    }

    layersTouched++;
    fieldsSet += count;

    if (DRY) {
      console.log(`  → layer ${li} (${doc.name}) — would set ${count} field(s):`);
      Object.keys(setOps).slice(0, 6).forEach((k) => console.log(`      ${k}`));
      if (count > 6) console.log(`      … and ${count - 6} more`);
    } else {
      const r = await questions.updateOne({ _id: doc._id }, { $set: setOps });
      console.log(`  ✅ layer ${li} (${doc.name}) — set ${count} field(s) (matched ${r.matchedCount}, modified ${r.modifiedCount})`);
    }
  }

  // Anything in the translation file that never matched a DB document.
  for (const li of Object.keys(txLayers)) {
    for (const qid of Object.keys(txLayers[li].questions || {})) {
      const key = `${li}#${qid}`;
      if (!seenQuestionKeys.has(key)) {
        mismatches.push(`question ${qid} of layer ${li} is in the translation file but not in the DB — nothing written`);
      }
    }
  }

  console.log('');
  console.log(`${DRY ? '[DRY RUN] ' : ''}Summary`);
  console.log(`  layers ${DRY ? 'that would be' : ''} touched : ${layersTouched}`);
  console.log(`  question textEn ${DRY ? 'to set' : 'set'}     : ${questionsSet}`);
  console.log(`  answer   textEn ${DRY ? 'to set' : 'set'}     : ${answersSet}`);
  console.log(`  total fields                : ${fieldsSet}`);
  console.log(`  mismatches (skipped safely) : ${mismatches.length}`);
  mismatches.slice(0, 25).forEach((m) => console.log(`    - ${m}`));
  if (mismatches.length > 25) console.log(`    … and ${mismatches.length - 25} more`);

  await client.close();
  if (DRY) console.log('\nNothing was written. Re-run without --dry-run to apply.');
})().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
