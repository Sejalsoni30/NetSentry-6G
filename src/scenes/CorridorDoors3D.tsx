import React, { useRef, useMemo } from 'react';
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
  doorIndex: _doorIndex,
  isOpen,
  riskColor,
}) => {
  const leftPlateRef = useRef<THREE.Group>(null);
  const rightPlateRef = useRef<THREE.Group>(null);
  const leftPistonRef = useRef<THREE.Mesh>(null);
  const rightPistonRef = useRef<THREE.Mesh>(null);
  const laserBeamsRef = useRef<THREE.LineSegments>(null);
  const openProgressRef = useRef(0);

  // Door Plate Dimensions
  const plateWidth = 3.6;
  const plateHeight = 6.2;

  // Generate Blueprint Ribs & Ventilation Grilles
  const doorRibs = useMemo(() => {
    const ribs: number[] = [];
    const yStarts = [-2.2, -1.2, -0.2, 0.8, 1.8];
    for (const y of yStarts) {
      ribs.push(-1.4, y, 0.09, 1.4, y, 0.09);
    }
    return new Float32Array(ribs);
  }, []);

  // Vertical Laser Interlock Beams (between doors when closed)
  const laserInterlockBeams = useMemo(() => {
    const beamCount = 6;
    const array = new Float32Array(beamCount * 2 * 3);
    for (let i = 0; i < beamCount; i++) {
      const x = ((i - (beamCount - 1) / 2) / (beamCount - 1)) * 1.8;
      // Bottom
      array[i * 6] = x;
      array[i * 6 + 1] = -2.8;
      array[i * 6 + 2] = 0.02;
      // Top
      array[i * 6 + 3] = x;
      array[i * 6 + 4] = 2.8;
      array[i * 6 + 5] = 0.02;
    }
    return array;
  }, []);

  useFrame((_, delta) => {
    const target = isOpen ? 1 : 0;
    openProgressRef.current = THREE.MathUtils.damp(
      openProgressRef.current,
      target,
      4.2,
      delta
    );

    const progress = openProgressRef.current;
    const slideDistance = 3.8 * progress;

    if (leftPlateRef.current) {
      leftPlateRef.current.position.x = -1.85 - slideDistance;
    }
    if (rightPlateRef.current) {
      rightPlateRef.current.position.x = 1.85 + slideDistance;
    }

    // Hydraulic Pistons stroke animation
    if (leftPistonRef.current) {
      leftPistonRef.current.scale.x = 1 + progress * 1.5;
    }
    if (rightPistonRef.current) {
      rightPistonRef.current.scale.x = 1 + progress * 1.5;
    }

    // Laser interlock fades out when door is opened
    if (laserBeamsRef.current) {
      const mat = laserBeamsRef.current.material as THREE.LineBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, (1 - progress * 2.2) * 0.75);
      }
    }
  });

  return (
    <group position={position}>
      {/* 1. STRUCTURAL OCTAGONAL AIRLOCK ARCHWAY BULKHEAD */}
      <mesh position={[0, 0, -0.12]}>
        <ringGeometry args={[3.8, 4.6, 8, 1, Math.PI / 8]} />
        <meshStandardMaterial
          color="#060E1C"
          roughness={0.25}
          metalness={0.92}
        />
      </mesh>

      {/* Frame Status CAD Wireframe Outline */}
      <lineSegments position={[0, 0, 0.06]}>
        <edgesGeometry args={[new THREE.BoxGeometry(8.2, 6.6, 0.25)]} />
        <lineBasicMaterial color={riskColor} transparent opacity={0.65} />
      </lineSegments>

      {/* Corner Gussets / Reinforcement Brackets */}
      {[-3.8, 3.8].map((x, xi) =>
        [-3.0, 3.0].map((y, yi) => (
          <group key={`${xi}-${yi}`} position={[x, y, 0.08]}>
            <lineSegments>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([
                    0, 0, 0, (x < 0 ? 0.6 : -0.6), 0, 0,
                    0, 0, 0, 0, (y < 0 ? 0.6 : -0.6), 0,
                  ]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={riskColor} transparent opacity={0.8} />
            </lineSegments>
          </group>
        ))
      )}

      {/* Door ID / Experiment HUD Header Bar */}
      <group position={[0, 3.1, 0.1]}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([-1.5, 0, 0, 1.5, 0, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={riskColor} transparent opacity={0.9} />
        </lineSegments>
      </group>

      {/* 2. HYDRAULIC PISTON HOUSINGS (TOP & BOTTOM) */}
      {/* Top Left Piston Cylinder */}
      <mesh position={[-3.2, 2.7, 0.05]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1.2, 8]} />
        <meshStandardMaterial color="#0A182E" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Top Right Piston Cylinder */}
      <mesh position={[3.2, 2.7, 0.05]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1.2, 8]} />
        <meshStandardMaterial color="#0A182E" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 3. VERTICAL LASER INTERLOCK SENSOR BEAMS */}
      <lineSegments ref={laserBeamsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[laserInterlockBeams, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={riskColor}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 4. LEFT PNEUMATIC BLAST DOOR PLATE */}
      <group ref={leftPlateRef} position={[-1.85, 0, 0]}>
        {/* Main Armor Plate */}
        <mesh>
          <boxGeometry args={[plateWidth, plateHeight, 0.16]} />
          <meshStandardMaterial
            color="#081426"
            roughness={0.2}
            metalness={0.92}
          />
        </mesh>

        {/* CAD Blueprint Outline */}
        <lineSegments position={[0, 0, 0.09]}>
          <edgesGeometry args={[new THREE.BoxGeometry(plateWidth, plateHeight, 0.16)]} />
          <lineBasicMaterial color={riskColor} transparent opacity={0.5} />
        </lineSegments>

        {/* Horizontal Structural Blueprint Ribs */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[doorRibs, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={riskColor} transparent opacity={0.3} />
        </lineSegments>

        {/* Vertical Luminous Seam Flare */}
        <mesh position={[plateWidth * 0.49, 0, 0.09]}>
          <boxGeometry args={[0.06, plateHeight - 0.2, 0.02]} />
          <meshBasicMaterial color={riskColor} toneMapped={false} />
        </mesh>
      </group>

      {/* 5. RIGHT PNEUMATIC BLAST DOOR PLATE */}
      <group ref={rightPlateRef} position={[1.85, 0, 0]}>
        {/* Main Armor Plate */}
        <mesh>
          <boxGeometry args={[plateWidth, plateHeight, 0.16]} />
          <meshStandardMaterial
            color="#081426"
            roughness={0.2}
            metalness={0.92}
          />
        </mesh>

        {/* CAD Blueprint Outline */}
        <lineSegments position={[0, 0, 0.09]}>
          <edgesGeometry args={[new THREE.BoxGeometry(plateWidth, plateHeight, 0.16)]} />
          <lineBasicMaterial color={riskColor} transparent opacity={0.5} />
        </lineSegments>

        {/* Horizontal Structural Blueprint Ribs */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[doorRibs, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={riskColor} transparent opacity={0.3} />
        </lineSegments>

        {/* Vertical Luminous Seam Flare */}
        <mesh position={[-plateWidth * 0.49, 0, 0.09]}>
          <boxGeometry args={[0.06, plateHeight - 0.2, 0.02]} />
          <meshBasicMaterial color={riskColor} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
};

export const CorridorDoors3D: React.FC = () => {
  const { activeDoor, activeSection } = useObservatory();

  // 6 doors along corridor Z-axis with technical color coding
  // 1-2 Nominal (Cyan), 3-4 High-Risk (Amber), 5-6 Catastrophic (Crimson)
  const doorColors = ['#00F0FF', '#00F0FF', '#FFB020', '#FFB020', '#FF3366', '#FF3366'];

  return (
    <group position={[0, 0, -35]}>
      {Array.from({ length: 6 }).map((_, idx) => {
        const doorNum = idx + 1;
        const isDoorOpen = activeSection === 5 ? activeDoor === doorNum : activeSection > 5;
        const zPos = -idx * 8.0;

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
