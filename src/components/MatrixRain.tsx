import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points as PointsType } from 'three';

const PARTICLE_COUNT = 200;
const SPREAD_X = 12;
const SPREAD_Y = 10;
const Z_POSITION = -5;
const MIN_SPEED = 1.5;
const MAX_SPEED = 4.5;

export const MatrixRain = () => {
  const pointsRef = useRef<PointsType>(null);

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const spd = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      pos[idx] = (Math.random() - 0.5) * SPREAD_X;
      pos[idx + 1] = (Math.random() - 0.5) * SPREAD_Y;
      pos[idx + 2] = Z_POSITION + (Math.random() - 0.5) * 2;
      spd[i] = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    }

    return { positions: pos, speeds: spd };
  }, []);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;

    const posArray = points.geometry.attributes.position.array as Float32Array;
    const halfY = SPREAD_Y / 2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const yIdx = i * 3 + 1;
      posArray[yIdx] -= speeds[i] * delta;

      if (posArray[yIdx] < -halfY) {
        posArray[yIdx] = halfY;
        posArray[i * 3] = (Math.random() - 0.5) * SPREAD_X;
      }
    }

    points.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00ff88"
        size={0.06}
        transparent
        opacity={0.7}
        depthWrite={false}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  );
};
