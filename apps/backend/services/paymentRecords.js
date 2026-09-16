/**
 * Garden For Life — Payment records (betaalbewijzen) as stored PDFs.
 *
 * Every paid report gets a PDF payment record at the moment the payment is recorded, and every
 * refund gets its own refund record. The PDF is generated ONCE and stored as-is in
 * `paymentRecords`, so the administration holds the document as it was issued — a later
 * refund never rewrites the original payment record.
 *
 *   { kind: 'payment' | 'refund', number: '2026-000001', unlockRef, reference, relatesTo?,
 *     issuedAt, amountCents (negative for refunds), vatRate, currency, filename, pdf (Binary),
 *     sha256, createdAt }
 *
 * Numbers are one gapless sequence per calendar year (counters collection), shared by payments
 * and refunds, as a bookkeeping record expects.
 *
 * The PDF deliberately carries NO email address or name: the payment reference (the Stripe
 * PaymentIntent id) ties it to the payment at Stripe. That keeps these records free of contact
 * details for the 7-year retention. The header always prints the seller's KVK and BTW number.
 *
 * VAT: a Stripe payment records the tax Stripe Tax calculated (taxCents + vatRate on the unlock)
 * and the record prints exactly that; older unlocks without it fall back to a VAT_RATE split.
 */
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { Binary } = require('mongodb');
const { collections, getDB } = require('../db');

const VAT_RATE = 21;
const BUSINESS = {
  name: 'Garden For Life',
  address: 'De Taxushaag 2, 7207 MB Zutphen',
  kvk: '85125245',
  btw: 'NL004054423B17',
  email: 'yuanwullink30@gfl.community',
  web: 'www.gardenforlife.nl',
};
const DESCRIPTION = 'Volledig rapport — Garden For Life Assessment';

const pad = (n, w) => String(n).padStart(w, '0');
const euro = (cents) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cents / 100);
const dateNl = (d) => new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Amsterdam' }).format(new Date(d));
const yearOf = (d) => Number(new Intl.DateTimeFormat('en-GB', { year: 'numeric', timeZone: 'Europe/Amsterdam' }).format(new Date(d)));
const monthOf = (d) => new Intl.DateTimeFormat('en-GB', { month: '2-digit', timeZone: 'Europe/Amsterdam' }).format(new Date(d));

/**
 * Next number in the gapless per-year sequence: "2026-000001". Stripe TEST-mode payments use their
 * own sequence ("TEST-2026-000001"), so testing can never put a gap or a fake payment into the real one.
 */
async function nextNumber(issuedAt, testmode = false) {
  const year = yearOf(issuedAt);
  const r = await getDB().collection('counters').findOneAndUpdate(
    { _id: `paymentRecord-${testmode ? 'test-' : ''}${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );
  return `${testmode ? 'TEST-' : ''}${year}-${pad(r.seq, 6)}`;
}

/** VAT split of a gross amount in cents (rounded on the VAT part). */
function vatSplit(grossCents, rate = VAT_RATE) {
  const vat = Math.round((grossCents * rate) / (100 + rate));
  return { net: grossCents - vat, vat, gross: grossCents };
}

/** Render one record to a PDF Buffer. */
function renderPdf(rec) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 56, info: { Title: `${rec.title} ${rec.number}`, Author: BUSINESS.name } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const L = 56;
    const W = doc.page.width - L * 2;
    const INK = '#1e1e1e';
    const DIM = '#6b6b6b';
    const ACCENT = '#f97316';

    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(18).text('GARDEN FOR LIFE', L, 56);
    doc.fillColor(DIM).font('Helvetica').fontSize(9)
      .text(BUSINESS.address, L, 80)
      .text(`KVK ${BUSINESS.kvk}  ·  BTW ${BUSINESS.btw}`)
      .text(`${BUSINESS.email}  ·  ${BUSINESS.web}`);

    doc.fillColor(INK).font('Helvetica-Bold').fontSize(16).text(rec.title, L, 150);
    doc.moveTo(L, 174).lineTo(L + W, 174).lineWidth(1).strokeColor(ACCENT).stroke();

    const rows = [
      ['Nummer', rec.number],
      ['Datum', dateNl(rec.issuedAt)],
      ['Betaalreferentie', rec.reference || '—'],
      ...(rec.relatesTo ? [['Betreft betaalbewijs', rec.relatesTo]] : []),
      ['Betaalwijze', rec.paymentMethod || 'Stripe'],
      ...(rec.extra || []),
    ];
    let y = 190;
    doc.fontSize(10);
    for (const [k, v] of rows) {
      doc.fillColor(DIM).font('Helvetica').text(k, L, y, { width: 150 });
      doc.fillColor(INK).font('Helvetica').text(String(v), L + 160, y, { width: W - 160 });
      y += 18;
    }

    y += 16;
    doc.rect(L, y, W, 22).fill('#f4f4f4');
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(10)
      .text('Omschrijving', L + 8, y + 6)
      .text('Bedrag', L + W - 128, y + 6, { width: 120, align: 'right' });
    y += 30;
    doc.font('Helvetica').text(rec.description, L + 8, y, { width: W - 150 })
      .text(euro(rec.amountCents), L + W - 128, y, { width: 120, align: 'right' });
    y += 30;
    doc.moveTo(L, y).lineTo(L + W, y).lineWidth(0.5).strokeColor('#d0d0d0').stroke();
    y += 10;

    const gross = Math.abs(rec.amountCents);
    const split = Number.isFinite(rec.taxCents)
      ? { net: gross - Math.abs(rec.taxCents), vat: Math.abs(rec.taxCents), gross }
      : vatSplit(gross, rec.vatRate);
    const sign = rec.amountCents < 0 ? -1 : 1;
    const totals = [
      ['Bedrag excl. btw', euro(sign * split.net), false],
      [`Btw ${rec.vatRate}%`, euro(sign * split.vat), false],
      ['Totaal incl. btw', euro(sign * split.gross), true],
    ];
    for (const [k, v, bold] of totals) {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(INK).fontSize(bold ? 11 : 10)
        .text(k, L + W - 300, y, { width: 170, align: 'right' })
        .text(v, L + W - 128, y, { width: 120, align: 'right' });
      y += bold ? 22 : 18;
    }

    doc.fillColor(DIM).font('Helvetica').fontSize(8.5)
      .text(rec.footer, L, doc.page.height - 110, { width: W });
    doc.end();
  });
}

async function storeRecord(fields) {
  const number = await nextNumber(fields.issuedAt, fields.testmode === true);
  const filename = `${number}_${fields.kind === 'refund' ? 'terugbetaling' : 'betaling'}_${String(fields.reference || 'geen-ref').replace(/[^A-Za-z0-9_-]/g, '')}.pdf`;
  const pdf = await renderPdf({ ...fields, number });
  const doc = {
    kind: fields.kind,
    number,
    unlockRef: fields.unlockRef,
    reference: fields.reference || '',
    ...(fields.relatesTo ? { relatesTo: fields.relatesTo } : {}),
    issuedAt: new Date(fields.issuedAt),
    amountCents: fields.amountCents,
    vatRate: fields.vatRate,
    ...(Number.isFinite(fields.taxCents) ? { taxCents: fields.taxCents } : {}),
    ...(fields.testmode === true ? { testmode: true } : {}),
    currency: 'EUR',
    filename,
    pdf: new Binary(pdf),
    sha256: crypto.createHash('sha256').update(pdf).digest('hex'),
    createdAt: new Date(),
  };
  try {
    await collections.paymentRecords().insertOne(doc);
  } catch (e) {
    // Unique (unlockRef, kind): a concurrent call already issued it — not an error.
    if (e && e.code === 11000) return collections.paymentRecords().findOne({ unlockRef: fields.unlockRef, kind: fields.kind }, { projection: { pdf: 0 } });
    throw e;
  }
  const { pdf: _omit, ...meta } = doc;
  return meta;
}

/** Issue the payment record for a paid unlock (idempotent). */
async function issuePaymentRecord(unlock) {
  if (!unlock || unlock.method !== 'payment') return null;
  const existing = await collections.paymentRecords().findOne({ unlockRef: unlock._id, kind: 'payment' }, { projection: { pdf: 0 } });
  if (existing) return existing;
  return storeRecord({
    kind: 'payment',
    title: 'Betaalbewijs',
    unlockRef: unlock._id,
    reference: unlock.reference,
    issuedAt: unlock.unlockedAt,
    amountCents: unlock.amountCents,
    vatRate: Number.isFinite(unlock.vatRate) ? unlock.vatRate : VAT_RATE,
    ...(Number.isFinite(unlock.taxCents) ? { taxCents: unlock.taxCents } : {}),
    testmode: unlock.testmode === true,
    description: DESCRIPTION,
    footer: 'Dit betaalbewijs is automatisch opgesteld bij ontvangst van de betaling. Op het volledige rapport geldt een geld-terug-garantie van 14 dagen na betaling.',
  });
}

/** Issue the refund record for a refunded unlock (idempotent). */
async function issueRefundRecord(unlock) {
  if (!unlock || unlock.method !== 'payment' || unlock.status !== 'refunded') return null;
  const existing = await collections.paymentRecords().findOne({ unlockRef: unlock._id, kind: 'refund' }, { projection: { pdf: 0 } });
  if (existing) return existing;
  const original = await issuePaymentRecord(unlock);
  return storeRecord({
    kind: 'refund',
    title: 'Terugbetalingsbewijs',
    unlockRef: unlock._id,
    reference: unlock.reference,
    relatesTo: original ? original.number : undefined,
    issuedAt: unlock.refundedAt,
    amountCents: -Math.abs(unlock.amountCents),
    vatRate: Number.isFinite(unlock.vatRate) ? unlock.vatRate : VAT_RATE,
    ...(Number.isFinite(unlock.taxCents) ? { taxCents: -Math.abs(unlock.taxCents) } : {}),
    testmode: unlock.testmode === true,
    description: `Terugbetaling — ${DESCRIPTION}`,
    extra: [['Grond', 'Geld-terug-garantie (14 dagen)']],
    footer: 'Dit terugbetalingsbewijs is automatisch opgesteld bij het verwerken van de terugbetaling onder de geld-terug-garantie.',
  });
}

/** Issue any records that are missing (e.g. after a failed write). Returns how many were issued. */
async function ensureRecords() {
  // Unlinked unlocks are skipped: their records were issued before the link was cut, under an
  // opaque unlockRef that deliberately no longer matches (reportAccess.unlinkExpiredPayments).
  const unlocks = await collections.reportUnlocks().find({ method: 'payment', paymentUnlinked: { $ne: true } }).toArray();
  if (!unlocks.length) return 0;
  const have = await collections.paymentRecords()
    .find({ unlockRef: { $in: unlocks.map((u) => u._id) } }, { projection: { unlockRef: 1, kind: 1 } }).toArray();
  const key = (ref, kind) => `${String(ref)}|${kind}`;
  const haveSet = new Set(have.map((r) => key(r.unlockRef, r.kind)));
  let issued = 0;
  for (const u of unlocks.sort((a, b) => new Date(a.unlockedAt) - new Date(b.unlockedAt))) {
    if (!haveSet.has(key(u._id, 'payment'))) { await issuePaymentRecord(u); issued++; }
    if (u.status === 'refunded' && !haveSet.has(key(u._id, 'refund'))) { await issueRefundRecord(u); issued++; }
  }
  return issued;
}

// ── Minimal ZIP writer (STORE, no compression — PDFs are already compressed) ──
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function dosDateTime(d) {
  const t = new Date(d);
  return {
    time: (t.getHours() << 11) | (t.getMinutes() << 5) | Math.floor(t.getSeconds() / 2),
    date: ((t.getFullYear() - 1980) << 9) | ((t.getMonth() + 1) << 5) | t.getDate(),
  };
}

/** @param {{ name: string, data: Buffer, date?: Date }[]} files  @returns {Buffer} */
function buildZip(files) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name, 'utf8');
    const data = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data);
    const crc = crc32(data);
    const { time, date } = dosDateTime(f.date || new Date());
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8); local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    locals.push(local, name, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8); central.writeUInt16LE(0, 10); central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24); central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += 30 + name.length + data.length;
  }
  const centralSize = centrals.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, ...centrals, end]);
}

/** Folder path of a record inside the archive: Betaalbewijzen/2026/09/<filename>. */
function archivePath(rec) {
  return `Betaalbewijzen/${yearOf(rec.issuedAt)}/${monthOf(rec.issuedAt)}/${rec.filename}`;
}

module.exports = {
  VAT_RATE,
  vatSplit,
  issuePaymentRecord,
  issueRefundRecord,
  ensureRecords,
  buildZip,
  archivePath,
  yearOf,
};
