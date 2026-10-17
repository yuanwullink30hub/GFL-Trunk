# Master prompt

The AI Master Prompt has **one home: MongoDB `promptConfigs/<record>.systemPromptTemplate`**, one record per prompt
slot, edited in the admin dashboard (Prompts tab, one sub-tab per slot). There is no prompt file in the repo.
`services/promptRouting.js` ties a report request to its record:

| slot | request | record |
| --- | --- | --- |
| beginner | `level: 'beginner'` (UI `quick`) | `beginner` |
| intermediate | `level: 'intermediate'` (UI `standard`) | `intermediate` |
| advanced | `level: 'advanced'` (UI `deep`, Leerling) | `default` (historic id; Master Prompt v7 since 2026-10-13) |

The analyze route reads the record before the stream opens and refuses a slot whose prompt is empty (409), so a
level without a prompt never reaches a paid call. For Leerling it also refuses a test that does not fit the prompt:
the two-layer test (`scoring_version: 'v2_two_layer'`) needs v7 or later, the old Nature/Culture test v6 or earlier. The report pipeline (`engine/reportV5.js`, the only one) passes
the prompt through unaltered.
Live since 2026-09-18: **v6.2.1** (v4.3 → v6.1 → v6.1.1 → v6.1.2 → v6.2.1). The v5.2 staged file is retired.

- **Format:** plain text, `●<TAB>` bullets, `N.<TAB>` numbered items, TAB-separated table rows, code fences verbatim.
  A new version handed over as pandoc-exported markdown is converted to that format: escapes and emphasis stripped,
  `---` → —, range `--` → –, spaced `-- TAG --` machine-block tags kept literal, `...` → ….
- **Replacing it:** diff the converted text against the live text first, back up the live record, and pin the write to
  the live text so a dashboard edit made in between is never overwritten.
- **Trap flag (W7):** "72 picks" = 36 questions × dual-pick and is correct. It is not the retired 72-extension
  set — never "fix" it to 132.
- **Activation:** the engine pipeline is live since 2026-09-16 and is the only one (the v4.3 full-corpus path was
  removed 2026-10-13). Gates before any pipeline change: `npm run test:gates` (gates 1–4, 6a, deploy absent-check)
  and `node scripts/engine-dry-run.js --live` (gates 5, 6b; reads the prompt from Mongo, never writes).

## What the backend pairs with the Master Prompt

| Prompt rule | Backend |
| --- | --- |
| Two curves, both the Main's (§5.5, Spec A1) | `enginePayload.main.register` → `MorphologyChart` two-curve mode |
| R4 bands | `register_bands` from workbook sheet `Band_Cutpoints_v0_PROVISIONAL`, stamp `register_bands_version` |
| R5 four stamps | `payload.stamps`: tau_calibration_version · corpus_manifest_version · register_bands_version · workbook |
| R6 Main-cell enrichment | `payload.main.enrichment` (verbatim) |
| R7 sliced corpus | `engine/corpusResolver.js` — Corpus Lookup Table v1.1 + always-block ruling (manifest v1.1): ALWAYS-block incl. the claim, the nine anchors, Nature and Culture and M1/M2 + group blocks + the Schaduw-pakket (§8, consumer 5.3 DE BLINDSPOT; shadow and blindspot read from the payload's geometry): `shadow_pack/shadow/<A>` = §1 + §6 of the shadow's group, only when that group is not in the active set; `shadow_pack/blindspot/<A>` = §6 of the blindspot's group, unless a group block or the shadow object already carries it — nothing ships twice + one extension cell + the triangle material by the session's cognitive triangles (v2, manifest v1.2: the Main's triangle in full with its pair paragraph and role entries, every other carrying triangle in brief; never Culturele Manifestatie or De Afwezige Driehoek); no composition math |
| R8 Support always present | `payload.support` always ships (w = support_weight_norm); no τ′ terms outside the pull set |
| v7.2 page 5.7b — De Cognitieve Driehoek | `engine/cogTriangle.js` (port of `cog_triangle_v0_1.py`): bands draagt · neutraal · stil from the chosen weight (keuze + passief), exact integers, seeds 17/10 · 1/2 (Main's triangle) and 31/20 · 3/5 (other) → `-- COGNITIEVE DRIEHOEK --` in the data block, the slice routing above, and `client.triangle` for the PDF figure (fill by band, other carrying triangles dashed). The lift and thresholds never leave the module. Parser tags `DE COGNITIEVE DRIEHOEK` · `DE DROGREDENEN VAN DE DRIEHOEK`; the English titles and the 21-section completeness check apply from a v7.2 masthead on |
| Links (table v1.1 §8; replaces the per-position table in R-a) | `payload.links` = the Main's links only: {main, green, blue, purple, red, yellow: [two]}, read from the whole wheel stored in `services/lineType.js` (`wheelLinks` → `mainLinks`), pinned by the gates to the scoring engine's line tables |
| §5.7 / §5.10 extension identity | `payload.extension` {n, name_en, name_nl, main, support}; gift/curse/levensles stay in the slice |
