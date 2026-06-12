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
    const glowBoost = Math.max(0, proximity) ** 5 * 15.0 * flicker;

    const boostColor = new THREE.Color(1, 1, 1).multiplyScalar(1 + glowBoost);
    if (baseColor) {
      ref.current.setColorAt(i, baseColor.clone().multiply(boostColor));
    } else {
      ref.current.setColorAt(i, boostColor);
    }
  });
  ref.current.instanceMatrix.needsUpdate = true;
  if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
};

/* Holographic in-scene return button, visible only inside. */
export function HolographicButton({ onReturn, isInside }) {
  const [hovered, setHovered] = useState(false);

  if (!isInside) return null;

  return (
    <group position={[0, -2.5, -4]} rotation={[-Math.PI / 3, 0, 0]}>
      <Html transform occlude distanceFactor={6} pointerEvents="auto">
        <button
          onClick={onReturn}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.125rem',
            border: `2px solid ${hovered ? '#39FF14' : 'rgba(191,0,255,0.6)'}`,
            fontFamily: 'monospace',
            fontSize: '10px',
            letterSpacing: '0.4em',
            transition: 'all 0.5s',
            background: hovered ? 'rgba(191,0,255,0.3)' : 'rgba(0,0,0,0.4)',
            color: hovered ? '#39FF14' : '#BF00FF',
            boxShadow: hovered ? '0 0 30px #39FF14' : '0 0 15px rgba(191,0,255,0.3)',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            backdropFilter: 'blur(24px)',
            cursor: 'pointer',
            textTransform: 'uppercase',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span style={{ opacity: 0.5, fontSize: '8px', letterSpacing: '0.1em' }}>Return_Signal</span>
          <span>[ DISCONNECT ]</span>
          <div style={{ width: '100%', height: '1px', background: 'currentColor', marginTop: '0.25rem', opacity: 0.2 }} />
        </button>
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
    const flicker = 1.0 + Math.sin(clock.getElapsedTime() * 50) * 0.15;

    // Suppress the lantern while the cubes overlap (folded state)
    const foldState = Math.abs(Math.sin(time * 2));
    const effectSuppressor = THREE.MathUtils.lerp(0.1, 1.0, foldState);
    const glowColorFactor = effectSuppressor * flicker;

    const cosT = Math.cos(time);
    const sinT = Math.sin(time);

    // 4D -> 3D perspective projection with dynamic scale for the room illusion
    const baseDistance = 2.2;
    const currentDistance = THREE.MathUtils.lerp(baseDistance, 4.0, expansionRef.current);
    const scale = THREE.MathUtils.lerp(3.0, 12.0, expansionRef.current);

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
      lightARef.current.intensity = 15;
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

      <pointLight ref={lightARef} color="#39FF14" distance={12} decay={2} intensity={15} />
      <pointLight color="#BF00FF" position={[0, 0, 0]} intensity={12} distance={15} />
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
      rotation.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotation.current.x));
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
export function FaceTargets({ isInside, paused, onSelect }) {
  const { camera, gl } = useThree();
  const [targeted, setTargeted] = useState(-1);
  const targetedRef = useRef(-1);
  const axes = useMemo(() => DOMAINS.map((d) => new THREE.Vector3(...d.axis)), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!isInside || paused) {
      if (targetedRef.current !== -1) { targetedRef.current = -1; setTargeted(-1); }
      return;
    }
    camera.getWorldDirection(fwd);
    let best = -Infinity;
    let bestIdx = 0;
    for (let i = 0; i < axes.length; i++) {
      const d = fwd.dot(axes[i]);
      if (d > best) { best = d; bestIdx = i; }
    }
    if (bestIdx !== targetedRef.current) {
      targetedRef.current = bestIdx;
      setTargeted(bestIdx);
    }
  });

  // Click-to-select (task 4b). Pointer lock still delivers `click`. While
  // locked, a click opens the targeted domain; when not locked (e.g. just
  // after closing an overlay), the click re-engages FPS look instead.
  useEffect(() => {
    const el = gl.domElement;
    const handleClick = () => {
      if (paused || !isInside) return;
      if (document.pointerLockElement === el) {
        if (targetedRef.current >= 0 && onSelect) onSelect(DOMAINS[targetedRef.current]);
      } else {
        const p = el.requestPointerLock();
        if (p && p.catch) p.catch(() => {});
      }
    };
    el.addEventListener('click', handleClick);
    return () => el.removeEventListener('click', handleClick);
  }, [gl, isInside, paused, onSelect]);

  if (!isInside || paused || targeted < 0) return null;
  const d = DOMAINS[targeted];

  return (
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
  );
}
