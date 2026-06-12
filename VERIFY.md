# VERIFY.md — human-eyes checklist (owner away)

Per DEV_PATHGUIDE: visual/interaction checks that cannot be verified headlessly
are logged here instead of blocking the queue. Append per task.

---

## Foundation landing — hypercube replaces DataPage, transparent over nebula
**Branch:** `feat/hypercube-datapage` · **Build:** green (only `@mediapipe` sourcemap warning) · main chunk 99.53 kB

Sessions 1–2 were never committed to `main` (main was the original 9-planet
DataPage). The hypercube was landed fresh from the cumulative patch + TubeCube
source, down-ported to GFL's stack (fiber 8.15 / drei 9.96 / three 0.160 / inline
styles). Per owner: it is a single component replacing the DataPage inner content,
rendered **transparent over the platform nebula** — the old `#050505` void is gone.

### Needs owner eyes
1. ~~**Transparency over nebula (HIGH RISK).**~~ **CONFIRMED by owner 2026-06-12:**
   hypercube renders correctly (transparent over nebula — bloom did not force an
   opaque background). No fix needed.
2. **Bloom over nebula.** Glow reads correctly, no dark rectangle around the scene.
   (Implied OK by #1; left for a closer look.)
3. **gridHelper floor.** Dark lines (`#222`/`#080808`) over the colourful nebula —
   keep, dim further, or drop? Aesthetic call.
4. ~~**Warp flow.**~~ **CONFIRMED by owner 2026-06-12:** the 3D→2D / warp movement
   works (fly-in, snap, expansion). Pointer-lock / DISCONNECT / Exit details still
   worth a closer pass but the core interaction is good.
5. **Section exit.** `DELTAWERKEN` back button leaves the section and the frameloop
   stops (GPU usage drops — check Task Manager / about:gpu). `isInside` resets so
   the next visit starts from the void view.
6. **Environment HDR.** `<Environment preset="night" />` still fetches from the
   pmndrs CDN at runtime — metallic tube reflections should read. (DEV_PATHGUIDE
   task 6 localizes this to `public/hdr/`.)
7. **Dev HMR soak.** Save ~5 files in succession with the DataPage open → zero
   `Error creating WebGL context` (the historical 9-canvas bug; if it reappears a
   disposal path regressed).
8. **WebGL-unavailable fallback.** The `[CRITICAL_FAILURE]` card renders when WebGL
   is missing.

### Notes
- `@react-three/postprocessing` pinned to **2.16.2** + `postprocessing` **6.36.4**:
  v2 is the fiber-8 line, and 6.37+ requires three ≥0.168 (we're on 0.160). Do not
  bump either while on fiber 8 / three 0.160.
- `useCelestialState` / `CelestialBehindLayer` remain exported from DataPage as
  stubs because `App.js:38` imports them synchronously (DEV_PATHGUIDE task 3).
- `HoloPlanet.js` is now unused by DataPage (retired pending owner decision —
  DEV_PATHGUIDE task 2); not deleted.

---

## Task 3 — close App.js sync-import leak + lazy NebulaBackground (`refactor(app)`)
**Build:** green · main chunk **81.36 kB** (was 99.53 — NebulaBackground split out of main, −18 kB)

- Stubs moved to `src/pages/DataPage.shared.js`; `App.js:38` imports from there;
  `DataPage.js` re-exports for compat. Heavy three.js graph stays fully lazy.
- `NebulaBackground` is now `lazy()` + wrapped in its own `<Suspense fallback={null}>`
  at the mount (it sits above the main Suspense boundary).

### Needs owner eyes
1. **Loading sequence intact.** `NebulaBackground` now loads as a separate chunk.
   It still only mounts when `mountNebula` is true (after chunks load, and
   `preloadAll` warms it), and its `onReady` still ends the loading screen.
   Confirm the landing still fades from the loading overlay to the nebula with no
   extra blank flash. Low risk, but it touches the load choreography.

---

## Task 4a — interior face-targeting (`feat(hypercube)`)
**Build:** green · main chunk unchanged (code is in the lazy scene chunk)

Six domains modelled in `DOMAINS` (src/webgl/HyperCube.js), one per cube axis:
+X Psychologie & Neurobiologie, −X Filosofie, +Y Symbolische Tradities,
−Y Chemie·Alchemie·Epigenetica, +Z Natuurkunde & Informatietheorie,
−Z Astronomie & Astrologie. `FaceTargets` finds the aimed face each frame
(camera-forward · axis, max dot) and shows that domain's label at its face.

No `hypercube-prototype.html` exists (confirmed by owner) — visual language is
the existing DataPage HUD aesthetic, designed here.

### Needs owner eyes
1. **Targeting feel.** Inside, as you mouse-look, the floating `[ DOM-0x //
   TARGET_LOCKED ]` label should update to whichever face you face. Only the
   targeted face's label shows (deliberate — avoids behind-camera clutter).
2. **Floor/ceiling domains.** ±Y faces are floor (Chemie) and ceiling
   (Symbolische Tradities) — reachable via pitch (clamped ~±85°). Confirm they're
   targetable and the label reads OK when looking up/down. If floor/ceiling feels
   wrong for a domain, the axis→domain mapping in `DOMAINS` is trivial to reorder.
3. **Timing.** Label currently appears as soon as `isInside` (during fly-in), not
   only after full expansion. If it reads as premature, gate it on expansion.
4. **Axis↔domain mapping** is a first pass — reorder freely if you have a preferred
   spatial layout (e.g. astro on ceiling).

---

## Task 4b — domain overlay + pause (`feat(hypercube)`)
**Build:** green · main chunk unchanged

Click a targeted face (while pointer-locked) → opens a 2D modal for that domain,
pauses the cube, and releases pointer lock so the cursor reaches the modal. A
`paused` flag is threaded into `HyperCube` (freezes the tesseract), `CameraRig`
(releases lock, freezes look), and `FaceTargets` (hides label, ignores clicks).
`BACK_TO_CORE` closes it and re-engages.

### Needs owner eyes
1. **Select → overlay.** Inside + locked, a left-click opens the targeted domain's
   modal; cube + look freeze; the cursor reappears over the modal.
2. **Re-lock after Back (timing risk).** Closing re-requests pointer lock from the
   Back-button gesture. Browsers can reject `requestPointerLock` if it's too far
   from a user gesture — if look doesn't resume automatically, a single click on
   the scene re-locks (fallback wired in `FaceTargets`). Confirm which happens.
3. **Modal aesthetic.** Inline-styled, monospace, `#BF00FF`/`#39FF14`, placeholder
   body. Matches the HUD; tune later.
4. **First click vs select.** When not locked, the first scene click re-engages FPS
   look (does not select); the next click selects. Confirm that two-stage feel is OK.

---

## Task 4c — assessment gate flow + unlock badge (`feat(hypercube)`)
**Build:** green · main chunk unchanged

Selecting a domain while **locked** runs the gate first: upload-ritual placeholder
(`PRESENT_DOCUMENT`) → 6 single-select questions (any answer accepted) with
progress pips → `ACCESS_GRANTED` celebration → `ENTER`. On complete, persists
`dw_assessmentUnlocked=true` to localStorage, then opens the domain that triggered
it. Subsequent selects skip the gate. A `Lattice_Unlocked` badge (lit cube) shows
in the corner once unlocked. Gate also pauses the cube (via `paused`).

### Needs owner eyes
1. **Full funnel.** First domain click → gate appears, cube + look freeze, cursor
   free. Walk upload → 6 questions → granted → enter; the triggering domain's
   overlay opens afterward.
2. **Persistence.** Reload the page → still unlocked (badge present, no gate on
   next access). localStorage key `dw_assessmentUnlocked`; a backend field replaces
   it when user accounts land.
3. **Cancel.** `[ X ]` closes the gate without unlocking; cube resumes.
4. **Copy.** The 6 questions + ritual text are placeholder "personalized-template"
   prose I wrote — replace with the real templates when ready.
5. **Pre-unlock teaser.** Face labels (4a) still show before unlock as a teaser;
   only *content access* is gated. DEV_PATHGUIDE mentions "outer-cube content fades
   in on unlock" — if you want the labels hidden until unlocked too, that's a small
   gate on `FaceTargets`. Flagged, not done.

### To reset while testing
`localStorage.removeItem('dw_assessmentUnlocked')` in the console, then reload.

