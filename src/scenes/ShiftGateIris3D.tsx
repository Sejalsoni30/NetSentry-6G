import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ShiftGateIris3DProps {
  position?: [number, number, number];
  openFactor: number; // 0 = fully closed, 1 = fully open
  bladeCount?: number;
  radius?: number;
  color?: string;
  edgeColor?: string;
}

export const ShiftGateIris3D: React.FC<ShiftGateIris3DProps> = ({
  position = [0, 0, 0],
  openFactor,
  bladeCount = 8,
  radius = 5.5,
  color = '#0E1424',
  edgeColor = '#22E4FF',
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const currentOpenRef = useRef(openFactor);

  // Custom blade shape
  const bladeShape = useMemo(() => {
    const shape = new THREE.Shape();
    const length = radius * 1.35;
    const width = (Math.PI * 2 * radius) / bladeCount * 1.25;

    shape.moveTo(0, 0);
    shape.lineTo(width * 0.9, -width * 0.35);
    shape.lineTo(width * 1.2, length * 0.7);
    shape.lineTo(0.2, length);
    shape.closePath();

    return shape;
  }, [radius, bladeCount]);

  useFrame((_, delta) => {
    // Smooth lerp for open factor
    currentOpenRef.current = THREE.MathUtils.damp(
      currentOpenRef.current,
      openFactor,
      4.5,
      delta
    );

    if (groupRef.current) {
      const open = currentOpenRef.current;
      groupRef.current.children.forEach((child, i) => {
        const angle = (i / bladeCount) * Math.PI * 2;
        // Blade rotates and retracts radially
        const radialOffset = radius * 0.5 + open * radius * 0.9;
        const bladeRotation = angle + open * 0.65;

        child.position.x = Math.cos(angle) * radialOffset;
        child.position.y = Math.sin(angle) * radialOffset;
        child.rotation.z = bladeRotation;
      });
    }
  });

  return (
    <group position={position}>
      {/* Outer Ring Casing */}
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[radius * 1.1, radius * 1.35, 64]} />
        <meshStandardMaterial
          color="#080C17"
          roughness={0.4}
          metalness={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Luminous Guide Ring */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0.02]}>
        <ringGeometry args={[radius * 1.1 - 0.05, radius * 1.1, 64]} />
        <meshBasicMaterial color={edgeColor} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Iris Blades */}
      <group ref={groupRef}>
        {Array.from({ length: bladeCount }).map((_, i) => (
          <group key={i}>
            <mesh position={[0, 0, i * 0.005]}>
              <shapeGeometry args={[bladeShape]} />
              <meshStandardMaterial
                color={color}
                roughness={0.3}
                metalness={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Blade Luminous Edge */}
            <lineSegments position={[0, 0, i * 0.005 + 0.01]}>
              <edgesGeometry args={[new THREE.ShapeGeometry(bladeShape)]} />
              <lineBasicMaterial color={edgeColor} transparent opacity={0.65} />
            </lineSegments>
          </group>
        ))}
      </group>
    </group>
  );
};
