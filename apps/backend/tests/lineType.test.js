/**
 * The Main–Support line type over all 132 pairs (Master Prompt v7 R-a, owner 14 Oct): green = hardware,
 * blue = feedback, red = blindspot, purple = shadow, yellow = cognitive synergy. The resolved type must
 * agree with the Main's own links the payload ships (mainLinks), so the model never reads two answers.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { resolveLineType, mainLinks, ARCHETYPE_POSITIONS } = require('../services/lineType');

const NAMES = Object.keys(ARCHETYPE_POSITIONS);
const title = (k) => k.charAt(0) + k.slice(1).toLowerCase();

test('every pair resolves to the line its Main links name, first match wins', () => {
  const counts = {};
  for (const main of NAMES) {
    const links = mainLinks(main);
    for (const support of NAMES) {
      if (support === main) continue;
      const s = title(support);
      const type = resolveLineType(main, support);
      counts[type] = (counts[type] || 0) + 1;
      const expected = links.green === s ? 'Groene Lijn'
        : links.purple === s ? 'Paarse Lijn'
          : links.blue === s ? 'Blauwe Lijn'
            : links.red === s ? 'Rode Lijn'
              : links.yellow.includes(s) ? 'Gele Lijn'
                : '(geen kanonieke lijn)';
      assert.equal(type, expected, `${main} × ${support}`);
    }
  }
  // 12 green, 12 purple, 8 cross-group blue (Ruling and Chaos bridge inside the group), 12 red, 24 yellow.
  assert.deepEqual(counts, { 'Groene Lijn': 12, 'Paarse Lijn': 12, 'Blauwe Lijn': 8, 'Rode Lijn': 12, 'Gele Lijn': 24, '(geen kanonieke lijn)': 64 });
});

test('yellow: the triangle partners, 4 positions apart', () => {
  assert.equal(resolveLineType('EXPLORER', 'JUDGE'), 'Gele Lijn');
  assert.equal(resolveLineType('JUDGE', 'ARTIST'), 'Gele Lijn');
  assert.equal(resolveLineType('RULER', 'INNOCENT'), 'Gele Lijn');
  assert.equal(resolveLineType('EXPLORER', 'OUTLAW'), '(geen kanonieke lijn)');
});
