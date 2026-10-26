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
  color = '#071224',
  edgeColor = '#00F0FF',
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bladesGroupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const reticleRef = useRef<THREE.Group>(null);
  const currentOpenRef = useRef(openFactor);

  // Precision CAD Caliper Ticks
  const { caliperTicks, minorTicks } = useMemo(() => {
    const majorCount = 32;
    const minorCount = 128;
    const majorPos = new Float32Array(majorCount * 2 * 3);
    const minorPos = new Float32Array(minorCount * 2 * 3);
    const r = radius * 1.22;

    for (let i = 0; i < majorCount; i++) {
      const angle = (i / majorCount) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      majorPos[i * 6] = cosA * (r - 0.28);
      majorPos[i * 6 + 1] = sinA * (r - 0.28);
      majorPos[i * 6 + 2] = 0.04;

      majorPos[i * 6 + 3] = cosA * (r + 0.08);
      majorPos[i * 6 + 4] = sinA * (r + 0.08);
      majorPos[i * 6 + 5] = 0.04;
    }

    for (let i = 0; i < minorCount; i++) {
      const angle = (i / minorCount) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      minorPos[i * 6] = cosA * (r - 0.12);
      minorPos[i * 6 + 1] = sinA * (r - 0.12);
      minorPos[i * 6 + 2] = 0.04;

      minorPos[i * 6 + 3] = cosA * r;
      minorPos[i * 6 + 4] = sinA * r;
      minorPos[i * 6 + 5] = 0.04;
    }

    return { caliperTicks: majorPos, minorTicks: minorPos };
  }, [radius]);

  // Precision Blueprint Blade Shape with inner mechanical bevels
  const bladeShape = useMemo(() => {
    const shape = new THREE.Shape();
    const length = radius * 1.42;
    const width = ((Math.PI * 2 * radius) / bladeCount) * 1.35;

    shape.moveTo(0, 0);
    shape.lineTo(width * 0.92, -width * 0.32);
    shape.lineTo(width * 1.25, length * 0.68);
    shape.lineTo(width * 0.35, length * 0.98);
    shape.lineTo(0.1, length);
    shape.closePath();

    return shape;
  }, [radius, bladeCount]);

  // Inner lattice cutout lines on each blade
  const bladeLatticeLines = useMemo(() => {
    const length = radius * 1.42;
    const width = ((Math.PI * 2 * radius) / bladeCount) * 1.35;

    // 3 internal blueprint truss lines per blade
    return new Float32Array([
      width * 0.2, length * 0.2, 0.02,
      width * 0.8, length * 0.5, 0.02,

      width * 0.3, length * 0.4, 0.02,
      width * 0.9, length * 0.7, 0.02,

      width * 0.1, length * 0.6, 0.02,
      width * 0.6, length * 0.85, 0.02,
    ]);
  }, [radius, bladeCount]);

  useFrame((_, delta) => {
    // Smooth damping for aperture open/close actuation
    currentOpenRef.current = THREE.MathUtils.damp(
      currentOpenRef.current,
      openFactor,
      4.2,
      delta
    );

    const open = currentOpenRef.current;

    // Rotate and retract individual blades
    if (bladesGroupRef.current) {
      bladesGroupRef.current.children.forEach((child, i) => {
        const angle = (i / bladeCount) * Math.PI * 2;
        // Blade rotates and retracts along radial path
        const radialOffset = radius * 0.48 + open * radius * 1.05;
        const bladeRotation = angle + open * 0.72;

        child.position.x = Math.cos(angle) * radialOffset;
        child.position.y = Math.sin(angle) * radialOffset;
        child.rotation.z = bladeRotation;
      });
    }

    // Counter-rotating Caliper Bearing Rings
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.08 + open * 0.02;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.12 + open * 0.03;
    }

    // Reticle expansion and fading
    if (reticleRef.current) {
      const reticleScale = 1 + open * 2.5;
      reticleRef.current.scale.set(reticleScale, reticleScale, 1);
      reticleRef.current.rotation.z = open * 1.2;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* 1. OUTER BLUEPRINT GEAR & CALIPER HOUSING */}
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[radius * 1.05, radius * 1.42, 64]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Blueprint Caliper Datum Rings */}
      <group ref={ring1Ref}>
        <lineSegments>
          <edgesGeometry args={[new THREE.RingGeometry(radius * 1.25, radius * 1.255, 64)]} />
          <lineBasicMaterial color={edgeColor} transparent opacity={0.7} />
        </lineSegments>

        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[caliperTicks, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={edgeColor} transparent opacity={0.8} />
        </lineSegments>
      </group>

      <group ref={ring2Ref}>
        <lineSegments>
          <edgesGeometry args={[new THREE.RingGeometry(radius * 1.08, radius * 1.085, 64)]} />
          <lineBasicMaterial color={edgeColor} transparent opacity={0.4} />
        </lineSegments>

        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[minorTicks, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={edgeColor} transparent opacity={0.35} />
        </lineSegments>

        {/* 12 Outer Hydraulic Pin Indicators */}
        {Array.from({ length: 12 }).map((_, i) => {
          const theta = (i / 12) * Math.PI * 2;
          const r = radius * 1.34;
          return (
            <mesh key={i} position={[Math.cos(theta) * r, Math.sin(theta) * r, 0.05]}>
              <ringGeometry args={[0.06, 0.12, 16]} />
              <meshBasicMaterial color={edgeColor} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
      </group>

      {/* 2. IRIS APERTURE BLADES WITH TECHNICAL BLUEPRINT SCHEMATIC */}
      <group ref={bladesGroupRef}>
        {Array.from({ length: bladeCount }).map((_, i) => (
          <group key={i}>
            {/* Solid Carbon/Titanium Blade Body */}
            <mesh position={[0, 0, i * 0.008]}>
              <shapeGeometry args={[bladeShape]} />
              <meshStandardMaterial
                color={color}
                roughness={0.2}
                metalness={0.92}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Perimeter Luminous Edge Flare */}
            <lineSegments position={[0, 0, i * 0.008 + 0.015]}>
              <edgesGeometry args={[new THREE.ShapeGeometry(bladeShape)]} />
              <lineBasicMaterial color={edgeColor} transparent opacity={0.75} />
            </lineSegments>

            {/* Internal CAD Blueprint Truss Lattice on each blade */}
            <lineSegments position={[0, 0, i * 0.008 + 0.02]}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[bladeLatticeLines, 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={edgeColor} transparent opacity={0.35} />
            </lineSegments>

            {/* Mechanical Pivot Pin on blade root */}
            <mesh position={[0, 0, i * 0.008 + 0.025]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color={edgeColor} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. CENTRAL TARGETING RETICLE & DECOUPLING CROSSHAIR */}
      <group ref={reticleRef} position={[0, 0, 0.15]}>
        {/* Reticle Circle */}
        <lineSegments>
          <edgesGeometry args={[new THREE.RingGeometry(0.85, 0.88, 32)]} />
          <lineBasicMaterial
            color={edgeColor}
            transparent
            opacity={Math.max(0, 0.7 - currentOpenRef.current * 0.7)}
          />
        </lineSegments>

        {/* Reticle Crosshair Line X */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([-1.3, 0, 0, -0.3, 0, 0, 0.3, 0, 0, 1.3, 0, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={edgeColor}
            transparent
            opacity={Math.max(0, 0.8 - currentOpenRef.current * 0.8)}
          />
        </lineSegments>

        {/* Reticle Crosshair Line Y */}
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, -1.3, 0, 0, -0.3, 0, 0, 0.3, 0, 0, 1.3, 0]), 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={edgeColor}
            transparent
            opacity={Math.max(0, 0.8 - currentOpenRef.current * 0.8)}
          />
        </lineSegments>
      </group>
    </group>
  );
};
