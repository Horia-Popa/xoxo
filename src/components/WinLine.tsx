import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, LineCurve3, TubeGeometry } from 'three';
import type { Mesh } from 'three';
import type { CellIndex } from '../game/types';

interface WinLineProps {
  line: readonly [CellIndex, CellIndex, CellIndex];
}

const CELL_SPACING = 1.1;
const PIECE_Y = 0.5;

const CELL_POSITIONS: readonly [number, number, number][] = [
  [-CELL_SPACING, PIECE_Y, -CELL_SPACING], [0, PIECE_Y, -CELL_SPACING], [CELL_SPACING, PIECE_Y, -CELL_SPACING],
  [-CELL_SPACING, PIECE_Y, 0],             [0, PIECE_Y, 0],             [CELL_SPACING, PIECE_Y, 0],
  [-CELL_SPACING, PIECE_Y, CELL_SPACING],  [0, PIECE_Y, CELL_SPACING],  [CELL_SPACING, PIECE_Y, CELL_SPACING],
];

const NEON_MAGENTA = '#ff00ff';
const TUBE_RADIUS = 0.04;
const TUBE_SEGMENTS = 16;
const RADIAL_SEGMENTS = 8;
const SCALE_SPEED = 3;

export const WinLine = ({ line }: WinLineProps): React.ReactNode => {
  const meshRef = useRef<Mesh>(null);

  const geometry = useMemo(() => {
    const start = new Vector3(...CELL_POSITIONS[line[0]]);
    const end = new Vector3(...CELL_POSITIONS[line[2]]);
    const curve = new LineCurve3(start, end);
    return new TubeGeometry(curve, TUBE_SEGMENTS, TUBE_RADIUS, RADIAL_SEGMENTS, false);
  }, [line]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    if (mesh.scale.x < 1) {
      const next = Math.min(mesh.scale.x + delta * SCALE_SPEED, 1);
      mesh.scale.set(next, next, next);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} scale={[0, 0, 0]}>
      <meshStandardMaterial
        color={NEON_MAGENTA}
        emissive={NEON_MAGENTA}
        emissiveIntensity={3}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};
