import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TelemetryCurtain3DProps {
  position?: [number, number, number];
  partFactor: number; // 0 = closed curtain, 1 = parted curtain
  width?: number;
  height?: number;
  lineCount?: number;
}

export const TelemetryCurtain3D: React.FC<TelemetryCurtain3DProps> = ({
  position = [0, 0, 0],
  partFactor,
  width = 16,
  height = 14,
  lineCount = 70,
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const currentPartRef = useRef(partFactor);

  // Line metadata (base positions, direction, center falloff)
  const linesMeta = useMemo(() => {
    const list = [];
    for (let i = 0; i < lineCount; i++) {
      const normalizedX = (i / (lineCount - 1)) * 2 - 1; // -1 to 1
      const x = normalizedX * (width * 0.5);
      const isLeft = normalizedX < 0;
      const distanceFromCenter = Math.abs(normalizedX);
      const zOffset = (Math.sin(i * 12.3) * 0.5);

      list.push({
        baseX: x,
        isLeft,
        distanceFromCenter,
        zOffset,
      });
    }
    return list;
  }, [lineCount, width]);

  // Initial vertex positions (2 vertices per line: top and bottom)
  const initialPositions = useMemo(() => {
    const array = new Float32Array(lineCount * 2 * 3);
    for (let i = 0; i < lineCount; i++) {
      const meta = linesMeta[i];
      // Vertex 1 (bottom)
      array[i * 6] = meta.baseX;
      array[i * 6 + 1] = -height * 0.5;
      array[i * 6 + 2] = meta.zOffset;

      // Vertex 2 (top)
      array[i * 6 + 3] = meta.baseX;
      array[i * 6 + 4] = height * 0.5;
      array[i * 6 + 5] = meta.zOffset;
    }
    return array;
  }, [lineCount, linesMeta, height]);

  useFrame((_, delta) => {
    currentPartRef.current = THREE.MathUtils.damp(
      currentPartRef.current,
      partFactor,
      3.8,
      delta
    );

    if (geometryRef.current) {
      const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
      const part = currentPartRef.current;

      for (let i = 0; i < lineCount; i++) {
        const meta = linesMeta[i];
        const centerFalloff = Math.exp(-meta.distanceFromCenter * 2.2);
        const displacement =
          (meta.isLeft ? -1 : 1) * part * (width * 0.65) * (0.4 + 0.6 * centerFalloff);
        const currentX = meta.baseX + displacement;

        // Update bottom and top vertices X
        posAttr.setX(i * 2, currentX);
        posAttr.setX(i * 2 + 1, currentX);
      }

      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      <lineSegments>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[initialPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#22E4FF"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};
