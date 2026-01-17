import React, { useMemo, useState, useEffect } from 'react';
import { useAnimationWorker } from '../hooks/useAnimationWorker';

// --- Geometry & Math Helpers ---

const getBrainRegion = (x, y, z) => {
  const pinealRadius = 40; 
  if ((x*x + y*y + z*z) < pinealRadius * pinealRadius) return 'pineal';

  const stemRadius = 45; 
  const stemDistSq = x*x + (z + 40)*(z + 40);
  if (stemDistSq < stemRadius*stemRadius && y > 60 && y < 200) {
    return 'stem';
  }

  if (Math.abs(x) < 45) return null;

  const cx = x / 90;
  const cy = (y - 90) / 60;
  const cz = (z + 120) / 70;
  if ((cx*cx + cy*cy + cz*cz) < 1.0) return 'cerebellum';

  let nx = x / 160; 
  let ny = y / 130; 
  let nz = z / 200;

  if (z < 0) nx /= 1.2; 
  if (z > 20) { 
      nx /= (1 - (z / 600));
      ny /= (1 - (z / 650));
  }
  if (y > 40) nx /= 0.85;

  if ((nx*nx + ny*ny + nz*nz) < 1.0) return 'cerebrum';

  return null;
};

const generateBrainStructure = (count) => {
  const points = [];
  const connections = [];
  
  // 1. Force 4 Central Yellow Nodes (Pineal Gland representation)
  // We explicitly create these first to ensure they exist and have the correct yellow color.
  for(let i=0; i<4; i++) {
    // Create a tight cluster in the center
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = 35 + Math.random() * 20; 
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    points.push({
        x, y, z,
        color: 'hsla(32, 89%, 51%, 1)', // Gold color matching Deltawerken (#ef8616)
        size: 24,
        id: `pineal-${i}`,
        region: 'pineal'
    });
  }

  let attempts = 0;
  
  // Bounds
  const BOUNDS = { x: 450, y: 650, z: 500 };

  while (points.length < count && attempts < count * 100) {
    attempts++;
    const x = (Math.random() - 0.5) * BOUNDS.x;
    const y = (Math.random() - 0.5) * BOUNDS.y;
    const z = (Math.random() - 0.5) * BOUNDS.z;

    const region = getBrainRegion(x, y, z);

    if (region) {
      if (region === 'pineal') {
          // We already forced 4 pineal nodes, so we skip adding more random ones
          // to keep the center clean and distinct.
          continue; 
      }

      let hue = 270 + Math.random() * 20; 
      let light = 60 + Math.random() * 20; 
      let alpha = 0.8;
      let size = Math.random() * 6 + 4.5;

      if (region === 'cerebrum') {
        size = Math.random() * 6 + 6;
        hue = 265 + Math.random() * 25; 
        light = 55 + Math.random() * 15; 
      } else if (region === 'stem') {
        hue = 260; 
        light = 40;
        size = 9; 
      }

      const color = `hsla(${hue}, 90%, ${light}%, ${alpha})`;
      
      const point = { x, y, z, color, size, id: attempts, region };
      points.push(point);
    }
  }

  // Generate Standard Connections
  const connectionExists = (id) => connections.some(c => c.id === id);

  points.forEach((p1, i) => {
    const neighbors = [];
    for (let j = 0; j < points.length; j++) {
        if (i === j) continue;
        const p2 = points[j];
        
        const isStemConnection = p1.region === 'stem' || p2.region === 'stem';
        const boxLimit = isStemConnection ? 180 : 130;

        if (Math.abs(p1.x - p2.x) > boxLimit) continue;
        if (Math.abs(p1.y - p2.y) > boxLimit) continue;
        if (Math.abs(p1.z - p2.z) > boxLimit) continue;

        const dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2 + (p2.z - p1.z)**2);
        neighbors.push({ p2, dist });
    }

    neighbors.sort((a, b) => a.dist - b.dist);

    const CONNECTIONS_PER_POINT = 2; 
    
    for (let k = 0; k < Math.min(neighbors.length, CONNECTIONS_PER_POINT); k++) {
        const { p2, dist } = neighbors[k];
        
        const isStemConnection = p1.region === 'stem' || p2.region === 'stem';
        const distLimit = isStemConnection ? 160 : 120;

        if (dist > distLimit) continue; 

        const id = p1.id < p2.id ? `${p1.id}-${p2.id}` : `${p2.id}-${p1.id}`;
        if (!connectionExists(id)) {
            connections.push({ p1, p2, id });
        }
    }
  });

  // --- BRIDGE CONNECTIONS (Bottom of hemispheres) ---
  const leftInner = points.filter(p => p.x < -45 && p.x > -120 && p.y > 40 && p.y < 160);
  const rightInner = points.filter(p => p.x > 45 && p.x < 120 && p.y > 40 && p.y < 160);

  leftInner.forEach(p1 => {
      let bestMatch = null;
      let minBridgeDist = 180; 

      rightInner.forEach(p2 => {
          const dist = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2 + (p2.z - p1.z)**2);
          if (dist < minBridgeDist) {
              minBridgeDist = dist;
              bestMatch = p2;
          }
      });

      if (bestMatch) {
          const id = p1.id < bestMatch.id ? `${p1.id}-${bestMatch.id}` : `${bestMatch.id}-${p1.id}`;
          if (!connectionExists(id) && Math.random() > 0.6) {
              connections.push({ p1, p2: bestMatch, id });
          }
      }
  });

  return { points, connections };
};

const BrainParticle = React.memo(({ x, y, z, color, size, region }) => {
  const isPineal = region === 'pineal';
  const isCerebrum = region === 'cerebrum';

  const width = size;
  const height = isCerebrum ? size * 0.85 : size;

  let background = `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95) 0%, ${color} 55%, rgba(0,0,0,0.8) 100%)`;
  let boxShadow = `0 0 ${size/2}px ${color}`;
  let opacity = 0.9;

  if (isPineal) {
    background = `radial-gradient(circle at 50% 50%, rgba(255,255,255,1) 15%, ${color} 60%, rgba(0,0,0,0) 100%)`;
    boxShadow = `0 0 ${size}px ${color}, 0 0 ${size * 0.5}px rgba(255,255,255,0.8)`;
    opacity = 1;
  } else if (isCerebrum) {
    const glowHue = x < 0 ? '138, 43, 226' : '180, 0, 220'; 
    const glowColor = `rgba(${glowHue}, 0.5)`;
    boxShadow = `0 0 ${size}px ${glowColor}`; 
    opacity = 0.85; 
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate3d(${x}px, ${y}px, ${z}px) translate(-50%, -50%)`,
        willChange: 'transform',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: background,
        boxShadow: boxShadow,
        opacity: opacity,
        pointerEvents: 'none',
      }} />
    </div>
  );
});

const NeuralConnection = React.memo(({ p1, p2 }) => {
  // Memoize geometry calc
  const { widthVal, transform } = useMemo(() => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const yaw = Math.atan2(dz, dx);
    const pitch = Math.atan2(dy, Math.sqrt(dx * dx + dz * dz));

    return {
        widthVal: length,
        transform: `translate3d(${p1.x}px, ${p1.y}px, ${p1.z}px) rotateY(${-yaw}rad) rotateZ(${pitch}rad)`
    };
  }, [p1, p2]);

  // Curve and ID generation
  const { curveHeight, controlY, uniqueId } = useMemo(() => {
      const height = 15 + Math.random() * 30; // Random amplitude
      const dir = Math.random() > 0.5 ? 1 : -1;
      // Control point offset in Y (relative to center)
      const cy = (height / 2) + (dir * (5 + Math.random() * 15));
      return {
          curveHeight: height,
          controlY: cy,
          uniqueId: Math.random().toString(36).substr(2, 9)
      };
  }, []);

  const pathD = `M 0 ${curveHeight/2} Q ${widthVal/2} ${controlY} ${widthVal} ${curveHeight/2}`;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: `${widthVal}px`,
        height: `${curveHeight}px`,
        marginTop: `-${curveHeight / 2}px`, // Shift up to center the pivot vertically
        transformOrigin: `0 50%`, // Rotate around the start of the line (vertically centered)
        transform: transform,
        pointerEvents: 'none',
      }}
    >
        <svg width={widthVal} height={curveHeight} style={{ display: 'block', overflow: 'visible' }}>
            <defs>
                <linearGradient id={`grad-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ff4500" stopOpacity="0" />
                    <stop offset="25%" stopColor="#ff4500" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#ff8c00" stopOpacity="1" />
                    <stop offset="75%" stopColor="#ff4500" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
                </linearGradient>
            </defs>
            {/* Glow Path - Thicker, Lower Opacity to simulate bloom without filter */}
            <path
                d={pathD}
                stroke={`url(#grad-${uniqueId})`}
                strokeWidth="4"
                fill="none"
                style={{ opacity: 0.3 }}
            />
            {/* Core Path - Sharp, Bright */}
            <path
                d={pathD}
                stroke={`url(#grad-${uniqueId})`}
                strokeWidth="1.5"
                fill="none"
            />
        </svg>
    </div>
  );
});

const HemisphereVolume = React.memo(({ xOffset, color }) => {
  const planes = [
    { rotateX: 0, rotateY: 0, width: 160, height: 260 },    
    { rotateX: 0, rotateY: 90, width: 360, height: 260 },   
    { rotateX: 90, rotateY: 0, width: 160, height: 360 },   
    { rotateX: 0, rotateY: 45, width: 280, height: 240 },   
    { rotateX: 0, rotateY: 135, width: 280, height: 240 },  
  ];

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: `translate3d(${xOffset}px, 0, 0)`,
      transformStyle: 'preserve-3d',
      pointerEvents: 'none',
    }}>
      {planes.map((plane, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: `${plane.width}px`,
            height: `${plane.height}px`,
            transform: `translate(-50%, -50%) rotateX(${plane.rotateX}deg) rotateY(${plane.rotateY}deg)`,
            background: `radial-gradient(ellipse at center, ${color} 15%, transparent 70%)`,
            opacity: 0.5, 
            filter: 'blur(20px)', 
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
});

const Mindholo = ({ nodeCount = 300, showScanline = true }) => {
  const { isReady, generateBrain } = useAnimationWorker();
  const [brainData, setBrainData] = useState(null);

  // Use Web Worker to generate brain structure off main thread
  useEffect(() => {
    if (!isReady) return;

    (async () => {
      try {
        const data = await generateBrain(nodeCount);
        setBrainData(data);
      } catch (error) {
        console.warn('Worker generation failed, falling back to main thread:', error.message);
        // Fallback to main thread generation if worker fails
        setBrainData(generateBrainStructure(nodeCount));
      }
    })();
  }, [nodeCount, isReady, generateBrain]);

  // Fallback to synchronous generation if worker not ready
  const { points, connections } = useMemo(() => {
    if (brainData) return brainData;
    return generateBrainStructure(nodeCount);
  }, [brainData, nodeCount]);

  return (
    <div
      style={{
        position: 'relative',
        width: 'min(800px, 90vmin)',
        height: 'min(800px, 90vmin)',
        background: 'transparent',
        borderRadius: '50%', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '2000px', 
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          transformStyle: 'preserve-3d',
          animation: 'rotator 36s linear infinite', 
          willChange: 'transform',
          pointerEvents: 'none', 
        }}
      >
        <HemisphereVolume xOffset={-75} color="rgba(90, 20, 250, 0.7)" />
        <HemisphereVolume xOffset={75} color="rgba(210, 0, 230, 0.7)" />

        {points.map((p) => (
          <BrainParticle key={p.id} {...p} />
        ))}

        {connections.map((c) => (
            <NeuralConnection key={c.id} p1={c.p1} p2={c.p2} />
        ))}
        
        {/* SCANLINE - CIRCLE SHAPE */}
        {showScanline && (
          <svg 
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: '640px', height: '640px',
              transform: 'translate(-50%, -50%) rotateX(90deg)',
              animation: 'scan-vertical 6s ease-in-out infinite alternate',
              pointerEvents: 'none',
              overflow: 'visible',
            }}
            viewBox="0 0 640 640"
          >
            <defs>
              <radialGradient id="circleScanGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(167, 59, 198, 0.6)" />
                <stop offset="50%" stopColor="rgba(167, 59, 198, 0.3)" />
                <stop offset="100%" stopColor="rgba(167, 59, 198, 0.6)" />
              </radialGradient>
              <filter id="circleGlow">
                <feGaussianBlur stdDeviation="15" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle 
              cx="320" 
              cy="320" 
              r="220" 
              fill="none" 
              stroke="url(#circleScanGradient)" 
              strokeWidth="3" 
              strokeDasharray="20 10"
              filter="url(#circleGlow)"
            />
          </svg>
        )}
      </div>

      <style>{`
        @keyframes rotator {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(360deg); }
        }
        @keyframes scan-vertical {
            0% { transform: translate(-50%, -50%) rotateX(90deg) translateZ(-180px); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translate(-50%, -50%) rotateX(90deg) translateZ(180px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(Mindholo);
