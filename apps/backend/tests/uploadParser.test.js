/**
 * R4 — untrusted document parsing cannot stall the event loop or exhaust memory.
 *
 * The crafted input is the one the audit measured: a .docx whose document.xml root carries tens of
 * thousands of attributes, which drives @xmldom/xmldom 0.8.13 super-linear (~12 s single-threaded for
 * ~142 KB). It is rebuilt here from scratch — nothing is read from outside the repo.
 */
const h = require('./helpers');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

before(h.start);
after(h.stop);

const mammothDir = path.dirname(require.resolve('mammoth/package.json'));
const JSZip = require(require.resolve('jszip', { paths: [mammothDir] }));

const CT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
const RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';

async function docx(body, attrs = 0) {
  let a = '';
  for (let i = 0; i < attrs; i++) a += ` a${i}="v"`;
  const xml = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"${a}><w:body><w:p><w:r><w:t>${body}</w:t></w:r></w:p></w:body></w:document>`;
  const zip = new JSZip();
  zip.file('[Content_Types].xml', CT);
  zip.folder('_rels').file('.rels', RELS);
  zip.folder('word').file('document.xml', xml);
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/** Largest gap between event-loop ticks while `work` runs — how long the main thread was blocked. */
async function maxLoopStall(work) {
  let last = Date.now(), worst = 0;
  const id = setInterval(() => { const now = Date.now(); worst = Math.max(worst, now - last); last = now; }, 10);
  try { await work(); } finally { clearInterval(id); }
  return worst;
}

test('a real .docx parses in the child process and returns its text', async () => {
  const { parseUpload } = require('../services/uploadParser');
  const text = await parseUpload('docx', await docx('Openheid 72 Consciëntieusheid 96 Extraversie 88'));
  assert.match(text, /Consciëntieusheid 96/);
});

test('a real .pdf parses in the child process and returns its text', async () => {
  const { parseUpload } = require('../services/uploadParser');
  const PDFDocument = require('pdfkit');
  const pdf = await new Promise((resolve) => {
    const doc = new PDFDocument();
    const parts = [];
    doc.on('data', (c) => parts.push(c));
    doc.on('end', () => resolve(Buffer.concat(parts)));
    doc.text('Big Five rapport — Openheid 72, Consciëntieusheid 96, Neuroticisme 2');
    doc.end();
  });
  const text = await parseUpload('pdf', pdf);
  assert.match(text, /Consci.ntieusheid 96/);
});

test('garbage handed in as a PDF is refused as unreadable, without taking anything down', async () => {
  const { parseUpload, UploadError } = require('../services/uploadParser');
  const err = await parseUpload('pdf', Buffer.from('%PDF-1.7 this is not a pdf at all')).then(() => null, (e) => e);
  assert.ok(err instanceof UploadError);
  assert.equal(err.code, 'unreadable');
});

test('the crafted .docx never blocks the main thread, whatever the parser does with it', async () => {
  const { parseUpload } = require('../services/uploadParser');
  const bomb = await docx('x', 64000);
  const started = Date.now();
  const stall = await maxLoopStall(() => parseUpload('docx', bomb, { timeoutMs: 3000 }).catch((e) => e));
  const took = Date.now() - started;
  assert.ok(stall < 250, `main thread stalled ${stall} ms`);
  assert.ok(took < 3000 + 1500, `the parse must settle by its timeout (took ${took} ms)`);
});

test('a parse that exceeds its timeout is terminated and refused as timeout', async () => {
  const { parseUpload, UploadError } = require('../services/uploadParser');
  const bomb = await docx('x', 64000);
  // A deliberately tiny budget, so this holds whether or not the parser version is still slow.
  const err = await parseUpload('docx', bomb, { timeoutMs: 1 }).then(() => null, (e) => e);
  assert.ok(err instanceof UploadError);
  assert.equal(err.code, 'timeout');
});

test('the server answers other requests while a crafted upload is being parsed', async () => {
  const express = require('express');
  const { parseUpload } = require('../services/uploadParser');
  const app = express();
  app.get('/ping', (_q, r) => r.json({ pong: true }));
  const srv = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const url = `http://127.0.0.1:${srv.address().port}/ping`;

  const bomb = await docx('x', 64000);
  const parsing = parseUpload('docx', bomb, { timeoutMs: 3000 }).catch(() => {});
  const latencies = [];
  for (let i = 0; i < 5; i++) {
    const t = Date.now();
    const res = await fetch(url);
    assert.equal(res.status, 200);
    latencies.push(Date.now() - t);
  }
  await parsing;
  srv.close();
  assert.ok(Math.max(...latencies) < 500, `ping latencies during the parse: ${latencies.join(', ')} ms`);
});

test('size and count caps', () => {
  const { checkUploads, MAX_FILE_BYTES, MAX_FILES } = require('../services/uploadParser');
  const b64 = (n) => Buffer.alloc(n).toString('base64');
  assert.equal(checkUploads([]), null);
  assert.equal(checkUploads([{ pdfBase64: b64(1000) }]), null);
  assert.equal(checkUploads(Array.from({ length: MAX_FILES + 1 }, () => ({ text: 'x' }))), 'too_many_files');
  assert.equal(checkUploads([{ pdfBase64: b64(MAX_FILE_BYTES + 10) }]), 'file_too_large');
  assert.equal(checkUploads([{ pdfBase64: b64(3.5 * 1024 * 1024) }, { docxBase64: b64(3.5 * 1024 * 1024) }, { pdfBase64: b64(3.5 * 1024 * 1024) }]), 'uploads_too_large');
});

test('the parser child starts without a single secret', () => {
  const { childEnv } = require('../services/uploadParser');
  process.env.MONGODB_URI_PROBE = 'mongodb://secret';
  process.env.STRIPE_SECRET_KEY = 'sk_live_probe';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-probe';
  const env = childEnv();
  delete process.env.MONGODB_URI_PROBE; delete process.env.STRIPE_SECRET_KEY; delete process.env.ANTHROPIC_API_KEY;
  for (const [k, v] of Object.entries(env)) {
    assert.doesNotMatch(k, /MONGO|STRIPE|ANTHROPIC|OPENAI|GROK|JWT|ENCRYPTION|SMTP|SECRET|KEY|TOKEN/i, `child env carries ${k}`);
    assert.doesNotMatch(String(v), /secret|sk_live|sk-ant/i);
  }
});

test('a flood of uploads is refused beyond the queue instead of spawning a process each', async () => {
  const { parseUpload, MAX_CONCURRENT, MAX_QUEUED } = require('../services/uploadParser');
  const bomb = await docx('x', 64000);
  const n = MAX_CONCURRENT + MAX_QUEUED + 3;
  const results = await Promise.all(Array.from({ length: n }, () => parseUpload('docx', bomb, { timeoutMs: 400 }).then(() => 'ok', (e) => e.code)));
  assert.ok(results.filter((r) => r === 'busy').length >= 3, `expected refusals beyond the queue, got ${results}`);
});

test('/api/ai/analyze refuses oversized uploads with 413 before opening the stream', async () => {
  // The production limit for this route (server.js), so it is the route's own caps that answer.
  const base = await h.serve([['/api/ai', require('../routes/ai')]], { jsonLimit: '12mb' });
  const url = `${base}/api/ai/analyze`;
  const tooMany = await h.post(url, { archetypeKey: 'OUTLAW', uploadedFileContents: [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }] });
  assert.equal(tooMany.status, 413);
  assert.equal(tooMany.body.error, 'too_many_files');
  const big = Buffer.alloc(5 * 1024 * 1024).toString('base64');
  const tooBig = await h.post(url, { archetypeKey: 'OUTLAW', uploadedFileContents: [{ name: 'r.pdf', pdfBase64: big }] });
  assert.equal(tooBig.status, 413);
  assert.equal(tooBig.body.error, 'file_too_large');
});
