import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useObservatory } from '../hooks/useObservatoryStore';

interface PhasedArrayCenterpieceProps {
  position?: [number, number, number];
  scale?: number;
}

export const PhasedArrayCenterpiece: React.FC<PhasedArrayCenterpieceProps> = ({
  position = [0, 0, 0],
  scale = 1,
}) => {
  const { isCombinedShifts, activeSection } = useObservatory();

  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Group>(null);
  const middleRingRef = useRef<THREE.Group>(null);
  const innerCoreRef = useRef<THREE.Group>(null);
  const radarSweepRef = useRef<THREE.Group>(null);
  const satellitesGroupRef = useRef<THREE.Group>(null);
  const beamLinesRef = useRef<THREE.LineSegments>(null);

  // Disturbance state (sections 2, 5, or combined shifts active)
  const isDisturbed = isCombinedShifts || activeSection === 2 || activeSection === 5;

  // Colors
  const cyanColor = useMemo(() => new THREE.Color('#00F0FF'), []);
  const amberColor = useMemo(() => new THREE.Color('#FFB020'), []);
  const redColor = useMemo(() => new THREE.Color('#FF3366'), []);
  const blueprintNavy = useMemo(() => new THREE.Color('#071326'), []);

  // Generate 24 Phased Array Antenna Beams
  const { beamPositions, beamColors } = useMemo(() => {
    const beamCount = 24;
    const positions = new Float32Array(beamCount * 2 * 3);
    const colors = new Float32Array(beamCount * 2 * 3);

    for (let i = 0; i < beamCount; i++) {
      const angle = (i / beamCount) * Math.PI * 2;
      const radiusInner = 1.35;
      const length = 2.4 + (i % 3) * 0.5;

      const x1 = Math.cos(angle) * radiusInner;
      const y1 = Math.sin(angle) * radiusInner;
      const z1 = 0;

      const x2 = Math.cos(angle) * (radiusInner + length);
      const y2 = Math.sin(angle) * (radiusInner + length);
      const z2 = (i % 2 === 0 ? 0.4 : -0.4);

      positions[i * 6] = x1;
      positions[i * 6 + 1] = y1;
      positions[i * 6 + 2] = z1;

      positions[i * 6 + 3] = x2;
      positions[i * 6 + 4] = y2;
      positions[i * 6 + 5] = z2;

      // Color gradient from inner cyan to outer fade
      colors[i * 6] = 0.0;
      colors[i * 6 + 1] = 0.94;
      colors[i * 6 + 2] = 1.0;

      colors[i * 6 + 3] = 0.1;
      colors[i * 6 + 4] = 0.5;
      colors[i * 6 + 5] = 0.8;
    }

    return { beamPositions: positions, beamColors: colors };
  }, []);

  // Generate Caliper Ticks for Blueprint Rings
  const { majorTicks, minorTicks } = useMemo(() => {
    const majorCount = 36; // Every 10 deg
    const minorCount = 144; // Every 2.5 deg

    const majorPos = new Float32Array(majorCount * 2 * 3);
    const minorPos = new Float32Array(minorCount * 2 * 3);

    const rOuter = 3.6;

    for (let i = 0; i < majorCount; i++) {
      const theta = (i / majorCount) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      majorPos[i * 6] = cosT * (rOuter - 0.22);
      majorPos[i * 6 + 1] = sinT * (rOuter - 0.22);
      majorPos[i * 6 + 2] = 0;

      majorPos[i * 6 + 3] = cosT * (rOuter + 0.05);
      majorPos[i * 6 + 4] = sinT * (rOuter + 0.05);
      majorPos[i * 6 + 5] = 0;
    }

    for (let i = 0; i < minorCount; i++) {
      const theta = (i / minorCount) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      minorPos[i * 6] = cosT * (rOuter - 0.1);
      minorPos[i * 6 + 1] = sinT * (rOuter - 0.1);
      minorPos[i * 6 + 2] = 0;

      minorPos[i * 6 + 3] = cosT * rOuter;
      minorPos[i * 6 + 4] = sinT * rOuter;
      minorPos[i * 6 + 5] = 0;
    }

    return { majorTicks: majorPos, minorTicks: minorPos };
  }, []);

  // Orbiting Satellite Nodes metadata
  const satellites = useMemo(() => [
    { radiusX: 4.8, radiusY: 3.2, tilt: 0.35, speed: 0.65, phase: 0.0 },
    { radiusX: 5.4, radiusY: 4.0, tilt: -0.45, speed: 0.45, phase: 2.1 },
    { radiusX: 4.2, radiusY: 3.6, tilt: 0.65, speed: -0.55, phase: 4.2 },
  ], []);

  // Frame loop animations
  useFrame(({ clock, pointer }, delta) => {
    const time = clock.getElapsedTime();

    // Mouse Parallax & Interactive Inspection Angle
    if (groupRef.current) {
      const targetRotX = pointer.y * 0.35;
      const targetRotY = pointer.x * 0.45;

      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetRotX,
        4.0,
        delta
      );
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotY,
        4.0,
        delta
      );
    }

    // Outer Caliper Ring slow clockwise rotation
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z -= delta * 0.12;
    }

    // Middle Hex/Grid Ring counter-clockwise rotation
    if (middleRingRef.current) {
      middleRingRef.current.rotation.z += delta * 0.18;
    }

    // Inner 6G Geodesic Core spin & pulse
    if (innerCoreRef.current) {
      innerCoreRef.current.rotation.x += delta * 0.4;
      innerCoreRef.current.rotation.y += delta * 0.6;

      const pulse = 1 + Math.sin(time * 3) * 0.08;
      innerCoreRef.current.scale.setScalar(pulse);
    }

    // 360-degree Blueprint Radar Sweep Plane
    if (radarSweepRef.current) {
      radarSweepRef.current.rotation.z = time * 1.8;
    }

    // Orbiting Satellites position update
    if (satellitesGroupRef.current) {
      satellitesGroupRef.current.children.forEach((child, idx) => {
        const sat = satellites[idx];
        if (!sat) return;
        const currentAngle = time * sat.speed + sat.phase;
        const rawX = Math.cos(currentAngle) * sat.radiusX;
        const rawY = Math.sin(currentAngle) * sat.radiusY;

        // Apply orbit tilt
        child.position.x = rawX;
        child.position.y = rawY * Math.cos(sat.tilt);
        child.position.z = rawY * Math.sin(sat.tilt);

        child.rotation.x = time * 1.2;
        child.rotation.y = time * 0.8;
      });
    }

    // Jitter beams when disturbed
    if (beamLinesRef.current && isDisturbed) {
      const jitter = Math.sin(time * 25) * 0.04;
      beamLinesRef.current.position.z = jitter;
    }
  });

  const activeThemeColor = isDisturbed ? amberColor : cyanColor;

  return (
    <group ref={groupRef} position={position} scale={[scale, scale, scale]}>
      {/* 1. OUTER CALIPER BLUEPRINT RING */}
      <group ref={outerRingRef}>
        {/* Fine circular blueprint circles */}
        <lineSegments>
          <edgesGeometry args={[new THREE.RingGeometry(3.55, 3.65, 64)]} />
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.6} />
        </lineSegments>

        <lineSegments>
          <edgesGeometry args={[new THREE.RingGeometry(3.9, 3.92, 64)]} />
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.3} />
        </lineSegments>

        {/* Outer Major Caliper Graduation Ticks */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[majorTicks, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.8} />
        </lineSegments>

        {/* Outer Minor Caliper Graduation Ticks */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[minorTicks, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.35} />
        </lineSegments>
      </group>

      {/* 2. MIDDLE HEXAGONAL FREQUENCY RING */}
      <group ref={middleRingRef}>
        {/* Hexagonal CAD wireframe casing */}
        <lineSegments>
          <edgesGeometry args={[new THREE.RingGeometry(2.6, 2.7, 6)]} />
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.7} />
        </lineSegments>

        {/* Octagonal inner guide */}
        <lineSegments>
          <edgesGeometry args={[new THREE.RingGeometry(2.1, 2.15, 8)]} />
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.4} />
        </lineSegments>

        {/* Translucent blueprint backing disc */}
        <mesh position={[0, 0, -0.05]}>
          <ringGeometry args={[1.5, 3.6, 48]} />
          <meshBasicMaterial
            color={blueprintNavy}
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 3. 24 RADIATING 6G PHASED-ARRAY BEAM WAVEGUIDES */}
      <group ref={beamLinesRef}>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[beamPositions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[beamColors, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={isDisturbed ? 0.9 : 0.65}
            blending={THREE.AdditiveBlending}
            linewidth={1}
          />
        </lineSegments>

        {/* Antenna emitter micro-nodes at base */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const r = 1.35;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}
            >
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshBasicMaterial
                color={isDisturbed ? redColor : cyanColor}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* 4. ROTATING BLUEPRINT RADAR SWEEP SECTOR */}
      <group ref={radarSweepRef}>
        {/* Radar beam line */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0.02, 3.6, 0, 0.02]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={isDisturbed ? amberColor : cyanColor}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Semi-transparent sweep wedge (45-degree sector) */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.2, 3.6, 32, 1, 0, Math.PI / 4]} />
          <meshBasicMaterial
            color={isDisturbed ? amberColor : cyanColor}
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 5. INNER GEODESIC QUANTUM CORE */}
      <group ref={innerCoreRef}>
        {/* Wireframe Icosahedron */}
        <lineSegments>
          <wireframeGeometry args={[new THREE.IcosahedronGeometry(0.85, 1)]} />
          <lineBasicMaterial
            color={isDisturbed ? redColor : cyanColor}
            transparent
            opacity={0.85}
          />
        </lineSegments>

        {/* Inner Octahedron nucleus */}
        <mesh>
          <octahedronGeometry args={[0.45]} />
          <meshBasicMaterial
            color={isDisturbed ? amberColor : cyanColor}
            wireframe
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Glowing sub-atomic point at the center */}
        <mesh>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshBasicMaterial
            color="#FFFFFF"
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* 6. ORBITING SATELLITE TRANSCEIVERS */}
      <group ref={satellitesGroupRef}>
        {satellites.map((_, i) => (
          <group key={i}>
            {/* Satellite Body */}
            <mesh>
              <boxGeometry args={[0.14, 0.14, 0.14]} />
              <meshStandardMaterial
                color="#0E223D"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
            {/* Satellite Solar Panel Wings */}
            <mesh position={[0.2, 0, 0]}>
              <boxGeometry args={[0.22, 0.08, 0.02]} />
              <meshBasicMaterial color={cyanColor} wireframe />
            </mesh>
            <mesh position={[-0.2, 0, 0]}>
              <boxGeometry args={[0.22, 0.08, 0.02]} />
              <meshBasicMaterial color={cyanColor} wireframe />
            </mesh>
            {/* Status Beacon */}
            <mesh position={[0, 0.1, 0]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshBasicMaterial
                color={isDisturbed ? amberColor : cyanColor}
                toneMapped={false}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 7. ELLIPTICAL ORBIT TRACE RINGS */}
      {satellites.map((sat, i) => (
        <group key={`orbit-${i}`} rotation={[sat.tilt, 0, 0]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.RingGeometry(sat.radiusX - 0.02, sat.radiusX, 64)]} />
            <lineBasicMaterial
              color={cyanColor}
              transparent
              opacity={0.15}
            />
          </lineSegments>
        </group>
      ))}

      {/* 8. CAD BLUEPRINT TARGETING RETICLE CROSSHAIRS */}
      <group position={[0, 0, 0.08]}>
        {/* Corner Reticle Bracket Top-Left */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                -4.2, 3.8, 0,   -3.6, 3.8, 0,
                -4.2, 3.8, 0,   -4.2, 3.2, 0
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.6} />
        </lineSegments>

        {/* Corner Reticle Bracket Top-Right */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                4.2, 3.8, 0,    3.6, 3.8, 0,
                4.2, 3.8, 0,    4.2, 3.2, 0
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.6} />
        </lineSegments>

        {/* Corner Reticle Bracket Bottom-Left */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                -4.2, -3.8, 0,  -3.6, -3.8, 0,
                -4.2, -3.8, 0,  -4.2, -3.2, 0
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.6} />
        </lineSegments>

        {/* Corner Reticle Bracket Bottom-Right */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([
                4.2, -3.8, 0,   3.6, -3.8, 0,
                4.2, -3.8, 0,   4.2, -3.2, 0
              ]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={activeThemeColor} transparent opacity={0.6} />
        </lineSegments>
      </group>
    </group>
  );
};
