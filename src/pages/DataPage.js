import React, { memo, useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { SciFiButton } from '../components/assessment/dashboardStyles';
const HoloPlanet = lazy(() => import('../components/orbital/HoloPlanet'));

/* ═══════════════════════════════════════════════════════════════════
   CELESTIAL BODIES — 9 planets/stars, viewport-relative positions
   ═══════════════════════════════════════════════════════════════════ */
const PLANETS = [
  { id: 2, name: 'DELTAWERKEN DATA', type: 'moon', size: 13.824, brightness: 1, cx: 'calc(92.29vw - 2rem)', cy: 'calc(13.74vh + 1rem + 3rem)', dur: 18, color: '156, 163, 175', tilt: 15, texture: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 20%), radial-gradient(circle at 70% 60%, rgba(0,0,0,0.3) 0%, transparent 30%), radial-gradient(circle at 40% 70%, rgba(255,255,255,0.15) 0%, transparent 20%), linear-gradient(45deg, rgba(156,163,175,0.4) 0%, rgba(107,114,128,0.4) 100%)' },
  { id: 9, name: 'PSYCHOLOGIE', type: 'venus', size: 17.28, cx: '72.28vw', cy: 'calc(9.36vh + 3rem)', dur: 16, color: '217, 119, 6', tilt: 25, behindNebula: true, brightness: 0.9, texture: 'radial-gradient(circle at 30% 30%, rgba(245,158,11,0.4) 0%, rgba(180,83,9,0.3) 30%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(120,53,15,0.4) 0%, rgba(180,83,9,0.3) 40%, transparent 70%), linear-gradient(45deg, rgba(217,119,6,0.4) 0%, rgba(253,230,138,0.3) 50%, rgba(217,119,6,0.4) 100%)' },
  { id: 3, name: 'NEUROBIOLOGIE', type: 'mars', size: 15.552, cx: '89.02vw', cy: 'calc(52.04vh + 3rem)', dur: 14, color: '234, 88, 12', tilt: 25, brightness: 1, texture: 'radial-gradient(circle at 30% 40%, rgba(234,88,12,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(67,20,7,0.3) 0%, transparent 60%), linear-gradient(to bottom right, rgba(153,27,27,0.4) 0%, rgba(194,65,12,0.4) 50%, rgba(127,29,29,0.4) 100%)' },
  { id: 11, name: 'NATUURKUNDE', type: 'mercury', size: 12.096, cx: '64.13vw', cy: 'calc(30.05vh + 3rem)', dur: 20, color: '163, 163, 163', tilt: 2, behindNebula: true, brightness: 1, texture: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.2) 0%, transparent 30%), radial-gradient(circle at 60% 60%, rgba(0,0,0,0.3) 0%, transparent 40%), linear-gradient(45deg, rgba(163,163,163,0.4) 0%, rgba(115,115,115,0.4) 100%)' },
  { id: 1, name: 'GEOMETRIE, MYTHOLOGIE & SYMBOLIEK', type: 'sun', size: 38.016, cx: '46.69vw', cy: '24.20vh', dur: 25, color: '250, 204, 21', tilt: 7, brightness: 1.32, texture: 'radial-gradient(circle at 50% 50%, rgba(254,252,232,0.5) 0%, rgba(250,204,21,0.4) 40%, rgba(234,88,12,0.3) 80%, rgba(153,27,27,0.2) 100%)' },
  { id: 4, name: 'RELIGIES', type: 'jupiter', size: 38.1888, cx: 'calc(57.49vw + 2rem)', cy: 'calc(69.97vh + 1rem)', dur: 28, color: '245, 158, 11', tilt: 3, behindNebula: true, brightness: 1, texture: 'radial-gradient(ellipse 15% 10% at 60% 65%, rgba(180,50,20,0.5) 0%, rgba(140,30,10,0.3) 50%, transparent 100%), radial-gradient(ellipse 10% 5% at 30% 48%, rgba(255,240,220,0.4) 0%, transparent 100%), radial-gradient(ellipse 20% 6% at 75% 30%, rgba(160,100,60,0.3) 0%, transparent 100%), radial-gradient(ellipse 12% 8% at 20% 80%, rgba(240,230,210,0.3) 0%, transparent 100%), radial-gradient(ellipse 25% 5% at 85% 52%, rgba(80,30,5,0.3) 0%, transparent 100%), repeating-linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 2%, transparent 4%), linear-gradient(to bottom, rgba(120,110,100,0.4) 0%, rgba(200,190,180,0.5) 20%, rgba(230,220,200,0.5) 35%, rgba(100,40,10,0.5) 45%, rgba(130,60,20,0.5) 55%, rgba(220,200,170,0.5) 65%, rgba(180,130,90,0.5) 80%, rgba(120,110,100,0.4) 100%)' },
  { id: 6, name: 'FILOSOFIE', type: 'saturn', size: 24.192, cx: '31.20vw', cy: '50.84vh', dur: 22, color: '253, 230, 138', tilt: 26, hasRing: true, behindNebula: true, brightness: 0.9, texture: 'repeating-linear-gradient(to right, transparent 0%, rgba(0,0,0,0.03) 3%, transparent 6%), linear-gradient(to bottom, rgba(214,211,209,0.4) 0%, rgba(253,230,138,0.5) 25%, rgba(234,179,8,0.3) 45%, rgba(253,230,138,0.5) 65%, rgba(147,197,253,0.4) 90%, rgba(100,116,139,0.4) 100%)' },
  { id: 10, name: 'ASTRO', type: 'uranus', size: 21.28896, cx: 'calc(9.24vw + 1rem)', cy: 'calc(40.45vh - 2rem)', dur: 20, color: '37, 99, 235', tilt: 98, behindNebula: true, brightness: 0.9, texture: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.3) 0%, transparent 5%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 4%), repeating-linear-gradient(to right, transparent 0%, rgba(255,255,255,0.03) 2%, transparent 5%), linear-gradient(to bottom, rgba(15,32,39,0.5) 0%, rgba(44,83,100,0.5) 20%, rgba(147,197,253,0.4) 30%, rgba(30,58,138,0.5) 40%, rgba(147,197,253,0.3) 60%, rgba(15,32,39,0.5) 80%, rgba(30,58,138,0.4) 100%)' },
  { id: 7, name: 'AL-CHEMIE', type: 'neptune', size: 19.44, cx: 'calc(16.03vw + 1rem)', cy: '83.20vh', dur: 18, color: '56, 189, 248', tilt: 24, brightness: 1, texture: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(186,230,253,0.4) 20%, rgba(56,189,248,0.3) 50%, rgba(14,165,233,0.4) 80%, rgba(2,132,197,0.5) 100%)' },
];

/* ── Single holographic planet ── */
const HologramPlanet = memo(({ p, isZoomed, isZoomedIn, hideOriginal, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      whileHover={!isZoomedIn ? { scale: 1.1 } : {}}
      animate={{ opacity: hideOriginal ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        pointerEvents: 'auto',
        left: p.cx,
        top: p.cy,
        x: '-50%',
        y: '-50%',
        width: `${p.size}vmin`,
        height: `${p.size}vmin`,
        zIndex: isZoomed ? 100 : 10,
        filter: p.brightness ? `brightness(${p.brightness})` : undefined,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Main Sphere — WebGL holographic shader for all bodies */}
        <Suspense fallback={null}>
          <HoloPlanet type={p.type} tilt={p.tilt} />
        </Suspense>

        {/* Saturn ring */}
        {p.hasRing && (
          <motion.div
            animate={{ rotateX: [78, 84, 78], rotateY: [-10, 10, -10] }}
            transition={{ duration: p.dur * 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: '-25%', left: '-25%',
              width: '150%', height: '150%',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              animate={{ rotateZ: [0, 360] }}
              transition={{ duration: p.dur * 1.5, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
                background: `repeating-conic-gradient(from 0deg, rgba(${p.color}, 0.12) 0deg, rgba(${p.color}, 0.28) 15deg, rgba(${p.color}, 0.12) 30deg)`,
                maskImage: 'radial-gradient(circle at center, transparent 46%, black 47.5%, black 50%, transparent 51.5%, transparent 53%, black 54.5%, black 57%, transparent 58.5%)',
                WebkitMaskImage: 'radial-gradient(circle at center, transparent 46%, black 47.5%, black 50%, transparent 51.5%, transparent 53%, black 54.5%, black 57%, transparent 58.5%)',
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Label */}
      <div style={{ position: 'absolute', bottom: p.type === 'jupiter' ? '-0.25rem' : '-1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: `rgba(${p.color}, 0.9)`, textShadow: `0 0 8px rgba(${p.color}, 0.8)` }}>
        <div style={{ fontSize: 'max(8px, 0.55vw)', textTransform: 'uppercase', letterSpacing: '0.4em', fontFamily: "'Lexend Mega', monospace", fontWeight: 'bold', whiteSpace: 'nowrap', textAlign: 'center' }}>
          {p.type === 'sun'
            ? <><span>GEOMETRIE</span><br/><span>MYTHOLOGIE</span><br/><span>SYMBOLIEK</span></>
            : p.name}
        </div>
        <div style={{ fontSize: 'max(6px, 0.4vw)', opacity: 0.7, marginTop: '0.25rem', letterSpacing: '0.2em', fontFamily: 'monospace' }}>SYS-{p.id}0{p.size}</div>
      </div>

    </motion.div>
  );
});
HologramPlanet.displayName = 'HologramPlanet';

/* ═══════════════════════════════════════════════════════════════════
   DATA PAGE — celestial orbit view with 9 holographic planets
   ═══════════════════════════════════════════════════════════════════ */
const FRONT_PLANETS = PLANETS.filter(p => !p.behindNebula);
const BEHIND_PLANETS = PLANETS.filter(p => p.behindNebula);

// Pure position-inversion helpers (module-level so they're usable in handlePlanetClick)
const invertPos = (s, unit) => {
  if (!s) return `0${unit}`;
  const m = s.match(/([\d.]+)\s*v[wh]/);
  if (!m) return `0${unit}`;
  const base = parseFloat(m[1]);
  const remMatch = s.match(/([+-])\s*([\d.]+)\s*rem/);
  let expr = `50${unit} - ${base}${unit}`;
  if (remMatch) {
    const sign = remMatch[1] === '+' ? '-' : '+';
    expr += ` ${sign} ${remMatch[2]}rem`;
  }
  return `calc(${expr})`;
};
const entryPos = (s, unit) => {
  if (!s) return `0${unit}`;
  const m = s.match(/([\d.]+)\s*v[wh]/);
  if (!m) return `0${unit}`;
  const base = parseFloat(m[1]);
  const remMatch = s.match(/([+-])\s*([\d.]+)\s*rem/);
  let expr = `${base}${unit} - 50${unit}`;
  if (remMatch) {
    expr += ` ${remMatch[1]} ${remMatch[2]}rem`;
  }
  return `calc(${expr})`;
};

/* Shared camera div — renders a subset of planets with the same zoom state.
   Uses imperative useAnimation controls: snap to identity before each new
   zoom-in so framer-motion never interpolates from stale motion values. */
const CameraLayer = memo(({ planets, isZoomedIn, selectedPlanetId, hideOriginal, transformOrigin, targetX, targetY, onPlanetClick }) => {
  const controls = useAnimation();
  const prevZoomedRef = useRef(false);

  useEffect(() => {
    if (isZoomedIn && !prevZoomedRef.current) {
      // New zoom-in: snap to identity first (clears any residual motion values),
      // then animate to target. This prevents the "jump" on sequential zooms.
      controls.set({ scale: 1, x: 0, y: 0 });
      controls.start(
        { scale: 100, x: targetX, y: targetY },
        { duration: 3, ease: 'easeIn' }
      );
    } else if (!isZoomedIn && prevZoomedRef.current) {
      // Zoom out: animate from current zoomed position to identity
      controls.start(
        { scale: 1, x: 0, y: 0 },
        { duration: 2.85, ease: 'easeOut' }
      );
    }
    prevZoomedRef.current = isZoomedIn;
  }, [isZoomedIn, targetX, targetY, controls]);

  return (
    <motion.div
      initial={{ scale: 1, x: 0, y: 0 }}
      animate={controls}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        transformOrigin,
      }}
    >
      {planets.map((p) => (
        <HologramPlanet
          key={p.id}
          p={p}
          isZoomed={selectedPlanetId === p.id}
          isZoomedIn={isZoomedIn}
          hideOriginal={hideOriginal}
          onClick={() => onPlanetClick(p.id)}
        />
      ))}
    </motion.div>
  );
});
CameraLayer.displayName = 'CameraLayer';

/* ── Shared state hook — used by both DataPage and CelestialBehindLayer ── */
export function useCelestialState() {
  const [selectedPlanetId, setSelectedPlanetId] = useState(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [hideOriginal, setHideOriginal] = useState(false);
  const [frozenOrigin, setFrozenOrigin] = useState('50% 50%');
  const [targetX, setTargetX] = useState('0vw');
  const [targetY, setTargetY] = useState('0vh');
  const [entryX, setEntryX] = useState('0vw');
  const [entryY, setEntryY] = useState('0vh');
  const timeoutsRef = useRef([]);
  const isAnimatingRef = useRef(false);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const resetState = useCallback(() => {
    setSelectedPlanetId(null);
    setIsZoomedIn(false);
    setHideOriginal(false);
    // NOTE: frozenOrigin, targetX/Y, entryX/Y are NOT cleared —
    // they keep the last planet's values so no in-flight animation jumps.
    // They'll be overwritten by the next handlePlanetClick.
    isAnimatingRef.current = false;
  }, []);

  const handlePlanetClick = useCallback((id) => {
    if (isZoomedIn || isAnimatingRef.current) return;
    clearAllTimeouts();
    isAnimatingRef.current = true;
    const planet = PLANETS.find(p => p.id === id);
    if (planet) {
      setFrozenOrigin(`${planet.cx} ${planet.cy}`);
      setTargetX(invertPos(planet.cx, 'vw'));
      setTargetY(invertPos(planet.cy, 'vh'));
      setEntryX(entryPos(planet.cx, 'vw'));
      setEntryY(entryPos(planet.cy, 'vh'));
    }
    setSelectedPlanetId(id);
    setIsZoomedIn(true);
    timeoutsRef.current.push(setTimeout(() => {
      setHideOriginal(true);
      isAnimatingRef.current = false;
    }, 1200));
  }, [isZoomedIn, clearAllTimeouts]);

  const handlePlanetBack = useCallback(() => {
    clearAllTimeouts();
    isAnimatingRef.current = true;
    setIsZoomedIn(false);
    timeoutsRef.current.push(setTimeout(() => setHideOriginal(false), 1300));
    timeoutsRef.current.push(setTimeout(() => resetState(), 3000));
  }, [clearAllTimeouts, resetState]);

  const activePlanet = PLANETS.find(p => p.id === selectedPlanetId);

  return { selectedPlanetId, isZoomedIn, hideOriginal, frozenOrigin, activePlanet, targetX, targetY, entryX, entryY, handlePlanetClick, handlePlanetBack };
}

/* ── Behind-nebula layer — rendered at a lower z-index in App.js ── */
export const CelestialBehindLayer = memo(({ isVisible, celestial }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      overflow: 'hidden',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
      pointerEvents: 'none',
    }}
  >
    <CameraLayer
      planets={BEHIND_PLANETS}
      isZoomedIn={celestial.isZoomedIn}
      selectedPlanetId={celestial.selectedPlanetId}
      hideOriginal={celestial.hideOriginal}
      transformOrigin={celestial.frozenOrigin}
      targetX={celestial.targetX}
      targetY={celestial.targetY}
      onPlanetClick={celestial.handlePlanetClick}
    />
  </div>
));
CelestialBehindLayer.displayName = 'CelestialBehindLayer';

/* ── Main DataPage — front planets + UI + content overlay ── */
const DataPage = memo(({ isVisible, onBack, celestial }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)',
        pointerEvents: 'none',
      }}
    >
      {/* Return to Deltawerken — top-right, below TimeSync */}
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

      {/* Front planets — above NebulaOverlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <CameraLayer
          planets={FRONT_PLANETS}
          isZoomedIn={celestial.isZoomedIn}
          selectedPlanetId={celestial.selectedPlanetId}
          hideOriginal={celestial.hideOriginal}
          transformOrigin={celestial.frozenOrigin}
          targetX={celestial.targetX}
          targetY={celestial.targetY}
          onPlanetClick={celestial.handlePlanetClick}
        />
      </div>

      {/* Zoomed-in content overlay */}
      <AnimatePresence>
        {celestial.isZoomedIn && celestial.activePlanet && (
          <motion.div
            key="content-wrapper"
            initial={{ x: celestial.entryX, y: celestial.entryY }}
            animate={{ x: '0vw', y: '0vh', transition: { duration: 3, ease: 'easeIn' } }}
            exit={{ x: celestial.entryX, y: celestial.entryY, transition: { duration: 3, ease: 'easeOut' } }}
            style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, transition: { delay: 1.2, duration: 1.7, ease: 'easeOut' } }}
              exit={{ scale: 0, transition: { duration: 1.4, ease: 'easeIn' } }}
              style={{ width: '100%', maxWidth: '42rem', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', pointerEvents: 'auto', color: 'white' }}
            >
              {/* Text container */}
              <div style={{ width: '100%', height: '10rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)', padding: '1.5rem' }} />

              {/* Image placeholder */}
              <div style={{ width: '100%', aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', letterSpacing: '0.2em' }}>IMAGE PLACEHOLDER</span>
              </div>

              <SciFiButton onClick={celestial.handlePlanetBack} variant="orange" size="sm">
                BACK
              </SciFiButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

DataPage.displayName = 'DataPage';

export default DataPage;
