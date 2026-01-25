import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Edges } from '@react-three/drei';
import * as THREE from 'three';
import HoloCore from './HoloCore';

// Smoothstep helper for particle occlusion calculations
const smoothstep = (edge0, edge1, x) => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

// Pyramid constants - scaled down to fit inside earth
const TOTAL_LAYERS = 5;
const PYRAMID_HEIGHT = 2.5; // Smaller to fit in earth core
const BASE_RADIUS = 1.6;    // Match the cone radius
const LAYER_THICKNESS = PYRAMID_HEIGHT / TOTAL_LAYERS;
const SPACING = 0.04;

// Timing constants
const INTRO_DELAY = 3.0;
const INTRO_DURATION = 2.0;

// --- Shaders for Inner Effect ---
const holoVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const holoFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  
  void main() {
    float scanline = step(0.8, sin(vUv.y * 80.0 - uTime * 4.0));
    float pulse = smoothstep(0.0, 0.2, 0.1 - abs(fract(uTime * 0.2) - vUv.y));
    float gridX = step(0.97, fract(vUv.x * 20.0));
    float gridY = step(0.97, fract(vUv.y * 20.0));
    float grid = max(gridX, gridY) * 0.1;
    float noise = fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
    float flicker = 0.95 + 0.05 * noise;
    float alpha = (scanline * 0.15 + pulse * 0.3 + grid) * flicker;
    alpha *= smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    alpha *= uOpacity;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

// --- Inner Holographic Effect ---
const InnerHoloEffect = ({ radiusTop, radiusBottom, height, isGoldMode }) => {
  const materialRef = useRef(null);
  const color = useMemo(() => new THREE.Color(isGoldMode ? '#fbbf24' : '#5d2e0f'), [isGoldMode]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uColor.value.lerp(color, 0.1);
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#5d2e0f') },
    uOpacity: { value: 1.0 }
  }), []);

  return (
    <mesh scale={[0.98, 0.98, 0.98]}>
      <cylinderGeometry args={[radiusTop * 0.99, radiusBottom * 0.99, height, 4, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={holoVertexShader}
        fragmentShader={holoFragmentShader}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

// --- Tech Layer Component (Visual Only) ---
const TechLayer = ({ radiusTop, radiusBottom, height, isGoldMode, showBottomCap, insideEarth = false, isAfterFrame15 = false, explosionProgress = 0, particleOcclusion = 0 }) => {
  const basePurple = "#a855f7";
  const glowPurple = "#6b21a8";
  const edgesRef = useRef(null);
  const shadowHardRef = useRef(null);
  const shadowSoftRef = useRef(null);
  const glassMatRef = useRef(null);
  const wireMatRef = useRef(null);

  useFrame((state, delta) => {
    const orangeColor = new THREE.Color("#ff6600");
    const goldColor = new THREE.Color("#fbbf24");
    const darkGoldColor = new THREE.Color("#b45309");
    const neonShadowColor = new THREE.Color("#fb923c");

    // Keep full opacity during explosion for vibrant pyramid visibility
    // Only reduce during orbital mode when inside earth
    // Apply particle occlusion - pyramid is behind smokescreen during explosion
    const occlusionMult = 1.0 - particleOcclusion * 0.85; // Reduce to 15% visibility at peak occlusion
    
    // During explosion, use higher opacity to block particles from shining through
    const isDuringExplosion = explosionProgress > 0.05;
    const targetEdgeOpacity = (insideEarth && !isDuringExplosion ? 0.15 : 1) * occlusionMult;
    const targetGlassOpacity = (insideEarth && !isDuringExplosion ? 0.07 : 0.35) * occlusionMult;
    const targetWireOpacity = (insideEarth && !isDuringExplosion ? 0.04 : 0.15) * occlusionMult;
    const targetEmissive = (insideEarth ? 0.05 : 0.35) * occlusionMult;

    if (edgesRef.current && edgesRef.current.material) {
      const targetColor = isGoldMode ? goldColor : orangeColor;
      // Darken orange edges to 0.7 intensity
      if (!isGoldMode) {
        edgesRef.current.material.color.copy(orangeColor).multiplyScalar(0.7);
      } else {
        edgesRef.current.material.color.lerp(targetColor, delta * 3);
      }
      edgesRef.current.material.opacity = THREE.MathUtils.lerp(edgesRef.current.material.opacity, targetEdgeOpacity, delta * 3);
    }

    if (glassMatRef.current) {
      glassMatRef.current.opacity = THREE.MathUtils.lerp(glassMatRef.current.opacity, targetGlassOpacity, delta * 3);
      glassMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(glassMatRef.current.emissiveIntensity, targetEmissive, delta * 3);
    }

    if (wireMatRef.current) {
      wireMatRef.current.opacity = THREE.MathUtils.lerp(wireMatRef.current.opacity, targetWireOpacity, delta * 3);
    }

    const targetShadowOpacity = isGoldMode ? 0.3 : 0;
    const targetGlowOpacity = isGoldMode ? 0.2 : 0;

    if (shadowHardRef.current && shadowHardRef.current.material) {
      const mat = shadowHardRef.current.material;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetShadowOpacity, delta * 2);
      mat.color = darkGoldColor;
      mat.transparent = true;
    }

    if (shadowSoftRef.current && shadowSoftRef.current.material) {
      const mat = shadowSoftRef.current.material;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetGlowOpacity, delta * 2);
      mat.color.lerp(neonShadowColor, delta * 2);
      mat.transparent = true;
    }
  });

  const frameColor = isGoldMode ? "#b45309" : "#4c1d95";

  return (
    <group>
      <mesh>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshPhysicalMaterial
          ref={glassMatRef}
          color={basePurple}
          emissive={glowPurple}
          emissiveIntensity={insideEarth ? 0.12 : (0.7 - 0.2 * Math.max(0, Math.min(1, (explosionProgress - 0.4) / 0.3)))}
          transparent
          opacity={insideEarth ? 0.07 : 0.35}
          roughness={0.1}
          metalness={0.8}
          transmission={0.9}
          thickness={2.5}
          attenuationColor="#ffffff"
          attenuationDistance={5}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges ref={edgesRef} threshold={10} color="#ff6600" scale={1.005} />
      </mesh>

      <mesh position={[0.04, -0.04, 0.04]} scale={[1.02, 1.02, 1.02]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges ref={shadowHardRef} threshold={10} color="#b45309" />
      </mesh>

      <mesh position={[0.08, -0.08, 0.08]} scale={[1.04, 1.04, 1.04]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges ref={shadowSoftRef} threshold={10} color="#fb923c" />
      </mesh>

      <mesh scale={[0.85, 0.98, 0.85]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 2]} />
        <meshBasicMaterial
          ref={wireMatRef}
          color={isGoldMode ? "#d97706" : "#22d3ee"}
          wireframe
          transparent
          opacity={insideEarth ? 0.04 : 0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <group position={[0, height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[radiusTop * 0.8, radiusTop, 4]} />
          <meshStandardMaterial color={frameColor} metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
          <Edges threshold={10} color={isGoldMode ? "#fbbf24" : "#ff6600"} opacity={0.5} />
        </mesh>
      </group>
      
      {showBottomCap && (
        <group position={[0, -height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[radiusBottom * 0.8, radiusBottom, 4]} />
            <meshStandardMaterial color={frameColor} metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
            <Edges threshold={10} color={isGoldMode ? "#fbbf24" : "#ff6600"} opacity={0.5} />
          </mesh>
        </group>
      )}

      <InnerHoloEffect
        radiusTop={radiusTop * 0.9}
        radiusBottom={radiusBottom * 0.9}
        height={height}
        isGoldMode={isGoldMode}
      />
    </group>
  );
};

// --- Main Pyramid Inner Component ---
// This is embedded inside HoloEarth, no Canvas wrapper
// Props:
// - isActive: when true (button visible), start 3s timer then animate
// - scrollProgress: 0-1 scroll value for layer animation AFTER intro
// - showLabels: whether to render Html labels (only when zoomed in)
// - orbitalRotationY: ref to the orbital/earth Y rotation (sync when not active)
// - onIntroComplete: callback when intro animation finishes (enables scroll for layers)
// - onLayerStateChange: callback to expose layer state (completedLayerIndex, isIntroActive, isGoldMode) for DOM labels
const PyramidInner = ({ 
  isActive = false, 
  scrollProgress = 0, 
  showLabels = false,
  orbitalRotationY = null,
  explosionProgress = 0,
  onSendComplete = () => {},
  onIntroComplete = () => {},
  onLayerStateChange = () => {}
}) => {
  const groupRef = useRef(null);
  const containerRef = useRef(null);
  const buttonGroupRef = useRef(null);

  // Container refs
  const containerBoxMatRef = useRef(null);
  const containerOctMatRef = useRef(null);
  const containerEdgesRef = useRef(null);
  const containerShadowHardRef = useRef(null);
  const containerShadowSoftRef = useRef(null);

  const [completedLayerIndex, setCompletedLayerIndex] = useState(0);
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [isGoldMode, setIsGoldMode] = useState(false);
  const [entityOpacity, setEntityOpacity] = useState(0);

  // Notify parent when layer state changes for DOM labels
  useEffect(() => {
    onLayerStateChange({
      completedLayerIndex,
      isIntroActive,
      isGoldMode,
      introComplete: !isIntroActive && showLabels // Intro is complete when not active and showing labels
    });
  }, [completedLayerIndex, isIntroActive, isGoldMode, showLabels, onLayerStateChange]);

  // Define handleGoldMode before it's used in useEffect
  const handleGoldMode = useCallback(() => {
    setIsGoldMode(true);
    onSendComplete();
  }, [onSendComplete]);

  // Listen for gold mode trigger from DOM labels
  useEffect(() => {
    const handleGoldModeTrigger = () => {
      handleGoldMode();
    };
    window.addEventListener('triggerGoldMode', handleGoldModeTrigger);
    return () => window.removeEventListener('triggerGoldMode', handleGoldModeTrigger);
  }, [handleGoldMode]);

  const activationTimeRef = useRef(null);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      activationTimeRef.current = null;
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Generate layers
  const layers = useMemo(() => {
    return Array.from({ length: TOTAL_LAYERS }).map((_, i) => {
      const bottomY = i * LAYER_THICKNESS;
      const topY = (i + 1) * LAYER_THICKNESS;
      const radiusBottom = BASE_RADIUS * (1 - bottomY / PYRAMID_HEIGHT);
      const radiusTop = BASE_RADIUS * (1 - topY / PYRAMID_HEIGHT);

      return {
        index: i,
        radiusTop,
        radiusBottom,
        height: LAYER_THICKNESS - SPACING,
        yPos: bottomY + (LAYER_THICKNESS / 2) - (PYRAMID_HEIGHT / 2),
      };
    });
  }, []);

  const totalMovable = TOTAL_LAYERS - 1;

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Pyramid rotation logic:
    // - When NOT active (button invisible, orbital mode): sync with orbital/earth rotation
    // - When active (button visible, zoomed in): own independent rotation
    if (!isActive && orbitalRotationY && orbitalRotationY.current !== undefined) {
      // Orbital mode: follow earth's rotation
      groupRef.current.rotation.y = orbitalRotationY.current;
    } else if (isActive) {
      // Active mode: independent slow rotation
      groupRef.current.rotation.y += delta * 0.2;
    }
    
    // Labels are rendered outside the rotating group - no counter-rotation needed

    // Container float animation (only when active and showing)
    if (containerRef.current) {
      const floatY = 2.5 + Math.sin(state.clock.elapsedTime) * 0.1;
      containerRef.current.position.y = floatY;
      containerRef.current.rotation.y += delta * 0.1;
      
      if (buttonGroupRef.current) {
        buttonGroupRef.current.position.y = floatY;
      }
    }

    // Determine intro state based on isActive
    let introFactor = 1; // Default: layers at pyramid position
    let showContent = false;

    if (!isActive) {
      // Not active - only pyramid visible, no labels/entity
      introFactor = 1;
      showContent = false;
      activationTimeRef.current = null;
      if (entityOpacity !== 0) setEntityOpacity(0);
      if (!isIntroActive) setIsIntroActive(true);
    } else {
      // Active - run timed intro
      showContent = showLabels;

      if (activationTimeRef.current === null) {
        activationTimeRef.current = state.clock.elapsedTime;
      }

      const timeSinceActive = state.clock.elapsedTime - activationTimeRef.current;

      if (timeSinceActive < INTRO_DELAY) {
        // Phase 1: Pyramid formed, labels visible (if showLabels), entity hidden
        introFactor = 1;
        if (!isIntroActive) setIsIntroActive(true);
        if (entityOpacity !== 0) setEntityOpacity(0);
      } else if (timeSinceActive < INTRO_DELAY + INTRO_DURATION) {
        // Phase 2: Layers floating up to entity
        const t = (timeSinceActive - INTRO_DELAY) / INTRO_DURATION;
        const eased = t * t * (3 - 2 * t);
        introFactor = 1 - eased;
        if (!isIntroActive) setIsIntroActive(true);
        const fade = Math.min(t / 0.75, 1);
        const easeFade = fade * fade * (3 - 2 * fade);
        setEntityOpacity(easeFade);
      } else {
        // Phase 3: Intro complete, scroll controls
        introFactor = 0;
        if (isIntroActive) {
          setIsIntroActive(false);
          onIntroComplete(); // Notify parent that scroll can now control layers
        }
        if (entityOpacity !== 1) setEntityOpacity(1);
      }
    }

    // Container animation
    const orangeColor = new THREE.Color("#ff6600");
    const goldColor = new THREE.Color("#fbbf24");
    const contentOpacity = showContent ? entityOpacity : 0;

    if (containerBoxMatRef.current) containerBoxMatRef.current.opacity = 0.05 * contentOpacity;
    if (containerOctMatRef.current) containerOctMatRef.current.opacity = 0.3 * contentOpacity;

    if (containerEdgesRef.current && containerEdgesRef.current.material) {
      const targetColor = isGoldMode ? goldColor : orangeColor;
      containerEdgesRef.current.material.color.lerp(targetColor, delta * 3);
      containerEdgesRef.current.material.opacity = contentOpacity;
    }

    const targetShadowOp = isGoldMode ? 0.3 : 0;
    const targetGlowOp = isGoldMode ? 0.2 : 0;

    if (containerShadowHardRef.current && containerShadowHardRef.current.material) {
      const mat = containerShadowHardRef.current.material;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetShadowOp * contentOpacity, delta * 2);
      mat.transparent = true;
      mat.color = new THREE.Color("#b45309");
    }

    if (containerShadowSoftRef.current && containerShadowSoftRef.current.material) {
      const mat = containerShadowSoftRef.current.material;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetGlowOp * contentOpacity, delta * 2);
      mat.transparent = true;
      mat.color = new THREE.Color("#fb923c");
    }

    // Scroll logic - each layer animates over one scroll segment
    const currentCompleted = Math.min(
      Math.floor(scrollProgress * totalMovable + 0.05),
      totalMovable
    );
    if (completedLayerIndex !== currentCompleted) {
      setCompletedLayerIndex(currentCompleted);
    }

    // Animate layers (3D only - labels are handled in DOM)
    layers.forEach((layer, i) => {
      const meshChild = groupRef.current.children[i];

      if (!meshChild) return;

      if (i === 0) {
        meshChild.visible = true;
        return;
      }

      // Range for each layer
      const rangeStart = (i - 1) / totalMovable;
      const rangeEnd = i / totalMovable;

      let scrollR = 0;
      if (scrollProgress >= rangeEnd) {
        scrollR = 1;
      } else if (scrollProgress > rangeStart) {
        scrollR = (scrollProgress - rangeStart) / (rangeEnd - rangeStart);
      }

      const effectiveR = scrollR + (1 - scrollR) * introFactor;

      const targetPos = new THREE.Vector3(0, layer.yPos, 0);
      const containerPos = new THREE.Vector3(0, 1.7, 0);
      const inverseMatrix = groupRef.current.matrixWorld.clone().invert();
      const localStartPos = containerPos.clone().applyMatrix4(inverseMatrix);

      meshChild.position.lerpVectors(localStartPos, targetPos, effectiveR);

      const targetScale = new THREE.Vector3(1, 1, 1);
      const startScale = new THREE.Vector3(0.01, 0.01, 0.01);
      meshChild.scale.lerpVectors(startScale, targetScale, effectiveR);

      meshChild.visible = effectiveR > 0.05;
    });
  });

  // Calculate pyramid render order - should be behind particles only during smokescreen phase
  // Lower renderOrder = renders first (behind), Higher = renders later (in front)
  // After frame 24 (0.26): pyramid uses normal depth for proper 3D sphere effect
  const pyramidRenderOrder = explosionProgress > 0.1 && explosionProgress < 0.26 ? -10 : 0;

  return (
    <group>
      {/* Rotating Pyramid Layers - renderOrder set to be behind particles during explosion */}
      <group ref={groupRef} renderOrder={pyramidRenderOrder}>
        {layers.map((layer) => {
          // Calculate particle occlusion based on explosion progress
          // Peak occlusion during mid-explosion (0.2-0.6 range) when particles are densest
          // Creates a "smokescreen" effect that the pyramid is behind
          const occlusionRamp = explosionProgress < 0.15 ? 0 :
            explosionProgress < 0.5 ? smoothstep(0.15, 0.35, explosionProgress) :
            explosionProgress < 0.7 ? 1.0 - smoothstep(0.5, 0.7, explosionProgress) * 0.6 :
            0.4 * (1.0 - smoothstep(0.7, 0.85, explosionProgress));
          
          return (
            <group key={layer.index} position={[0, layer.yPos, 0]}>
              <TechLayer
                radiusTop={layer.radiusTop}
                radiusBottom={layer.radiusBottom}
                height={layer.height}
                isGoldMode={isGoldMode}
                showBottomCap={layer.index === 0}
                insideEarth={!isActive}
                isAfterFrame15={explosionProgress > 0.4}
                explosionProgress={explosionProgress}
                particleOcclusion={occlusionRamp}
              />
            </group>
          );
        })}
      </group>

      {/* Labels are now rendered as pure DOM in App.js - no 3D Html components */}

      {/* Floating Container - only when showLabels */}
      {showLabels && (
        <group ref={containerRef} position={[0, 2.5, 0]} scale={[0.3, 0.3, 0.3]} visible={entityOpacity > 0}>
          <mesh>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial
              ref={containerBoxMatRef}
              color={isGoldMode ? "#fbbf24" : "#a855f7"}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>

          <mesh>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <Edges ref={containerEdgesRef} color="#ff6600" threshold={15} />
          </mesh>

          <mesh position={[0.08, -0.08, 0.08]}>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <Edges ref={containerShadowHardRef} threshold={15} color="#b45309" />
          </mesh>

          <mesh position={[0.15, -0.15, 0.15]}>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <Edges ref={containerShadowSoftRef} threshold={15} color="#fb923c" />
          </mesh>

          <mesh>
            <octahedronGeometry args={[2.5, 0]} />
            <meshBasicMaterial
              ref={containerOctMatRef}
              color={isGoldMode ? "#fcd34d" : "#d8b4fe"}
              wireframe
              transparent
              opacity={0}
            />
          </mesh>

          <HoloCore isGoldMode={isGoldMode} opacity={entityOpacity} />
        </group>
      )}
    </group>
  );
};

export default PyramidInner;
