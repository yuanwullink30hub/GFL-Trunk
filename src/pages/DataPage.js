import React, { memo, useState, useEffect, lazy, Suspense } from 'react';
import { Zap, Home, Radio } from 'lucide-react';
import { SciFiButton } from '../components/assessment/dashboardStyles';

// App.js (line ~38) imports these synchronously; they live in DataPage.shared.js
// to stay off this module's lazy three.js graph. Re-exported here for any
// existing `from './pages/DataPage'` consumers.
export { useCelestialState, CelestialBehindLayer } from './DataPage.shared';

// Heavy scene (three / fiber / drei / postprocessing) stays behind a
// lazy boundary: App.js synchronously imports the stubs below, which
// would otherwise drag three.js into the main chunk.
const HypercubeScene = lazy(() => import('../webgl/HypercubeScene'));

/* Inline (instead of importing from HyperCube.js, which imports three) */
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/* ===================================================================
   DATA PAGE - the Deltawerken hypercube.

   Replaces the previous 9-planet celestial orbit view with a single
   4D tesseract (see src/webgl/HyperCube.js for the scene internals
   and porting notes). One WebGL context, full disposal, frameloop
   gated on visibility, rendered TRANSPARENT over the platform nebula.

   Interaction: WARP_INSIDE flies the camera to the cube's center;
   the tesseract settles its 4D rotation to a 90deg snap point and
   expands into a room around the camera. Pointer lock gives FPS
   look-around inside. DISCONNECT (in-scene holographic button) or
   EXIT_INTERIOR returns to the void view.

   The domain-content layer (six faces = six science domains, the
   assessment-gated unlock flow) is the next build phase - see
   DEV_PATHGUIDE.md. This file deliberately keeps the page shell
   minimal so that phase has a clean surface to build on.
   =================================================================== */

/* -- Inline keyframes for the HUD (codebase is inline-styles; these two
   animations are the only CSS the page needs) -- */
const HUD_KEYFRAMES = `
@keyframes dwPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes dwPing { 75%, 100% { transform: scale(2); opacity: 0; } }
`;

/* -- Main DataPage -- */
const DataPage = memo(({ isVisible, onBack }) => {
  const [hasWebGL, setHasWebGL] = useState(null);
  const [isInside, setIsInside] = useState(false);
  // The domain whose overlay is open (task 4b). Non-null = cube paused.
  const [activeDomain, setActiveDomain] = useState(null);
  const paused = !!activeDomain;

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  // Leaving the section exits the interior so pointer lock releases
  // and the next visit starts from the void view; close any open overlay.
  useEffect(() => {
    if (!isVisible) {
      if (isInside) setIsInside(false);
      if (activeDomain) setActiveDomain(null);
    }
  }, [isVisible, isInside, activeDomain]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <style>{HUD_KEYFRAMES}</style>

      {/* WebGL unavailable fallback */}
      {hasWebGL === false && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'monospace', color: '#39FF14', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
            [CRITICAL_FAILURE] // GPU_CONTEXT_UNAVAILABLE
          </div>
          <div style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', maxWidth: '28rem', lineHeight: 1.6 }}>
            Hardware acceleration is required to reconstruct this 3D coordinate set.
            Please verify WebGL support in your browser settings.
          </div>
        </div>
      )}

      {/* The hypercube - lazy scene, see src/webgl/HypercubeScene.js */}
      {hasWebGL && (
        <Suspense fallback={null}>
          <HypercubeScene
            isVisible={isVisible}
            isInside={isInside}
            paused={paused}
            onExitInside={() => setIsInside(false)}
            onSelectDomain={setActiveDomain}
          />
        </Suspense>
      )}

      {/* Return to Deltawerken - top-right, below TimeSync (kept from
          the previous DataPage so section navigation is unchanged) */}
      <div style={{ position: 'absolute', top: '6rem', right: '1.5rem', zIndex: 200, pointerEvents: isVisible ? 'auto' : 'none' }}>
        <SciFiButton onClick={onBack} variant="purple" size="sm">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            DELTAWERKEN
          </span>
        </SciFiButton>
      </div>

      {/* Warp toggle - below the Deltawerken button */}
      <div style={{ position: 'absolute', top: '9.5rem', right: '1.5rem', zIndex: 200 }}>
        <button
          onClick={() => setIsInside(!isInside)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1.5rem',
            fontFamily: 'monospace', fontSize: '0.7rem',
            letterSpacing: '-0.02em', textTransform: 'uppercase',
            border: `1px solid ${isInside ? '#BF00FF' : '#39FF14'}`,
            background: isInside ? 'rgba(191,0,255,0.1)' : 'rgba(57,255,20,0.1)',
            color: isInside ? '#BF00FF' : '#39FF14',
            boxShadow: isInside ? '0 0 20px rgba(191,0,255,0.3)' : '0 0 20px rgba(57,255,20,0.3)',
            transition: 'all 0.5s',
            cursor: 'pointer',
          }}
        >
          {isInside ? (
            <>
              <Home size={14} style={{ animation: 'dwPulse 2s infinite' }} />
              <span>Exit_Interior // Return_to_Void</span>
            </>
          ) : (
            <>
              <Zap size={14} style={{ animation: 'dwPulse 2s infinite' }} />
              <span>Warp_Inside // Explore_Center</span>
            </>
          )}
        </button>
      </div>

      {/* Interior HUD — hidden while a domain overlay is open */}
      {isInside && !activeDomain && (
        <>
          {/* Crosshair */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: '2px', height: '1rem', background: '#BF00FF', opacity: 0.5 }} />
              <div style={{ position: 'absolute', width: '1rem', height: '2px', background: '#BF00FF', opacity: 0.5 }} />
              <div style={{ width: '4px', height: '4px', background: '#39FF14', borderRadius: '50%', boxShadow: '0 0 5px #39FF14' }} />
              <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(191,0,255,0.2)', borderRadius: '50%', animation: 'dwPing 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
            </div>
          </div>

          {/* Frame + status */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            borderLeft: '4px solid rgba(191,0,255,0.2)',
            borderRight: '4px solid rgba(191,0,255,0.2)',
            borderTop: '4px solid rgba(191,0,255,0.2)',
          }}>
            <div style={{ position: 'absolute', top: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '10px', fontFamily: 'monospace', color: '#BF00FF', letterSpacing: '0.3em' }}>
                <Radio size={12} style={{ animation: 'dwPing 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                CORE_SYNCHRONIZED // FPS_LOOK_ACTIVE
              </div>
              <div style={{ fontSize: '8px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                [ ESC ] to Unlock Cursor
              </div>
            </div>
          </div>
        </>
      )}

      {/* Domain overlay (task 4b) — 2D modal over the paused cube. The
          assessment gate (task 4c) will wrap access to this. */}
      {activeDomain && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 300,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem',
          background: 'rgba(5,5,5,0.55)', backdropFilter: 'blur(4px)',
          pointerEvents: 'auto',
        }}>
          <div style={{
            width: '100%', maxWidth: '40rem',
            border: '1px solid rgba(191,0,255,0.6)',
            background: 'rgba(0,0,0,0.6)',
            boxShadow: '0 0 40px rgba(191,0,255,0.35)',
            padding: '2rem',
            fontFamily: 'monospace', color: '#fff',
          }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#39FF14', textTransform: 'uppercase' }}>
              {activeDomain.code} // Domain_Access
            </div>
            <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.1em', color: '#BF00FF', textTransform: 'uppercase', margin: '0.5rem 0 1.25rem' }}>
              {activeDomain.title}
            </h2>
            <div style={{
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.03)',
              padding: '1.5rem', minHeight: '8rem',
              fontSize: '0.85rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.55)',
              letterSpacing: '0.05em',
            }}>
              [ PLACEHOLDER ] // Domain content for {activeDomain.title} will be
              populated in a later phase. This panel is the surface the assessment
              gate (DEV_PATHGUIDE task 4c) unlocks.
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <SciFiButton onClick={() => setActiveDomain(null)} variant="purple" size="sm">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '0.875rem', height: '0.875rem' }}>
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  BACK_TO_CORE
                </span>
              </SciFiButton>
            </div>
          </div>
        </div>
      )}

      {/* Technical data overlay */}
      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', pointerEvents: 'none', opacity: 0.4 }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Reconstruction_Active // Nested_Geometric_Array // Deltawerken.Hypercube
        </div>
      </div>
    </div>
  );
});

DataPage.displayName = 'DataPage';

export default DataPage;
