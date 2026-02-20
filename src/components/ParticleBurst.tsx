import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points as PointsType } from 'three';

interface ParticleBurstProps {
  position: [number, number, number];
  color?: string;
}

const PARTICLE_COUNT = 25;
const DURATION = 1; // seconds
const SPEED = 2;

export const ParticleBurst = ({ position, color = '#00ffff' }: ParticleBurstProps) => {
  const pointsRef = useRef<PointsType>(null);
  const elapsedRef = useRef(0);

  const velocities = useMemo(() => {
    const vels: [number, number, number][] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = SPEED * (0.5 + Math.random() * 0.5);
      vels.push([
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed,
      ]);
    }
    return vels;
  }, []);

  const initialPositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const points = pointsRef.current;
    if (!points) return;

    const posArray = points.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3;
      posArray[idx] += velocities[i][0] * delta;
      posArray[idx + 1] += velocities[i][1] * delta;
      posArray[idx + 2] += velocities[i][2] * delta;
    }
    points.geometry.attributes.position.needsUpdate = true;

    const opacity = Math.max(0, 1 - elapsedRef.current / DURATION);
    const mat = points.material as { opacity: number };
    mat.opacity = opacity;
  });

  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[initialPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.08}
        transparent
        opacity={1}
        depthWrite={false}
        toneMapped={false}
        sizeAttenuation
      />
    </points>
  );
};
