#!/usr/bin/env node
/**
 * Compile the v4.3 workbook to JSON — the only form the runtime engine loads.
 *
 *   node scripts/compile-workbook.js          (re)write engine/data/Matrix_360_v4_3.json
 *   node scripts/compile-workbook.js --check  exit 1 if the JSON is missing, stale or tampered
 *
 * The .xlsx stays the source of record (calibration = editing its cells + a version bump); the JSON
 * is its compiled form, carrying two checksums:
 *   source.sha256    of the .xlsx bytes it was compiled from — a stale compile fails --check and gate 1
 *   content_sha256   of the compiled sheets themselves — the engine refuses to boot on a mismatch
 * Every sheet ships, cell values exactly as the reader returns them (openpyxl values_only semantics).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadWorkbook } = require('../engine/xlsx');

const DATA = path.join(__dirname, '..', 'engine', 'data');
const SOURCE = path.join(DATA, 'Matrix_360_v4_3_reconstructed.xlsx');
const TARGET = path.join(DATA, 'Matrix_360_v4_3.json');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const contentHash = (sheet_order, sheets) => sha256(JSON.stringify({ sheet_order, sheets }));

function compile() {
  const bytes = fs.readFileSync(SOURCE);
  const wb = loadWorkbook(SOURCE);
  const sheets = {};
  for (const name of wb.sheetNames) sheets[name] = wb.rows(name);
  return {
    format: 'gfl-workbook-json/1',
    source: { file: path.basename(SOURCE), bytes: bytes.length, sha256: sha256(bytes) },
    sheet_order: wb.sheetNames,
    content_sha256: contentHash(wb.sheetNames, sheets),
    sheets,
  };
}

if (require.main === module) {
  const fresh = compile();
  if (process.argv.includes('--check')) {
    let ok = false;
    try {
      const cur = JSON.parse(fs.readFileSync(TARGET, 'utf8'));
      ok = cur.source.sha256 === fresh.source.sha256
        && cur.content_sha256 === contentHash(cur.sheet_order, cur.sheets)
        && cur.content_sha256 === fresh.content_sha256;
    } catch { ok = false; }
    console.log(ok ? `current: ${path.basename(TARGET)} matches ${fresh.source.file}` : `STALE or invalid: re-run node scripts/compile-workbook.js`);
    process.exit(ok ? 0 : 1);
  }
  fs.writeFileSync(TARGET, JSON.stringify(fresh));
  console.log(`${path.basename(TARGET)}: ${fresh.sheet_order.length} sheets · source sha256 ${fresh.source.sha256.slice(0, 16)}… · content sha256 ${fresh.content_sha256.slice(0, 16)}…`);
}

module.exports = { compile, contentHash, SOURCE, TARGET };
