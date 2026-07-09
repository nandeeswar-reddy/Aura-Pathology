import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Reusable standard materials (more efficient on GPUs than MeshPhysicalMaterial)
const darkMaterial = new THREE.MeshStandardMaterial({
  color: '#2a3045',
  roughness: 0.15,
  metalness: 0.8,
});

const glowMaterial = new THREE.MeshStandardMaterial({
  color: '#ffb700',
  emissive: '#ff7700',
  emissiveIntensity: 2.2,
  toneMapped: false,
});

const DNA = ({ count = 35 }) => {
  const groupRef = useRef();
  const innerRef = useRef();

  const radius = 3.5;
  const height = 45;
  const heightStep = height / count;
  const angleStep = Math.PI * 2 * (1 / 10); // One turn every 10 base pairs

  // Pre-calculate segments data
  const segments = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const y1 = i * heightStep - height / 2;
      const a1 = i * angleStep;
      
      const y2 = (i + 1) * heightStep - height / 2;
      const a2 = (i + 1) * angleStep;

      // Backbone 1
      const p1_1 = new THREE.Vector3(Math.cos(a1) * radius, y1, Math.sin(a1) * radius);
      const p1_2 = new THREE.Vector3(Math.cos(a2) * radius, y2, Math.sin(a2) * radius);
      
      // Backbone 2
      const p2_1 = new THREE.Vector3(Math.cos(a1 + Math.PI) * radius, y1, Math.sin(a1 + Math.PI) * radius);
      const p2_2 = new THREE.Vector3(Math.cos(a2 + Math.PI) * radius, y2, Math.sin(a2 + Math.PI) * radius);

      const mid1 = p1_1.clone().lerp(p1_2, 0.5);
      const dist1 = p1_1.distanceTo(p1_2);
      const dir1 = p1_2.clone().sub(p1_1).normalize();
      const rot1 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir1);

      const mid2 = p2_1.clone().lerp(p2_2, 0.5);
      const dist2 = p2_1.distanceTo(p2_2);
      const dir2 = p2_2.clone().sub(p2_1).normalize();
      const rot2 = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir2);

      data.push({
        id: i,
        p1_1, p1_2, mid1, dist1, rot1,
        p2_1, p2_2, mid2, dist2, rot2,
        a1, y1
      });
    }
    return data;
  }, [count, heightStep, angleStep, radius, height]);

  // Pre-allocate and reuse geometries to eliminate CPU allocation overhead on every frame
  const geometries = useMemo(() => {
    // Distance between points is constant across all segments
    const backboneLength = Math.sqrt(2 * radius * radius * (1 - Math.cos(angleStep)) + heightStep * heightStep) - 0.2;
    
    return {
      backbone: new THREE.CylinderGeometry(0.2, 0.2, backboneLength, 10),
      joint: new THREE.CylinderGeometry(0.22, 0.22, 0.15, 10),
      rung: new THREE.CylinderGeometry(0.12, 0.12, radius * 2, 10),
      rungJoint: new THREE.CylinderGeometry(0.13, 0.13, 0.2, 8)
    };
  }, [radius, angleStep, heightStep]);

  // Clean up geometries on unmount to prevent WebGL memory leaks
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(geo => geo.dispose());
    };
  }, [geometries]);

  useFrame((state, delta) => {
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.15; // Slow rotation
    }
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  const responsiveScale = 0.32 * dpr;

  return (
    <group ref={groupRef} scale={responsiveScale} rotation={[0, 0, Math.PI / 4.5]}>
      <group ref={innerRef}>
        {segments.map((seg, i) => (
          <group key={seg.id}>
            {/* Backbone 1 */}
            {i < count - 1 && (
              <mesh position={seg.mid1} quaternion={seg.rot1} geometry={geometries.backbone} material={darkMaterial} />
            )}
            {/* Joint 1 */}
            <mesh position={seg.p1_1} quaternion={seg.rot1} geometry={geometries.joint} material={glowMaterial} />

            {/* Backbone 2 */}
            {i < count - 1 && (
              <mesh position={seg.mid2} quaternion={seg.rot2} geometry={geometries.backbone} material={darkMaterial} />
            )}
            {/* Joint 2 */}
            <mesh position={seg.p2_1} quaternion={seg.rot2} geometry={geometries.joint} material={glowMaterial} />

            {/* Rung */}
            <group position={[0, seg.y1, 0]} rotation={[0, -seg.a1, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]} geometry={geometries.rung} material={darkMaterial} />
              <mesh position={[radius * 0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={geometries.rungJoint} material={glowMaterial} />
              <mesh position={[-radius * 0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={geometries.rungJoint} material={glowMaterial} />
            </group>
          </group>
        ))}
      </group>
    </group>
  );
};

export default DNA;
