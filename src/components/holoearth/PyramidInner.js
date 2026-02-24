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
const INTRO_DELAY = 1.5;
const INTRO_DURATION = 2.0;

// --- Shaders for Inner Effect ---
const holoVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vY;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    vY = position.y;
    gl_Position = projectionMatrix * mvPos;
  }
`;

const holoFragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uExplosionProgress;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vY;
  
  // Simplex-ish noise for organic variation
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  void main() {
    // 1. Fresnel edge glow — brighter at grazing angles
    float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
    fresnel = pow(fresnel, 2.5) * 1.2;
    
    // 2. Layered scanlines with varying thickness and speed
    float scan1 = smoothstep(0.3, 0.35, sin(vUv.y * 100.0 - uTime * 3.0) * 0.5 + 0.5);
    float scan2 = smoothstep(0.6, 0.65, sin(vUv.y * 40.0 + uTime * 1.5) * 0.5 + 0.5) * 0.5;
    float scan3 = smoothstep(0.85, 0.9, sin(vUv.y * 200.0 - uTime * 8.0) * 0.5 + 0.5) * 0.15;
    float scanlines = scan1 * 0.12 + scan2 * 0.08 + scan3;
    
    // 3. Holographic interference pattern — rainbow shimmer
    float interference = sin(vUv.y * 300.0 + uTime * 2.0) * sin(vUv.x * 150.0 - uTime);
    interference = interference * 0.5 + 0.5;
    vec3 rainbow = vec3(
      sin(interference * 6.28 + 0.0) * 0.5 + 0.5,
      sin(interference * 6.28 + 2.09) * 0.5 + 0.5,
      sin(interference * 6.28 + 4.19) * 0.5 + 0.5
    );
    
    // 4. Rising data pulse — thicker, more visible
    float pulseY = fract(uTime * 0.15);
    float pulse = smoothstep(0.0, 0.06, 0.03 - abs(pulseY - vUv.y));
    float pulse2 = smoothstep(0.0, 0.12, 0.06 - abs(fract(uTime * 0.1 + 0.5) - vUv.y)) * 0.5;
    
    // 5. Tech grid with glow — disable during explosion
    float gridMultiplier = uExplosionProgress > 0.05 ? 0.0 : 1.0;
    float gridX = smoothstep(0.02, 0.0, abs(fract(vUv.x * 16.0) - 0.5) - 0.48);
    float gridY = smoothstep(0.02, 0.0, abs(fract(vUv.y * 16.0) - 0.5) - 0.48);
    float grid = max(gridX, gridY) * 0.12 * gridMultiplier;
    
    // 6. Data flow noise — organic digital texture
    float dataFlow = noise(vUv * 8.0 + vec2(0.0, -uTime * 0.5));
    dataFlow = smoothstep(0.4, 0.6, dataFlow) * 0.08;
    
    // 7. Subtle flicker
    float flicker = 0.96 + 0.04 * hash(vec2(floor(uTime * 12.0), 0.0));

    // Combine all effects
    float alpha = (scanlines + pulse * 0.4 + pulse2 * 0.3 + grid + dataFlow + fresnel * 0.25) * flicker;
    
    // Vertical fade at edges
    alpha *= smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
    
    // Mix base color with holographic rainbow
    vec3 finalColor = mix(uColor, rainbow * uColor * 2.0, 0.15 + fresnel * 0.2);
    finalColor += uColor * fresnel * 0.6; // Edge highlight
    finalColor += vec3(1.0) * pulse * 0.3; // White pulse flash
    
    // Global Opacity Control
    alpha *= uOpacity;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// --- Inner Holographic Effect ---
const InnerHoloEffect = ({ radiusTop, radiusBottom, height, isGoldMode, explosionProgress = 0 }) => {
  const materialRef = useRef(null);
  const color = useMemo(() => new THREE.Color(isGoldMode ? '#fbbf24' : '#d8b4fe'), [isGoldMode]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uColor.value.lerp(color, 0.1);
      materialRef.current.uniforms.uExplosionProgress.value = explosionProgress;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#d8b4fe') },
    uOpacity: { value: 1.0 },
    uExplosionProgress: { value: 0 }
  }), []);

  return (
    <mesh scale={[0.98, 0.98, 0.98]}>
      <cylinderGeometry args={[radiusTop * 0.99, radiusBottom * 0.99, height, 4, 8]} />
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
  const glowMeshRef = useRef(null);
  const wire2MatRef = useRef(null);

  useFrame((state, delta) => {
    const orangeColor = new THREE.Color("#ff6600");
    const goldColor = new THREE.Color("#fbbf24");
    const darkGoldColor = new THREE.Color("#b45309");
    const neonShadowColor = new THREE.Color("#fb923c");

    // Chunk glow fade: pyramid starts at 10% opacity when chunks appear,
    // then gradually returns to 100% over 9 frames
    let chunkGlowFade = 1.0;
    if (explosionProgress > 0 && explosionProgress < 0.078) {
      const fadeProgress = explosionProgress / 0.078;
      chunkGlowFade = 0.1 + fadeProgress * 0.9;
    }

    // Particle occlusion - pyramid is behind smokescreen during explosion
    const occlusionMult = 1.0 - particleOcclusion * 0.85;
    
    const isDuringExplosion = explosionProgress > 0.05;
    const targetEdgeOpacity = (insideEarth && !isDuringExplosion ? 0.15 : 1) * occlusionMult * chunkGlowFade;
    const targetGlassOpacity = (insideEarth && !isDuringExplosion ? 0.07 : 0.25) * occlusionMult * chunkGlowFade;
    const targetWireOpacity = (insideEarth && !isDuringExplosion ? 0.04 : 0.15) * occlusionMult * chunkGlowFade;
    const targetEmissive = (insideEarth && !isDuringExplosion ? 0.05 : 0.35) * occlusionMult * chunkGlowFade;

    const lerpSpeed = chunkGlowFade < 1.0 ? 15 : 3;

    if (edgesRef.current && edgesRef.current.material) {
      const targetColor = isGoldMode ? goldColor : orangeColor;
      edgesRef.current.material.color.lerp(targetColor, delta * 3);
      edgesRef.current.material.opacity = THREE.MathUtils.lerp(edgesRef.current.material.opacity, targetEdgeOpacity, delta * lerpSpeed);
    }

    if (glassMatRef.current) {
      glassMatRef.current.opacity = THREE.MathUtils.lerp(glassMatRef.current.opacity, targetGlassOpacity, delta * lerpSpeed);
      glassMatRef.current.emissiveIntensity = THREE.MathUtils.lerp(glassMatRef.current.emissiveIntensity, targetEmissive, delta * lerpSpeed);
    }

    if (wireMatRef.current) {
      wireMatRef.current.opacity = THREE.MathUtils.lerp(wireMatRef.current.opacity, targetWireOpacity, delta * lerpSpeed);
    }
    
    if (wire2MatRef.current) {
      wire2MatRef.current.opacity = THREE.MathUtils.lerp(wire2MatRef.current.opacity, targetWireOpacity * 0.4, delta * lerpSpeed);
    }
    
    // Fresnel glow pulse
    if (glowMeshRef.current && glowMeshRef.current.material) {
      const pulse = (0.12 + Math.sin(state.clock.elapsedTime * 2.0) * 0.04) * occlusionMult * chunkGlowFade;
      glowMeshRef.current.material.opacity = pulse;
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
      {/* Main Glassy Shell — enhanced transmission glass */}
      <mesh>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshPhysicalMaterial
          ref={glassMatRef}
          color={isGoldMode ? "#d97706" : basePurple}
          emissive={isGoldMode ? "#92400e" : glowPurple}
          emissiveIntensity={insideEarth && explosionProgress < 0.05 ? 0.12 : (0.7 - 0.2 * Math.max(0, Math.min(1, (explosionProgress - 0.4) / 0.3)))}
          transparent
          opacity={insideEarth && explosionProgress < 0.05 ? 0.07 : 0.25}
          roughness={0.05}
          metalness={0.9}
          transmission={0.92}
          thickness={3.0}
          attenuationColor={isGoldMode ? "#fcd34d" : "#e9d5ff"}
          attenuationDistance={3}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          ior={1.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Fresnel edge glow layer — additive outer shell */}
      <mesh ref={glowMeshRef} scale={[1.015, 1.01, 1.015]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshBasicMaterial 
          color={isGoldMode ? "#fbbf24" : "#c084fc"}
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Primary Structural Edges (Animated Color) */}
      <mesh>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges ref={edgesRef} threshold={10} color="#ff6600" scale={1.005} />
      </mesh>

      {/* Neon Drop Shadow 1: Hard Dark Offset */}
      <mesh position={[0.04, -0.04, 0.04]} scale={[1.02, 1.02, 1.02]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges ref={shadowHardRef} threshold={10} color="#b45309" />
      </mesh>

      {/* Neon Drop Shadow 2: Soft Glow Offset */}
      <mesh position={[0.08, -0.08, 0.08]} scale={[1.04, 1.04, 1.04]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges ref={shadowSoftRef} threshold={10} color="#fb923c" />
      </mesh>

      {/* Internal Structure — dual wireframe for depth */}
      <mesh scale={[0.85, 0.98, 0.85]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 3]} />
        <meshBasicMaterial
          ref={wireMatRef}
          color={isGoldMode ? "#d97706" : "#22d3ee"}
          wireframe
          transparent
          opacity={insideEarth && explosionProgress < 0.05 ? 0.04 : 0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Second inner wireframe — offset rotation for depth parallax */}
      <mesh scale={[0.7, 0.96, 0.7]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 2]} />
        <meshBasicMaterial 
          ref={wire2MatRef}
          color={isGoldMode ? "#fbbf24" : "#a78bfa"} 
          wireframe 
          transparent 
          opacity={0.06} 
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Caps — enhanced with glow */}
      <group position={[0, height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[radiusTop * 0.75, radiusTop, 4]} />
          <meshPhysicalMaterial 
            color={frameColor} 
            metalness={0.95} 
            roughness={0.1} 
            emissive={isGoldMode ? "#92400e" : "#4c1d95"}
            emissiveIntensity={0.3}
            side={THREE.DoubleSide} 
          />
          <Edges threshold={10} color={isGoldMode ? "#fbbf24" : "#ff6600"} opacity={0.6} />
        </mesh>
      </group>
      
      {showBottomCap && (
        <group position={[0, -height / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[radiusBottom * 0.75, radiusBottom, 4]} />
            <meshPhysicalMaterial 
              color={frameColor} 
              metalness={0.95} 
              roughness={0.1}
              emissive={isGoldMode ? "#92400e" : "#4c1d95"}
              emissiveIntensity={0.3}
              side={THREE.DoubleSide} 
            />
            <Edges threshold={10} color={isGoldMode ? "#fbbf24" : "#ff6600"} opacity={0.6} />
          </mesh>
        </group>
      )}

      <InnerHoloEffect
        radiusTop={radiusTop * 0.9}
        radiusBottom={radiusBottom * 0.9}
        height={height}
        isGoldMode={isGoldMode}
        explosionProgress={explosionProgress}
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
// - coreScaleMultiplier: 1-5 scale for the inner core (used during convergence animation)
const PyramidInner = ({ 
  isActive = false, 
  scrollProgress = 0, 
  showLabels = false,
  orbitalRotationY = null,
  explosionProgress = 0,
  coreScaleMultiplier = 1, // Scale multiplier for inner core during convergence
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

    // Container float animation (only when active and showing)
    if (containerRef.current) {
      // Device-specific entity Y offset
      // Desktop/Laptop: 1rem up - 1rem down = 0
      // Tablet: 0 - 0.5rem down = -0.065
      const entityYOffset = window.innerWidth >= 1024 ? 0 : // Desktop/Laptop: back to original
                            window.innerWidth >= 768 ? -0.065 : // Tablet: 0.5rem down
                            0; // Mobile
      
      const floatY = 2.5 + entityYOffset + Math.sin(state.clock.elapsedTime) * 0.1;
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
      // Entity center point - where layers should float FROM (start position)
      // Adjusted to match actual entity visual position on screen
      const entityYOffset = window.innerWidth >= 1024 ? 0 :
                            window.innerWidth >= 768 ? -0.065 :
                            0;
      // Set to 0.75 to match entity placement (2rem higher than 0.5)
      const containerPos = new THREE.Vector3(0, 0.75 + entityYOffset, 0);
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
  // Frames 14-22: normal depth rendering - particles behind pyramid not visible
  // After frame 22 (explosionProgress > 0.25): pyramid behind particles (smokescreen)
  const pyramidRenderOrder = explosionProgress > 0.25 && explosionProgress < 0.35 ? -10 : 0;

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

      {/* Labels are now rendered as pure DOM elements in App.js for completely static positioning */}

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

          <HoloCore isGoldMode={isGoldMode} opacity={entityOpacity} scaleMultiplier={coreScaleMultiplier} />
        </group>
      )}
    </group>
  );
};

export default PyramidInner;
