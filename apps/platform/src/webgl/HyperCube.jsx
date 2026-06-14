import React, { useRef, useMemo, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

/* ===================================================================
   HYPERCUBE - 4D tesseract with instanced tube edges.

   Ported from the standalone "TubeCube 3D" Vite project (AI Studio
   export, fiber v9 / drei v10 / TS / Tailwind v4) to this codebase's
   stack: fiber 8.15 / drei 9.96 / three 0.160 / JS / inline styles.

   Structure:
   - 16 vertices of a 4-cube (+/-1 in x,y,z,w), rotated in the XW plane
     and perspective-projected 4D->3D every frame.
   - 32 edges in three instanced meshes: purple cube (w<0), green cube
     (w>0), and 8 purple->green gradient "bridge" edges between them.
   - A stationary "4D lantern" glow: edges brighten as their XW angle
     passes a fixed focal angle, with a high-frequency electric flicker,
     suppressed while the two cubes overlap (folded state).
   - `isInside` drives the state machine: rotation settles to the next
     90deg snap point, then the projection expands (scale 3->12,
     distance 2.2->4) to create the room illusion around the camera.

   The owning <Canvas>, post-processing, lighting, HUD, and disposal
   live in src/webgl/HypercubeScene.js.
   =================================================================== */

export function isWebGLAvailable() {
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

/* Shared instanced-mesh updater. Computes per-edge transform from the
   projected endpoints and per-edge glow color from the 4D lantern. */
const updateMesh = (
  ref, indices, projected, vertices4D, baseColor,
  glowTime, flicker, dummy, up
) => {
  if (!ref.current) return;
  indices.forEach(([startIdx, endIdx], i) => {
    const start = projected[startIdx];
    const end = projected[endIdx];
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

    dummy.position.copy(midpoint);
    dummy.scale.set(1, length, 1);
    dummy.quaternion.setFromUnitVectors(up, direction.normalize());
    dummy.updateMatrix();
    ref.current.setMatrixAt(i, dummy.matrix);

    // Stationary glow focal point: edge brightness follows its average
    // XW-plane angle relative to a focus angle locked to the rotation.
    const avgX = (vertices4D[startIdx].x + vertices4D[endIdx].x) / 2;
    const avgW = (vertices4D[startIdx].w + vertices4D[endIdx].w) / 2;
    const edgeAngle = Math.atan2(avgW, avgX);
    const focusAngle = -glowTime - Math.PI / 2;
    const proximity = Math.cos(edgeAngle - focusAngle);
    // Smooth focus sweep. proximity^5 gave each edge a razor-thin bright window, so
    // as the focus passed it snapped bright->dark — a glitchy flash, amplified outward
    // by bloom. proximity^2 widens that window so the glow flows smoothly along the
    // cube (neighbouring edges share it), and x2.5 keeps the peak modest. The clamp
    // still guards the Bloom pass from HDR blowout.
    const glowBoost = Math.max(0, proximity) ** 2.0 * 2.5 * flicker;
    const boost = Math.min(1 + glowBoost, 5.0);
    const boostColor = new THREE.Color(boost, boost, boost);
    if (baseColor) {
      ref.current.setColorAt(i, baseColor.clone().multiply(boostColor));
    } else {
      ref.current.setColorAt(i, boostColor);
    }
  });
  ref.current.instanceMatrix.needsUpdate = true;
  if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
};

/* In-world ENTER gate — a billboarded holographic button that lives at the centre,
   inside the inner cube. It copies the camera orientation each frame so it always
   faces us and never rolls with the 4D rotation. `occlude="blending"` makes the
   cube's near edges pass in front of it per-pixel while the far edges sit behind —
   so it reads as living *inside* the inner cube. Shown only from the void view;
   once inside, the crosshair-aimable DISCONNECT button (in FaceTargets) and the
   HUD toggle handle the exit. */
export function EnterButton({ onEnter, isInside, paused }) {
  const [hovered, setHovered] = useState(false);

  if (isInside || paused) return null;

  // No billboard — the panel stays world-oriented so it shares the tesseract's tilt.
  // The cube's faces are world-axis-aligned; facing +Z sits flush with the inner
  // cube's camera-facing face, so it foreshortens with the same perspective as the
  // cube instead of reading as a flat HUD sticker. `rotation` is the tilt knob.
  // Cursor feedback while hovering the inner-cube hit target.
  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => { document.body.style.cursor = ''; };
  }, [hovered]);

  if (isInside || paused) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* The inner cube IS the event handler: an invisible hit-box at the inner-cube
          volume captures the click → enter. (Wireframe edges are too thin to click.) */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onEnter && onEnter(); }}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Single green text label — non-interactive (clicks fall through to the cube).
          No occlude plane (that was the faint "container"); plain transformed text. */}
      <Html transform distanceFactor={5} pointerEvents="none" style={{ pointerEvents: 'none' }}>
        <div style={{
          fontFamily: "'Lexend Mega', Arial, Helvetica, sans-serif",
          fontWeight: 700,
          letterSpacing: '0.28em',
          color: '#39FF14',
          fontSize: '15px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textShadow: hovered ? '0 0 20px rgba(57,255,20,0.95)' : '0 0 11px rgba(57,255,20,0.55)',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.3s ease-out',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>Initieer</div>
      </Html>
    </group>
  );
}

/* The tesseract itself. */
export function HyperCube({ isInside, paused }) {
  const edgesPurpleRef = useRef(null);
  const edgesGreenRef = useRef(null);
  const edgesBridgeRef = useRef(null);
  const rotationRef = useRef(0);
  const isSettled = useRef(true);
  const expansionRef = useRef(0); // 0 = standard, 1 = fully expanded (inside)
  const lightARef = useRef(null);

  // 16 vertices of a 4D cube (+/-1, +/-1, +/-1, +/-1)
  const vertices4D = useMemo(() => {
    const v = [];
    for (let x = -1; x <= 1; x += 2) {
      for (let y = -1; y <= 1; y += 2) {
        for (let z = -1; z <= 1; z += 2) {
          for (let w = -1; w <= 1; w += 2) {
            v.push(new THREE.Vector4(x, y, z, w));
          }
        }
      }
    }
    return v;
  }, []);

  // 32 edges, categorized: purple inner cube (w<0), green outer cube
  // (w>0), and the 8 bridges connecting corresponding vertices.
  const { purpleIndices, greenIndices, bridgeIndices } = useMemo(() => {
    const p = [];
    const g = [];
    const b = [];
    for (let i = 0; i < 16; i++) {
      for (let j = i + 1; j < 16; j++) {
        let diff = 0;
        if (vertices4D[i].x !== vertices4D[j].x) diff++;
        if (vertices4D[i].y !== vertices4D[j].y) diff++;
        if (vertices4D[i].z !== vertices4D[j].z) diff++;
        if (vertices4D[i].w !== vertices4D[j].w) diff++;
        if (diff === 1) {
          if (vertices4D[i].w < 0 && vertices4D[j].w < 0) {
            p.push([i, j]);
          } else if (vertices4D[i].w > 0 && vertices4D[j].w > 0) {
            g.push([i, j]);
          } else {
            // Bridge: start is always Cube A (purple), end Cube B (green)
            if (vertices4D[i].w < 0) b.push([i, j]);
            else b.push([j, i]);
          }
        }
      }
    }
    return { purpleIndices: p, greenIndices: g, bridgeIndices: b };
  }, [vertices4D]);

  const colorPurple = useMemo(() => new THREE.Color('#BF00FF'), []);
  const colorEnergyGreen = useMemo(() => new THREE.Color('#39FF14'), []);

  const projected = useMemo(() => Array.from({ length: 16 }, () => new THREE.Vector3()), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  // Bridge cylinder with baked purple->green vertex-color gradient
  const bridgeGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const pos = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      const y = pos.getY(i); // -0.5 .. 0.5
      const t = y + 0.5;
      const color = new THREE.Color().lerpColors(colorPurple, colorEnergyGreen, t);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [colorPurple, colorEnergyGreen]);

  // Dispose geometry on unmount (the instanced cylinder geometries
  // declared as JSX children are disposed by r3f automatically; this
  // one is created imperatively so it's ours to clean up).
  useEffect(() => {
    return () => bridgeGeometry.dispose();
  }, [bridgeGeometry]);

  useFrame(({ clock }) => {
    if (!edgesPurpleRef.current || !edgesGreenRef.current || !edgesBridgeRef.current) return;
    // Domain overlay open: freeze the tesseract where it is (task 4b).
    if (paused) return;

    // -- State machine: settle -> expand (inside) / shrink -> resume (outside)
    if (isInside) {
      if (!isSettled.current) {
        const snapPoint = Math.PI / 2;
        const target = Math.ceil(rotationRef.current / snapPoint) * snapPoint;
        const remaining = target - rotationRef.current;
        if (remaining > 0.005) {
          rotationRef.current += Math.min(0.015, remaining);
        } else {
          rotationRef.current = target;
          isSettled.current = true;
        }
      } else if (expansionRef.current < 1) {
        expansionRef.current = Math.min(1, expansionRef.current + 0.01);
      }
    } else {
      if (expansionRef.current > 0) {
        expansionRef.current = Math.max(0, expansionRef.current - 0.02);
      } else {
        rotationRef.current += 0.01;
        isSettled.current = false;
      }
    }

    const time = rotationRef.current;
    // Gentle electric shimmer — was 50 rad/s x 0.15, a fast/deep strobe that read as flashing.
    const flicker = 1.0 + Math.sin(clock.getElapsedTime() * 7) * 0.06;

    // Suppress the lantern while the cubes overlap (folded state)
    const foldState = Math.abs(Math.sin(time * 2));
    const effectSuppressor = THREE.MathUtils.lerp(0.1, 1.0, foldState);
    const glowColorFactor = effectSuppressor * flicker;

    const cosT = Math.cos(time);
    const sinT = Math.sin(time);

    // 4D -> 3D perspective projection with dynamic scale for the room illusion
    const baseDistance = 2.2;
    const currentDistance = THREE.MathUtils.lerp(baseDistance, 4.0, expansionRef.current);
    const scale = THREE.MathUtils.lerp(2.4, 12.0, expansionRef.current); // 2.4 = 80% of the old 3.0 void-view size

    vertices4D.forEach((v, i) => {
      const rw = v.x * sinT + v.w * cosT;
      const rx = v.x * cosT - v.w * sinT;
      const factor = 1 / (currentDistance - rw);
      projected[i].set(rx * factor * scale, v.y * factor * scale, v.z * factor * scale);
    });

    updateMesh(edgesPurpleRef, purpleIndices, projected, vertices4D, colorPurple, time, glowColorFactor, dummy, up);
    updateMesh(edgesGreenRef, greenIndices, projected, vertices4D, colorEnergyGreen, time, glowColorFactor, dummy, up);
    updateMesh(edgesBridgeRef, bridgeIndices, projected, vertices4D, null, time, glowColorFactor, dummy, up);

    if (lightARef.current) {
      lightARef.current.position.set(0, 0, 0);
      lightARef.current.intensity = 8; // softened — sharp moving speculars were twinkling on the chrome edges
    }
  });

  return (
    <group>
      {/* Cube A edges (solid purple) */}
      <instancedMesh ref={edgesPurpleRef} args={[undefined, undefined, 12]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial emissiveIntensity={2} metalness={0.9} roughness={0.1} transparent opacity={0.9} />
      </instancedMesh>

      {/* Cube B edges (solid green) */}
      <instancedMesh ref={edgesGreenRef} args={[undefined, undefined, 12]}>
        <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
        <meshStandardMaterial emissiveIntensity={1} metalness={0.9} roughness={0.1} transparent opacity={0.9} />
      </instancedMesh>

      {/* Bridge edges (purple->green gradient) */}
      <instancedMesh ref={edgesBridgeRef} args={[bridgeGeometry, undefined, 8]}>
        <meshStandardMaterial
          vertexColors
          emissiveIntensity={1.5}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </instancedMesh>

      <pointLight ref={lightARef} color="#39FF14" distance={12} decay={2} intensity={8} />
      <pointLight color="#BF00FF" position={[0, 0, 0]} intensity={7} distance={15} />
    </group>
  );
}

/* Camera: void view (static, looking at center) -> fly-in to center with
   pointer-lock FPS look while inside. ESC releases the pointer; look
   pauses until re-entry. */
export function CameraRig({ isInside, paused }) {
  const { camera, gl } = useThree();
  const transitionActive = useRef(false);
  const prevState = useRef(isInside);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const rotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isPointerLocked = useRef(false);

  useEffect(() => {
    const handleLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === gl.domElement;
    };
    const handleMouseMove = (e) => {
      if (!isPointerLocked.current || transitionActive.current) return;
      const sensitivity = 0.002;
      rotation.current.y -= e.movementX * sensitivity;
      rotation.current.x -= e.movementY * sensitivity;
      // No pitch clamp — full vertical freedom so you can look/turn all the way
      // over the top and bottom and back around (free-floating-in-space look).
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl]);

  // Pointer lock follows isInside, but releases while a domain overlay is open
  // (paused) so the cursor can reach the 2D modal. Re-locks when it closes.
  useEffect(() => {
    if (isInside && !paused && !transitionActive.current) {
      const promise = gl.domElement.requestPointerLock();
      if (promise && promise.catch) promise.catch(() => {});
    } else {
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }
    }
  }, [isInside, paused, gl]);

  useEffect(() => {
    if (!isInside && !transitionActive.current) {
      camera.position.set(5, 5, 8);
      camera.lookAt(0, 0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  useEffect(() => {
    if (prevState.current !== isInside) {
      transitionActive.current = true;
      prevState.current = isInside;
    }
  }, [isInside]);

  useFrame(() => {
    // Frozen while a domain overlay is open (task 4b).
    if (paused) return;
    if (transitionActive.current) {
      if (isInside) targetPos.set(0, 0, 0.01);
      else targetPos.set(5, 5, 8);

      camera.position.lerp(targetPos, 0.08);

      if (!isInside) {
        camera.lookAt(0, 0, 0);
      } else {
        const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
        camera.quaternion.slerp(targetQuat, 0.1);
      }

      if (camera.position.distanceTo(targetPos) < 0.01) {
        camera.position.copy(targetPos);
        transitionActive.current = false;
        rotation.current.set(0, 0, 0);
        if (isInside) {
          const promise = gl.domElement.requestPointerLock();
          if (promise && promise.catch) promise.catch(() => {});
        }
      }
    }

    if (isInside && !transitionActive.current) {
      camera.quaternion.setFromEuler(rotation.current);
    } else if (!isInside && !transitionActive.current) {
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

/* ===================================================================
   DOMAIN LAYER - the six science domains, one per outer-cube face.

   Tesseract design (owner-decided, DEV_PATHGUIDE task 4): inner cube =
   the Deltawerken system, outer cube = six domain faces. Each face maps
   to one axis direction of the expanded room the camera sits inside.
   =================================================================== */
export const DOMAINS = [
  { id: 'psyche',      axis: [1, 0, 0],  code: 'DOM-01', title: 'Psychologie & Neurobiologie' },
  { id: 'filosofie',   axis: [-1, 0, 0], code: 'DOM-02', title: 'Filosofie' },
  { id: 'symboliek',   axis: [0, 1, 0],  code: 'DOM-03', title: 'Symbolische Tradities' },
  { id: 'chemie',      axis: [0, -1, 0], code: 'DOM-04', title: 'Chemie · Alchemie · Epigenetica' },
  { id: 'natuurkunde', axis: [0, 0, 1],  code: 'DOM-05', title: 'Natuurkunde & Informatietheorie' },
  { id: 'astro',       axis: [0, 0, -1], code: 'DOM-06', title: 'Astronomie & Astrologie' },
];

const FACE_DIST = 4.5;

/* Face-targeting: every frame, find which face the crosshair (= camera
   forward) is aimed at by max dot product against the six axis normals,
   and surface that domain's label at its face position. Only the targeted
   face shows (the one in front of the camera) - no behind-camera clutter. */
export function FaceTargets({ isInside, paused, onSelect, onDisconnect }) {
  const { camera, gl } = useThree();
  const [targeted, setTargeted] = useState(-1);
  const targetedRef = useRef(-1);
  const aimDiscRef = useRef(false);
  const axes = useMemo(() => DOMAINS.map((d) => new THREE.Vector3(...d.axis)), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  // Direction from the camera (centre) to the in-world DISCONNECT button at
  // [0,-2.5,-4]. A narrow cone (dot > 0.92, ~23°) around it is reserved so the
  // button is aimable while pointer-locked, without bleeding into the -Z/-Y faces.
  const DISCONNECT_DIR = useMemo(() => new THREE.Vector3(0, -2.5, -4).normalize(), []);

  useFrame(() => {
    if (!isInside || paused) {
      if (targetedRef.current !== -1) { targetedRef.current = -1; setTargeted(-1); }
      aimDiscRef.current = false;
      return;
    }
    camera.getWorldDirection(fwd);
    // DISCONNECT takes priority when the crosshair is on it — so a locked click
    // there exits instead of opening the domain behind it.
    if (fwd.dot(DISCONNECT_DIR) > 0.92) {
      aimDiscRef.current = true;
      if (targetedRef.current !== -2) { targetedRef.current = -2; setTargeted(-2); }
      return;
    }
    aimDiscRef.current = false;
    let best = -Infinity;
    let bestIdx = 0;
    for (let i = 0; i < axes.length; i++) {
      const d = fwd.dot(axes[i]);
      if (d > best) { best = d; bestIdx = i; }
    }
    // Contain the hitbox to the button itself: only target a face when the
    // crosshair is within a tight cone of its normal (~where the label sits),
    // not anywhere on the 90°-wide face. Below threshold → no target, so a click
    // off the label does nothing instead of selecting the nearest face.
    const FACE_AIM = 0.96; // ~16° cone
    const next = best >= FACE_AIM ? bestIdx : -1;
    if (next !== targetedRef.current) {
      targetedRef.current = next;
      setTargeted(next);
    }
  });

  // Click-to-select (task 4b). Pointer lock still delivers `click`. While
  // locked, a click opens the targeted domain; when not locked (e.g. just
  // after closing an overlay), the click re-engages FPS look instead.
  useEffect(() => {
    const el = gl.domElement;
    const handleClick = (e) => {
      if (paused || !isInside) return;
      // Only the 3D canvas itself drives select / re-lock. A click that lands on an
      // overlay control (DISCONNECT, exit, INITIALIZE, HUD) must NOT also open a
      // domain or grab pointer-lock — that shared "one click → two paths" was what
      // made DISCONNECT also fire the content path.
      if (e.target !== el) return;
      if (document.pointerLockElement === el) {
        // Aimed at the DISCONNECT button → exit (priority over domain select).
        if (aimDiscRef.current) { if (onDisconnect) onDisconnect(); return; }
        if (targetedRef.current >= 0 && onSelect) onSelect(DOMAINS[targetedRef.current]);
      } else {
        const p = el.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      }
    };
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [gl, isInside, paused, onSelect, onDisconnect]);

  if (!isInside || paused) return null;

  const armed = targeted === -2;           // crosshair on the DISCONNECT button
  const d = targeted >= 0 ? DOMAINS[targeted] : null;

  return (
    <>
      {/* The single in-world DISCONNECT button — small, green, always visible while
          inside; brightens + invites a click when the crosshair is on it. */}
      <Html position={[0, -2.5, -4]} center pointerEvents="none" zIndexRange={[20, 0]}>
        <div style={{
          fontFamily: 'monospace', textAlign: 'center', whiteSpace: 'nowrap',
          padding: '0.35rem 0.9rem',
          border: `1px solid ${armed ? '#39FF14' : 'rgba(57,255,20,0.5)'}`,
          background: armed ? 'rgba(57,255,20,0.12)' : 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          boxShadow: armed ? '0 0 22px rgba(57,255,20,0.55)' : '0 0 10px rgba(57,255,20,0.2)',
          userSelect: 'none',
          fontSize: '9px', letterSpacing: '0.3em',
          color: armed ? '#39FF14' : 'rgba(57,255,20,0.75)',
          textTransform: 'uppercase', transition: 'all 0.2s',
        }}>
          {armed ? '[ CLICK_TO_DISCONNECT ]' : '[ DISCONNECT ]'}
        </div>
      </Html>

      {/* Domain label — only while the crosshair is on the face's button cone. */}
      {d && (
        <Html
          position={[d.axis[0] * FACE_DIST, d.axis[1] * FACE_DIST, d.axis[2] * FACE_DIST]}
          center
          pointerEvents="none"
          zIndexRange={[20, 0]}
        >
          <div style={{
            fontFamily: 'monospace',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            padding: '0.6rem 1.25rem',
            border: '1px solid rgba(191,0,255,0.6)',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 24px rgba(191,0,255,0.35)',
            userSelect: 'none',
          }}>
            <div style={{ fontSize: '8px', letterSpacing: '0.3em', color: '#39FF14', opacity: 0.8, textTransform: 'uppercase' }}>
              {d.code} // Target_Locked
            </div>
            <div style={{ fontSize: '13px', letterSpacing: '0.15em', color: '#BF00FF', marginTop: '0.25rem', textTransform: 'uppercase', fontWeight: 'bold' }}>
              {d.title}
            </div>
            <div style={{ width: '100%', height: '1px', background: 'rgba(191,0,255,0.4)', marginTop: '0.4rem' }} />
          </div>
        </Html>
      )}
    </>
  );
}
