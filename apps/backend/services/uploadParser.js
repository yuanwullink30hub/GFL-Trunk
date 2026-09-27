/**
 * Parse untrusted uploads (the OCEAN report on /api/ai/analyze) outside the server process.
 *
 * The backend is one Node process. mammoth (-> @xmldom/xmldom) and pdf-parse do their work synchronously,
 * so a crafted file used to stall EVERY request for as long as it took: a 142 KB .docx whose root carries
 * 64 000 attributes held the event loop for 8.1 s under xmldom 0.8.13 (super-linear; 0.8.15 is linear).
 * `await` in the main thread cannot interrupt synchronous work; killing another process can.
 *
 * Why a child PROCESS and not a worker thread: pdf-parse 2.x loads @napi-rs/canvas, a native addon. A
 * worker thread isolates JavaScript but not native code -- loading it in one crashed the whole host
 * process with an access violation. A child process contains that: only the child dies. It also gets its
 * own environment, so it is started without a single secret (childEnv).
 *
 * Each parse runs in its own child with:
 *   a hard timeout    PARSE_TIMEOUT_MS, then SIGKILL mid-parse; that one upload is refused and every
 *                     other request carries on.
 *   a memory bound    --max-old-space-size; a file that balloons the heap kills its child, not the server.
 *   a concurrency cap MAX_CONCURRENT parses at once, MAX_QUEUED waiting. Beyond that a parse is refused
 *                     immediately, so a flood of uploads cannot turn into a flood of processes.
 *   no secrets        childEnv() passes only what Node needs to start: no database URI, no Stripe or
 *                     model keys. A parser ever made to run attacker code would find nothing to take.
 *   no output         stdout/stderr are discarded, so a parser warning cannot print document text.
 *
 * Size caps (MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES) are applied by the caller before any child
 * starts, via checkUploads().
 */
const path = require('path');
const { fork } = require('child_process');

const PARSE_TIMEOUT_MS = 8000;
// Sized for the Render free plan (render.yaml): 512 MB for the whole service. The server itself takes a
// good part of that, and a parser child can grow to its heap cap plus pdf.js and a native canvas, so two
// at once could push the SERVER into an out-of-memory kill — trading one outage for another. Uploads come
// only with an OCEAN report during report generation, so one at a time costs nothing in practice; raise
// UPLOAD_PARSE_CONCURRENCY on a larger plan.
const MAX_CONCURRENT = Math.max(1, Number(process.env.UPLOAD_PARSE_CONCURRENCY) || 1);
const MAX_QUEUED = 8;
const HEAP_MB = 160;

/** What the child may see of the environment: enough for Node to start, nothing more. */
function childEnv() {
  const keep = ['PATH', 'Path', 'SYSTEMROOT', 'SystemRoot', 'TEMP', 'TMP', 'TMPDIR', 'HOME', 'USERPROFILE', 'LANG'];
  const env = { NODE_ENV: process.env.NODE_ENV || 'production' };
  for (const k of keep) if (process.env[k] !== undefined) env[k] = process.env[k];
  return env;
}

// What one analysis may carry. OCEAN reports are image-heavy exports: persoonlijkheid.nl's is 4.4 MB and
// parses in well under a second (an earlier 4 MB cap refused it). The caps leave room for that without
// letting one request queue up tens of megabytes of parsing; the timeout and heap cap bound each parse.
const MAX_FILES = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;

class UploadError extends Error {
  constructor(code) { super(code); this.code = code; }
}

let active = 0;
const waiting = [];

function acquire() {
  if (active < MAX_CONCURRENT) { active++; return Promise.resolve(); }
  if (waiting.length >= MAX_QUEUED) return Promise.reject(new UploadError('busy'));
  return new Promise((resolve) => waiting.push(resolve));
}

function release() {
  const next = waiting.shift();
  if (next) next(); else active--;
}

function runChild(kind, bytes, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const child = fork(path.join(__dirname, 'uploadParser.child.js'), [], {
      env: childEnv(),
      execArgv: [`--max-old-space-size=${HEAP_MB}`],
      stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      serialization: 'advanced', // Buffers cross the channel as bytes, not as a JSON array of numbers
    });
    const settle = (fn, v) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      fn(v);
    };
    const timer = setTimeout(() => settle(reject, new UploadError('timeout')), timeoutMs);
    child.once('message', (msg) => {
      if (msg && msg.ok) settle(resolve, String(msg.text || ''));
      else settle(reject, new UploadError('unreadable'));
    });
    child.once('error', () => settle(reject, new UploadError('unreadable')));
    // Died before answering: a native crash, or V8 aborting on the heap cap (exit 134 / SIGABRT).
    child.once('exit', (code, signal) => {
      const oom = code === 134 || signal === 'SIGABRT';
      settle(reject, new UploadError(oom ? 'too_large' : 'unreadable'));
    });
    child.send({ kind, bytes });
  });
}

/**
 * Extract text from one upload, in a child process. Rejects with UploadError: timeout | too_large |
 * unreadable | busy | unsupported.
 * @param {'pdf'|'docx'} kind
 * @param {Buffer} bytes
 */
async function parseUpload(kind, bytes, { timeoutMs = PARSE_TIMEOUT_MS } = {}) {
  if (kind !== 'pdf' && kind !== 'docx') throw new UploadError('unsupported');
  await acquire();
  try {
    return await runChild(kind, bytes, timeoutMs);
  } finally {
    release();
  }
}

/** Decoded size of a base64 string without decoding it. */
function base64Bytes(b64) {
  const s = String(b64 || '');
  const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((s.length * 3) / 4) - pad);
}

/**
 * The caps, checked before any parsing starts. Returns null when the batch is acceptable, else an error
 * code: too_many_files | file_too_large | uploads_too_large.
 */
function checkUploads(items) {
  if (!Array.isArray(items) || !items.length) return null;
  if (items.length > MAX_FILES) return 'too_many_files';
  let total = 0;
  for (const it of items) {
    const n = it && (it.pdfBase64 || it.docxBase64) ? base64Bytes(it.pdfBase64 || it.docxBase64)
      : Buffer.byteLength(String((it && it.text) || ''), 'utf8');
    if (n > MAX_FILE_BYTES) return 'file_too_large';
    total += n;
  }
  return total > MAX_TOTAL_BYTES ? 'uploads_too_large' : null;
}

module.exports = {
  parseUpload, checkUploads, base64Bytes, childEnv, UploadError,
  PARSE_TIMEOUT_MS, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, MAX_CONCURRENT, MAX_QUEUED,
};
