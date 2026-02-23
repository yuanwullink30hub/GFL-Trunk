import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { MotionPredictor } from '../../utils/MotionPredictor';
import { getPerformanceSettings } from '../../utils/performanceMonitor';
import PyramidInner from '../holoearth/PyramidInner';
import EarthParticleWaves from './EarthParticleWaves';

// --- Generate landmass chunks from actual sphere surface with thickness ---
const generateChunkGeometries = (radius = 2.5, segments = 48) => {
  const baseSphere = new THREE.SphereGeometry(radius, segments, segments);
  const positions = baseSphere.attributes.position.array;
  const normals = baseSphere.attributes.normal.array;
  const uvs = baseSphere.attributes.uv.array;
  const indices = baseSphere.index.array;
  
  // Hash function for chunk assignment
  const hash33 = (x, y, z) => {
    let px = Math.abs((x * 127.1 + y * 311.7 + z * 74.7) % 1);
    let py = Math.abs((x * 269.5 + y * 183.3 + z * 246.1) % 1);
    let pz = Math.abs((x * 113.5 + y * 271.9 + z * 124.6) % 1);
    return [px, py, pz];
  };
  
  // Voronoi-style chunk assignment for natural "broken" look
  const frequency = 2.0; // Controls chunk size
  const triangleCount = indices.length / 3;
  const chunkTriangles = {};
  
  for (let t = 0; t < triangleCount; t++) {
    const i0 = indices[t * 3];
    const i1 = indices[t * 3 + 1];
    const i2 = indices[t * 3 + 2];
    
    const cx = (positions[i0 * 3] + positions[i1 * 3] + positions[i2 * 3]) / 3;
    const cy = (positions[i0 * 3 + 1] + positions[i1 * 3 + 1] + positions[i2 * 3 + 1]) / 3;
    const cz = (positions[i0 * 3 + 2] + positions[i1 * 3 + 2] + positions[i2 * 3 + 2]) / 3;
    
    const sx = cx * frequency;
    const sy = cy * frequency;
    const sz = cz * frequency;
    const nx = Math.floor(sx);
    const ny = Math.floor(sy);
    const nz = Math.floor(sz);
    const fx = sx - nx;
    const fy = sy - ny;
    const fz = sz - nz;
    
    let minDist = 100;
    let chunkKey = '0_0_0';
    
    for (let dk = -1; dk <= 1; dk++) {
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const gx = nx + di;
          const gy = ny + dj;
          const gz = nz + dk;
          const [px, py, pz] = hash33(gx, gy, gz);
          const diffX = di + px - fx;
          const diffY = dj + py - fy;
          const diffZ = dk + pz - fz;
          const d = diffX * diffX + diffY * diffY + diffZ * diffZ;
          if (d < minDist) {
            minDist = d;
            chunkKey = `${gx}_${gy}_${gz}`;
          }
        }
      }
    }
    
    if (!chunkTriangles[chunkKey]) chunkTriangles[chunkKey] = [];
    chunkTriangles[chunkKey].push(t);
  }
  
  // Create proper 3D chunks with thickness
  const chunks = [];
  const thickness = 0.22;
  
  for (const key of Object.keys(chunkTriangles)) {
    const tris = chunkTriangles[key];
    if (tris.length < 4) continue;
    
    // Build vertex arrays for this chunk
    const chunkPositions = [];
    const chunkNormals = [];
    const chunkUvs = [];
    
    // Track edge vertices for side walls
    const edgeMap = new Map();
    
    const addEdge = (v1Idx, v2Idx, triIdx) => {
      const key = v1Idx < v2Idx ? `${v1Idx}_${v2Idx}` : `${v2Idx}_${v1Idx}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { v1: v1Idx, v2: v2Idx, count: 0 });
      }
      edgeMap.get(key).count++;
    };
    
    // OUTER SURFACE (original sphere)
    for (const t of tris) {
      const i0 = indices[t * 3];
      const i1 = indices[t * 3 + 1];
      const i2 = indices[t * 3 + 2];
      
      addEdge(i0, i1, t);
      addEdge(i1, i2, t);
      addEdge(i2, i0, t);
      
      for (const idx of [i0, i1, i2]) {
        chunkPositions.push(positions[idx * 3], positions[idx * 3 + 1], positions[idx * 3 + 2]);
        chunkNormals.push(normals[idx * 3], normals[idx * 3 + 1], normals[idx * 3 + 2]);
        chunkUvs.push(uvs[idx * 2], uvs[idx * 2 + 1]);
      }
    }
    
    // INNER SURFACE (extruded inward, reversed winding)
    for (const t of tris) {
      const triIndices = [indices[t * 3 + 2], indices[t * 3 + 1], indices[t * 3]]; // Reversed
      
      for (const idx of triIndices) {
        const px = positions[idx * 3];
        const py = positions[idx * 3 + 1];
        const pz = positions[idx * 3 + 2];
        const nnx = normals[idx * 3];
        const nny = normals[idx * 3 + 1];
        const nnz = normals[idx * 3 + 2];
        
        chunkPositions.push(px - nnx * thickness, py - nny * thickness, pz - nnz * thickness);
        chunkNormals.push(-nnx, -nny, -nnz);
        chunkUvs.push(uvs[idx * 2], uvs[idx * 2 + 1]);
      }
    }
    
    // SIDE WALLS (connect edges that belong to only one triangle = boundary edges)
    for (const [, edge] of edgeMap) {
      if (edge.count === 1) {
        const v1 = edge.v1;
        const v2 = edge.v2;
        
        // Outer edge vertices
        const o1 = [positions[v1 * 3], positions[v1 * 3 + 1], positions[v1 * 3 + 2]];
        const o2 = [positions[v2 * 3], positions[v2 * 3 + 1], positions[v2 * 3 + 2]];
        
        // Inner edge vertices
        const n1 = [normals[v1 * 3], normals[v1 * 3 + 1], normals[v1 * 3 + 2]];
        const n2 = [normals[v2 * 3], normals[v2 * 3 + 1], normals[v2 * 3 + 2]];
        const i1 = [o1[0] - n1[0] * thickness, o1[1] - n1[1] * thickness, o1[2] - n1[2] * thickness];
        const i2 = [o2[0] - n2[0] * thickness, o2[1] - n2[1] * thickness, o2[2] - n2[2] * thickness];
        
        // Calculate side normal (perpendicular to edge and radial direction)
        const edgeDir = new THREE.Vector3(o2[0] - o1[0], o2[1] - o1[1], o2[2] - o1[2]).normalize();
        const midpoint = new THREE.Vector3((o1[0] + o2[0]) / 2, (o1[1] + o2[1]) / 2, (o1[2] + o2[2]) / 2);
        const radial = midpoint.clone().normalize();
        const sideNormal = new THREE.Vector3().crossVectors(edgeDir, radial).normalize();
        
        // Two triangles for the quad
        // Triangle 1: o1, o2, i1
        chunkPositions.push(o1[0], o1[1], o1[2]);
        chunkPositions.push(o2[0], o2[1], o2[2]);
        chunkPositions.push(i1[0], i1[1], i1[2]);
        for (let j = 0; j < 3; j++) {
          chunkNormals.push(sideNormal.x, sideNormal.y, sideNormal.z);
          chunkUvs.push(0, 0);
        }
        
        // Triangle 2: o2, i2, i1
        chunkPositions.push(o2[0], o2[1], o2[2]);
        chunkPositions.push(i2[0], i2[1], i2[2]);
        chunkPositions.push(i1[0], i1[1], i1[2]);
        for (let j = 0; j < 3; j++) {
          chunkNormals.push(sideNormal.x, sideNormal.y, sideNormal.z);
          chunkUvs.push(0, 0);
        }
      }
    }
    
    // Calculate chunk center
    let centerX = 0, centerY = 0, centerZ = 0;
    const outerVertCount = tris.length * 3;
    for (let i = 0; i < outerVertCount; i++) {
      centerX += chunkPositions[i * 3];
      centerY += chunkPositions[i * 3 + 1];
      centerZ += chunkPositions[i * 3 + 2];
    }
    centerX /= outerVertCount;
    centerY /= outerVertCount;
    centerZ /= outerVertCount;
    
    const chunkGeom = new THREE.BufferGeometry();
    chunkGeom.setAttribute('position', new THREE.Float32BufferAttribute(chunkPositions, 3));
    chunkGeom.setAttribute('normal', new THREE.Float32BufferAttribute(chunkNormals, 3));
    chunkGeom.setAttribute('uv', new THREE.Float32BufferAttribute(chunkUvs, 2));
    
    const [rx, ry, rz] = hash33(centerX * 10, centerY * 10, centerZ * 10);
    
    chunks.push({
      geometry: chunkGeom,
      center: new THREE.Vector3(centerX, centerY, centerZ),
      direction: new THREE.Vector3(centerX, centerY, centerZ).normalize(),
      randomSeed: rx,
      rotationAxis: new THREE.Vector3(rx - 0.5, ry - 0.5, rz - 0.5).normalize(),
      rotationSpeed: 0.3 + rx * 0.6,
      speed: 0.2 + ry * 0.4,
      delay: rz * 0.12,
    });
  }
  
  baseSphere.dispose();
  return chunks;
};

// --- Shader for landmass chunk pieces ---
const ChunkShaderMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uExplode: { value: 0 },
    uChunkFade: { value: 1.0 },
    uColorCore: { value: new THREE.Color('#0d0618') },   
    uColorLand: { value: new THREE.Color('#6b1d8f') },
    uColorLandDeep: { value: new THREE.Color('#3d0a5c') },
    uColorRim: { value: new THREE.Color('#1a0320') },
    uColorBorder: { value: new THREE.Color('#FFD700') },
    uColorBorderDark: { value: new THREE.Color('#2c290e') },
    uMap: { value: null },
  },
  vertexShader: `
    uniform float uExplode;
    
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      
      // Each vertex spreads outward from sphere center based on explosion progress
      // This creates the visual of particles separating/spreading apart
      vec3 radialDir = normalize(position); // Direction from center to this vertex
      float spreadFactor = uExplode * 0.04; // Smooth spread factor (adjustable)
      vec3 spreadPosition = position + radialDir * spreadFactor;
      
      vPosition = (modelMatrix * vec4(spreadPosition, 1.0)).xyz;
      vWorldPosition = spreadPosition;
      gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uExplode;
    uniform vec3 uColorCore;
    uniform vec3 uColorLand;
    uniform vec3 uColorLandDeep;
    uniform vec3 uColorRim;
    uniform vec3 uColorBorder;
    uniform vec3 uColorBorderDark;
    uniform sampler2D uMap;
    uniform float uChunkFade;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    void main() {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(cameraPosition - vPosition);
      float VdotN = dot(V, N);
      
      // Frame-based progression (matches previous build)
      float normExp = uExplode / 25.0;
      float fresnel = pow(1.0 - abs(VdotN), 2.0);
      
      // Sample earth texture using spherical UVs
      vec4 texColor = texture2D(uMap, vUv);
      float mapValue = texColor.r;
      
      // Continent detection from texture - SAME as solid sphere
      float continent = smoothstep(0.40, 0.60, mapValue);
      float border = smoothstep(0.3, 0.45, mapValue) * (1.0 - smoothstep(0.55, 0.7, mapValue));
      
      // Transition factor: gradual fade-in from frame 9 to frame 20
      // Frame 9 linear (0.36) = 0.36^2.5 ≈ 0.078 eased - particles start appearing
      // Frame 20 linear (0.80) = 0.80^2.5 ≈ 0.57 eased - fully visible
      float fadeInStart = 0.078; // Frame 9 eased
      float fadeInEnd = 0.57;    // Frame 20 eased
      float transition = clamp((normExp - fadeInStart) / (fadeInEnd - fadeInStart), 0.0, 1.0);
      // Before fadeInStart, transition is 0; after fadeInEnd, transition is 1
      if (normExp < fadeInStart) transition = 0.0;
      
      // Lighting transition: kicks in earlier (frame 3-4) instead of frame 9
      // Frame 3 linear (0.12) = 0.12^2.5 ≈ 0.003, Frame 4 = 0.01
      float lightingTransition = clamp(normExp / 0.015, 0.0, 1.0); // Earlier than transition
      
      // === COLORS - Match solid sphere at start ===
      // Solid sphere uses: mix(uColorCore * 0.4, uColorLand * 1.2, continent)
      // Start: exactly match solid sphere
      // End: slightly brighter for exploded chunks
      vec3 oceanColorStart = uColorCore * 0.4;
      vec3 oceanColorEnd = uColorCore * 0.6;
      vec3 landColorStart = uColorLand * 1.2;
      vec3 landColorEnd = uColorLand * 1.4;
      
      vec3 oceanColor = mix(oceanColorStart, oceanColorEnd, transition);
      vec3 landColor = mix(landColorStart, landColorEnd, transition);
      
      // Base color: ocean vs land
      vec3 color = mix(oceanColor, landColor, continent);
      
      // Gold borders - solid sphere uses: uColorBorder * border * 2.5
      // Start at 2.5 (match solid), boost to 12.0 for visibility during explosion
      if (gl_FrontFacing) {
        float borderBoost = 1.0 - smoothstep(0.0, 0.15, normExp);
        float borderIntensity = mix(2.5, mix(12.0, 2.0, transition), normExp > 0.01 ? 1.0 : 0.0);
        if (normExp <= 0.01) borderIntensity = 2.5; // Exact match at start
        // Increase base border visibility - multiply by 1.6 for more prominent lines
        color += uColorBorder * border * borderIntensity * 1.6;
      }
      
      // Fresnel rim glow - solid sphere uses: uColorRim * fresnel * 1.5
      color += uColorRim * fresnel * 1.5;
      
      // Face shading - solid sphere uses: faceMult = gl_FrontFacing ? 1.1 : 0.5
      float faceMult = gl_FrontFacing ? 1.1 : 0.5;
      color *= faceMult;
      
      // Directional lighting - ONLY apply after lighting transition (earlier than color transition)
      vec3 lightDir = normalize(vec3(0.4, 0.8, 0.6));
      float diffuse = max(dot(N, lightDir), 0.0) * 0.3 + 0.7;
      float lightingMix = mix(1.0, diffuse, lightingTransition); // Kicks in around frame 3-4
      color *= lightingMix;
      
      if (!gl_FrontFacing) {
        // Inner faces
        color = landColor * 0.7 + oceanColor * 0.3;
      }
      
      // Scanline effect - solid sphere uses same
      float scanline = 0.9 + sin(gl_FragCoord.y * 0.15 - uTime * 2.0) * 0.1;
      color *= scanline;

      // === ALPHA - Match solid sphere formula at start ===
      // Solid sphere: alpha = 0.3 + (1.0 - continent) * 0.4 + fresnel * 0.5
      // This means: land = 0.3 + fresnel*0.5, ocean = 0.7 + fresnel*0.5
      // Starting alpha (before transition) - denser starting point
      float startAlpha = 3.3;
      
      // Ending alpha (fully transitioned chunks)
      float chunkAlpha = 2.4;
      
      // Blend from start alpha to chunk alpha based on transition
      float baseAlpha = mix(startAlpha, chunkAlpha, transition);
      
      // Apply fade-out during later frames via uChunkFade
      float alpha = baseAlpha * uChunkFade;

      gl_FragColor = vec4(color, alpha);
    }
  `
};

// --- Single Chunk Mesh Component ---
// The chunk geometries already have vertices at their correct sphere positions.
// We only add position offset for expansion movement, NOT for the base position.
// NOTE: explosionProgress is EASED (linear^2.5), not linear!
const ChunkMesh = ({ chunk, explosionProgress, material }) => {
  const meshRef = useRef();
  
  // Match particle sphere movement - fast, snappy expansion
  // Particles use baseDist = uExplode * 0.8 where uExplode = explosionProgress * 25
  // So particles move at roughly explosionProgress * 20-25 rate
  const expansion = explosionProgress * 69; // Much faster expansion
  
  // Position is ONLY the expansion offset - geometry already has correct sphere positions
  const posX = chunk.direction.x * expansion * chunk.speed;
  const posY = chunk.direction.y * expansion * chunk.speed;
  const posZ = chunk.direction.z * expansion * chunk.speed;
  
  return (
    <mesh 
      ref={meshRef} 
      geometry={chunk.geometry} 
      material={material}
      position={[posX, posY, posZ]}
    />
  );
};

// --- All Chunks Container - appears at frame 4, animates outward ---
const ExplodingChunks = ({ explosionProgress, earthMap, chunkFadeValue }) => {
  const chunks = useMemo(() => {
    const performanceSettings = getPerformanceSettings();
    const segments = performanceSettings.tier === 'LOW' ? 32 : 48;
    return generateChunkGeometries(2.5, segments);
  }, []);
  
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(ChunkShaderMaterial.uniforms),
      vertexShader: ChunkShaderMaterial.vertexShader,
      fragmentShader: ChunkShaderMaterial.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, // Match solid sphere's additive blending
      depthWrite: false, // Required for proper additive blending
    });
    return mat;
  }, []);
  
  useEffect(() => {
    if (material && earthMap) {
      material.uniforms.uMap.value = earthMap;
    }
  }, [earthMap, material]);
  
  useFrame((state) => {
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uExplode.value = explosionProgress * 25;
      material.uniforms.uChunkFade.value = chunkFadeValue;
    }
  });
  
  return (
    <group>
      {chunks.map((chunk, i) => (
        <ChunkMesh 
          key={i} 
          chunk={chunk} 
          explosionProgress={explosionProgress}
          material={material}
        />
      ))}
    </group>
  );
};

const HoloEarthSphere = ({ 
  exploding, 
  explosionProgress = 0, 
  isActive = false, 
  pyramidScrollProgress = 0,
  showPyramidLabels = false,
  coreScaleMultiplier = 1, // Scale for inner core during convergence
  onIntroComplete = () => {},
  onLayerStateChange = () => {},
  isMobile = false
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

  // Scale: base scale with mobile multiplier for larger earth on mobile
  const baseScale = Math.min(1, viewport.width / 5.5) * 0.65;
  const scale = isMobile ? baseScale * 1.15 : baseScale;

  // Solid sphere material - used for complete earth (frames 0-3)
  const solidSphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorCore: { value: new THREE.Color('#0d0618') },   
        uColorLand: { value: new THREE.Color('#6b1d8f') },
        uColorRim: { value: new THREE.Color('#1a0320') },
        uColorBorder: { value: new THREE.Color('#FFD700') },
        uMap: { value: null },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * viewMatrix * vec4(vPosition, 1.0);
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
        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(cameraPosition - vPosition);
          float VdotN = dot(V, N);
          float fresnel = pow(1.0 - abs(VdotN), 2.0);
          vec4 texColor = texture2D(uMap, vUv);
          float mapValue = texColor.r;
          float continent = smoothstep(0.40, 0.60, mapValue);
          float border = smoothstep(0.3, 0.45, mapValue) * (1.0 - smoothstep(0.55, 0.7, mapValue));
          // Match brighter chunk colors - increase land color multiplier
          vec3 color = mix(uColorCore * 0.4, uColorLand * 1.4, continent);
          // Match chunk border visibility (2.5 * 1.6 = 4.0)
          color += uColorBorder * border * 2.5 * 1.6;
          // Boost rim glow for more brightness
          color += uColorRim * fresnel * 2.0;
          float faceMult = gl_FrontFacing ? 1.1 : 0.5;
          color *= faceMult;
          // Reduce scanline darkening for brighter result
          float scanline = 0.95 + sin(gl_FragCoord.y * 0.15 - uTime * 2.0) * 0.05;
          color *= scanline;
          // Significantly boost alpha to match chunks brightness (2.0x instead of 1.4x)
          float alpha = (0.3 + (1.0 - continent) * 0.4 + fresnel * 0.5) * 2.0;
          alpha = min(alpha, 1.0); // Clamp to 1.0
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, []);

  // Load earth texture into solid sphere material
  useEffect(() => {
    if (solidSphereMaterial && earthMap) {
      solidSphereMaterial.uniforms.uMap.value = earthMap;
    }
  }, [earthMap, solidSphereMaterial]);



  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = -2.4; 
      groupRef.current.rotation.x = 0.25;
    }
  }, []);

  // Chunk fade calculation - fade out during later frames
  // NOTE: explosionProgress is EASED (linear^2.5)
  // Multi-step gradual fade with set points for smoother transparency transition
  // Frame mappings (linear -> eased):
  // Frame 13 (0.52 linear) = 0.20 eased -> 100% opacity
  // Frame 16 (0.64 linear) = 0.33 eased -> 85% opacity
  // Frame 19 (0.76 linear) = 0.50 eased -> 60% opacity
  // Frame 22 (0.88 linear) = 0.72 eased -> 30% opacity
  // Frame 25 (1.00 linear) = 1.00 eased -> 0% opacity
  const fadePoints = [
    { progress: 0.20, opacity: 1.0 },   // Frame 13 - fully visible
    { progress: 0.33, opacity: 0.85 },  // Frame 16 - slight fade
    { progress: 0.50, opacity: 0.60 },  // Frame 19 - moderate fade
    { progress: 0.72, opacity: 0.30 },  // Frame 22 - mostly faded
    { progress: 1.00, opacity: 0.0 },   // Frame 25 - fully transparent
  ];
  
  let chunkFadeValue = 1.0;
  if (explosionProgress >= fadePoints[0].progress) {
    // Find which segment we're in
    for (let i = 0; i < fadePoints.length - 1; i++) {
      if (explosionProgress >= fadePoints[i].progress && explosionProgress <= fadePoints[i + 1].progress) {
        const segmentProgress = (explosionProgress - fadePoints[i].progress) / (fadePoints[i + 1].progress - fadePoints[i].progress);
        chunkFadeValue = fadePoints[i].opacity + (fadePoints[i + 1].opacity - fadePoints[i].opacity) * segmentProgress;
        break;
      }
    }
    if (explosionProgress > fadePoints[fadePoints.length - 1].progress) {
      chunkFadeValue = 0.0;
    }
  }

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // Update solid sphere time uniform
    if (solidSphereMaterial) {
      solidSphereMaterial.uniforms.uTime.value = time;
    }
    
    const momentumMagnitude = Math.abs(rotationVelocity.current.x) + Math.abs(rotationVelocity.current.y);
    
    if (coreRef.current) {
        coreRef.current.rotation.y += 0.0014;
        coreRef.current.rotation.x = Math.sin(time * 0.35) * 0.1;
        
        const zoomZ = 4.5 * explosionProgress;
        const pyramidYOffset = window.innerWidth >= 1280 ? 0.27 :
                               window.innerWidth >= 1100 ? 0.27 :
                               window.innerWidth >= 768 ? 0.22 :
                               0;
        const zoomY = 0.25 - (1.75 * explosionProgress) + (pyramidYOffset * explosionProgress);
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

  const mobileYOffset = isMobile ? -(3 * 16 * viewport.height / window.innerHeight) : 0;
  const baseY = 0.45 + mobileYOffset;

  return (
    <group position={[0, baseY, 0]} scale={scale}>
      
      {/* Inner Core: PyramidInner */}
      <group ref={coreRef} position={[0, 0.35, 0]}>
        <PyramidInner 
          isActive={isActive}
          scrollProgress={pyramidScrollProgress}
          showLabels={showPyramidLabels}
          orbitalRotationY={orbitalRotationY}
          explosionProgress={explosionProgress}
          coreScaleMultiplier={coreScaleMultiplier}
          onIntroComplete={onIntroComplete}
          onLayerStateChange={onLayerStateChange}
        />
      </group>

      {/* Earth Hologram - Solid sphere before explosion, chunks during explosion */}
      {/* Chunks appear immediately when explosion starts (15 frames earlier than before) */}
      <group ref={groupRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        {/* Solid Complete Earth - visible only before explosion starts */}
        {explosionProgress === 0 && (
          <Sphere args={[2.5, 64, 64]}>
            <primitive 
              object={solidSphereMaterial} 
              attach="material" 
              transparent={true}
            />
          </Sphere>
        )}
        
        {/* Exploding Chunks - appear immediately when explosion begins, unmount when fully faded */}
        {explosionProgress > 0 && chunkFadeValue > 0 && (
          <ExplodingChunks 
            explosionProgress={explosionProgress}
            earthMap={earthMap}
            chunkFadeValue={chunkFadeValue}
          />
        )}
        
        {/* Inner Glow - dropshadow/glow inside earth to integrate chunks with particle sphere */}
        {/* NOTE: explosionProgress is EASED. Frame 9 (0.078) to Frame 18 (0.44) */}
        {/* Fades out from frame 16 (0.33) to frame 18 (0.44), then unmounts */}
        {explosionProgress > 0.078 && explosionProgress < 0.44 && (
          <Sphere args={[2.35, 32, 32]}>
            <shaderMaterial
              transparent={true}
              side={THREE.BackSide}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              uniforms={{
                uColor: { value: new THREE.Color('#1a0825') },
                uGlowColor: { value: new THREE.Color('#6b1d8f') },
                uIntensity: { value: Math.min(1, (explosionProgress - 0.078) / 0.15) * 0.6 * (explosionProgress > 0.33 ? Math.max(0, 1 - (explosionProgress - 0.33) / (0.44 - 0.33)) : 1) }
              }}
              vertexShader={`
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                  vNormal = normalize(normalMatrix * normal);
                  vPosition = position;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `}
              fragmentShader={`
                uniform vec3 uColor;
                uniform vec3 uGlowColor;
                uniform float uIntensity;
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                  // Soft inner glow that's stronger at edges
                  float edgeFade = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
                  float glow = pow(edgeFade, 1.5) * uIntensity;
                  
                  // Mix base color with glow color
                  vec3 color = mix(uColor, uGlowColor, edgeFade * 0.5);
                  
                  // Soft falloff for nice integration
                  float alpha = glow * 0.8;
                  gl_FragColor = vec4(color, alpha);
                }
              `}
            />
          </Sphere>
        )}
      </group>

      {/* Earth Particle Waves - has internal visibility logic, becomes visible around frame 9 */}
      {explosionProgress > 0 && getPerformanceSettings().tier !== 'LOW' && (
        <EarthParticleWaves 
          explosionProgress={explosionProgress} 
          sphereRadius={2.5}
        />
      )}

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
  coreScaleMultiplier = 1, // Scale for inner core during convergence
  onIntroComplete = () => {},
  onLayerStateChange = () => {}
}) => {
  return (
    <div 
      className={className || ''}
      style={{
        ...style,
        // Mobile: Fill parent (which is flexbox centered), Desktop: absolute fill
        position: isMobile ? 'relative' : 'absolute',
        inset: isMobile ? undefined : 0,
        width: isMobile ? '100vw' : undefined,
        height: isMobile ? '100vh' : undefined,
        pointerEvents: exploding ? 'none' : 'auto',
        overflow: 'visible',
      }}
    >
      {/* Canvas wrapper - Mobile uses simple 100% fill, Desktop uses 200% for map navigation */}
      <div style={isMobile ? {
        // Mobile: Simple full-size canvas
        position: 'absolute',
        inset: 0,
        overflow: 'visible',
      } : {
        // Desktop: 200% size for extra rendering area to prevent clipping during map navigation
        position: 'absolute',
        width: '200%',
        height: '200%',
        left: '-50%',
        top: '-50%',
        overflow: 'visible',
      }}>
        <Canvas 
          camera={{ position: [0, 0, 8], fov: 40 }}
          style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          gl={{ 
            alpha: true, 
            premultipliedAlpha: false,
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            depth: true,
            stencil: false,
            precision: 'mediump',
          }}
          dpr={1}
          performance={{ min: 0.5, max: 1, debounce: 200 }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#FFD700" />
            {getPerformanceSettings().tier !== 'LOW' && <pointLight position={[-10, -10, -10]} intensity={1} color="#360642" />}
            {/* Scale group - Mobile uses 1.3x for larger display, Desktop uses 0.5 to compensate for 200% canvas */}
            <group scale={isMobile ? 1.3 : 0.5}>
              <HoloEarthSphere 
                exploding={exploding} 
                explosionProgress={explosionProgress}
                isActive={isActive}
                pyramidScrollProgress={pyramidScrollProgress}
                showPyramidLabels={showPyramidLabels}
                coreScaleMultiplier={coreScaleMultiplier}
                onIntroComplete={onIntroComplete}
                onLayerStateChange={onLayerStateChange}
                isMobile={isMobile}
              />
            </group>
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
};

export default React.memo(HoloEarth);
