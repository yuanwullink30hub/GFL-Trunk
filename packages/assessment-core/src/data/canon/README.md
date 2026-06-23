# Canon — Deltawerken Complete Corpus

`deltawerken_corpus.json` is the **single source of truth** for all Deltawerken
archetype content: the framework (Rosetta), the 360-cell matrix (B/C/D per
archetype), the six hardware-group documents, the four Yellow Triangles (Culture
layer), the 72 extensions, and the relational-operation / cell schema specs.

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

- `../archetypeQuotes.js` — the **72 Levensles** (combination life-lessons). These
  are fetched and sent to the AI directly, so it needn't search the corpus for them.
- `../scoring/` — the assessment scoring engine (not archetype content).
- `../archetypes/` — the archetype key/position/group registry (assessment infra).
- `../archetypeImages.js` — image assets.

Consumers of the removed exports (results modal / PDF / EyedentityPage) are rewired
in a later part of the restructure.
