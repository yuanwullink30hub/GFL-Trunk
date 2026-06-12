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
1. **Transparency over nebula (HIGH RISK).** The canvas is `alpha:true` + 0-alpha
   clear, but `@react-three/postprocessing` `EffectComposer`/`Bloom` can force an
   opaque background, which would show the tesseract on black instead of the
   nebula. Confirm the nebula is visible behind the cube. If it's black, the bloom
   pass is clearing opaque — flag and we'll switch the composer to preserve alpha
   (or move bloom to a selective pass).
2. **Bloom over nebula.** Glow reads correctly, no dark rectangle around the scene.
3. **gridHelper floor.** Dark lines (`#222`/`#080808`) over the colourful nebula —
   keep, dim further, or drop? Aesthetic call.
4. **Warp flow.** `Warp_Inside` flies to centre → 4D rotation snaps to 90° → cube
   expands into a room; pointer lock engages (mouse-look); `ESC` releases; in-scene
   `[ DISCONNECT ]` and the HUD `Exit_Interior` button both return to void.
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
