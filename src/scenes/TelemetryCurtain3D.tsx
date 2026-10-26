import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TelemetryCurtain3DProps {
  position?: [number, number, number];
  partFactor: number; // 0 = closed curtain, 1 = parted curtain
  opacity?: number;
  width?: number;
  height?: number;
  lineCount?: number;
}

export const TelemetryCurtain3D: React.FC<TelemetryCurtain3DProps> = ({
  position = [0, 0, 0],
  partFactor,
  opacity = 0.55,
  width = 18,
  height = 14,
  lineCount = 75,
}) => {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const currentPartRef = useRef(partFactor);

  // Points per vertical line for wave ripples (e.g. 16 segments per line)
  const segmentsPerLine = 16;

  // Metadata for each line
  const linesMeta = useMemo(() => {
    const list = [];
    for (let i = 0; i < lineCount; i++) {
      const normalizedX = (i / (lineCount - 1)) * 2 - 1; // -1 to 1
      const x = normalizedX * (width * 0.5);
      const isLeft = normalizedX < 0;
      const distanceFromCenter = Math.abs(normalizedX);
      const zOffset = Math.sin(i * 14.5) * 0.4;
      const waveFreq = 2.5 + (i % 4) * 0.8;
      const wavePhase = i * 0.45;

      list.push({
        baseX: x,
        isLeft,
        distanceFromCenter,
        zOffset,
        waveFreq,
        wavePhase,
      });
    }
    return list;
  }, [lineCount, width]);

  // Initial vertex positions array
  const initialPositions = useMemo(() => {
    // Each line has segmentsPerLine segments = segmentsPerLine * 2 vertices for LineSegments
    const totalLineVertices = lineCount * segmentsPerLine * 2 * 3;
    const array = new Float32Array(totalLineVertices);
    let ptr = 0;

    for (let i = 0; i < lineCount; i++) {
      const meta = linesMeta[i];
      for (let s = 0; s < segmentsPerLine; s++) {
        const y1 = -height * 0.5 + (s / segmentsPerLine) * height;
        const y2 = -height * 0.5 + ((s + 1) / segmentsPerLine) * height;

        // Vertex 1
        array[ptr++] = meta.baseX;
        array[ptr++] = y1;
        array[ptr++] = meta.zOffset;

        // Vertex 2
        array[ptr++] = meta.baseX;
        array[ptr++] = y2;
        array[ptr++] = meta.zOffset;
      }
    }
    return array;
  }, [lineCount, linesMeta, height, segmentsPerLine]);

  // Horizontal Blueprint Scale Ticks (Graticule)
  const graticuleLines = useMemo(() => {
    const lines: number[] = [];
    const yLevels = [-4.5, -2.25, 0, 2.25, 4.5];
    for (const y of yLevels) {
      lines.push(-width * 0.5, y, -0.1, width * 0.5, y, -0.1);
    }
    return new Float32Array(lines);
  }, [width]);

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();

    currentPartRef.current = THREE.MathUtils.damp(
      currentPartRef.current,
      partFactor,
      3.8,
      delta
    );

    if (geometryRef.current) {
      const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
      const part = currentPartRef.current;
      let ptr = 0;

      for (let i = 0; i < lineCount; i++) {
        const meta = linesMeta[i];
        const centerFalloff = Math.exp(-meta.distanceFromCenter * 2.4);
        const displacement =
          (meta.isLeft ? -1 : 1) * part * (width * 0.65) * (0.35 + 0.65 * centerFalloff);
        const currentBaseX = meta.baseX + displacement;

        for (let s = 0; s < segmentsPerLine; s++) {
          const y1 = -height * 0.5 + (s / segmentsPerLine) * height;
          const y2 = -height * 0.5 + ((s + 1) / segmentsPerLine) * height;

          // Oscilloscope high-frequency carrier wave ripple
          const wave1 = Math.sin(y1 * meta.waveFreq + time * 3.5 + meta.wavePhase) * 0.08 * (1 - part * 0.7);
          const wave2 = Math.sin(y2 * meta.waveFreq + time * 3.5 + meta.wavePhase) * 0.08 * (1 - part * 0.7);

          // Point 1
          posAttr.setXYZ(ptr++, currentBaseX + wave1, y1, meta.zOffset);
          // Point 2
          posAttr.setXYZ(ptr++, currentBaseX + wave2, y2, meta.zOffset);
        }
      }

      posAttr.needsUpdate = true;
    }
  });

  if (opacity <= 0.001) return null;

  return (
    <group position={position}>
      {/* 1. HORIZONTAL BLUEPRINT FREQUENCY GRATICULE */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[graticuleLines, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00F0FF"
          transparent
          opacity={opacity * 0.25}
        />
      </lineSegments>

      {/* 2. OSCILLATING TELEMETRY BLUEPRINT CARRIER CURTAIN */}
      <lineSegments>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[initialPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00F0FF"
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};
