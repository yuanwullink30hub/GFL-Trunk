import { memo, useMemo } from 'react';

/* ===================================================================
   DATA PAGE - shared lightweight exports.

   App.js imports { useCelestialState, CelestialBehindLayer } synchronously
   (it threads `celestial` into NebulaOverlay and the behind-nebula layer).
   These live here, OFF DataPage.js's module graph, so that sync import does
   not pull DataPage's lazy hypercube scene (three / fiber / drei /
   postprocessing) into the main chunk.

   Both are stubs: the 9-planet celestial view was replaced by the hypercube
   (see src/webgl/HyperCube.js). `isZoomedIn` is now constantly false, so the
   NebulaOverlay zoom prop is inert - the wiring is left intact in App.js in
   case zoom returns with the hypercube domain layer (DEV_PATHGUIDE task 4).
   Remove both when App.js stops importing them.
   =================================================================== */

export function useCelestialState() {
  return useMemo(() => ({
    selectedPlanetId: null,
    isZoomedIn: false,
    hideOriginal: false,
    frozenOrigin: '50% 50%',
    activePlanet: null,
    targetX: '0vw',
    targetY: '0vh',
    entryX: '0vw',
    entryY: '0vh',
    handlePlanetClick: () => {},
    handlePlanetBack: () => {},
  }), []);
}

export const CelestialBehindLayer = memo(() => null);
CelestialBehindLayer.displayName = 'CelestialBehindLayer';
