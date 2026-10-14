/**
 * The public questions file (services/questionsPublisher.js, services/r2.js): the platform loads the questions from
 * R2 so the cards never wait for the backend. The S3 signature is checked against AWS's published SigV4 example;
 * the file's content against the database; the upload's request shape with fetch intercepted (nothing leaves the
 * machine); and without R2 keys publishing is a quiet no-op.
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

before(h.start);
after(h.stop);

test('SigV4 matches the AWS documentation example (IAM ListUsers, 20150830T123600Z)', () => {
  const { sigv4 } = require('../services/r2');
  const auth = sigv4({
    method: 'GET',
    path: '/',
    query: 'Action=ListUsers&Version=2010-05-08',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
      host: 'iam.amazonaws.com',
      'x-amz-date': '20150830T123600Z',
    },
    payloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    region: 'us-east-1',
    service: 'iam',
    accessKeyId: 'AKIDEXAMPLE',
    secret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
    amzDate: '20150830T123600Z',
  });
  assert.equal(auth, 'AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20150830/us-east-1/iam/aws4_request, '
    + 'SignedHeaders=content-type;host;x-amz-date, Signature=5d672d79c15b13162d9279b0855cfba6789a8edb4c82c400e06b5924a6f2b5d7');
});

test('the public file holds the database layers (no internal fields) and the two-layer plans by quarter', async () => {
  const { collections } = require('../db');
  await collections.questions().insertOne({ layerIndex: 0, name: 'Zelf', questions: [{ id: 1, text: 'V1' }], updatedBy: 'admin-id', updatedAt: new Date() });
  const { buildQuestionsFile } = require('../services/questionsPublisher');
  const file = await buildQuestionsFile(new Date('2026-12-31T23:30:00Z')); // already 2027-Q1 in Amsterdam
  assert.equal(file.layers.length, 1);
  assert.ok(!('_id' in file.layers[0]) && !('updatedBy' in file.layers[0]) && !('updatedAt' in file.layers[0]));
  assert.equal(file.seeded, true);
  // tests run outside production, where the two-layer test is on
  assert.equal(file.twoLayer.enabled, true);
  assert.deepEqual(Object.keys(file.twoLayer.plans).slice(0, 2), ['2027-Q1', '2027-Q2']);
  assert.equal(Object.keys(file.twoLayer.plans).length, 8);
  assert.match(file.twoLayer.plans['2027-Q1'].rotation_sequence_id, /^leerling:2027-Q1:/);
});

test('publishing: a quiet no-op without R2 keys; with them, one signed PUT of questions/questions.json', async () => {
  const { publishQuestions } = require('../services/questionsPublisher');
  for (const k of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']) delete process.env[k];
  assert.deepEqual(await publishQuestions(), { published: false, reason: 'R2 is not configured' });

  Object.assign(process.env, { R2_ACCOUNT_ID: 'acct', R2_ACCESS_KEY_ID: 'key', R2_SECRET_ACCESS_KEY: 'secret' });
  const realFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, init) => { calls.push({ url, init }); return { ok: true, text: async () => '' }; };
  try {
    const result = await publishQuestions();
    assert.equal(result.published, true);
    assert.equal(calls.length, 1);
    const { url, init } = calls[0];
    assert.equal(url, 'https://acct.eu.r2.cloudflarestorage.com/gfl-downloads/questions/questions.json');
    assert.equal(init.method, 'PUT');
    assert.match(init.headers.authorization, /^AWS4-HMAC-SHA256 Credential=key\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=cache-control;content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/);
    assert.equal(init.headers['content-type'], 'application/json; charset=utf-8');
    assert.equal(JSON.parse(init.body.toString('utf8')).schema, 1);
  } finally {
    global.fetch = realFetch;
    for (const k of ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']) delete process.env[k];
  }
});
