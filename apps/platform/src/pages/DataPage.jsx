import React, { memo, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Zap, Home, Radio, Box, Monitor } from 'lucide-react';
import { SciFiButton } from '@gfl/ui';
import { getDeviceInfo } from '@gfl/utils';

/* ===================================================================
   ASSESSMENT GATE (task 4c) — a soft, ritual, one-time funnel (NOT
   security): the student "presents" their assessment (placeholder
   click-through), answers 6 short questions (any answer accepted), and
   unlocks the domain content. Persisted to localStorage for now
   (`assessmentUnlocked`); a backend field replaces it when user accounts
   land. No crypto, no server validation.
   =================================================================== */
const UNLOCK_KEY = 'dw_assessmentUnlocked';

function readUnlocked() {
  try {
    return window.localStorage.getItem(UNLOCK_KEY) === 'true';
  } catch (e) {
    return false;
  }
}
function persistUnlocked() {
  try {
    window.localStorage.setItem(UNLOCK_KEY, 'true');
  } catch (e) { /* private mode / disabled storage — funnel only, ignore */ }
}

// Placeholder personalized-template questions (any answer accepted).
const GATE_QUESTIONS = [
  { q: 'Which pull brought you to the lattice?', a: ['A question I cannot drop', 'A pattern I keep seeing', 'A name I was given', 'I am not yet sure'] },
  { q: 'When a system resists you, you first…', a: ['Map its edges', 'Sit with the friction', 'Look for the hidden symmetry', 'Ask who built it'] },
  { q: 'Your assessment named a dominant layer. You read it as…', a: ['A mirror', 'A starting coordinate', 'A provocation', 'A coincidence'] },
  { q: 'Knowledge feels most true to you when it is…', a: ['Measurable', 'Lived', 'Inherited', 'Contradicted and survives'] },
  { q: 'The six domains relate to each other like…', a: ['Facets of one stone', 'Rooms in one house', 'Notes in one chord', 'Rival maps of one terrain'] },
  { q: 'You intend to leave this place with…', a: ['A method', 'A question sharpened', 'A discipline to study', 'Something I cannot name yet'] },
];

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

/* -- Assessment gate flow: upload ritual -> 6 questions -> unlock -- */
function GateFlow({ domain, onComplete, onCancel }) {
  const [phase, setPhase] = useState('upload'); // 'upload' | 'quiz' | 'granted'
  const [qIndex, setQIndex] = useState(0);
  const total = GATE_QUESTIONS.length;

  const choose = () => {
    if (qIndex + 1 < total) setQIndex((i) => i + 1);
    else setPhase('granted');
  };

  const panelBase = {
    width: '100%', maxWidth: '34rem',
    border: '1px solid rgba(191,0,255,0.6)',
    background: 'rgba(0,0,0,0.7)',
    boxShadow: '0 0 50px rgba(191,0,255,0.4)',
    padding: '2rem', fontFamily: 'monospace', color: '#fff',
    position: 'relative',
  };
  const eyebrow = { fontSize: '10px', letterSpacing: '0.3em', color: '#39FF14', textTransform: 'uppercase' };
  const optBtn = {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '0.75rem 1rem', marginTop: '0.5rem',
    border: '1px solid rgba(191,0,255,0.35)', background: 'rgba(191,0,255,0.05)',
    color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', fontSize: '0.8rem',
    letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.2s',
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 400,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(6px)',
      pointerEvents: 'auto',
    }}>
      <div style={panelBase}>
        {/* close */}
        <button onClick={onCancel} aria-label="Cancel" style={{
          position: 'absolute', top: '0.75rem', right: '0.75rem',
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
          fontFamily: 'monospace', fontSize: '0.9rem', cursor: 'pointer',
        }}>[ X ]</button>

        {phase === 'upload' && (
          <>
            <div style={eyebrow}>Access_Ritual // Step 1 of 2</div>
            <h2 style={{ fontSize: '1.25rem', letterSpacing: '0.1em', color: '#BF00FF', textTransform: 'uppercase', margin: '0.5rem 0 1rem' }}>
              Present your assessment
            </h2>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em' }}>
              The lattice opens to those who have mapped themselves first. Present
              your Deltawerken assessment to continue. (Placeholder — no file is
              read or stored; this is a threshold, not a checkpoint.)
            </p>
            <div style={{
              marginTop: '1.25rem', padding: '1.5rem', textAlign: 'center',
              border: '1px dashed rgba(57,255,20,0.4)', background: 'rgba(57,255,20,0.04)',
              color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.1em',
            }}>
              [ DROP_ZONE // ASSESSMENT.PDF ]
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <SciFiButton onClick={() => setPhase('quiz')} variant="purple" size="sm">
                PRESENT_DOCUMENT
              </SciFiButton>
            </div>
          </>
        )}

        {phase === 'quiz' && (
          <>
            <div style={eyebrow}>Attunement // Step 2 of 2 · {qIndex + 1}/{total}</div>
            <h2 style={{ fontSize: '1.1rem', letterSpacing: '0.06em', color: '#BF00FF', margin: '0.6rem 0 1rem', lineHeight: 1.5 }}>
              {GATE_QUESTIONS[qIndex].q}
            </h2>
            <div>
              {GATE_QUESTIONS[qIndex].a.map((opt) => (
                <button
                  key={opt}
                  style={optBtn}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(191,0,255,0.18)'; e.currentTarget.style.borderColor = '#39FF14'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(191,0,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(191,0,255,0.35)'; }}
                  onClick={choose}
                >
                  &gt; {opt}
                </button>
              ))}
            </div>
            {/* progress pips */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
              {GATE_QUESTIONS.map((_, i) => (
                <div key={i} style={{
                  width: '0.5rem', height: '0.5rem', borderRadius: '50%',
                  background: i < qIndex ? '#39FF14' : i === qIndex ? '#BF00FF' : 'rgba(255,255,255,0.15)',
                  boxShadow: i <= qIndex ? '0 0 6px currentColor' : 'none',
                }} />
              ))}
            </div>
          </>
        )}

        {phase === 'granted' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ ...eyebrow, color: '#39FF14' }}>Access_Granted</div>
            <h2 style={{ fontSize: '1.4rem', letterSpacing: '0.12em', color: '#39FF14', textTransform: 'uppercase', margin: '0.75rem 0', textShadow: '0 0 16px rgba(57,255,20,0.6)' }}>
              The lattice opens
            </h2>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', maxWidth: '24rem', margin: '0 auto' }}>
              All six domains are now reachable. This threshold is crossed once.
            </p>
            <div style={{ marginTop: '1.75rem' }}>
              <SciFiButton onClick={onComplete} variant="purple" size="sm">
                ENTER // {domain ? domain.title : 'CORE'}
              </SciFiButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -- Unlock badge: small lit cube, shown post-unlock (reads the flag). -- */
const Badge = memo(() => (
  <div style={{
    position: 'absolute', bottom: '2rem', right: '1.5rem', zIndex: 200,
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.4rem 0.75rem', pointerEvents: 'none',
    border: '1px solid rgba(57,255,20,0.5)', background: 'rgba(57,255,20,0.08)',
    boxShadow: '0 0 14px rgba(57,255,20,0.3)',
    fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.25em',
    color: '#39FF14', textTransform: 'uppercase',
  }}>
    <Box size={12} style={{ animation: 'dwPulse 2.5s infinite' }} />
    Lattice_Unlocked
  </div>
));
Badge.displayName = 'Badge';

/* -- Main DataPage -- */
const DataPage = memo(({ isVisible, onBack }) => {
  // Hypercube is desktop-only by design (task 5) — no touch port. Mobile/tablet
  // get a styled card instead of the WebGL scene. UA-based, stable for the session.
  const [mobileBlocked] = useState(() => {
    const d = getDeviceInfo();
    return d.isMobile || d.isTablet;
  });
  const [hasWebGL, setHasWebGL] = useState(null);
  const [isInside, setIsInside] = useState(false);
  // The domain whose overlay is open (task 4b). Non-null = cube paused.
  const [activeDomain, setActiveDomain] = useState(null);
  // Assessment gate (task 4c): one-time unlock, persisted to localStorage.
  const [unlocked, setUnlocked] = useState(readUnlocked);
  const [gateDomain, setGateDomain] = useState(null); // domain that triggered the gate
  const paused = !!activeDomain || !!gateDomain;

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());
  }, []);

  // Leaving the section exits the interior so pointer lock releases
  // and the next visit starts from the void view; close any open overlay.
  useEffect(() => {
    if (!isVisible) {
      if (isInside) setIsInside(false);
      if (activeDomain) setActiveDomain(null);
      if (gateDomain) setGateDomain(null);
    }
  }, [isVisible, isInside, activeDomain, gateDomain]);

  // Face select: unlocked -> open the domain; locked -> run the gate first.
  const handleSelectDomain = useCallback((domain) => {
    if (readUnlocked()) setActiveDomain(domain);
    else setGateDomain(domain);
  }, []);

  const completeGate = useCallback(() => {
    persistUnlocked();
    setUnlocked(true);
    setActiveDomain(gateDomain); // open the domain that triggered the gate
    setGateDomain(null);
  }, [gateDomain]);

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

      {/* Desktop-only card (task 5) — mobile/tablet do not mount the scene. */}
      {mobileBlocked && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center', gap: '1.25rem',
        }}>
          <Monitor size={40} color="#BF00FF" style={{ animation: 'dwPulse 2.5s infinite' }} />
          <div style={{ fontFamily: 'monospace', color: '#39FF14', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.25em' }}>
            [ DESKTOP_REQUIRED ]
          </div>
          <div style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', maxWidth: '26rem', lineHeight: 1.7, letterSpacing: '0.04em' }}>
            The Deltawerken hypercube is a desktop experience — it needs a pointer and
            keyboard to navigate the 4D lattice. Return on a desktop browser to enter.
          </div>
        </div>
      )}

      {/* WebGL unavailable fallback (desktop only) */}
      {!mobileBlocked && hasWebGL === false && (
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
      {!mobileBlocked && hasWebGL && (
        <Suspense fallback={null}>
          <HypercubeScene
            isVisible={isVisible}
            isInside={isInside}
            paused={paused}
            onEnter={() => setIsInside(true)}
            onExitInside={() => {
              // DISCONNECT is authoritative: leave the interior AND close any open
              // domain/gate overlay so it always lands straight back on the overview.
              setIsInside(false);
              setActiveDomain(null);
              setGateDomain(null);
            }}
            onSelectDomain={() => { /* content access disabled for now — only DISCONNECT works inside */ }}
          />
        </Suspense>
      )}

      {/* (Return-to-Deltawerken button removed — the global nav "← Terug" handles going back.) */}

      {/* Exit toggle — only while inside (entry is now the in-cube INITIALIZE button).
          Kept as a reliable HUD way out alongside the in-world DISCONNECT. */}
      {!mobileBlocked && isInside && (
      <div style={{ position: 'absolute', top: '9.5rem', right: '1.5rem', zIndex: 200 }}>
        <button
          onClick={() => { setIsInside(false); setActiveDomain(null); setGateDomain(null); }}
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
      )}

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

      {/* Assessment gate (task 4c) — shown before first domain access. */}
      {gateDomain && (
        <GateFlow
          domain={gateDomain}
          onComplete={completeGate}
          onCancel={() => setGateDomain(null)}
        />
      )}

      {/* Unlock badge — corner indicator once the lattice is open. */}
      {isInside && unlocked && <Badge />}

      {/* Domain overlay (task 4b) — 2D modal over the paused cube, gated by 4c. */}
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

    </div>
  );
});

DataPage.displayName = 'DataPage';

export default DataPage;
