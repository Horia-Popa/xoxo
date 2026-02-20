import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Points as PointsType } from 'three';

export interface DethroneExplosionProps {
  active: boolean;
  position: [number, number, number];
  onComplete: () => void;
}

const PARTICLE_COUNT = 80;
const DURATION = 2;
const SPEED = 3;
const HALF = PARTICLE_COUNT / 2;

const makeVelocities = (): [number, number, number][] => {
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
};

export const DethroneExplosion = ({ active, position, onComplete }: DethroneExplosionProps) => {
  const magentaRef = useRef<PointsType>(null);
  const cyanRef = useRef<PointsType>(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);

  const velocities = useMemo(() => makeVelocities(), []);
  const magentaPositions = useMemo(() => new Float32Array(HALF * 3), []);
  const cyanPositions = useMemo(() => new Float32Array(HALF * 3), []);

  useEffect(() => {
    if (active) {
      elapsedRef.current = 0;
      completedRef.current = false;
      magentaPositions.fill(0);
      cyanPositions.fill(0);
    }
  }, [active, magentaPositions, cyanPositions]);

  useFrame((_, delta) => {
    if (!active || completedRef.current) return;

    elapsedRef.current += delta;

    const updatePoints = (ref: React.RefObject<PointsType | null>, offset: number) => {
      const points = ref.current;
      if (!points) return;
      const posArray = points.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < HALF; i++) {
        const vi = i + offset;
        const idx = i * 3;
        posArray[idx] += velocities[vi][0] * delta;
        posArray[idx + 1] += velocities[vi][1] * delta;
        posArray[idx + 2] += velocities[vi][2] * delta;
      }
      points.geometry.attributes.position.needsUpdate = true;
      const opacity = Math.max(0, 1 - elapsedRef.current / DURATION);
      (points.material as { opacity: number }).opacity = opacity;
    };

    updatePoints(magentaRef, 0);
    updatePoints(cyanRef, HALF);

    if (elapsedRef.current >= DURATION) {
      completedRef.current = true;
      onComplete();
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      <points ref={magentaRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[magentaPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ff00ff" size={0.1} transparent opacity={1} depthWrite={false} toneMapped={false} sizeAttenuation />
      </points>
      <points ref={cyanRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[cyanPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#00ffff" size={0.1} transparent opacity={1} depthWrite={false} toneMapped={false} sizeAttenuation />
      </points>
    </group>
  );
};
