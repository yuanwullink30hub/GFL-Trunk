/* eslint-disable no-restricted-globals */
// Animation computation Web Worker
// Offloads heavy calculations (particle generation, path calculations) from main thread

/**
 * Generate brain structure for Mindholo
 */
const generateBrainStructure = (count) => {
  const points = [];
  const connections = [];
  
  // 1. Force 4 Central Yellow Nodes (Pineal Gland representation)
  for(let i=0; i<4; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = 35 + Math.random() * 20; 
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    points.push({
        x, y, z,
        color: 'hsla(32, 89%, 51%, 1)',
        size: 24,
        id: `pineal-${i}`,
        region: 'pineal'
    });
  }

  const getBrainRegion = (x, y, z) => {
    // Pineal (center)
    if (Math.sqrt(x*x + y*y + z*z) < 60) {
      return 'pineal';
    }
    // Cerebrum (upper larger area)
    if (y > -100 && Math.sqrt(x*x + z*z) < 200) {
      return 'cerebrum';
    }
    // Stem (lower)
    if (y < -100) {
      return 'stem';
    }
    return null;
  };

  let attempts = 0;
  const BOUNDS = { x: 450, y: 650, z: 500 };

  while (points.length < count && attempts < count * 100) {
    attempts++;
    const x = (Math.random() - 0.5) * BOUNDS.x;
    const y = (Math.random() - 0.5) * BOUNDS.y;
    const z = (Math.random() - 0.5) * BOUNDS.z;

    const region = getBrainRegion(x, y, z);

    if (region) {
      if (region === 'pineal') continue;

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
      
      // Simple proximity check
      let tooClose = false;
      for (let i = 0; i < points.length; i++) {
        const dx = points[i].x - x;
        const dy = points[i].y - y;
        const dz = points[i].z - z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < 30) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        points.push(point);
      }
    }
  }

  // Build connections between nearby points
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      const dz = points[i].z - points[j].z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      
      if (dist < 120) {
        connections.push({ from: i, to: j, distance: dist });
      }
    }
  }

  return { points, connections };
};

/**
 * Generate scatter points for Deltawerken
 */
const generateScatterPoints = (count = 25) => {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
  }));
};

/**
 * Message handler for worker
 */
self.onmessage = (event) => {
  const { type, payload } = event.data;

  try {
    let result;

    switch (type) {
      case 'GENERATE_BRAIN':
        result = generateBrainStructure(payload.count || 300);
        self.postMessage({ success: true, type: 'BRAIN_GENERATED', data: result });
        break;

      case 'GENERATE_SCATTER':
        result = generateScatterPoints(payload.count || 25);
        self.postMessage({ success: true, type: 'SCATTER_GENERATED', data: result });
        break;

      default:
        self.postMessage({ success: false, error: `Unknown message type: ${type}` });
    }
  } catch (error) {
    self.postMessage({ 
      success: false, 
      error: error.message || 'Unknown error in worker'
    });
  }
};
