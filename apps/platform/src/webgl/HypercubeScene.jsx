import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { HyperCube, CameraRig, FaceTargets, EnterButton } from './HyperCube';

/* Pre-warm pass — mounted inside the Canvas only during the idle warm-up window.
   The hypercube's first rendered frame compiles every material's shader program plus
   the Bloom composer and the PMREM environment — ~hundreds of ms that, left to the
   first navigation, freeze the data-stream page. We do it off the critical path during
   idle. The catch: the scene is behind a <Suspense> gated on the Environment HDR, so it
   renders nothing until that loads — a fixed-frame warm would warm an empty canvas
   (observed: programs=0). So this polls until the suspense resolves and the program
   count settles, then the canvas drops back to frameloop:'never' until the user visits. */
function PreWarm({ active, onDone }) {
  const { gl, scene, camera } = useThree();
  const frames = useRef(0);
  const stable = useRef(0);
  const last = useRef(-1);
  // The scene sits behind a <Suspense> that's suspended until the Environment HDR
  // loads — so for the first ~second the canvas renders NOTHING (programs=0) and a
  // fixed-frame pre-warm warms an empty scene. Instead we keep the frameloop alive and
  // poll: once the suspense resolves (programs>0) we gl.compile any remaining variants
  // (env-map materials, the Bloom mip chain) and only declare done once the program
  // count stops growing. Safety-capped so a failed HDR load can't spin forever.
  useFrame(() => {
    if (!active) return;
    frames.current += 1;
    const n = gl.info?.programs?.length ?? 0;
    if (n > 0) {
      try { gl.compile(scene, camera); } catch (e) { /* ignore */ }
      const after = gl.info?.programs?.length ?? n;
      if (after === last.current) stable.current += 1; else stable.current = 0;
      last.current = after;
      if (stable.current >= 4) { onDone(); return; }
    }
    if (frames.current > 300) onDone(); // ~5s cap
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

export default function HypercubeScene({ isVisible, isInside, paused, onEnter, onExitInside, onSelectDomain }) {
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
      /* No shadows + dpr capped at 1: the hypercube shares the GPU with the always-on
         Nebula + HoloEarth contexts, and its render targets were tipping the GPU into a
         context drop on first nav (24 shaders relink synchronously = a ~400-600ms freeze).
         Shadow maps cost both VRAM and extra depth-shader variants; the wireframe cube in
         open space barely shows them, so they're pure overhead here. */
      dpr={1}
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
      <spotLight position={[10, 10, 10]} angle={0.2} penumbra={1} intensity={5} />
      <pointLight position={[-5, 5, -5]} intensity={4} color="#00FF00" />
      <pointLight position={[5, -5, 5]} intensity={3} color="#00FF00" />

      <Suspense fallback={null}>
        <HyperCube isInside={isInside} paused={paused} />
        <FaceTargets isInside={isInside} paused={paused} onSelect={onSelectDomain} onDisconnect={onExitInside} />
        <EnterButton onEnter={onEnter} isInside={isInside} paused={paused} />
        {/* DISCONNECT is now the crosshair-aimable green button rendered inside
            FaceTargets (onDisconnect); the old large purple Html button is removed. */}

        {/* Bloom-only composer (cf2a690's known-good state). SMAA removed: it's a pass
            that only compiles at real framebuffer size, which the 0x0 off-screen pre-warm
            can't cover, so it compiled on first nav and added to the context-drop. */}
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.1} mipmapBlur intensity={1.5} radius={0.4} />
        </EffectComposer>

        {/* Environment only feeds reflections on the metallic tubes - no
            `background` prop, so the canvas stays transparent. Served locally
            from public/hdr/ (the drei `night` preset = dikhololo_night_1k.hdr,
            ~1.7MB) instead of fetching the pmndrs CDN at runtime (task 6). */}
        <Environment files="/hdr/night.hdr" />
      </Suspense>

    </Canvas>
  );
}
