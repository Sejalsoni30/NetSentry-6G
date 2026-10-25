import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useObservatory } from '../hooks/useObservatoryStore';
import { NetworkLattice } from './NetworkLattice';
import { ShiftGateIris3D } from './ShiftGateIris3D';
import { TelemetryCurtain3D } from './TelemetryCurtain3D';
import { CorridorDoors3D } from './CorridorDoors3D';

// Camera controller that choreographs the continuous journey
const CameraRig: React.FC = () => {
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
      case 1: // Hero
        targetZ = 3.5;
        break;
      case 2: // Problem
        targetZ = -3.0;
        targetX = Math.sin(state.clock.elapsedTime * 0.5) * 0.4;
        break;
      case 3: // The Question (curtain)
        targetZ = -12.0;
        break;
      case 4: // What It Is (chambers)
        targetZ = -22.0;
        break;
      case 5: // The Experiments (corridor traversal)
        targetZ = -34.0 - (activeDoor - 1) * 6.5;
        break;
      case 6: // The Comparison (split gate)
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
      case 10: // Final
        targetZ = -120.0;
        break;
      default:
        targetZ = 8 - scrollProgress * 125;
        break;
    }

    targetPos.current.set(targetX, targetY, targetZ);
    targetLook.current.set(0, 0, targetZ - 12);

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetPos.current.x, 3.2, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetPos.current.y, 3.2, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetPos.current.z, 3.2, delta);
    
    // Look ahead smoothly
    const currentLook = new THREE.Vector3(0, 0, targetZ - 12);
    state.camera.lookAt(currentLook);
  });

  return null;
};

// Background volumetric particulate field
const AmbientDust: React.FC<{ count?: number }> = ({ count = 300 }) => {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color('#22E4FF');
    const amber = new THREE.Color('#FFB020');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 45;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      pos[i * 3 + 2] = -Math.random() * 140 + 10;

      const pickColor = Math.random() > 0.85 ? amber : cyan;
      col[i * 3] = pickColor.r;
      col[i * 3 + 1] = pickColor.g;
      col[i * 3 + 2] = pickColor.b;
    }
    return [pos, col];
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.z += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
        vertexColors
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const ObservatoryCanvas: React.FC = () => {
  const { quality, activeSection, isPreloaderComplete } = useObservatory();

  // Entrance iris open factor: 0 during preloader, 1 once enter hero
  const entranceIrisOpen = isPreloaderComplete ? (activeSection >= 1 ? 1 : 0.1) : 0;
  
  // Telemetry curtain parts when approaching section 3
  const curtainParted = activeSection >= 3 ? 1 : 0.05;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-navy-950">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55, near: 0.1, far: 200 }}
        gl={{
          antialias: quality === 'high',
          powerPreference: 'high-performance',
          alpha: true,
        }}
        dpr={quality === 'high' ? [1, 2] : 1}
      >
        {/* Dark Observatory Atmospheric Fog */}
        <color attach="background" args={['#05070D']} />
        <fog attach="fog" args={['#05070D', 15, 95]} />

        {/* Cinematic Technical Lighting */}
        <ambientLight intensity={0.25} />
        <pointLight position={[0, 6, 4]} intensity={1.5} color="#22E4FF" distance={25} />
        <pointLight position={[0, -5, -20]} intensity={1.2} color="#0D8299" distance={35} />
        <pointLight position={[0, 4, -70]} intensity={2.0} color="#FFB020" distance={45} />
        <directionalLight position={[10, 15, 10]} intensity={0.4} color="#E2E8F0" />

        {/* Camera Traversal Controller */}
        <CameraRig />

        {/* Ambient Telemetry Particulates */}
        <AmbientDust count={quality === 'high' ? 350 : 120} />

        {/* Scene 1: Entrance Iris Gate */}
        <ShiftGateIris3D
          position={[0, 0, 5]}
          openFactor={entranceIrisOpen}
          bladeCount={8}
          radius={5.2}
          edgeColor="#22E4FF"
        />

        {/* Scenes 1-2: 3D Network Node Lattice */}
        <NetworkLattice position={[0, 0, -2]} />

        {/* Scene 3: Telemetry Curtain */}
        <TelemetryCurtain3D
          position={[0, 0, -10]}
          partFactor={curtainParted}
          width={18}
          height={14}
          lineCount={quality === 'high' ? 70 : 35}
        />

        {/* Scene 5: Six-Door Corridor */}
        <CorridorDoors3D />

        {/* Scene 10: Exit Iris Portal */}
        <ShiftGateIris3D
          position={[0, 0, -125]}
          openFactor={activeSection >= 10 ? 1 : 0.2}
          bladeCount={8}
          radius={6.0}
          edgeColor="#22E4FF"
        />
      </Canvas>
    </div>
  );
};
