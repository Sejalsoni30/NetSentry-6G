import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useObservatory } from '../hooks/useObservatoryStore';

interface DoorPlateProps {
  position: [number, number, number];
  doorIndex: number;
  isOpen: boolean;
  riskColor: string;
}

const SingleCorridorDoor: React.FC<DoorPlateProps> = ({
  position,
  isOpen,
  riskColor,
}) => {
  const leftPlateRef = useRef<THREE.Group>(null);
  const rightPlateRef = useRef<THREE.Group>(null);
  const openProgressRef = useRef(0);

  useFrame((_, delta) => {
    const target = isOpen ? 1 : 0;
    openProgressRef.current = THREE.MathUtils.damp(
      openProgressRef.current,
      target,
      4.0,
      delta
    );

    const slideDistance = 3.6 * openProgressRef.current;

    if (leftPlateRef.current) {
      leftPlateRef.current.position.x = -1.9 - slideDistance;
    }
    if (rightPlateRef.current) {
      rightPlateRef.current.position.x = 1.9 + slideDistance;
    }
  });

  return (
    <group position={position}>
      {/* Structural Gate Archway Frame */}
      <mesh position={[0, 0, -0.1]}>
        <ringGeometry args={[3.6, 4.4, 4, 1, Math.PI / 4]} />
        <meshStandardMaterial color="#080C17" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* Frame Status Trim */}
      <lineSegments position={[0, 0, 0.05]}>
        <edgesGeometry args={[new THREE.BoxGeometry(7.8, 6.2, 0.2)]} />
        <lineBasicMaterial color={riskColor} transparent opacity={0.65} />
      </lineSegments>

      {/* Left Pneumatic Door Plate */}
      <group ref={leftPlateRef} position={[-1.9, 0, 0]}>
        <mesh>
          <boxGeometry args={[3.6, 5.8, 0.15]} />
          <meshStandardMaterial
            color="#0E1424"
            roughness={0.25}
            metalness={0.8}
          />
        </mesh>
        {/* Edge Seam Flare */}
        <mesh position={[1.78, 0, 0.08]}>
          <boxGeometry args={[0.06, 5.7, 0.02]} />
          <meshBasicMaterial color={riskColor} toneMapped={false} />
        </mesh>
      </group>

      {/* Right Pneumatic Door Plate */}
      <group ref={rightPlateRef} position={[1.9, 0, 0]}>
        <mesh>
          <boxGeometry args={[3.6, 5.8, 0.15]} />
          <meshStandardMaterial
            color="#0E1424"
            roughness={0.25}
            metalness={0.8}
          />
        </mesh>
        {/* Edge Seam Flare */}
        <mesh position={[-1.78, 0, 0.08]}>
          <boxGeometry args={[0.06, 5.7, 0.02]} />
          <meshBasicMaterial color={riskColor} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

export const CorridorDoors3D: React.FC = () => {
  const { activeDoor, activeSection } = useObservatory();

  // 6 doors along corridor Z-axis
  const doorColors = ['#22E4FF', '#22E4FF', '#FFB020', '#FFB020', '#FF3B5C', '#FF3B5C'];

  return (
    <group position={[0, 0, -35]}>
      {Array.from({ length: 6 }).map((_, idx) => {
        const doorNum = idx + 1;
        // Door is open if currently focused in the experiment section or user clicked it
        const isDoorOpen = activeSection === 5 ? activeDoor === doorNum : activeSection > 5;
        const zPos = -idx * 8;

        return (
          <SingleCorridorDoor
            key={doorNum}
            doorIndex={doorNum}
            position={[0, 0, zPos]}
            isOpen={isDoorOpen}
            riskColor={doorColors[idx]}
          />
        );
      })}
    </group>
  );
};
