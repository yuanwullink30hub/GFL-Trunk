import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

// --- Custom Shader Material for the Holographic Surface ---
const HolographicShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColorCore: { value: new THREE.Color('#020005') },   // Almost Black Purple (Ocean)
    uColorLand: { value: new THREE.Color('#4a1d6e') },   // Darker Purple (Land)
    uColorRim: { value: new THREE.Color('#581c87') },    // Darker Deep Purple (Base Rim)
    uColorBorder: { value: new THREE.Color('#FFD700') }, // Bright Gold (Border)
    uMap: { value: null }, // Texture unit
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorCore;
    uniform vec3 uColorLand;
    uniform vec3 uColorRim;
    uniform vec3 uColorBorder;
    uniform sampler2D uMap;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;

    // Pseudo-random function for flicker
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      // 1. Fresnel Effect (Rim lighting) - softer and larger
      vec3 viewDirection = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 1.0); 

      // 2. Scanlines (Subtle tech effect)
      float scanline = sin(vPosition.y * 100.0 - uTime * 0.8) * 0.03 + 0.97;
      
      // 3. Holographic Flicker Effect
      float flickerSpeed = 6.0;
      float flickerIntensity = 0.03;
      float flicker = 1.0 - flickerIntensity * random(vec2(floor(uTime * flickerSpeed), 0.0));
      
      // 4. Horizontal distortion bands (classic hologram look)
      float bandFreq = 30.0;
      float bandSpeed = 2.0;
      float distortionBand = sin(vPosition.y * bandFreq + uTime * bandSpeed) * 0.5 + 0.5;
      distortionBand = pow(distortionBand, 12.0) * 0.08; // Sharper, rarer bands
      
      // 5. Chromatic-like color shift on edges
      float colorShift = sin(uTime * 3.0 + vPosition.y * 20.0) * 0.01;
      
      // 6. Geographical Map Analysis
      vec4 texColor = texture2D(uMap, vUv);
      float mapValue = texColor.r; // 0.0 = Ocean, 1.0 = Land
      
      // SHARP landmass definition
      float continent = smoothstep(0.48, 0.52, mapValue);

      // GOLD BORDER definition - expanded to cover all landmass edges
      float borderOuter = smoothstep(0.25, 0.48, mapValue);
      float borderInner = smoothstep(0.52, 0.75, mapValue);
      float border = borderOuter * (1.0 - borderInner);
      
      // Additional inner glow on all landmass
      float landGlow = continent * 0.1;

      // 7. Color Mixing - uniform brightness for landmass
      vec3 color = uColorCore;
      // Use a base brightness multiplier for landmass to ensure consistency
      float landBrightness = 1.0 + continent * 0.3; // boost land brightness
      color = mix(color, uColorLand * landBrightness, continent * 0.9);
      color += uColorBorder * border * 2.5;
      color += uColorBorder * landGlow;
      color *= scanline;
      // Apply fresnel only to rim, not affecting landmass base color
      color += uColorRim * fresnel * 0.9;
      
      // Apply flicker and distortion
      color *= flicker;
      color += vec3(distortionBand * 0.3, distortionBand * 0.1, distortionBand * 0.4);
      color.r += colorShift;
      color.b -= colorShift;

      // 8. Transparency Logic - landmass more opaque for clarity
      float alpha = 0.02 + (continent * 0.7) + (fresnel * 0.2) + (border * 0.6);
      alpha *= flicker; // Flicker affects transparency too

      gl_FragColor = vec4(color, alpha);
    }
  `
};

// Inner 3D Earth component with texture and drag interaction
const HoloEarthSphere = () => {
  const groupRef = useRef();
  const meshRef = useRef();
  const materialRef = useRef();
  const { viewport } = useThree();
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  // Load Earth Specular Map for geographical data
  const earthMap = useLoader(
    THREE.TextureLoader, 
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  );

  const scale = Math.min(1, viewport.width / 5.5);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uMap.value = earthMap;
    }
  }, [earthMap]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
    }
    
    if (groupRef.current) {
      if (!isDragging.current) {
        // Auto-rotate when not dragging
        groupRef.current.rotation.y += 0.001;
        // Apply momentum decay
        rotationVelocity.current.x *= 0.95;
        rotationVelocity.current.y *= 0.95;
        groupRef.current.rotation.y += rotationVelocity.current.x;
        groupRef.current.rotation.x += rotationVelocity.current.y;
      }
      // Clamp vertical rotation
      groupRef.current.rotation.x = Math.max(-0.5, Math.min(0.5, groupRef.current.rotation.x));
    }
  });

  const handlePointerDown = (e) => {
    e.stopPropagation();
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current || !groupRef.current) return;
    
    const deltaX = (e.clientX - previousMouse.current.x) * 0.005;
    const deltaY = (e.clientY - previousMouse.current.y) * 0.005;
    
    groupRef.current.rotation.y += deltaX;
    groupRef.current.rotation.x += deltaY;
    
    rotationVelocity.current = { x: deltaX, y: deltaY };
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <group 
      ref={groupRef} 
      scale={scale}
      position={[0, 0.45, 0]}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {/* Main Earth Sphere */}
      <Sphere ref={meshRef} args={[2.5, 64, 64]}>
        <shaderMaterial
          ref={materialRef}
          attach="material"
          args={[HolographicShaderMaterial]}
          transparent={true}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* Outer glow aura */}
      <Sphere args={[3.2, 32, 32]}>
        <shaderMaterial
          transparent={true}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uColor: { value: new THREE.Color('#7c3aed') },
            uIntensity: { value: 0.08 }
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            uniform float uIntensity;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.85 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 5.0);
              gl_FragColor = vec4(uColor, intensity * uIntensity);
            }
          `}
        />
      </Sphere>

      {/* Second outer glow layer - softer/larger */}
      <Sphere args={[4.0, 32, 32]}>
        <shaderMaterial
          transparent={true}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uColor: { value: new THREE.Color('#a21caf') },
            uIntensity: { value: 0.04 }
          }}
          vertexShader={`
            varying vec3 vNormal;
            void main() {
              vNormal = normalize(normalMatrix * normal);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uColor;
            uniform float uIntensity;
            varying vec3 vNormal;
            void main() {
              float intensity = pow(0.95 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 7.0);
              gl_FragColor = vec4(uColor, intensity * uIntensity);
            }
          `}
        />
      </Sphere>

      {/* Inner wireframe for tech effect */}
      <Sphere args={[2.45, 24, 24]}>
        <meshBasicMaterial 
          color="#f97316" 
          wireframe={true} 
          transparent={true} 
          opacity={0.18}
        />
      </Sphere>
    </group>
  );
};

// Main exported component with Canvas
const HoloEarth = ({ style, className }) => {
  return (
    <div 
      className={`relative overflow-hidden ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        ...style
      }}
    >
      {/* 3D Scene Container */}
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance'
        }}
        onPointerMissed={() => {}}
        onCreated={({ gl }) => {
          gl.domElement.style.touchAction = 'none';
        }}
      >
        <Suspense fallback={null}>
          {/* Ambient light - low for darker mood */}
          <ambientLight intensity={0.1} />
          
          {/* Dynamic accent lights */}
          <pointLight position={[10, 10, 10]} intensity={1} color="#f97316" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4c1d95" />

          {/* Main Hologram - drag interaction is on the sphere itself */}
          <HoloEarthSphere />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HoloEarth;
