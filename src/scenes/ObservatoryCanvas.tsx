import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useObservatory } from '../hooks/useObservatoryStore';
import { NetworkLattice } from './NetworkLattice';
import { ShiftGateIris3D } from './ShiftGateIris3D';
import { TelemetryCurtain3D } from './TelemetryCurtain3D';
import { CorridorDoors3D } from './CorridorDoors3D';
import { PhasedArrayCenterpiece } from './PhasedArrayCenterpiece';

// Camera controller that choreographs the continuous journey with interactive mouse parallax
const CameraRig: React.FC<{ mouseRef: React.MutableRefObject<{ x: number; y: number }> }> = ({
  mouseRef,
}) => {
  const { scrollProgress, activeSection, reduceMotion, activeDoor } = useObservatory();
  const targetPos = useRef(new THREE.Vector3(0, 0, 8));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    // If reduce motion is enabled, use stable fixed positions per section
    if (reduceMotion) {
      state.camera.position.set(0, 0, 6);
      state.camera.lookAt(0, 0, -10);
      return;
    }

    // Map section & scrollProgress to spatial 3D corridor positions
    let targetZ = 8;
    let targetY = 0;
    let targetX = 0;

    switch (activeSection) {
      case 0: // Preloader
        targetZ = 7.5;
        break;
      case 1: // Hero: Framed right on the Phased-Array Centerpiece
        targetZ = 4.2;
        break;
      case 2: // Problem: Entering network turbulence
        targetZ = -3.2;
        targetX = Math.sin(state.clock.elapsedTime * 0.5) * 0.35;
        break;
      case 3: // The Question: Telemetry curtain
        targetZ = -12.0;
        break;
      case 4: // What It Is: Chambers overview
        targetZ = -22.0;
        break;
      case 5: // The Experiments: Spatial corridor traversal
        targetZ = -34.0 - (activeDoor - 1) * 7.2;
        break;
      case 6: // The Comparison: Split gate
        targetZ = -78.0;
        break;
      case 7: // Metrics
        targetZ = -88.0;
        break;
      case 8: // Roadmap
        targetZ = -98.0;
        break;
      case 9: // Stack
        targetZ = -108.0;
        break;
      case 10: // Final Exit Portal
        targetZ = -120.0;
        break;
      default:
        targetZ = 8 - scrollProgress * 125;
        break;
    }

    // Interactive mouse inspection parallax
    const parallaxX = mouseRef.current.x * 0.65;
    const parallaxY = mouseRef.current.y * 0.45;

    targetPos.current.set(targetX + parallaxX, targetY + parallaxY, targetZ);
    targetLook.current.set(parallaxX * 0.5, parallaxY * 0.3, targetZ - 12);

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetPos.current.x, 3.2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetPos.current.y, 3.2, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetPos.current.z, 3.2, delta);

    // Look ahead smoothly with subtle tilt
    state.camera.lookAt(targetLook.current);
  });

  return null;
};

// 3D CAD Blueprint Extended Floor Grid & Longitudinal Guide Rails
const BlueprintGridFloor: React.FC = () => {
  return (
    <group position={[0, -4.5, -60]}>
      {/* CAD Cyan Grid Rulers */}
      <gridHelper
        args={[160, 80, '#00F0FF', '#081C38']}
        position={[0, 0, 0]}
      />
      {/* Longitudinal Guide Beams along Corridor Z-axis */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              -4.8, 0.05, 80,  -4.8, 0.05, -80,
               4.8, 0.05, 80,   4.8, 0.05, -80,
               0.0, 0.05, 80,   0.0, 0.05, -80,
            ]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00F0FF" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
};

// Technical blueprint telemetry particulate sparks
const AmbientTelemetrySparks: React.FC<{ count?: number }> = ({ count = 320 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color('#00F0FF');
    const amber = new THREE.Color('#FFB020');
    const white = new THREE.Color('#E2E8F0');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = -Math.random() * 145 + 12;

      const rand = Math.random();
      const pickColor = rand > 0.82 ? amber : rand > 0.65 ? white : cyan;
      col[i * 3] = pickColor.r;
      col[i * 3 + 1] = pickColor.g;
      col[i * 3 + 2] = pickColor.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z += delta * 0.015;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        vertexColors
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const ObservatoryCanvas: React.FC = () => {
  const { quality, activeSection, isPreloaderComplete } = useObservatory();
  const mouseRef = useRef({ x: 0, y: 0 });

  // Track window pointer movement for responsive 3D parallax & orbit inspection
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Entrance iris open factor: 0 during preloader, 1 once entering hero
  const entranceIrisOpen = isPreloaderComplete ? (activeSection >= 1 ? 1 : 0.1) : 0;

  // Telemetry curtain parts when approaching section 3 and is only visible near Section 3
  const curtainParted = activeSection >= 3 ? 1 : 0.05;
  const curtainOpacity = activeSection === 3 ? 0.6 : activeSection === 2 ? 0.15 : 0;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-navy-950">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55, near: 0.1, far: 220 }}
        gl={{
          antialias: quality === 'high',
          powerPreference: 'high-performance',
          alpha: true,
        }}
        dpr={quality === 'high' ? [1, 2] : 1}
      >
        {/* Technical Blueprint Deep Navy Atmospheric Fog */}
        <color attach="background" args={['#030712']} />
        <fog attach="fog" args={['#030712', 18, 105]} />

        {/* Precision Blueprint Technical Lighting */}
        <ambientLight intensity={0.3} color="#0E223D" />
        <pointLight position={[0, 6, 5]} intensity={2.0} color="#00F0FF" distance={30} />
        <pointLight position={[0, -4, -20]} intensity={1.4} color="#0A4D68" distance={40} />
        <pointLight position={[0, 5, -70]} intensity={2.2} color="#FFB020" distance={50} />
        <directionalLight position={[12, 18, 12]} intensity={0.5} color="#E0F2FE" />

        {/* Camera Traversal & Interactive Parallax Rig */}
        <CameraRig mouseRef={mouseRef} />

        {/* 3D CAD Blueprint Extended Floor Grid */}
        <BlueprintGridFloor />

        {/* Ambient Telemetry Blueprint Sparks */}
        <AmbientTelemetrySparks count={quality === 'high' ? 360 : 130} />

        {/* Scene 1: Entrance Mechanical Iris Gate */}
        <ShiftGateIris3D
          position={[0, 0, 5.2]}
          openFactor={entranceIrisOpen}
          bladeCount={8}
          radius={5.4}
          edgeColor="#00F0FF"
        />

        {/* Hero & Observatory Centerpiece: 3D 6G Phased-Array Antenna & Holographic Core */}
        <PhasedArrayCenterpiece
          position={[0, 0.25, -0.8]}
          scale={0.9}
        />

        {/* Scenes 1-2: 3D 6G Network Node Lattice with Radar Wavefront */}
        <NetworkLattice position={[0, 0, -2]} />

        {/* Scene 3: Oscilloscope Blueprint Laser Curtain */}
        <TelemetryCurtain3D
          position={[0, 0, -10]}
          partFactor={curtainParted}
          opacity={curtainOpacity}
          width={18}
          height={14}
          lineCount={quality === 'high' ? 75 : 40}
        />

        {/* Scene 5: Six-Door Technical Airlock Corridor */}
        <CorridorDoors3D />

        {/* Scene 10: Exit Iris Portal */}
        <ShiftGateIris3D
          position={[0, 0, -125]}
          openFactor={activeSection >= 10 ? 1 : 0.2}
          bladeCount={8}
          radius={6.2}
          edgeColor="#00F0FF"
        />
      </Canvas>
    </div>
  );
};
