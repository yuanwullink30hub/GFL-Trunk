/**
 * R1 — the credential cannot be rebuilt from public data.
 *
 * Acceptance (brief): given the full output of GET /api/auth/public/:handle, /card/:handle and /profiles,
 * no function reproduces a value that authenticates. This file plays the attacker: it rebuilds the code
 * from the public profile exactly as the audit did (field-by-field back into the encoding vector, which
 * reproduces the code byte for byte), then tries every way in — PDF login, registration, linking — and
 * checks that the legitimate PDF, which carries the key, still works.
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const orb3 = require('@gfl/orb-engine/orb3');

let base;
before(async () => {
  await h.start();
  base = await h.serve([
    ['/api/auth', require('../routes/auth')],
    ['/api/orb', require('../routes/orb')],
  ], { jsonLimit: '25mb' });
});
after(h.stop);

// ── helpers ──

let addr = 0, seq = 0;
async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'cf-connecting-ip': `192.0.2.${(++addr % 250) + 1}`, // own address per call: R2's limits stay out of it
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch { /* not JSON */ }
  return { status: res.status, body: json };
}

/** A real crystal code, as report generation mints it. */
function mintCode() {
  const KEYS = ['JUDGE', 'LOVER', 'CAREGIVER', 'INNOCENT', 'EXPLORER', 'OUTLAW', 'TRICKSTER', 'SAGE', 'ARTIST', 'MAGICIAN', 'HERO', 'RULER'];
  const s = ++seq + Date.now() % 1000;
  const details = KEYS.map((k, i) => ({ key: k, total: 5 + ((s * 13 + i * 7) % 37) }));
  return orb3.orb3FromGeometry({ archetypeDetails: details, mainKey: KEYS[(s * 5) % 12], shadowKey: KEYS[(s * 7 + 3) % 12] });
}

/** The attacker's function: rebuild the code from what /public/:handle publishes as `orb`. */
function rebuildFromPublic(pub) {
  const palette = orb3.ORB3_GROUP_NAME.findIndex((g) => JSON.stringify(orb3.ORB3_PALETTES[g]) === JSON.stringify(pub.colors));
  return orb3.encodeOrb3({
    v: 1, palette, L: pub.cymaticL, M: pub.cymaticM, dir: pub.dir, amp: pub.displacement,
    R: pub.radial, fractal: pub.friction, harmony: pub.harmony, density: pub.density,
    T: pub.tension, depth: pub.depth, B: pub.breaking, rot: pub.rotation, pulse: pub.pulse,
  });
}

async function unlock(code) {
  const { recordUnlock, codeHashFor } = require('../services/reportAccess');
  await recordUnlock({ unlockId: `u-${Date.now()}-${++seq}`, method: 'activation_code', reference: `r-${seq}`, codeHash: codeHashFor(code) });
}

/** A report PDF carrying the markers, the way the results modal prints them. */
function reportPdf(code, key) {
  const PDFDocument = require('pdfkit');
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const parts = [];
    doc.on('data', (c) => parts.push(c));
    doc.on('end', () => resolve(Buffer.concat(parts).toString('base64')));
    doc.fontSize(7).text(`ORB::${code}::ORB`);
    if (key) doc.text(`KEY::${key}::KEY`);
    doc.end();
  });
}

const STRONG = 'kerkklok-vlieger-47-regenboog';
async function registerWith(code, key) {
  const name = `claimer-${Date.now()}-${++seq}`;
  const r = await call('POST', '/api/auth/register', {
    body: { email: `${name}@example.com`, password: STRONG, displayName: name, orbCode: code, ...(key ? { orbKey: key } : {}) },
  });
  return { ...r, name };
}

const { orbKeyFor } = require('../services/orbKey');

// ── the attack ──

test('the threat is real: the public profile rebuilds the code byte for byte', async () => {
  const code = mintCode();
  await unlock(code);
  const owner = await registerWith(code, orbKeyFor(code));
  assert.equal(owner.status, 201, JSON.stringify(owner.body));
  const pub = await call('GET', `/api/auth/public/${encodeURIComponent(owner.name)}`);
  assert.equal(pub.status, 200);
  assert.equal(rebuildFromPublic(pub.body.orb), code, 'the attacker model must be the real one');
});

test('after the owner deletes their account, the rebuilt code claims nothing without the key', async () => {
  const code = mintCode();
  await unlock(code);
  const owner = await registerWith(code, orbKeyFor(code));
  const pub = await call('GET', `/api/auth/public/${encodeURIComponent(owner.name)}`);
  const rebuilt = rebuildFromPublic(pub.body.orb);

  // The account is erased; its code link goes with it.
  assert.equal((await call('DELETE', '/api/auth/account', { token: owner.body.token })).status, 200);

  // 1. PDF login with a forged report carrying only the rebuilt code.
  const viaPdf = await call('POST', '/api/orb/login', { body: { pdfBase64: await reportPdf(rebuilt) } });
  assert.equal(viaPdf.status, 403);
  assert.equal(viaPdf.body.code, 'key_required');

  // 2. Registration with the rebuilt code.
  const viaRegister = await registerWith(rebuilt);
  assert.equal(viaRegister.status, 403);
  assert.equal(viaRegister.body.code, 'key_required');

  // 3. Linking it to an account the attacker already has.
  const attacker = await registerWith(null);
  const viaLink = await call('POST', '/api/orb/link', { token: attacker.body.token, body: { code: rebuilt } });
  assert.equal(viaLink.status, 403);
  assert.equal(viaLink.body.code, 'key_required');
});

test('...while the rightful PDF, which carries the key, still opens it', async () => {
  const code = mintCode();
  await unlock(code);
  const key = orbKeyFor(code);
  const owner = await registerWith(code, key);
  await call('DELETE', '/api/auth/account', { token: owner.body.token });

  const viaPdf = await call('POST', '/api/orb/login', { body: { pdfBase64: await reportPdf(code, key) } });
  assert.equal(viaPdf.status, 200, JSON.stringify(viaPdf.body));
  assert.equal(viaPdf.body.orbKey, key, 'the verified key goes back for onboarding');
  const again = await registerWith(code, viaPdf.body.orbKey);
  assert.equal(again.status, 201, JSON.stringify(again.body));
});

test('a code linked to a live account cannot be taken over, with or without the key', async () => {
  const code = mintCode();
  await unlock(code);
  const key = orbKeyFor(code);
  await registerWith(code, key);
  assert.equal((await registerWith(code, key)).status, 409);
  const other = await registerWith(null);
  assert.equal((await call('POST', '/api/orb/link', { token: other.body.token, body: { code, orbKey: key } })).status, 409);
  const viaPdf = await call('POST', '/api/orb/login', { body: { pdfBase64: await reportPdf(code, key) } });
  assert.equal(viaPdf.status, 403);
  assert.equal(viaPdf.body.useLogin, true, 'the gate still sends them to email + password, and issues no token');
  assert.equal(viaPdf.body.token, undefined);
});

test('a wrong key is refused, and the key is compared exactly (no case folding)', async () => {
  const code = mintCode();
  await unlock(code);
  const key = orbKeyFor(code);
  const flipped = key.replace(/[a-z]/, (c) => c.toUpperCase());
  assert.notEqual(flipped, key);
  for (const bad of ['x'.repeat(26), flipped]) {
    const r = await registerWith(code, bad);
    assert.equal(r.status, 403);
    assert.equal(r.body.code, 'bad_key');
  }
});

test('nothing public carries the key', async () => {
  const code = mintCode();
  await unlock(code);
  const key = orbKeyFor(code);
  const owner = await registerWith(code, key);
  const outputs = await Promise.all([
    call('GET', `/api/auth/public/${encodeURIComponent(owner.name)}`),
    call('GET', `/api/auth/card/${encodeURIComponent(owner.name)}`),
    call('GET', '/api/auth/profiles'),
  ]);
  for (const o of outputs) assert.ok(!JSON.stringify(o.body).includes(key), 'a public endpoint leaked the key');
});

// ── nothing breaks ──

test('a report printed before the key existed still claims, as long as its code was never redeemed', async () => {
  const code = mintCode();
  await unlock(code);
  const viaPdf = await call('POST', '/api/orb/login', { body: { pdfBase64: await reportPdf(code) } });
  assert.equal(viaPdf.status, 200, JSON.stringify(viaPdf.body));
  assert.equal(viaPdf.body.orbKey, undefined);
  assert.equal((await registerWith(code)).status, 201);
});

test('the signed-in owner can re-upload their own report (dashboard re-sync) — read back, no new session', async () => {
  const code = mintCode();
  await unlock(code);
  const key = orbKeyFor(code);
  const owner = await registerWith(code, key);
  const r = await call('POST', '/api/orb/login', { token: owner.body.token, body: { pdfBase64: await reportPdf(code, key) } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.owned, true);
  assert.equal(r.body.token, undefined);
  const relink = await call('POST', '/api/orb/link', { token: owner.body.token, body: { code, orbKey: r.body.orbKey } });
  assert.equal(relink.body.alreadyOwned, true);
});

test('a real-sized report PDF is accepted (several MB, parsed off the main thread)', async () => {
  // A real report is big because of its embedded cover image (~5.6 MB), not its text. Mirror that: one
  // incompressible image, which the text extraction skips, so the size is real and the parse is quick.
  const code = mintCode();
  await unlock(code);
  const sharp = require('sharp');
  const noise = Buffer.alloc(1400 * 1400 * 3);
  require('crypto').randomFillSync(noise);
  const png = await sharp(noise, { raw: { width: 1400, height: 1400, channels: 3 } }).png({ compressionLevel: 0 }).toBuffer();
  const PDFDocument = require('pdfkit');
  const big = await new Promise((resolve) => {
    const doc = new PDFDocument();
    const parts = [];
    doc.on('data', (c) => parts.push(c));
    doc.on('end', () => resolve(Buffer.concat(parts).toString('base64')));
    doc.image(png, 0, 0, { width: 400 });
    doc.addPage();
    doc.fontSize(7).text(`ORB::${code}::ORB`);
    doc.text(`KEY::${orbKeyFor(code)}::KEY`);
    doc.end();
  });
  assert.ok(big.length > 4 * 1024 * 1024, `test PDF is only ${(big.length / 1048576).toFixed(1)} MB as base64`);
  const r = await call('POST', '/api/orb/login', { body: { pdfBase64: big } });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.code, code);
});
