import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useObservatory } from '../hooks/useObservatoryStore';

interface NetworkLatticeProps {
  position?: [number, number, number];
}

export const NetworkLattice: React.FC<NetworkLatticeProps> = ({ position = [0, 0, 0] }) => {
  const { isCombinedShifts, quality, reduceMotion, activeSection } = useObservatory();
  const groupRef = useRef<THREE.Group>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const wireframesInstancedRef = useRef<THREE.InstancedMesh>(null);
  const linesGeometryRef = useRef<THREE.BufferGeometry>(null);
  const radarWaveRef = useRef<THREE.Group>(null);
  const packetMeshRef = useRef<THREE.InstancedMesh>(null);

  const nodeCount = quality === 'low' ? 70 : 160;
  const packetCount = quality === 'low' ? 18 : 40;

  // Disturbance state (sections 2, 5, or combined shifts active)
  const isDisturbed = isCombinedShifts || activeSection === 2 || activeSection === 5;

  // Colors
  const cyanColor = useMemo(() => new THREE.Color('#00F0FF'), []);
  const amberColor = useMemo(() => new THREE.Color('#FFB020'), []);
  const redColor = useMemo(() => new THREE.Color('#FF3366'), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Generate node coordinates & connections
  const { nodePositions, connections } = useMemo(() => {
    const positions: [number, number, number][] = [];

    const seedRandom = (i: number) => {
      const x = Math.sin(i * 12345.67) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < nodeCount; i++) {
      const radius = 5.5 + seedRandom(i * 4) * 20;
      const theta = seedRandom(i * 4 + 1) * Math.PI * 2;
      const phi = (seedRandom(i * 4 + 2) - 0.5) * Math.PI * 0.85;

      const x = radius * Math.cos(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.sin(theta) - 14;

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
        if (distSq < 32) {
          lineIndices.push(i, j);
        }
      }
    }

    return { nodePositions: positions, connections: lineIndices };
  }, [nodeCount]);

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

  // Packets data (traveling between connected pairs)
  const packetPairs = useMemo(() => {
    const pairs: { n1: number; n2: number; speed: number; offset: number }[] = [];
    const totalLines = connections.length / 2;
    for (let i = 0; i < packetCount; i++) {
      const lineIdx = Math.floor((i / packetCount) * totalLines) * 2;
      pairs.push({
        n1: connections[lineIdx] || 0,
        n2: connections[lineIdx + 1] || 1,
        speed: 0.6 + (i % 5) * 0.25,
        offset: (i * 0.37) % 1.0,
      });
    }
    return pairs;
  }, [connections, packetCount]);

  // 3D CAD Blueprint Coordinate Axes Lines
  const cadRulers = useMemo(() => {
    // Rulers along X, Y, Z with graduation tick marks
    const rulerLines: number[] = [];
    const span = 18;

    // Center Cross
    rulerLines.push(-span, 0, -14, span, 0, -14);
    rulerLines.push(0, -span * 0.7, -14, 0, span * 0.7, -14);

    // Graduation ticks along X axis
    for (let x = -span; x <= span; x += 3) {
      rulerLines.push(x, -0.3, -14, x, 0.3, -14);
    }
    // Graduation ticks along Y axis
    for (let y = -span * 0.6; y <= span * 0.6; y += 3) {
      rulerLines.push(-0.3, y, -14, 0.3, y, -14);
    }

    return new Float32Array(rulerLines);
  }, []);

  useFrame(({ clock, pointer }, delta) => {
    const time = clock.getElapsedTime();
    const speed = reduceMotion ? 0.05 : 1.0;

    // Mouse Parallax
    if (groupRef.current) {
      const targetX = pointer.x * 0.25;
      const targetY = pointer.y * 0.2;
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetX,
        3.5,
        delta
      );
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        -targetY,
        3.5,
        delta
      );
    }

    // Expanding 6G Radar Wavefront
    if (radarWaveRef.current) {
      const waveCycle = (time * 0.45) % 1.0;
      const waveRadius = 3 + waveCycle * 25;
      radarWaveRef.current.scale.set(waveRadius, waveRadius, waveRadius);
    }

    // Destabilization intensity calculation
    const jitterMagnitude = isDisturbed ? 0.32 : 0.035;

    // Update Nodes
    if (instancedMeshRef.current && wireframesInstancedRef.current) {
      for (let i = 0; i < nodeCount; i++) {
        const [baseX, baseY, baseZ] = nodePositions[i];
        const offset = i * 0.18;

        // Wave motion & disturbance jitter
        const waveY = Math.sin(time * 1.8 * speed + offset) * 0.22;
        const waveX = Math.cos(time * 1.4 * speed + offset) * 0.15;
        const jitterX = isDisturbed ? Math.sin(time * 20 + i * 8) * jitterMagnitude : 0;
        const jitterY = isDisturbed ? Math.cos(time * 24 + i * 11) * jitterMagnitude : 0;
        const jitterZ = isDisturbed ? Math.sin(time * 18 + i * 5) * jitterMagnitude : 0;

        dummy.position.set(baseX + waveX + jitterX, baseY + waveY + jitterY, baseZ + jitterZ);

        // Slow polyhedral spin
        dummy.rotation.x = time * 0.4 + offset;
        dummy.rotation.y = time * 0.6 + offset;

        // Pulse scale
        const pulse = 0.85 + 0.35 * Math.sin(time * 2.8 * speed + offset);
        const scaleVal = pulse * (isDisturbed ? 1.35 : 1.0);
        dummy.scale.setScalar(scaleVal);

        dummy.updateMatrix();
        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
        wireframesInstancedRef.current.setMatrixAt(i, dummy.matrix);

        // Color transition
        if (isDisturbed) {
          const mixVal = (Math.sin(time * 4 + i) + 1) * 0.5;
          if (mixVal > 0.6) {
            tempColor.lerpColors(amberColor, redColor, (mixVal - 0.6) / 0.4);
          } else {
            tempColor.lerpColors(cyanColor, amberColor, mixVal / 0.6);
          }
        } else {
          tempColor.copy(cyanColor);
        }

        instancedMeshRef.current.setColorAt(i, tempColor);
        wireframesInstancedRef.current.setColorAt(i, tempColor);
      }

      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      wireframesInstancedRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
      if (wireframesInstancedRef.current.instanceColor) {
        wireframesInstancedRef.current.instanceColor.needsUpdate = true;
      }
    }

    // Update Packets traveling on wireframe links
    if (packetMeshRef.current) {
      for (let i = 0; i < packetCount; i++) {
        const { n1, n2, speed: pSpeed, offset: pOffset } = packetPairs[i];
        const p1 = nodePositions[n1];
        const p2 = nodePositions[n2];

        const progress = ((time * pSpeed * 0.5 + pOffset) % 1.0);

        const px = THREE.MathUtils.lerp(p1[0], p2[0], progress);
        const py = THREE.MathUtils.lerp(p1[1], p2[1], progress);
        const pz = THREE.MathUtils.lerp(p1[2], p2[2], progress);

        dummy.position.set(px, py, pz);
        dummy.scale.setScalar(0.08);
        dummy.updateMatrix();
        packetMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      packetMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 1. CAD BLUEPRINT SPATIAL COORDINATE RULERS */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[cadRulers, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={isDisturbed ? '#FFB020' : '#00F0FF'}
          transparent
          opacity={0.2}
        />
      </lineSegments>

      {/* 2. EXPANDING 6G RADAR WAVE SPHERE */}
      <group ref={radarWaveRef} position={[0, 0, -14]}>
        <lineSegments>
          <edgesGeometry args={[new THREE.RingGeometry(0.98, 1.0, 64)]} />
          <lineBasicMaterial
            color={isDisturbed ? '#FFB020' : '#00F0FF'}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>
      </group>

      {/* 3. WIREFRAME POLYHEDRAL NODES (OCTAHEDRON SHELLS) */}
      <instancedMesh
        ref={wireframesInstancedRef}
        args={[undefined, undefined, nodeCount]}
      >
        <octahedronGeometry args={[0.34]} />
        <meshBasicMaterial
          wireframe
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* 4. SOLID CORE GLOW POINTS */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, nodeCount]}
      >
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* 5. TRAVELING TELEMETRY DATA PACKETS */}
      <instancedMesh
        ref={packetMeshRef}
        args={[undefined, undefined, packetCount]}
      >
        <sphereGeometry args={[0.12, 6, 6]} />
        <meshBasicMaterial
          color={isDisturbed ? '#FF3366' : '#FFFFFF'}
          toneMapped={false}
        />
      </instancedMesh>

      {/* 6. TECHNICAL BLUEPRINT VECTOR LINKS */}
      <lineSegments>
        <bufferGeometry ref={linesGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={isDisturbed ? '#FFB020' : '#00F0FF'}
          transparent
          opacity={isDisturbed ? 0.45 : 0.28}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};
