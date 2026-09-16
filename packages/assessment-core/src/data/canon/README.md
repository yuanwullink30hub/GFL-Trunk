# Canon — Deltawerken Complete Corpus

`deltawerken_corpus.json` is the **single source of truth** for all Deltawerken
archetype content: the Frame Extract (the always-ship spine), the framework
(Rosetta), the 360-cell matrix (B/C/D per archetype), the six hardware-group
documents, the four Yellow Triangles (Culture layer), the 132 extensions, and the
cell schema spec. `deltawerken_corpus_nl.json` is its Dutch
twin (same structure and numbers). Source versions are stamped in `_meta`
(corpus 1.2: Frame Extract v1.0, Rosetta v1.4.11, Matrix v4.3, Schema v1.9,
Extensions 132 v1.0 RATIFIED, Extended list v1.3, Lessen 132 v2.1 FINAL).

At runtime the report model never receives this whole file: `apps/backend/engine/corpusResolver.js` slices it per
Corpus Lookup Table v1.1 (heading-keyed; ALWAYS-block — Frame Extract, front sections 1 (the claim), 3 (the nine
anchors) and 5 (Nature and Culture), the masthead's M1/M2 methodology principles, wheel mechanics — in every call · one block
per active hardware group · the Schaduw-pakket: "1 — Group Identity & Geometry" + "6 — Biochemical Architecture" of the
shadow's group when that group is not active, and "6 — Biochemical Architecture" of the blindspot's group, never twice ·
the one Main × Support extension cell · TNM entries on culture picks). [STAGED] banners are filtered at bind time: a standalone banner
drops its section (the Epilogue); an inline table-cell banner drops only that cell's staged text, so the section
still ships (Seeker §1 "Hardware seam (red)" ships without its staged no-hardware-antagonist claim). The corpus
itself keeps the banner verbatim. Rosetta v1.4.11's `[STAGED-afhankelijk — …]` markers (HG3 §1 seam cell, HG4 chapter
opening, HG4 §5 note) are not banners: their sections ship, and the resolver strips the marker and the clause it tags
(the Seeker re-type stated outside its banners) from the slice (human rulings, 2026-09-16); the corpus keeps both
verbatim.

The Relational group's §3/§4 were a fold artifact (the "4 — OCEAN Precision" heading and table glued into the §3
body; the NL twin had lost the table). Repaired 2026-09-16: §4 is its own section in both twins; the NL table is a
translation of the EN table in the terms the other NL §4 tables use. Both twins: 240 Rosetta sections.

The corpus is narration ground only. **Composition math is not in it, in any version:** D
Relational Operations (v1.0 was removed; Layer-3 v1.1 stays on the reference shelf) is the
engine-implementation spec the Node port in `apps/backend/engine/` implements from — τ′,
C-magnitude, compose-then-modulate. The report model receives the engine's resolved values,
never the formulas; the pull and modulation semantics it needs live in the Frame Extract and the
master prompt's DEEL 0.6, without numbers. Certificates (e.g. the Global Computation Certificate,
formerly cited only inside the v1.0 copy) are audit-shelf material, not corpus.

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
