# Layer-2 falsification diff — v4.0 / v4.1 vs v4.3 (canonical)

Run: `node scripts/layer2-diff.js` · 2026-09-15

Sources: v4.0 `Matrix_360_v4_0_integrated.xlsx` · v4.1 `Matrix_360_v4_1_payment_styles.xlsx` · v4.3 `Matrix_360_v4_3_reconstructed.xlsx` (engine copy).

## 0 · Handed markdown vs its workbook

- v4.0: markdown 660 rows vs workbook 660 rows — identical.
- v4.1: markdown 660 rows vs workbook 660 rows — identical.

## 1 · D_Transform_Articulations (660 rows)

Row keys: v4.0 660 · v4.1 660 · v4.3 660.
Key set v4.0 vs v4.3: identical
Key set v4.1 vs v4.3: identical

| Column | Authenticity | v4.1 → v4.3 | v4.0 → v4.3 | Reading |
| --- | --- | --- | --- | --- |
| Direction | original | 0 | 0 | clean |
| Class | original | 0 | 0 | clean |
| C1 | original | 0 | 0 | clean |
| Flag | original | 0 | 0 | clean |
| Cost-state | structural | 0 | 0 | clean |
| Polarity | pre-loss original (v4.3 rebuilt it) | 0 | 0 | rebuild CONFIRMED by the pre-loss original |
| Sense (derived) | derived since origin | 0 | 0 | consistent |
| Locus | PRE-SPLIT grain | 120 | 120 | see §2 (split mapping) |

## 2 · Locus — pre-split (v4.1) mapped onto the v4.3 split

| v4.1 locus → v4.3 locus | rows | expected? |
| --- | --- | --- |
| value → value | 437 | yes — refinement or identity |
| — → — | 73 | yes — refinement or identity |
| shape → shape:tracking | 64 | yes — refinement or identity |
| shape → shape:operational | 56 | yes — refinement or identity |
| entry → entry | 30 | yes — refinement or identity |

Per cost-state (the regenerated zone is dissolution and boundary-loss):
- **petrification**: value → value ×80 · shape → shape:tracking ×20 · — → — ×10
- **depletion**: value → value ×66 · entry → entry ×30 · — → — ×8 · shape → shape:operational ×6
- **dissolution**: value → value ×100 · — → — ×10
- **boundary-loss**: value → value ×70 · shape → shape:operational ×30 · — → — ×10
- **sealing**: value → value ×55 · — → — ×35 · shape → shape:operational ×20
- **borderlessness**: value → value ×66 · shape → shape:tracking ×44

### 2b · Rule reproduction (no free parameters)

Regenerating v4.3's locus from v4.1 + the rule: 660/660 cells match.
Census produced by the rule: tracking 64, operational 56 (L3 §5 states 64 / 56).

## 3 · D_Transform_Cells (132 rows)

| Column | v4.1 → v4.3 | v4.0 → v4.3 |
| --- | --- | --- |
| Cost-state | 0 | 0 |
| Class | 0 | 0 |
| C1 | 0 | 0 |
| Flag | 0 | 0 |
| D1 | 0 | 0 |
| D2 | 0 | 0 |
| D3 | 0 | 0 |
| D4 | 0 | 0 |
| D5 | 0 | 0 |

## 4 · Matrix_360 base cells (360: B 156 · C 144 · D 60)

| Column | v4.1 → v4.3 | v4.0 → v4.3 |
| --- | --- | --- |
| value | 1 | 1 |
| reasoning | 1 | 1 |
| source_anchor | 1 | 1 |
| confidence | 1 | 1 |
| failure_mode | 1 | 1 |
| valence_trajectory | 1 | 1 |
| mode_relation | 1 | 1 |
| state_mechanism | 1 | 1 |
| strain_response | 1 | 1 |
| state_relation | 1 | 1 |

**Matrix_360 value** (1):
- 11 / Hero|D|D4 Acute: [HELD - routes to Research, OD-18] → 30

**Matrix_360 reasoning** (1):
- 11 / Hero|D|D4 Acute: Hero distinguishing substrate = T-status-drive; R5 belief-mediated (not clean control) and → Sudden effort/vigour exhaustion at an internal threshold (Ch4.A5-EXT mode 4). High-effort 

**Matrix_360 source_anchor** (1):
- 11 / Hero|D|D4 Acute: Stage2_BaseD_Structural_v1 F8 (HELD); routes to Research OD-18 → Ch4.A5-EXT mode 4; Le Heron 2018 (doi 10.1093/brain/awy110); HG3 §7 D4 + §11; HG3 §3 Motio

**Matrix_360 confidence** (1):
- 11 / Hero|D|D4 Acute: HELD - underdetermined → band H / placement M

**Matrix_360 failure_mode** (1):
- 11 / Hero|D|D4 Acute: (blank) → drive_depletion (mode 4) — effort-exhaustion at threshold

**Matrix_360 valence_trajectory** (1):
- 11 / Hero|D|D4 Acute: neutral → approach → collapsed-approach (want intact, capacity gone)

**Matrix_360 mode_relation** (1):
- 11 / Hero|D|D4 Acute: (blank) → mode 4; origin-dissociated from mode 5 per ledger #48

**Matrix_360 state_mechanism** (1):
- 11 / Hero|D|D4 Acute: suppressed cost arrives at once — sudden depletion/burnout collapse → allostatic-load discharge; internal threshold; armour-break

**Matrix_360 strain_response** (1):
- 11 / Hero|D|D4 Acute: (blank) → escalates → suppresses → exhausts

**Matrix_360 state_relation** (1):
- 11 / Hero|D|D4 Acute: recruited-by←valence_inversion (LC-NE); 5→4 edge onset at D3→D4 (existing mode_relation; r → D3→D4: sudden; D4→D5: incentive follows effort into depletion

## 5 · Verdict

- Original columns (Direction, Class, C1, Flag, Cost-state): **0 differences** against v4.0 and v4.1 combined.
- Polarity: **0 differences** — v4.3's rebuild against the pre-loss original.
- Sense: **0 differences** — the derivation still lands where it landed at origin.
- Locus: 120 cells changed, **0 of them crossing between value / shape / entry / —**; the rest is the shape split.
- Split reproducibility: 660/660 cells regenerate from v4.1 + the stated rule.
- Base matrix: 10 field differences, all on the single Hero D4 cell (the OD-18 closure).

Amendment this supports on the v4.3 Provenance sheet (human-ratified 2026-09-16; applied to the engine workbook copy):
- `direction` / `class` / `c1` / `flag`: "Recovered" → **confirmed against v4.0 and v4.1 originals**.
- `polarity`: "Reconstructed from the stated rule · high" → **confirmed identical to the pre-loss original**.
- `sense_derived`: still derived, but **identical to the origin derivation** — not a new derivation event.
- `locus`: "RULE-REGENERATED · derived" → **reproducible from v4.1 + the rule, no cell crosses the pre-split grain**; only the tracking/operational assignment inside old `shape` remains unverifiable against the lost v4.2.
- The 660 definition sentences stay lost: no version carries that column.
