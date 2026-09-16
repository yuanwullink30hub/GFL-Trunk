/**
 * Minimal, dependency-free .xlsx reader — values only (the openpyxl
 * `load_workbook(path, read_only=True)` + `iter_rows(values_only=True)` view the
 * Python engine was written against).
 *
 * An .xlsx is a zip of XML parts. This reads the zip central directory, inflates
 * the parts with node:zlib, resolves sheet names → worksheet parts through the
 * workbook relationships, and turns every <row> into a positional array of cell
 * values: shared/inline strings → string, numeric cells → number, booleans →
 * boolean, empty → null. No formulas are evaluated (the workbook carries none;
 * a formula cell yields its cached value).
 */

const fs = require('fs');
const zlib = require('zlib');

function readZipEntries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('xlsx: not a zip archive (no end-of-central-directory record)');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('xlsx: corrupt central directory');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    entries.set(name, { method, compSize, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  const read = (name) => {
    const e = entries.get(name);
    if (!e) return null;
    const lp = e.localOffset;
    if (buf.readUInt32LE(lp) !== 0x04034b50) throw new Error(`xlsx: bad local header for ${name}`);
    const start = lp + 30 + buf.readUInt16LE(lp + 26) + buf.readUInt16LE(lp + 28);
    const data = buf.subarray(start, start + e.compSize);
    if (e.method === 0) return data.toString('utf8');
    if (e.method === 8) return zlib.inflateRawSync(data).toString('utf8');
    throw new Error(`xlsx: unsupported compression method ${e.method} for ${name}`);
  };
  return { read, names: [...entries.keys()] };
}

function decodeXml(s) {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, ent) => {
    if (ent[0] === '#') return String.fromCodePoint(ent[1] === 'x' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10));
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[ent];
  });
}

function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w:]+)="([^"]*)"/g)) out[m[1]] = decodeXml(m[2]);
  return out;
}

/** All <t> text inside a fragment (plain and rich-text runs), phonetic runs excluded. */
function textOf(fragment) {
  const noPhonetic = fragment.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let s = '';
  for (const m of noPhonetic.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)) s += decodeXml(m[1] || '');
  return s;
}

function colIndex(ref) {
  const letters = /^[A-Z]+/.exec(ref)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseSheet(xml, shared) {
  const rows = [];
  for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const r = attrs(rm[1]);
    const rowIdx = r.r ? parseInt(r.r, 10) - 1 : rows.length;
    const cells = [];
    for (const cm of (rm[2] || '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = attrs(cm[1]);
      const inner = cm[2] || '';
      const idx = a.r ? colIndex(a.r) : cells.length;
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner);
      let value = null;
      if (a.t === 's') value = v ? shared[parseInt(v[1], 10)] : null;
      else if (a.t === 'inlineStr') value = textOf(inner);
      else if (a.t === 'str' || a.t === 'e') value = v ? decodeXml(v[1]) : null;
      else if (a.t === 'b') value = v ? v[1] === '1' : null;
      else value = v ? Number(v[1]) : null;
      cells[idx] = value;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = null;
    rows[rowIdx] = cells;
  }
  for (let i = 0; i < rows.length; i++) if (rows[i] === undefined) rows[i] = [];
  return rows;
}

/** path → { sheetNames, rows(sheetName) } with each sheet parsed once. */
function loadWorkbook(path) {
  const zip = readZipEntries(fs.readFileSync(path));
  const sharedXml = zip.read('xl/sharedStrings.xml');
  const shared = sharedXml ? [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1])) : [];
  const rels = {};
  for (const m of (zip.read('xl/_rels/workbook.xml.rels') || '').matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const a = attrs(m[1]);
    rels[a.Id] = a.Target.startsWith('/') ? a.Target.slice(1) : `xl/${a.Target}`;
  }
  const sheets = new Map();
  for (const m of (zip.read('xl/workbook.xml') || '').matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const a = attrs(m[1]);
    sheets.set(a.name, rels[a['r:id']]);
  }
  const cache = new Map();
  return {
    sheetNames: [...sheets.keys()],
    rows(name) {
      if (!sheets.has(name)) throw new Error(`xlsx: no sheet named "${name}"`);
      if (!cache.has(name)) cache.set(name, parseSheet(zip.read(sheets.get(name)), shared));
      return cache.get(name);
    },
  };
}

module.exports = { loadWorkbook };
