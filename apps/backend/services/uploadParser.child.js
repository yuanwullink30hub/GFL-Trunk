/**
 * Child process for services/uploadParser.js. Parses ONE untrusted upload and exits.
 *
 * It is a process, not a worker thread, on purpose: pdf-parse 2.x loads @napi-rs/canvas, a native addon,
 * and a native crash inside a worker thread takes the whole server down with it (measured: an access
 * violation on Windows killed the host process). A crash in here only ends this process.
 *
 * It is started with a minimal environment (uploadParser.js CHILD_ENV): no database URI, no Stripe or
 * model keys. If a crafted file ever achieved code execution in a parser, there is nothing here to take.
 * stdout/stderr are discarded by the parent, so a parser warning can never print document text to a log.
 */
process.once('message', async ({ kind, bytes }) => {
  const buffer = Buffer.from(bytes);
  try {
    let text = '';
    if (kind === 'docx') {
      const mammoth = require('mammoth');
      text = (await mammoth.extractRawText({ buffer })).value || '';
    } else if (kind === 'pdf') {
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      try {
        text = (await parser.getText()).text || '';
      } finally {
        await parser.destroy().catch(() => {});
      }
    } else {
      throw new Error('unsupported_kind');
    }
    process.send({ ok: true, text }, () => process.exit(0));
  } catch (e) {
    // The message only: a stack could carry fragments of the document.
    process.send({ ok: false, error: String((e && e.message) || 'parse_failed').slice(0, 200) }, () => process.exit(0));
  }
});
