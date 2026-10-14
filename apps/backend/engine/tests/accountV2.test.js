/**
 * The account card for v2 readings (payload instruction v7 §8): a reading read from a v2 report's data
 * page carries schema_version v2_two_layer and the seven mandjes (never the five-basket decomposition),
 * and its gift / curse / levensles come from the extension cell by number — the corpus, not the page or
 * the client.
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const V = require('../reportV7');
const { dataBlockText } = require('../dataBlock');
const { extractReading, sanitizeReading } = require('../../services/readingExtract');
const { loadCorpus } = require('../../services/corpusData');
const sessions = require('./bleed_v2_session_fixtures_v0_1.json').cases;

const SYSTEM = 'AI MASTER PROMPT v7.0 — test\nW1';
/** The text layer of a v2 PDF's last page: the orb lines, then the server's blocks as the PDF prints them. */
function v2Page(name, language = 'en') {
  const r = V.buildV2Request({ system: SYSTEM, responses: sessions[name].questions, language });
  const report = language === 'en' ? 'THE IDENTITY\nSome report text.' : 'DE IDENTITEIT\nWat rapporttekst.';
  return { r, text: `${report}\n\nPROFIEL DATA VOOR AI VERWERKING\n${dataBlockText(r.dataBlock)}` };
}

test('§8.1: a v2 page yields schema v2, the seven mandjes and the shape; never baskets12', () => {
  const { r, text } = v2Page('ruling_tetrad');
  const reading = extractReading(text);
  assert.equal(reading.schemaVersion, 'v2_two_layer');
  assert.equal(reading.archetypeMainId, 'Ruler');
  assert.equal(reading.archetypeSupportId, 'Judge');
  assert.equal(reading.mandjes12.length, 12);
  assert.deepEqual(reading.mandjes12[11], ['keuze', 'passief', 'groen', 'blauw', 'blauw_intern', 'paars', 'geel'].map((b) => r.session.mandjes.Ruler[b]));
  const max = Math.max(...Object.values(r.session.totals));
  assert.deepEqual(reading.shapeVector12, ['Judge', 'Lover', 'Caregiver', 'Innocent', 'Explorer', 'Outlaw', 'Trickster', 'Sage', 'Artist', 'Magician', 'Hero', 'Ruler']
    .map((n) => Math.round((r.session.totals[n] / max) * 1000) / 1000));
  assert.equal(reading.extensionN, r.payload.extension.n);
  assert.ok(!('baskets12' in reading));
  // the claim never keeps both, whatever the client sends
  const mixed = sanitizeReading({ ...reading, baskets12: Array.from({ length: 12 }, () => [1, 2, 3, 4, 5, 6]) });
  assert.ok(!('baskets12' in mixed) && mixed.mandjes12.length === 12);
});

test('§8.2: gift, curse and levensles come from the extension cell by number, in the report\'s language — never from the client', () => {
  for (const language of ['en', 'nl']) {
    const { r, text } = v2Page('selftest_example', language);
    const claimed = sanitizeReading({ ...extractReading(text), gift: 'forged gift', levensles: 'forged lesson' });
    const cell = loadCorpus(language).archetypes[r.session.main].extensions.find((x) => x.n === r.payload.extension.n);
    assert.equal(claimed.gift, cell.gift.replace(/\s+/g, ' ').trim().slice(0, 300), language);
    assert.equal(claimed.curse, cell.curse.replace(/\s+/g, ' ').trim().slice(0, 300), language);
    assert.equal(claimed.levensles, cell.levensles.replace(/\s+/g, ' ').trim().slice(0, 600), language);
    assert.ok(!('lang' in claimed), 'the language picks the cell; it is not stored');
  }
  // a number that is not this Main × Support's cell gives no texts at all
  const { text } = v2Page('selftest_example');
  const wrong = sanitizeReading({ ...extractReading(text), extensionN: 1 });
  assert.ok(!wrong.gift && !wrong.curse && !wrong.levensles && !wrong.extensionN);
});

test('v1 readings are unchanged apart from their schema version', () => {
  const page = ['-- IDENTITEIT --', 'Main: De Rebel (6) | Groep: CHAOS', 'Support: De Heerser (12) | Groep: RULING',
    ...['Judge', 'Lover', 'Caregiver', 'Innocent', 'Explorer', 'Outlaw', 'Trickster', 'Sage', 'Artist', 'Magician', 'Hero', 'Ruler'].map((n, i) => `${n}: nat_core ${i} | green 1 | cult_core 2 | blue 3 | yellow 4 | purple 5`),
    'Gift: een gave', 'Curse / Trigger: een vloek', 'Levensles: "een les"'].join('\n');
  const r = sanitizeReading(extractReading(page));
  assert.equal(r.schemaVersion, 'v1_nature_culture');
  assert.equal(r.baskets12.length, 12);
  assert.ok(!('mandjes12' in r));
  assert.equal(r.gift, 'een gave');
  assert.equal(r.levensles, 'een les');
});
