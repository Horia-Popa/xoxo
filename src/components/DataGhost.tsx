import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import type { MeshStandardMaterial } from 'three';
import type { Mark } from '../game/types';

interface DataGhostProps {
  mark: Mark;
  position: [number, number, number];
  color?: string;
}

const DEFAULT_COLORS: Record<Mark, string> = {
  X: '#00ffff',
  O: '#ff00ff',
};

const INITIAL_OPACITY = 0.4;
const FADE_DURATION = 2; // seconds

export const DataGhost = ({ mark, position, color }: DataGhostProps) => {
  const matRefs = useRef<MeshStandardMaterial[]>([]);
  const elapsedRef = useRef(0);

  // Reset refs on mount to prevent stale references from previous renders
  useEffect(() => {
    matRefs.current = [];
    elapsedRef.current = 0;
  }, [mark, position]);

  const ghostColor = color ?? DEFAULT_COLORS[mark];

  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const opacity = Math.max(0, INITIAL_OPACITY - (elapsedRef.current / FADE_DURATION) * INITIAL_OPACITY);
    for (const mat of matRefs.current) {
      mat.opacity = opacity;
    }
  });

  const addMatRef = (mat: MeshStandardMaterial | null) => {
    if (mat && !matRefs.current.includes(mat)) {
      matRefs.current.push(mat);
    }
  };

  const materialProps = {
    color: ghostColor,
    emissive: ghostColor,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: INITIAL_OPACITY,
    toneMapped: false,
    depthWrite: false,
  } as const;

  return (
    <group position={position}>
      {mark === 'X' ? (
        <>
          <mesh rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.7, 0.15, 0.15]} />
            <meshStandardMaterial ref={addMatRef} {...materialProps} />
          </mesh>
          <mesh rotation={[0, -Math.PI / 4, 0]}>
            <boxGeometry args={[0.7, 0.15, 0.15]} />
            <meshStandardMaterial ref={addMatRef} {...materialProps} />
          </mesh>
        </>
      ) : (
        <mesh>
          <torusGeometry args={[0.3, 0.08, 16, 32]} />
          <meshStandardMaterial ref={addMatRef} {...materialProps} />
        </mesh>
      )}
    </group>
  );
};
