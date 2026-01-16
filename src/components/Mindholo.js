<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Holographic Brain</title>
    <style>
      :root {
        --bg-void: #020205;
      }

      body {
        margin: 0;
        padding: 0;
        background-color: var(--bg-void);
        font-family: 'Segoe UI', 'Courier New', monospace;
        color: white;
        overflow: hidden;
        height: 100vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #root {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
    <script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/client": "https://esm.sh/react-dom@^19.2.3/client",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "react/": "https://esm.sh/react@^19.2.3/"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>

import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

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
    const r = Math.random() * 25; 
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    points.push({
        x, y, z,
        color: 'hsla(60, 100%, 70%, 1)', // Bright Pure Yellow
        size: 16,
        id: `pineal-${i}`,
        region: 'pineal'
    });
  }

  let attempts = 0;
  let pinealCount = 4; // We already have the 4 required nodes
  
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
      let size = Math.random() * 4 + 3;

      if (region === 'cerebrum') {
        size = Math.random() * 4 + 4; // Reduced from 8+8 to 4+4
        hue = 265 + Math.random() * 25; 
        light = 55 + Math.random() * 15; 
      } else if (region === 'stem') {
        hue = 260; 
        light = 40;
        size = 6; 
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

const BrainParticle: React.FC<{ x: number; y: number; z: number; color: string; size: number; region: string }> = React.memo(({ x, y, z, color, size, region }) => {
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
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: background,
        boxShadow: boxShadow,
        opacity: opacity,
      }} />
    </div>
  );
});

const NeuralConnection: React.FC<{ p1: any; p2: any }> = React.memo(({ p1, p2 }) => {
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

const HemisphereVolume: React.FC<{ xOffset: number; color: string }> = React.memo(({ xOffset, color }) => {
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

const HoloButton = () => {
  const { points, connections } = useMemo(() => generateBrainStructure(300), []);

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
        
        {/* SCANLINE - PURPLE COLOR */}
        <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: '640px', height: '640px', 
            border: '3px dashed rgba(167, 59, 198, 0.5)', 
            borderRadius: '50%',
            transform: 'translate(-50%, -50%) rotateX(90deg)',
            animation: 'scan-vertical 6s ease-in-out infinite alternate',
            boxShadow: '0 0 50px rgba(167, 59, 198, 0.5), inset 0 0 20px rgba(167, 59, 198, 0.3)',
            background: 'radial-gradient(closest-side, rgba(167, 59, 198, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
        }} />
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

const App = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      <HoloButton />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Holographic Brain</title>
    <style>
      :root {
        --bg-void: #020205;
      }

      body {
        margin: 0;
        padding: 0;
        background-color: var(--bg-void);
        font-family: 'Segoe UI', 'Courier New', monospace;
        color: white;
        overflow: hidden;
        height: 100vh;
        width: 100vw;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #root {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    </style>
    <script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@^19.2.3",
    "react-dom/client": "https://esm.sh/react-dom@^19.2.3/client",
    "react-dom/": "https://esm.sh/react-dom@^19.2.3/",
    "react/": "https://esm.sh/react@^19.2.3/"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>