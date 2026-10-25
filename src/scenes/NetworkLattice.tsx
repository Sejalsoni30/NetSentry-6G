import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useObservatory } from '../hooks/useObservatoryStore';

interface NetworkLatticeProps {
  position?: [number, number, number];
}

export const NetworkLattice: React.FC<NetworkLatticeProps> = ({ position = [0, 0, 0] }) => {
  const { isCombinedShifts, quality, reduceMotion, activeSection } = useObservatory();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);

  const nodeCount = quality === 'low' ? 60 : 160;

  // Generate node coordinates and initial velocities
  const { nodePositions, connections } = useMemo(() => {
    const positions: [number, number, number][] = [];

    const seedRandom = (i: number) => {
      const x = Math.sin(i * 9999) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < nodeCount; i++) {
      const radius = 6 + seedRandom(i * 3) * 18;
      const theta = seedRandom(i * 3 + 1) * Math.PI * 2;
      const phi = (seedRandom(i * 3 + 2) - 0.5) * Math.PI;

      const x = radius * Math.cos(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.sin(theta) - 15;

      positions.push([x, y, z]);
    }

    // Connect close neighbors
    const lineIndices: number[] = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = positions[i][0] - positions[j][0];
        const dy = positions[i][1] - positions[j][1];
        const dz = positions[i][2] - positions[j][2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 28) {
          lineIndices.push(i, j);
        }
      }
    }

    return { nodePositions: positions, connections: lineIndices };
  }, [nodeCount]);

  // Instanced dummy object
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Line vertices array
  const linePositions = useMemo(() => {
    const array = new Float32Array(connections.length * 3);
    for (let i = 0; i < connections.length; i++) {
      const nodeIdx = connections[i];
      array[i * 3] = nodePositions[nodeIdx][0];
      array[i * 3 + 1] = nodePositions[nodeIdx][1];
      array[i * 3 + 2] = nodePositions[nodeIdx][2];
    }
    return array;
  }, [connections, nodePositions]);

  useFrame(({ clock }) => {
    if (!instancedMeshRef.current) return;
    const time = clock.getElapsedTime();
    const speed = reduceMotion ? 0.05 : 1.0;

    // Destabilization intensity calculation
    const destabilized = isCombinedShifts || activeSection === 2 || activeSection === 5;
    const jitterMagnitude = destabilized ? 0.28 : 0.04;

    const cyan = new THREE.Color('#22E4FF');
    const amber = new THREE.Color('#FFB020');
    const red = new THREE.Color('#FF3B5C');

    for (let i = 0; i < nodeCount; i++) {
      const [baseX, baseY, baseZ] = nodePositions[i];
      const offset = i * 0.15;

      // Jitter & wave propagation
      const wave = Math.sin(time * 2 * speed + offset) * 0.2;
      const jitterX = destabilized ? (Math.sin(time * 18 + i * 7) * jitterMagnitude) : 0;
      const jitterY = destabilized ? (Math.cos(time * 22 + i * 11) * jitterMagnitude) : 0;

      dummy.position.set(baseX + jitterX, baseY + wave + jitterY, baseZ);

      // Node scale pulse
      const pulse = 0.8 + 0.4 * Math.sin(time * 3 * speed + offset);
      dummy.scale.setScalar(pulse * (destabilized ? 1.3 : 1.0));

      dummy.updateMatrix();
      instancedMeshRef.current.setMatrixAt(i, dummy.matrix);

      // Node color transition based on disturbance state
      if (destabilized) {
        const mixVal = (Math.sin(time * 4 + i) + 1) * 0.5;
        if (mixVal > 0.65) {
          tempColor.lerpColors(amber, red, (mixVal - 0.65) / 0.35);
        } else {
          tempColor.lerpColors(cyan, amber, mixVal / 0.65);
        }
      } else {
        tempColor.copy(cyan);
      }
      instancedMeshRef.current.setColorAt(i, tempColor);
    }

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    if (instancedMeshRef.current.instanceColor) {
      instancedMeshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      {/* Instanced Sphere Nodes */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, nodeCount]}
      >
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Network Edge Links */}
      <lineSegments>
        <bufferGeometry ref={linesGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={isCombinedShifts ? '#FFB020' : '#22E4FF'}
          transparent
          opacity={isCombinedShifts ? 0.35 : 0.22}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};
