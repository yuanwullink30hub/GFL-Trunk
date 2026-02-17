import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- Holographic Core Component ---
const HoloCore = ({ isGoldMode = false, opacity = 1, scaleMultiplier = 1 }) => {
  const ref = useRef(null);
  const ringRef = useRef(null);
  const outerRingRef = useRef(null);
  const groupRef = useRef(null);

  // Material refs for dynamic opacity
  const mat1 = useRef(null);
  const mat2 = useRef(null);
  const mat3 = useRef(null);
  const matRing1 = useRef(null);
  const matRing2 = useRef(null);
  const matGlow = useRef(null);

  useFrame((state) => {
    if (!ref.current || !ringRef.current || !outerRingRef.current) return;
    const t = state.clock.elapsedTime;
    
    // Core rotation
    ref.current.rotation.y = t * 0.5;
    ref.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    
    // Pulse effect
    const pulse = 1 + Math.sin(t * 3) * 0.02;
    ref.current.scale.set(pulse, pulse, pulse);

    // Ring animations
    ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.1;
    ringRef.current.rotation.y = t * 0.2;

    outerRingRef.current.rotation.x = Math.PI / 2 - Math.sin(t * 0.3) * 0.1;
    outerRingRef.current.rotation.y = -t * 0.1;

    // Apply opacity
    if(mat1.current) mat1.current.opacity = 0.9 * opacity;
    if(mat2.current) mat2.current.opacity = 0.3 * opacity;
    if(mat3.current) mat3.current.opacity = 0.2 * opacity;
    if(matRing1.current) matRing1.current.opacity = 0.6 * opacity;
    if(matRing2.current) matRing2.current.opacity = 0.3 * opacity;
    if(matGlow.current) matGlow.current.opacity = 0.5 * opacity;
    
    // Apply scale multiplier to entire group
    if (groupRef.current) {
      groupRef.current.scale.setScalar(scaleMultiplier);
    }
  });

  const primaryColor = isGoldMode ? "#fbbf24" : "#22d3ee"; // Gold or Cyan
  const glowColor = isGoldMode ? "#b45309" : "#0891b2";

  return (
    <group ref={groupRef}>
      <group ref={ref}>
        {/* Solid Core - High Transmission */}
        <mesh>
            <octahedronGeometry args={[0.5, 0]} />
            <meshPhysicalMaterial 
                ref={mat1}
                color={primaryColor}
                emissive={glowColor}
                emissiveIntensity={isGoldMode ? 1.5 : 0.8}
                transmission={0.6}
                thickness={1}
                roughness={0}
                clearcoat={1}
                transparent
                opacity={0.9}
            />
        </mesh>
        
        {/* Inner Wireframe - Additive Glow */}
        <mesh scale={[1.01, 1.01, 1.01]}>
             <octahedronGeometry args={[0.5, 0]} />
             <meshBasicMaterial 
                ref={mat2}
                color="white"
                wireframe
                transparent
                opacity={0.3}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>

        {/* Outer Ghost Shell */}
        <mesh scale={[1.2, 1.2, 1.2]}>
             <octahedronGeometry args={[0.5, 0]} />
             <meshBasicMaterial 
                ref={mat3}
                color={primaryColor}
                wireframe
                transparent
                opacity={0.2}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
             />
        </mesh>
      </group>

      {/* Orbiting Data Rings */}
      <mesh ref={ringRef} scale={[1.2, 1.2, 1.2]}>
         <torusGeometry args={[0.7, 0.005, 16, 64]} />
         <meshBasicMaterial 
            ref={matRing1}
            color={primaryColor} 
            transparent 
            opacity={0.6} 
            blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      <mesh ref={outerRingRef} scale={[1.5, 1.5, 1.5]}>
         <torusGeometry args={[0.9, 0.002, 16, 64]} />
         <meshBasicMaterial 
            ref={matRing2}
            color={primaryColor} 
            transparent 
            opacity={0.3} 
            blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Central Glow Sprite */}
       <mesh>
         <sphereGeometry args={[0.2, 16, 16]} />
         <meshBasicMaterial 
            ref={matGlow}
            color={primaryColor}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
         />
       </mesh>
    </group>
  );
};

export default HoloCore;
