import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { MotionPredictor } from '../../utils/MotionPredictor';
import PyramidInner from '../newFeature/PyramidInner';

// --- Custom Shader Material for the Holographic Surface ---
const HolographicShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uExplode: { value: 0 },
    uColorCore: { value: new THREE.Color('#0d0618') },   
    uColorLand: { value: new THREE.Color('#4a1d66') },   
    uColorRim: { value: new THREE.Color('#1a0320') },    // Dark Purple Glow
    uColorBorder: { value: new THREE.Color('#FFD700') }, // Bright Gold
    uColorBorderDark: { value: new THREE.Color('#2c290e') }, // Dark Brown for post-frame 9
    uMap: { value: null }, 
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying float vFragExplode;
    varying float vCellDensity; 

    uniform float uExplode;
    uniform float uTime;
    uniform sampler2D uMap;

    vec3 hash33(vec3 p) {
        p = fract(p * vec3(.1031, .1030, .0973));
        p += dot(p, p.yxz + 33.33);
        return fract((p.xxy + p.yxx) * p.zyx);
    }

    vec4 voronoi(in vec3 x) {
        vec3 n = floor(x);
        vec3 f = fract(x);
        float m_dist = 100.0;
        vec3 m_center = vec3(0.0);
        for( int k=-1; k<=1; k++ )
        for( int j=-1; j<=1; j++ )
        for( int i=-1; i<=1; i++ )
        {
            vec3 g = vec3(float(i),float(j),float(k));
            vec3 p = hash33( n + g ); 
            vec3 diff = g + p - f; 
            float d = dot(diff,diff);
            if( d < m_dist )
            {
                m_dist = d;
                m_center = n + g + p; 
            }
        }
        return vec4(m_dist, m_center);
    }

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vFragExplode = uExplode;

      vec3 finalPos = position;
      // Lower frequency = Bigger "parts" / rocks
      float frequency = 1.5; 
      
      vec4 cell = voronoi(position * frequency);
      vec3 cellCenter = cell.yzw;
      
      // Random properties for this rock chunk
      vec3 cellHash = hash33(cellCenter);
      float randomFactor = cellHash.x; 
      vCellDensity = randomFactor;

      // Chaotic Direction: mostly radial but with random offset
      vec3 explosionDir = normalize(cellCenter + (cellHash - 0.5) * 0.5); 

      // Tangential drift for "tumble" feel
      vec3 tangent = cross(explosionDir, vec3(0.0, 1.0, 0.0));
      if (length(tangent) < 0.1) tangent = cross(explosionDir, vec3(1.0, 0.0, 0.0));
      tangent = normalize(tangent);

      if (uExplode > 0.0) {
          // High speed variance for separation - MORE VARIATION
          float speed = 0.5 + (randomFactor * 2.0); 
          
          // Add secondary variation based on position for different chunks to explode at different rates
          float secondaryVariation = sin(cellCenter.x * 5.0 + cellCenter.y * 7.0) * 0.3 + 0.85;
          speed *= secondaryVariation;
          
          float dist = uExplode * speed;
          
          finalPos += explosionDir * dist;
          
          // Add INTENSE tangential movement - creates swirling, chaotic motion
          float chunkRotation = cellHash.y * 20.0;
          float tangentialIntensity = sin(uExplode * (0.2 + randomFactor * 0.3) + chunkRotation) * (dist * 0.15);
          finalPos += tangent * tangentialIntensity;
          
          // Add bitangent movement for true 3D chaotic motion
          vec3 bitangent = cross(tangent, explosionDir);
          float bitangentialIntensity = cos(uExplode * (0.15 + randomFactor * 0.4) + cellHash.z * 15.0) * (dist * 0.12);
          finalPos += bitangent * bitangentialIntensity;
          
          // Add surface deformation/warping based on explosion progress
          // Make the surface itself "crack" and deform
          float deformation = sin(position.x * 3.0 + uExplode * 2.0) * cos(position.y * 3.0 + uExplode * 1.5);
          deformation += sin(position.z * 2.5 + uExplode * 1.8) * 0.5;
          finalPos += normalize(position) * deformation * uExplode * 0.15;
          
          // Add wave-based ripples that propagate outward
          float wavePhase = uExplode * 3.0 - length(position) * 2.0;
          float wave = sin(wavePhase + randomFactor * 10.0) * 0.08;
          finalPos += normalize(position) * wave * uExplode;
      }

      vPosition = (modelMatrix * vec4(finalPos, 1.0)).xyz; 
      gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uExplode;
    uniform vec3 uColorCore;
    uniform vec3 uColorLand;
    uniform vec3 uColorRim;
    uniform vec3 uColorBorder;
    uniform vec3 uColorBorderDark;
    uniform sampler2D uMap;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying float vFragExplode;
    varying float vCellDensity;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vPosition);
      
      float fresnel = pow(1.0 - abs(dot(V, N)), 2.0);

      vec4 texColor = texture2D(uMap, vUv);
      float mapValue = texColor.r;
      float continent = smoothstep(0.40, 0.60, mapValue);
      
      vec3 color = uColorCore * 0.4; 
      color = mix(color, uColorLand * 1.5, continent);

      // THICKER BORDER LOGIC
      // Widened range from (0.45-0.55) to (0.3-0.7) for visibility
      float border = smoothstep(0.3, 0.45, mapValue) * (1.0 - smoothstep(0.55, 0.7, mapValue));
      
      // Before frame 9: gold border with x4 intensity
      // After frame 9: dark brown border for moody pyramid background
      // Frame 9 = approx vFragExplode 0.2 (6 frames into 30-frame explosion)
      bool isAfterFrame9 = vFragExplode > 0.2;
      vec3 borderColor = isAfterFrame9 ? uColorBorderDark : uColorBorder;
      float borderIntensity = isAfterFrame9 ? 1.0 : 4.0;
      color += borderColor * border * borderIntensity;

      color += uColorRim * fresnel * 1.5;

      if (!gl_FrontFacing) {
         color *= 0.5; 
         color += uColorRim * fresnel * 0.8;
      } else {
         color *= 1.1;
      }

      float scanline = sin(gl_FragCoord.y * 0.15 - uTime * 2.0) * 0.1 + 0.9;
      color *= scanline;
      
      float flicker = 1.0 - 0.03 * random(vec2(floor(uTime * 20.0), 0.0));
      color *= flicker;

      // Landmass (dark areas inside gold border) has higher opacity to obscure pyramid behind it
      // Use (1.0 - continent) so dark landmass areas have MORE opacity, not less
      float landmassOpacity = (1.0 - continent) * 0.5;
      float alpha = 0.2 + landmassOpacity + (fresnel * 0.6);
      
      // Add per-chunk color variation during explosion
      // Each chunk has its own brightness and hue tint based on cellDensity
      if (vFragExplode > 0.0) {
        // Vary chunk brightness based on density
        float chunkVariation = mix(0.7, 1.3, vCellDensity);
        color *= chunkVariation;
        
        // Add tint variation to different chunks
        // Use gold during explosion, gradually switch to dark brown after frame 15
        // Frame 15 = approximately vFragExplode 0.4 (12 frames into 30-frame explosion)
        float brownTransition = smoothstep(0.4, 0.7, vFragExplode); // gradual transition from frame 15 to frame 24
        vec3 chunkTintColor = mix(uColorBorder, uColorBorderDark, brownTransition);
        vec3 chunk1Tint = mix(uColorRim, chunkTintColor, vCellDensity);
        color = mix(color, color + chunk1Tint * 0.3, vCellDensity * vFragExplode * 0.5);
      }
      
      // --- FADE LOGIC ---
      float fade = 1.0 - smoothstep(15.0, 40.0, uExplode);
      
      float distToCamera = distance(cameraPosition, vPosition);
      float proximityFade = smoothstep(2.0, 5.0, distToCamera);
      
      // Fade out front-facing rubble between frame 18-23, fully invisible after 23
      // Frame 18 = vFragExplode 0.5, Frame 23 = vFragExplode 0.67
      // This creates the effect of the viewer passing through the explosion debris
      float viewDot = dot(N, V); // positive = facing camera
      float frontFaceFade = 1.0;
      if (vFragExplode > 0.5) {
        // Progressive fade from frame 18 to 23, then fully invisible
        float fadeProgress = smoothstep(0.5, 0.67, vFragExplode);
        // viewDot > 0 means facing camera, fade those out
        float frontFactor = smoothstep(0.0, 0.5, viewDot); // 0 for side/back, 1 for front
        frontFaceFade = 1.0 - (frontFactor * fadeProgress);
      }
      
      alpha *= fade * proximityFade * frontFaceFade;

      gl_FragColor = vec4(color, alpha);
    }
  `
};

const HoloEarthSphere = ({ 
  exploding, 
  explosionProgress = 0, 
  isActive = false, 
  pyramidScrollProgress = 0,
  showPyramidLabels = false,
  onIntroComplete = () => {},
  onLayerStateChange = () => {}
}) => {
  const groupRef = useRef(null);
  const coreRef = useRef(null);
  const { viewport } = useThree();
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const motionPredictor = useRef(new MotionPredictor());
  
  // Track orbital rotation to pass to PyramidInner when in orbital mode (button invisible)
  const orbitalRotationY = useRef(0);
  
  const earthMap = useLoader(
    THREE.TextureLoader, 
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'
  );

  const scale = Math.min(1, viewport.width / 5.5) * 0.65;

  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(HolographicShaderMaterial.uniforms),
      vertexShader: HolographicShaderMaterial.vertexShader,
      fragmentShader: HolographicShaderMaterial.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return mat;
  }, []);

  useEffect(() => {
    if (material) {
      material.uniforms.uMap.value = earthMap;
    }
  }, [earthMap, material]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -2.4; 
      groupRef.current.rotation.x = 0.25;
    }
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    if (material) {
      material.uniforms.uTime.value = time;

      // Use explosionProgress directly instead of time-based animation
      // explosionProgress goes from 0 to 1
      const targetExplode = 25.0; // Maximum explosion distance
      material.uniforms.uExplode.value = targetExplode * explosionProgress;
      
      // Transition colors from orbital to explosion view
      // Orbital: brighter, Explosion: darker
      const orbitalCore = new THREE.Color('#0d0618');
      const explosionCore = new THREE.Color('#050310');
      const orbitalLand = new THREE.Color('#4a1d66');
      const explosionLand = new THREE.Color('#2d0f3d');
      const orbitalRim = new THREE.Color('#1a0320');
      const explosionRim = new THREE.Color('#0a0110');
      
      // Frame 15 threshold: vFragExplode > 0.4, hide purple shadows after
      const fadeOutRim = explosionProgress > 0.4 ? 0 : new THREE.Color('#1a0320');
      
      // Lerp between colors based on explosion progress
      const currentCore = orbitalCore.clone().lerp(explosionCore, explosionProgress);
      const currentLand = orbitalLand.clone().lerp(explosionLand, explosionProgress);
      const currentRim = typeof fadeOutRim === 'number' ? new THREE.Color('#0a0110') : orbitalRim.clone().lerp(explosionRim, explosionProgress);
      
      material.uniforms.uColorCore.value = currentCore;
      material.uniforms.uColorLand.value = currentLand;
      material.uniforms.uColorRim.value = currentRim;
    }
    
    const momentumMagnitude = Math.abs(rotationVelocity.current.x) + Math.abs(rotationVelocity.current.y);
    
    if (coreRef.current) {
        coreRef.current.rotation.y += 0.0014;
        coreRef.current.rotation.x = Math.sin(time * 0.35) * 0.1;
        
        // Position based on explosionProgress instead of time-based animation
        // z: zoom from 0 to 4.5 (towards camera)
        // y: move from 0.25 down to -1.5 
        const zoomZ = 4.5 * explosionProgress;
        const zoomY = 0.25 - (1.75 * explosionProgress); // ends at y=-1.5
        coreRef.current.position.z = zoomZ;
        coreRef.current.position.y = zoomY;
    }

    if (groupRef.current) {
        if (!exploding) {
            if (!isDragging.current) {
                rotationVelocity.current.x *= 0.95;
                rotationVelocity.current.y *= 0.95;
                groupRef.current.rotation.x += rotationVelocity.current.y;
                groupRef.current.rotation.y += rotationVelocity.current.x;
                if (momentumMagnitude < 0.0001) {
                    groupRef.current.rotation.y += 0.0014;
                }
            }
            groupRef.current.rotation.x = Math.max(-0.5, Math.min(0.5, groupRef.current.rotation.x));
        } else {
            groupRef.current.rotation.y += 0.00035; 
        }
        // Track orbital rotation for pyramid sync
        orbitalRotationY.current = groupRef.current.rotation.y;
    }
  });

  const handlePointerDown = (e) => {
    if (exploding) return;
    e.stopPropagation();
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    document.body.style.cursor = 'auto';
  };

  const handlePointerMove = (e) => {
    if (exploding || !isDragging.current || !groupRef.current) return;
    const deltaX = (e.clientX - previousMouse.current.x) * 0.005;
    const deltaY = (e.clientY - previousMouse.current.y) * 0.005;
    groupRef.current.rotation.y += deltaX;
    groupRef.current.rotation.x += deltaY;
    const motion = motionPredictor.current.updateMotion({ x: deltaX, y: deltaY }, 16);
    rotationVelocity.current = { x: motion.velocity.x, y: motion.velocity.y };
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  return (
    <group position={[0, 0.45, 0]} scale={scale}>
      
      {/* Inner Core: PyramidInner replaces the cone */}
      <group ref={coreRef} position={[0, 0.35, 0]}>
        <PyramidInner 
          isActive={isActive}
          scrollProgress={pyramidScrollProgress}
          showLabels={showPyramidLabels}
          orbitalRotationY={orbitalRotationY}
          explosionProgress={explosionProgress}
          onIntroComplete={onIntroComplete}
          onLayerStateChange={onLayerStateChange}
        />
      </group>

      {/* Outer Holographic Crust */}
      <Sphere 
        ref={groupRef} 
        args={[2.5, 128, 128]} 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        <primitive object={material} attach="material" />
      </Sphere>

      {/* Atmospheric Glow - hidden after frame 15 */}
      <Sphere args={[3.2, 32, 32]}>
        <shaderMaterial
          transparent={true}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uniforms={{
            uColor: { value: new THREE.Color('#360642') }, 
            uIntensity: { value: explosionProgress > 0.4 ? 0 : 0.05 }
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
              float intensity = pow(0.85 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 6.0);
              gl_FragColor = vec4(uColor, intensity * uIntensity);
            }
          `}
        />
      </Sphere>
    </group>
  );
};

const HoloEarth = ({ 
  className, 
  style, 
  exploding = false, 
  explosionProgress = 0, 
  isMobile = false,
  isActive = false,
  pyramidScrollProgress = 0,
  showPyramidLabels = false,
  onIntroComplete = () => {},
  onLayerStateChange = () => {}
}) => {
  return (
    <div 
      className={`relative ${className || ''}`}
      style={{
        ...style,
        pointerEvents: exploding ? 'none' : 'auto',
        // Move up, scale, and shift left for mobile with viewport-relative units
        transform: isMobile ? 'translateY(calc(-1 * 12vh)) scale(1.15) translateX(calc(-1 * 3vw - 1.18rem))' : 'none',
        transformOrigin: 'center center'
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 40 }}
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
          depth: true,
          stencil: false
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#360642" />
          <HoloEarthSphere 
            exploding={exploding} 
            explosionProgress={explosionProgress}
            isActive={isActive}
            pyramidScrollProgress={pyramidScrollProgress}
            showPyramidLabels={showPyramidLabels}
            onIntroComplete={onIntroComplete}
            onLayerStateChange={onLayerStateChange}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default React.memo(HoloEarth);
