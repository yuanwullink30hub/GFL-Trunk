import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { HyperCube, CameraRig, HolographicButton, FaceTargets } from './HyperCube';

/* Pre-warm pass — mounted inside the Canvas only during the idle warm-up window.
   The hypercube's first rendered frame compiles every material's shader program
   plus the Bloom composer, shadow maps and the PMREM environment — ~hundreds of
   ms that, left to the first navigation, freeze the data-stream page. Here we do
   it off the critical path: gl.compile() builds the scene programs synchronously,
   and a few rendered frames flush the composer/shadow passes. Then we report done
   and the canvas drops back to frameloop:'never' until the user actually visits. */
function PreWarm({ active, onDone }) {
  const { gl, scene, camera } = useThree();
  const frames = useRef(0);
  useEffect(() => {
    if (active) { try { gl.compile(scene, camera); } catch (e) { /* ignore */ } }
  }, [active, gl, scene, camera]);
  useFrame(() => {
    if (!active) return;
    frames.current += 1;
    if (frames.current >= 8) onDone();
  });
  return null;
}

/* ===================================================================
   HYPERCUBE SCENE - the <Canvas> owner, lazy-loaded by DataPage.

   Kept in its own module because App.js synchronously imports
   { useCelestialState, CelestialBehindLayer } from DataPage, which
   pulls DataPage's top-level import graph into the main chunk. All
   heavy deps (three / fiber / drei / postprocessing) therefore live
   here, behind DataPage's lazy() boundary, not in DataPage itself.

   Transparency: the canvas is alpha:true with a 0-alpha clear, so the
   app's NebulaOverlay / NebulaBackground show through behind the
   tesseract. No opaque page background is drawn (the old #050505 void
   is intentionally dropped - the platform renders nebulae throughout).

   Disposal: full release on unmount incl. WEBGL_lose_context (the
   call that actually returns the context to the browser pool -
   same pattern as HoloEarth).
   =================================================================== */

export default function HypercubeScene({ isVisible, isInside, paused, onExitInside, onSelectDomain }) {
  const glRef = useRef(null);

  // One-time idle pre-warm so the FIRST navigation to the data-stream page doesn't
  // freeze on shader/bloom/shadow/PMREM compilation. Scheduled on idle (after the
  // landing settles) — renders a few hidden frames, then the canvas idles again.
  const [warming, setWarming] = useState(false);
  const [warmed, setWarmed] = useState(false);
  useEffect(() => {
    if (warmed) return;
    const ric = window.requestIdleCallback || ((cb) => setTimeout(() => cb(), 1500));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = ric(() => setWarming(true), { timeout: 4000 });
    return () => cancel(id);
  }, [warmed]);
  const finishWarm = () => { setWarming(false); setWarmed(true); };

  useEffect(() => {
    return () => {
      if (glRef.current) {
        glRef.current.dispose();
        const ctx = glRef.current.getContext && glRef.current.getContext();
        if (ctx) {
          const ext = ctx.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
        }
        glRef.current = null;
      }
    };
  }, []);

  return (
    <Canvas
      frameloop={(isVisible || (warming && !warmed)) ? 'always' : 'never'}
      shadows
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        alpha: true,
        premultipliedAlpha: false,
      }}
      onCreated={({ gl }) => {
        glRef.current = gl;
        // Transparent clear so the nebula behind shows through.
        gl.setClearColor(0x000000, 0);
        // Firefox fix (same as HoloEarth): null info logs crash
        // three r160's .trim() during shader compilation.
        const ctx = gl.getContext();
        const origGetProgramInfoLog = ctx.getProgramInfoLog.bind(ctx);
        ctx.getProgramInfoLog = (program) => origGetProgramInfoLog(program) || '';
        const origGetShaderInfoLog = ctx.getShaderInfoLog.bind(ctx);
        ctx.getShaderInfoLog = (shader) => origGetShaderInfoLog(shader) || '';
      }}
    >
      <PreWarm active={warming && !warmed} onDone={finishWarm} />
      <CameraRig isInside={isInside} paused={paused} />
      <PerspectiveCamera makeDefault position={[5, 5, 8]} fov={45} />

      {/* Cinematic lighting */}
      <ambientLight intensity={2} />
      <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={5} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={4} color="#00FF00" />
      <pointLight position={[5, -5, 5]} intensity={3} color="#00FF00" />

      <Suspense fallback={null}>
        <HyperCube isInside={isInside} paused={paused} />
        <FaceTargets isInside={isInside} paused={paused} onSelect={onSelectDomain} />
        <HolographicButton onReturn={onExitInside} isInside={isInside} />

        <EffectComposer>
          <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.5} radius={0.4} />
        </EffectComposer>

        {/* Environment only feeds reflections on the metallic tubes - no
            `background` prop, so the canvas stays transparent. Served locally
            from public/hdr/ (the drei `night` preset = dikhololo_night_1k.hdr,
            ~1.7MB) instead of fetching the pmndrs CDN at runtime (task 6). */}
        <Environment files="/hdr/night.hdr" />
      </Suspense>

      {/* Subtle floor grid - dark lines, reads faintly over the nebula. */}
      <gridHelper args={[60, 40, '#222', '#080808']} position={[0, -4, 0]} />
    </Canvas>
  );
}
