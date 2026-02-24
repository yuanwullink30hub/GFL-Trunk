import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Edges } from '@react-three/drei';
import * as THREE from 'three';
import HoloLabel from './HoloLabel';
import HoloCore from './HoloCore';

const TOTAL_LAYERS = 5;
const PYRAMID_HEIGHT = 5;
const BASE_RADIUS = 3.5;
const LAYER_THICKNESS = PYRAMID_HEIGHT / TOTAL_LAYERS;
const SPACING = 0.08;

// Timing constants
const INTRO_DELAY = 1.5;      // Wait 1.5 seconds before layers start floating up
const INTRO_DURATION = 2.0;   // 2 seconds for layers to float up to entity 

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
    
    // 5. Tech grid with glow
    float gridX = smoothstep(0.02, 0.0, abs(fract(vUv.x * 16.0) - 0.5) - 0.48);
    float gridY = smoothstep(0.02, 0.0, abs(fract(vUv.y * 16.0) - 0.5) - 0.48);
    float grid = max(gridX, gridY) * 0.12;
    
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

// --- Inner Holographic Effect Component ---
const InnerHoloEffect = ({ radiusTop, radiusBottom, height, isGoldMode }) => {
    const materialRef = useRef(null);
    
    const color = useMemo(() => {
        return new THREE.Color(isGoldMode ? '#fbbf24' : '#d8b4fe');
    }, [isGoldMode]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
            materialRef.current.uniforms.uColor.value.lerp(color, 0.1); 
        }
    });

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#d8b4fe') },
        uOpacity: { value: 1.0 }
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

// --- Tech Layer Component ---
const TechLayer = ({ radiusTop, radiusBottom, height, isGoldMode, showBottomCap }) => {
    
    const basePurple = "#a855f7";
    const glowPurple = "#6b21a8";
    
    // Refs for animation
    const edgesRef = useRef(null); 
    const glowMeshRef = useRef(null);
    
    // Double Shadow Refs
    const shadowHardRef = useRef(null);
    const shadowSoftRef = useRef(null);

    useFrame((state, delta) => {
        const orangeColor = new THREE.Color("#ff6600");
        const goldColor = new THREE.Color("#fbbf24");
        const darkGoldColor = new THREE.Color("#b45309");
        const neonShadowColor = new THREE.Color("#fb923c"); 
        
        // 1. Animate Primary Edges Color: Orange -> Gold
        if (edgesRef.current && edgesRef.current.material) {
            const targetColor = isGoldMode ? goldColor : orangeColor;
            edgesRef.current.material.color.lerp(targetColor, delta * 3);
            edgesRef.current.material.opacity = 1;
        }

        // 2. Animate Neon Drop Shadows
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
        
        // 3. Animate fresnel glow layer pulse
        if (glowMeshRef.current && glowMeshRef.current.material) {
            const pulse = 0.12 + Math.sin(state.clock.elapsedTime * 2.0) * 0.04;
            glowMeshRef.current.material.opacity = pulse;
        }
    });

    const frameColor = isGoldMode ? "#b45309" : "#4c1d95";

    return (
        <group>
            {/* Main Glassy Shell — enhanced transmission glass */}
            <mesh>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
                <meshPhysicalMaterial 
                    color={isGoldMode ? "#d97706" : basePurple}
                    emissive={isGoldMode ? "#92400e" : glowPurple}
                    emissiveIntensity={isGoldMode ? 0.6 : 0.5}
                    transparent
                    opacity={0.25}
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
             <mesh position={[0.08, -0.08, 0.08]} scale={[1.02, 1.02, 1.02]}>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                <Edges ref={shadowHardRef} threshold={10} color="#b45309" />
            </mesh>
            
            {/* Neon Drop Shadow 2: Soft Glow Offset */}
             <mesh position={[0.15, -0.15, 0.15]} scale={[1.04, 1.04, 1.04]}>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 1]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                <Edges 
                    ref={shadowSoftRef} 
                    threshold={10} 
                    color="#fb923c" 
                />
            </mesh>


            {/* Internal Structure — dual wireframe for depth */}
            <mesh scale={[0.85, 0.98, 0.85]}>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 3]} />
                <meshBasicMaterial 
                    color={isGoldMode ? "#d97706" : "#22d3ee"} 
                    wireframe 
                    transparent 
                    opacity={0.15} 
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
            
            {/* Second inner wireframe — offset rotation for depth parallax */}
            <mesh scale={[0.7, 0.96, 0.7]} rotation={[0, Math.PI / 4, 0]}>
                <cylinderGeometry args={[radiusTop, radiusBottom, height, 4, 2]} />
                <meshBasicMaterial 
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
            />
        </group>
    );
};

// --- Main Pyramid Scene ---
// scrollProgress: 0-1 value from parent (discrete frame-based scroll)
// isActive: controls when the intro animation starts (true when orbit button is visible)
const HoloPyramid = ({ scrollProgress = 0, isActive = false, onSendComplete = () => {} }) => {
  const groupRef = useRef(null);
  const labelGroupRef = useRef(null);
  const containerRef = useRef(null);
  const buttonGroupRef = useRef(null);
  
  // Container Refs for Animation
  const containerBoxMatRef = useRef(null);
  const containerOctMatRef = useRef(null);
  const containerEdgesRef = useRef(null);
  const containerShadowHardRef = useRef(null);
  const containerShadowSoftRef = useRef(null);

  const { gl } = useThree();
  
  const portalNode = useMemo(() => ({ current: gl.domElement.parentNode }), [gl]);
  const labelDomRefs = useRef([]);

  const [completedLayerIndex, setCompletedLayerIndex] = useState(0);
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [isGoldMode, setIsGoldMode] = useState(false);
  const [entityOpacity, setEntityOpacity] = useState(0);
  
  // Track when isActive becomes true to start the timer
  const activationTimeRef = useRef(null);
  const wasActiveRef = useRef(false);

  // Reset activation time when isActive changes from false to true
  useEffect(() => {
    if (isActive && !wasActiveRef.current) {
      // isActive just became true - reset the activation time
      activationTimeRef.current = null; // Will be set on next frame
    }
    wasActiveRef.current = isActive;
  }, [isActive]);

  // Generate layers data
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

  // Total movable layers (excluding base)
  const totalMovable = TOTAL_LAYERS - 1;

  useFrame((state, delta) => {
    if (!groupRef.current || !labelGroupRef.current || !containerRef.current) return;

    // 1. Scene Rotation (always rotate)
    groupRef.current.rotation.y += delta * 0.2;
    
    // Vertical Float Animation for container
    const floatY = 4.5 + Math.sin(state.clock.elapsedTime) * 0.2;
    containerRef.current.position.y = floatY;
    containerRef.current.rotation.y += delta * 0.1;
    
    // Sync Button Group Vertical Position (No Rotation)
    if (buttonGroupRef.current) {
        buttonGroupRef.current.position.y = floatY;
    }

    // 2. Activation-based Intro Animation
    // If NOT active: layers stay at pyramid position, no labels/entity visible
    // If active: after 3s delay, layers float up to entity, then scroll controls
    
    let introFactor = 1; // Default: layers at pyramid position
    let showContent = false; // Whether to show labels and entity
    
    if (!isActive) {
      // Not active - pyramid only, no labels, no entity
      introFactor = 1;
      showContent = false;
      activationTimeRef.current = null; // Reset timer
      if (entityOpacity !== 0) setEntityOpacity(0);
      if (!isIntroActive) setIsIntroActive(true);
    } else {
      // Active - run the timed intro sequence
      showContent = true;
      
      // Initialize activation time on first active frame
      if (activationTimeRef.current === null) {
        activationTimeRef.current = state.clock.elapsedTime;
      }
      
      const timeSinceActive = state.clock.elapsedTime - activationTimeRef.current;
      
      if (timeSinceActive < INTRO_DELAY) {
        // Phase 1: First 3 seconds - pyramid formed, labels visible, entity hidden
        introFactor = 1;
        if (!isIntroActive) setIsIntroActive(true);
        if (entityOpacity !== 0) setEntityOpacity(0);
      } else if (timeSinceActive < INTRO_DELAY + INTRO_DURATION) {
        // Phase 2: Layers floating up to entity (3-5 seconds)
        const t = (timeSinceActive - INTRO_DELAY) / INTRO_DURATION;
        const eased = t * t * (3 - 2 * t); // smoothstep
        introFactor = 1 - eased; // 1 -> 0 (pyramid -> container)
        if (!isIntroActive) setIsIntroActive(true);
        
        // Fade in entity
        const fade = Math.min(t / 0.75, 1);
        const easeFade = fade * fade * (3 - 2 * fade);
        setEntityOpacity(easeFade);
      } else {
        // Phase 3: Intro complete - scroll controls layers
        introFactor = 0;
        if (isIntroActive) setIsIntroActive(false);
        if (entityOpacity !== 1) setEntityOpacity(1);
      }
    }
    
    // 3. Container Animation (only visible when active)
    const orangeColor = new THREE.Color("#ff6600");
    const goldColor = new THREE.Color("#fbbf24");
    
    // Base Opacity Logic - multiply by showContent
    const contentOpacity = showContent ? entityOpacity : 0;
    if (containerBoxMatRef.current) containerBoxMatRef.current.opacity = 0.05 * contentOpacity;
    if (containerOctMatRef.current) containerOctMatRef.current.opacity = 0.3 * contentOpacity;

    // Animate Container Edges Color
    if (containerEdgesRef.current && containerEdgesRef.current.material) {
         const targetColor = isGoldMode ? goldColor : orangeColor;
         containerEdgesRef.current.material.color.lerp(targetColor, delta * 3);
         containerEdgesRef.current.material.opacity = contentOpacity; 
    }

    // Animate Container Shadows (Hard & Soft)
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


    // 4. Scroll Logic - Use scrollProgress from props (0-1)
    // Only process scroll when intro is complete (isIntroActive = false)
    const currentCompleted = Math.min(
      Math.floor(scrollProgress * totalMovable + 0.05),
      totalMovable
    );
    if (completedLayerIndex !== currentCompleted) {
        setCompletedLayerIndex(currentCompleted);
    }

    // 5. Animate Layers
    layers.forEach((layer, i) => {
      const meshChild = groupRef.current.children[i];
      const labelDom = labelDomRefs.current[i];

      if (!meshChild) return;

      // Base layer (i=0) always visible and in position
      if (i === 0) {
        meshChild.visible = true;
        if (labelDom) {
            // Only show label if active and showContent
            const labelOpacity = showContent ? '1' : '0';
            labelDom.style.opacity = labelOpacity;
            labelDom.style.pointerEvents = showContent ? 'auto' : 'none';
        }
        return;
      }

      // Calculate range for this layer based on scroll progress
      const rangeStart = (i - 1) / totalMovable;
      const rangeEnd = i / totalMovable;
      
      // Linear interpolation within range
      let scrollR = 0;
      if (scrollProgress >= rangeEnd) {
        scrollR = 1;
      } else if (scrollProgress > rangeStart) {
        scrollR = (scrollProgress - rangeStart) / (rangeEnd - rangeStart);
      }
      
      // effectiveR: combines intro animation and scroll
      // introFactor=1 means layers at pyramid, introFactor=0 means scroll controls
      const effectiveR = scrollR + (1 - scrollR) * introFactor;

      const targetPos = new THREE.Vector3(0, layer.yPos, 0);
      const worldContainerPos = new THREE.Vector3(0, 4.5, 0);
      const inverseMatrix = groupRef.current.matrixWorld.clone().invert();
      const localStartPos = worldContainerPos.clone().applyMatrix4(inverseMatrix);

      meshChild.position.lerpVectors(localStartPos, targetPos, effectiveR);
      
      const targetScale = new THREE.Vector3(1, 1, 1);
      const startScale = new THREE.Vector3(0.01, 0.01, 0.01);
      meshChild.scale.lerpVectors(startScale, targetScale, effectiveR);

      const isStructureFormed = effectiveR > 0.9;
      meshChild.visible = effectiveR > 0.05;
      
      if (labelDom) {
        // Labels only visible when active (showContent) AND structure is formed
        const baseOpacity = isStructureFormed ? Math.min((effectiveR - 0.9) * 10, 1) : 0;
        const finalOpacity = showContent ? baseOpacity : 0;
        labelDom.style.opacity = finalOpacity.toString();
        labelDom.style.pointerEvents = (showContent && isStructureFormed) ? 'auto' : 'none';
      }
    });
  });

  const handleGoldMode = () => {
    setIsGoldMode(true);
    onSendComplete();
  };

  // Ambient holographic particles around pyramid
  const particleData = useMemo(() => {
    const count = 60;
    const positions = new Float32Array(count * 3);
    const speeds = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2.5 + Math.random() * 4;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds.push(0.2 + Math.random() * 0.5);
    }
    return { positions, speeds, count };
  }, []);

  const particlesRef = useRef(null);
  
  // Animate particles in the existing useFrame would be complex, so use a separate small effect
  useFrame((state) => {
    if (!particlesRef.current) return;
    const posArr = particlesRef.current.geometry.attributes.position.array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < particleData.count; i++) {
      const speed = particleData.speeds[i];
      posArr[i * 3 + 1] += Math.sin(t * speed + i) * 0.002;
      // Gentle orbit
      const x = posArr[i * 3];
      const z = posArr[i * 3 + 2];
      const angle = Math.atan2(z, x) + 0.001 * speed;
      const r = Math.sqrt(x * x + z * z);
      posArr[i * 3] = Math.cos(angle) * r;
      posArr[i * 3 + 2] = Math.sin(angle) * r;
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      {/* Ambient holographic particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={particleData.positions}
            count={particleData.count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color={isGoldMode ? "#fbbf24" : "#c084fc"}
          size={0.04}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* 1. Rotating Pyramid Group */}
      <group ref={groupRef}>
        {layers.map((layer) => (
            <group key={layer.index} position={[0, layer.yPos, 0]}>
                <TechLayer 
                   radiusTop={layer.radiusTop}
                   radiusBottom={layer.radiusBottom}
                   height={layer.height}
                   isGoldMode={isGoldMode}
                   showBottomCap={layer.index === 0}
                />
            </group>
        ))}
      </group>

      {/* 2. Static Label Group */}
      <group ref={labelGroupRef}>
        {layers.map((layer, i) => {
            const isHighestCompleted = layer.index === completedLayerIndex;
            const showButton = !isIntroActive && isHighestCompleted;
            const isRight = layer.index % 2 === 0;
            const xPos = layer.index === 0 ? -6 : (isRight ? 6 : -6);
            const yPos = layer.index === 0 ? 12 : 0;

            return (
                <group key={layer.index} position={[layer.index === 0 ? -20 : 0, layer.index === 0 ? layer.yPos + 18 : layer.yPos, 0]}>
                    <Html
                        position={[layer.index === 0 ? 0 : xPos, layer.index === 0 ? 0 : yPos, 0]} 
                        center
                        distanceFactor={10} 
                        zIndexRange={[100, 0]}
                        portal={portalNode}
                        style={{ transition: 'none' }}
                    >
                        <div 
                            ref={(el) => { labelDomRefs.current[i] = el; }}
                            style={{ 
                                transition: 'opacity 0.2s', 
                                opacity: 1,
                                transform: 'scale(2)',
                                transformOrigin: isRight ? 'center left' : 'center right'
                            }}
                        >
                            <HoloLabel 
                                layerIndex={layer.index} 
                                showButton={showButton}
                                isLast={layer.index === TOTAL_LAYERS - 1}
                                alignment={isRight ? 'right' : 'left'}
                                onSend={handleGoldMode}
                                isSent={isGoldMode}
                            />
                        </div>
                    </Html>
                </group>
            );
        })}

        <group position={[0, layers[0].yPos, 0]}>
            <Html
                position={[-6, 0, 0]}
                center
                distanceFactor={10}
                zIndexRange={[100, 0]}
                portal={portalNode}
            >
                 <div className="flex items-center gap-2 opacity-70 animate-bounce">
                    <span className="text-cyan-300 font-mono text-[10px] uppercase tracking-widest whitespace-nowrap">
                        &lt; Scroll Me
                    </span>
                 </div>
            </Html>
        </group>
      </group>

      {/* Floating Container - Fade Transition, Rotating */}
      <group ref={containerRef} position={[0, 4.5, 0]} scale={[0.48, 0.48, 0.48]} visible={entityOpacity > 0}>
         {/* Glass Box */}
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

         {/* Container Edges (Animated) */}
         <mesh>
            <boxGeometry args={[3, 3, 3]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <Edges ref={containerEdgesRef} color="#ff6600" threshold={15} />
         </mesh>

         {/* Container Shadow 1: Hard Dark */}
         <mesh position={[0.08, -0.08, 0.08]}>
             <boxGeometry args={[3, 3, 3]} />
             <meshBasicMaterial transparent opacity={0} depthWrite={false} />
             <Edges ref={containerShadowHardRef} threshold={15} color="#b45309" />
         </mesh>

         {/* Container Shadow 2: Soft Glow */}
         <mesh position={[0.15, -0.15, 0.15]}>
             <boxGeometry args={[3, 3, 3]} />
             <meshBasicMaterial transparent opacity={0} depthWrite={false} />
             <Edges ref={containerShadowSoftRef} threshold={15} color="#fb923c" />
         </mesh>

         {/* Inner Octahedron */}
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

      {/* Floating Button Group - Moves vertically with container, but NO rotation */}
      <group ref={buttonGroupRef} position={[0, 4.5, 0]}>
         {isGoldMode && entityOpacity > 0.5 && (
             <Html 
                position={[-2.2, 0, 0]}
                center 
                distanceFactor={8}
                zIndexRange={[100, 0]}
                portal={portalNode}
                style={{ pointerEvents: 'none' }}
             >
                 <div className="pointer-events-auto flex items-center gap-2 whitespace-nowrap">
                     <div 
                        className="
                            relative px-8 py-4
                            bg-[#1a0525] 
                            border border-orange-500 
                            text-white 
                            font-mono text-sm 
                            tracking-widest uppercase
                            shadow-[0_0_30px_rgba(255,165,0,0.5)]
                            cursor-pointer
                            flex items-center gap-4
                            hover:bg-orange-900/50
                            transition-all duration-300
                            animate-pulse
                        "
                        onClick={(e) => { e.stopPropagation(); console.log('Syncing compass...'); }}
                     >
                         <div className="absolute -left-1 -top-1 w-2.5 h-2.5 border-t border-l border-white"></div>
                         <div className="absolute -right-1 -bottom-1 w-2.5 h-2.5 border-b border-r border-white"></div>
                         
                         <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
                         Synchroniseer kompas
                     </div>
                     <div className="w-16 h-[1px] bg-orange-500/60"></div>
                 </div>
             </Html>
         )}
      </group>

    </group>
  );
};

export default HoloPyramid;
