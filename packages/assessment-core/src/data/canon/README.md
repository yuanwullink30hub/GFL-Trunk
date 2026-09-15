# Canon — Deltawerken Complete Corpus

`deltawerken_corpus.json` is the **single source of truth** for all Deltawerken
archetype content: the Frame Extract (the always-ship spine), the framework
(Rosetta), the 360-cell matrix (B/C/D per archetype), the six hardware-group
documents, the four Yellow Triangles (Culture layer), the 132 extensions, and the
relational-operation / cell schema specs. `deltawerken_corpus_nl.json` is its Dutch
twin (same structure and numbers). Source versions are stamped in `_meta`
(corpus 1.2: Frame Extract v1.0, Rosetta v1.4.10, Matrix v4.3, Schema v1.8,
Extensions 132 v1.0 RATIFIED, Extended list v1.3, Lessen 132 v2.1 FINAL).

The Rosetta's twelve §8 extension tables are the 132-grain RATIFIED tables; in the NL twin
their gift/curse cells carry the same Dutch translation as `archetypes.<Main>.extensions`.
The six §9 "Crystallised Lessons" tables no longer carry the 72-set group-grain lessons:
they list the 132 Lessen v2.1 FINAL lessons (same text as the extension records). Known
source residual still kept verbatim: two §5 individuation paths name a retired extension
(the Mystic).

Extensions live per archetype in `archetypes.<Main>.extensions` — 11 entries, one per
Support (name EN/NL, gift, curse, levensles) — plus `extensions_singles` (Dutch gift + curse
for the 12 singles). The RATIFIED workbook has gift + curse in English and the levensles in
Dutch; each twin carries its own language: the EN file keeps the ratified gift + curse and
an English translation of the levensles, the NL file keeps the ratified levensles and a
Dutch translation of gift + curse. Three
cells carry open human-owned flags in the workbook's Flag_Ledger (#113 curse, #116 gift,
#119 curse); they ship as ratified until ruled on.

A model reads this corpus and needs no external search — if it is verified, it is
here.

## Restructure (part 1)

This canon replaces the previously scattered per-domain data files. Removed in
part 1 (their content now lives here):

- `biochemical/` — biochemical & neuro-integration profiles
- `ocean/`, `oceanProfiles.js` — OCEAN deep-dive profiles
- `extendedArchetypeDescriptions.js` — 72 extended descriptions
- `analysis/templates.js` — pre-written analysis templates

**Kept separate on purpose:**

- `../archetypeQuotes.js` — the **132 Levensles** (Main × Support life-lessons, same text
  as the corpus). These are fetched and sent to the AI directly, so it needn't search the
  corpus for them.
- `../scoring/` — the assessment scoring engine (not archetype content).
- `../archetypes/` — the archetype key/position/group registry (assessment infra).
- `../archetypeImages.js` — image assets.

Consumers of the removed exports (results modal / PDF / EyedentityPage) are rewired
in a later part of the restructure.
