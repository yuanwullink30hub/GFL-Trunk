import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function PyramidLayer(props) {
  const { baseWidth, topWidth, height, y, color = '#a73bc6', opacity = 0.45 } = props;
  const meshRef = useRef(null);

  const scale = 0.01;
  const bottom = (baseWidth * scale) / 2;
  const top = (topWidth * scale) / 2;
  const h = Math.max(0.01, height * scale);

  const geometry = useMemo(function createGeom() {
    return new THREE.CylinderGeometry(top, bottom, h, 4, 1, false);
  }, [top, bottom, h]);

  const material = useMemo(function createMat() {
    return new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: true,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
  }, [color, opacity]);

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} position={[0, y * scale, 0]} rotation={[0, Math.PI / 4, 0]} />
  );
}

function Pyramid3DInner(props) {
  const { layers = [], rotationSpeed = 0.02 } = props;
  const groupRef = useRef(null);

  useFrame(function (state, delta) {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <group ref={groupRef} rotation={[-0.35, 0, 0]}>
      {layers.map(function (layer, idx) {
        return <PyramidLayer key={idx} {...layer} />;
      })}
    </group>
  );
}

export default function Pyramid3D(props) {
  const { layers = [], style = {} } = props;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <Pyramid3DInner layers={layers} rotationSpeed={0.5} />
      </Canvas>
    </div>
  );
}

