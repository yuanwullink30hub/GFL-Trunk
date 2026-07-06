# LC_ORB3_ Migration Plan — 2D → 3D orb, authored+traced lever engine

**Status:** developer plan, drafted against `orb_engine_spec_and_config_v1.md`,
`orb_lever_derivation_map_v1.md`, `archetype_relations_table_v1.md` (all "v3 sketch, never-lock").
Nothing here ships a locked value — every scalar inherits the deferred-runtime class.
**This plan changes the ENGINE architecture; it does not lock any scalar.**

---

## 0 · The headline change (why this isn't "+1 lever")

Our current `LC_ORB2_` engine (`packages/orb-engine/index.js`) stores a per-archetype `CANON`
value for all 11 levers and **blends them by weight** (`resolveOrb`). The v1.0 spec **forbids
that** for the traced levers: "storing a per-archetype value would freeze a runtime quantity
into a prior — the subset-as-calibration pattern, forbidden." Under v1.0 the levers split:

- **Authored levers** — keep a per-archetype/per-group aesthetic value (as today).
- **Traced levers** — RUNTIME-COMPUTED from emitted geometry (top-3, `polar_norm`, edges,
  composed-B/D). They read **baseline/zero for a lone archetype** by design.

So `nematicTension`, `birefringence`, `chiralPitch`, `cymaticMode` **move from authored-blend
to traced-compute**, and new traced levers appear (**Depth/affect-amplitude**, **friction**,
**harmony**, **cymatic ℓ/direction**). The `LC_ORB2_` path stays intact for back-compat; `LC_ORB3_`
is a new, additive code path.

---

## 1 · The 9-lever v3 set → source, status, backend input

| Lever | Class | Derivation (spec) | Status | Backend input (exists?) |
|---|---|---|---|---|
| **Radial** (surface↔depth) | traced | `ORIENT[group]` sign; magnitude `polar_norm`-gated | ratified form | ✅ `ORIENT` (have), `polarNorm` (cMagnitude) |
| **Breaking** (iridescence) | traced | `= polar_norm` | ratify (§5.1) | ✅ `cMagnitude.polarNorm` |
| **Tension** (turbulence) | traced | `(D2+D3) share of composed D-state`; shape ← R-cost-curve | ratify (§5.2) | ✅ `cRuntime.composed_D_state` |
| **Colour-friction** (radial↔fractal) | traced | red-in-top3 (0/1) × eased `B/A` proportion | form settled | ✅ `connectionMatrix.edgeToMain` + top-3 weights |
| **Harmony** (mandalas) | traced | Σ green/blue/purple instances (hyperlink=2; purple ×(1−polar_norm)) · w[a]·w[b] | form settled | ✅ `connectionMatrix` (+ hyperlink rule), weights |
| **Cymatic m, ℓ, direction** | traced | m = Main wheel-pos; ℓ = distinct groups in top-3; dir ← dispersion | proposed (§5.5) | ✅ positions map, top-3 groups, weight spread |
| **Depth / affect-amplitude** | traced | signed `limbic_pole_load(top3) − dmn_pole_load(top3)` | NEW; group-preset now, individual-deferred | ⚠️ needs pole→B-function map (confirm in Matrix) |
| **Density** (faceting+brightness) | authored | authored per group; PROPOSED trace = Nature/Authenticity | authored now (§5.3 open) | ✅ authored; Nature score available if traced |
| **Displacement** (topology amplitude) | authored* | authored floor 0.13; PROPOSED trace = Main Core-share | authored now (§5.4 open) | ✅ authored; Core-share available if traced |
| **Rotation** (spin) | authored | NO canon anchor — stays authored | confirm authored (§5.7) | ✅ authored |
| **Pulse-rate** (affective tempo) | group-preset | cost-curve tempo of the **x1.2 accumulative winner** (not palette group) | preset | ✅ compute from top-3 group sums |

Naming collision to resolve (§7.4): **topology-amplitude = "Displacement"**, **affect-amplitude
= "Depth"**. The v3 engine must use these disambiguated names.

---

## 2 · What already exists to build on (no new derivation needed)

The Stage-2.2 backend is most of the substrate:
- `connectionMatrix.js` — full 12×5 edge table + `edgeToMain`/`edgesForMain` (matches
  `archetype_relations_table_v1.md` exactly, incl. hyperlink precedence and red-sign). Feeds
  **friction** + **harmony**.
- `cMagnitude.js` — `polarNorm` (provisional denom 100), `gatePolar` (1−polar_norm),
  `composeDState`. Feeds **breaking**, **tension**, purple-gate in **harmony**, **radial** magnitude.
- `cRuntime.js` — assembles `geo` (main/support/shadow weights + per-archetype baskets) and
  returns `composed_D_state`, `polar_norm`. The single call site already runs in `ai.js`.
- `ai.js` promptData — carries `archetypeDetails`, `totalNaturePoints`, `totalCulturePoints`,
  `authenticityIndex`, `polarizationIndex`, shadow/support keys. Feeds **density**/**displacement**
  (if their Nature/Core-share traces get ratified) and the **top-3** ordering.
- Wheel positions + groups: from the relations-table JSON (`positions`, `groups`).

**Gap to confirm:** the composed **B-profile** (13 functions) and the **limbic-pole / DMN-pole**
function grouping that **Depth** needs. `cMagnitude` composes D-state; verify a composed-B read is
emitted (Q7) and locate the pole→function map before implementing Depth beyond a group-preset stub.

---

## 3 · Target data flow

```
assessment → bleed engine → 12-arc geometry → matrix engine (cRuntime: composed B/D, polar_norm)
   → orbEngineV3(geometry)  [NEW: authored levers + traced levers from the substrate above]
   → LC_ORB3_ code  (generative vs snapshot — DEFERRED, §5)
   → printed on PDF
   → client 3D renderer (orb_3d_prototype.html port) decodes + renders
```

Same site as today: author the code in `ai.js` right after `computeCRuntime` (the `geo` with
weights + `polar_norm` is already there). `orbEngineV3` lives in `packages/orb-engine` beside the
v2 engine; the v2 path is untouched.

---

## 4 · Files to add / change

**Shared engine (`packages/orb-engine/`)**
- `orbEngineV3.js` (new): authored lever tables (density, displacement, rotation, per-group
  pulse presets) + traced-lever functions (radial, breaking, tension, friction, harmony,
  cymatic, depth) consuming `{ top3, weights, edges, composedD, composedB, polarNorm, nature }`.
- `edges.js` (new): port the relations-table JSON (or re-export from a backend-shared copy) —
  green/blue/purple/red pairs, red_sign, hyperlink pairs, positions, groups.
- `dnaV3.js` (new): `encodeDNAv3` / `decodeDNAv3` for `LC_ORB3_<version>_<vector-b64>`. Class
  (snapshot vs generative) **deferred** — build the codec so either can slot in.
- `index.js`: export the v3 surface alongside v2 (both `LC_ORB2_` and `LC_ORB3_` decode).

**Backend (`apps/backend/`)**
- `routes/ai.js`: after `computeCRuntime`, call `orbCodeFromGeometryV3(...)` and add
  `orbCode3` (or replace `orbCode`) in the SSE `result`. Keep `orbCode` (v2) until the 3D
  renderer ships, so PDFs stay decodable during the transition.

**Client (`apps/platform/src/orb/`)**
- Port `orb_3d_prototype.html` → an `<OrbSphere3D>` (Three.js — already a dep) reading the v3
  lever vector. **BLOCKED: `orb_3d_prototype.html` is not in the repo or Downloads** (likely the
  claude.ai Google Drive connector, which is unauthorized in this session). Needed before the
  render side can be built.
- Consumer swap in `AssessmentResultsModal.jsx` (same `orbCodeRef` bridge as v2).

---

## 5 · Ratification gates (block full lock — from derivation-map §5)

Cannot finalize values until you ratify:
1. Breaking = `polar_norm` (strongest match).
2. Tension = composed D2+D3 strain share.
3. Faceting/Density = Nature-dominance (interpretive binding) — or keep authored.
4. Displacement = Main Core-share — or another quantity (authored floor holds meanwhile).
5. Cymatic absolutes: m = Main position, ℓ = group-count — ratify/amend/hold.
6. Brightness = composed D1 (accepting anti-correlation with tension) — or keep authored.
7. Rotation stays authored (no anchor) — confirm.
8. **DNA class: snapshot vs generative — DEFERRED by you** (decide before codes go on PDFs;
   generative is the spec recommendation so codes survive later scalar calibration).

## 6 · Deferred runtime scalars (Research owns; ship provisional + flag)

`polar_norm` normalisation (currently `POLAR_SCALE=100`), Blue half-weight (0.5), Yellow
culture-ratio, dispersion→direction threshold, friction floor/ease constants, pulse x1.2
dead-band. All codes emitted pre-calibration are **pre-calibration; re-generation required**
(generative DNA makes this a re-render, not a re-issue — another reason to prefer it).

## 7 · Staged forks the engine must carry (do NOT collapse)

- **F1** Seeker↔Relational red (pairs 2-5, 3-4) = coupling-to-restore, **sign state-conditional
  at runtime**, never hardcoded (GANE-trap). `cMagnitude` already refuses (`σ=null`) on
  `LOST_COUPLING`. Friction on a Seeker+Relational top-3 is staged-conditional — carry both
  readings until the Phase-2 GEO-2L gate.
- **Purple** shadow-reading is GEO-2L staged; the N+6 geometry is stable either way.

## 8 · Phasing (what's buildable now vs blocked)

- **Phase A (buildable now, no new canon):** `orbEngineV3` traced-lever functions for radial,
  breaking, tension, friction, harmony, cymatic — all inputs already exist server-side. Wire a
  `LC_ORB3_` codec (class-agnostic). Unit-test against the anchoring/sign/edge cases. All values
  flagged provisional/pre-calibration.
- **Phase B (needs confirmation):** Depth lever — confirm the composed-B pole→function map;
  ship group-preset stub until then. Density/Displacement traces — build only if §5.3/§5.4 ratify.
- **Phase C (blocked):** 3D renderer port — needs `orb_3d_prototype.html` (fetch from Google
  Drive after authorizing the connector).
- **Phase D:** flip `ai.js`/PDF/consumer to `LC_ORB3_`; keep `LC_ORB2_` decodable. Back-compat:
  `decodeDNA` already handles `LC_ORB_` + `LC_ORB2_`; add `LC_ORB3_`.

---

## 9 · Back-compat & risk

- `LC_ORB_`, `LC_ORB2_`, `LC_ORB3_` all decode (versioned prefix). Old PDFs/logins keep working.
- The 2D engine (`resolveOrb`/`encodeDNA`) is untouched — v3 is additive, so nothing regresses if
  Phase C stalls.
- Biggest risk is the authored→traced philosophical shift: once v3 is the emitted code, the orb's
  non-authored levers reflect *composition*, not a stored per-archetype look — intended, but it
  means the single-archetype "template" orbs (our `PRESETS`) are authored illustrations only, not
  engine output. Keep that boundary explicit.
