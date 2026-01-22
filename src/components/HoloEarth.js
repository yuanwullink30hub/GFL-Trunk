import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { MotionPredictor } from '../utils/MotionPredictor';

// --- Custom Shader Material for the Holographic Surface ---
const HolographicShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uExplode: { value: 0 },
    uColorCore: { value: new THREE.Color('#2d1b4e') },   
    uColorLand: { value: new THREE.Color('#7c2faa') },   
    uColorRim: { value: new THREE.Color('#360642') },    // Dark Purple Glow
    uColorBorder: { value: new THREE.Color('#FFD700') }, // Bright Gold
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
          // High speed variance for separation
          float speed = 0.5 + (randomFactor * 2.0); 
          float dist = uExplode * speed;
          
          finalPos += explosionDir * dist;
          
          // Add some rotation/drift
          finalPos += tangent * sin(uExplode * 0.2 + randomFactor * 10.0) * (dist * 0.1);
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
      // Boost border brightness significantly
      color += uColorBorder * border * 4.0;

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

      float alpha = 0.2 + (continent * 0.2) + (fresnel * 0.6);
      
      // --- FADE LOGIC ---
      float fade = 1.0 - smoothstep(15.0, 40.0, uExplode);
      
      float distToCamera = distance(cameraPosition, vPosition);
      float proximityFade = smoothstep(2.0, 5.0, distToCamera);
      
      alpha *= fade * proximityFade;

      gl_FragColor = vec4(color, alpha);
    }
  `
};

const HoloEarthSphere = ({ exploding }) => {
  const groupRef = useRef(null);
  const coreRef = useRef(null);
  const { viewport } = useThree();
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });
  const motionPredictor = useRef(new MotionPredictor());
  const explosionStartTime = useRef(null);
  const explosionComplete = useRef(false);
  
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

      const currentExplode = material.uniforms.uExplode.value;
      const targetExplode = 25.0; // Distance to move
      const duration = 3.33; // Seconds

      if (exploding) {
         // Start explosion timer only once
         if (explosionStartTime.current === null && !explosionComplete.current) {
           explosionStartTime.current = time;
         }
         
         // Only animate if not complete
         if (!explosionComplete.current && explosionStartTime.current !== null) {
           const elapsedTime = time - explosionStartTime.current;
           const progress = Math.min(elapsedTime / duration, 1.0);
           
           // Easing: slow first half, faster second half
           let easedProgress;
           if (progress < 0.5) {
             // First half: slow down
             easedProgress = 0.5 * Math.pow(progress * 2, 1.5);
           } else {
             // Second half: speed up
             easedProgress = 0.5 + 0.5 * Math.pow((progress - 0.5) * 2, 0.8);
           }
           
           material.uniforms.uExplode.value = targetExplode * easedProgress;
           
           if (progress >= 1.0) {
             explosionComplete.current = true;
           }
         }
      } else {
         // Reset when going back to orbital
         explosionStartTime.current = null;
         explosionComplete.current = false;
         if (currentExplode > 0.0) {
           material.uniforms.uExplode.value = THREE.MathUtils.lerp(currentExplode, 0.0, delta * 2.0);
         }
      }
    }
    
    const momentumMagnitude = Math.abs(rotationVelocity.current.x) + Math.abs(rotationVelocity.current.y);
    
    if (coreRef.current) {
        coreRef.current.rotation.y += 0.005;
        coreRef.current.rotation.x = Math.sin(time * 0.5) * 0.1;
        
        if (exploding) {
             const zoomSpeed = 4.5 / 3.33;
             if (coreRef.current.position.z < 4.5) {
                coreRef.current.position.z += delta * zoomSpeed;
             }
             if (coreRef.current.position.y > -1.0) {
                 coreRef.current.position.y -= delta * (1.25 / 3.33);
             }
        } else {
             coreRef.current.position.z = THREE.MathUtils.lerp(coreRef.current.position.z, 0, delta * 2.0);
             coreRef.current.position.y = THREE.MathUtils.lerp(coreRef.current.position.y, 0.25, delta * 2.0);
        }
    }

    if (groupRef.current) {
        if (!exploding) {
            if (!isDragging.current) {
                rotationVelocity.current.x *= 0.95;
                rotationVelocity.current.y *= 0.95;
                groupRef.current.rotation.x += rotationVelocity.current.y;
                groupRef.current.rotation.y += rotationVelocity.current.x;
                if (momentumMagnitude < 0.0001) {
                    groupRef.current.rotation.y += 0.002;
                }
            }
            groupRef.current.rotation.x = Math.max(-0.5, Math.min(0.5, groupRef.current.rotation.x));
        } else {
            groupRef.current.rotation.y += 0.0005; 
        }
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
      
      {/* Inner Core: Matte Dark Object */}
      <group ref={coreRef} position={[0, 0.25, 0]}>
        <mesh rotation={[0, 0, 0]}> 
            <coneGeometry args={[1.6, 2.56, 4, 1]} /> 
            <meshStandardMaterial 
                color="#1a0a2e" 
                emissive="#000000"
                emissiveIntensity={0}
                roughness={0.8}
                metalness={0.2}
                flatShading={true}
            />
        </mesh>
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

      {/* Atmospheric Glow */}
      {!exploding && (
          <Sphere args={[3.2, 32, 32]}>
            <shaderMaterial
            transparent={true}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            uniforms={{
                uColor: { value: new THREE.Color('#360642') }, 
                uIntensity: { value: 0.1 }
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
      )}
    </group>
  );
};

const HoloEarth = ({ className, style, exploding = false, isMobile = false }) => {
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
          <HoloEarthSphere exploding={exploding} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default React.memo(HoloEarth);
