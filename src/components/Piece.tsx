import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import type { Mark } from '../game/types';

interface PieceProps {
  mark: Mark;
  isWinning: boolean;
  color?: string;
  isCorrupted?: boolean;
}

const DEFAULT_COLORS: Record<Mark, string> = {
  X: '#00ffff',
  O: '#ff00ff',
};

const DROP_START_Y = 3;
const DROP_TARGET_Y = 0.5;
const LERP_FACTOR = 0.1;
const GLITCH_INTENSITY = 0.05;

const XMesh = ({ color, emissiveIntensity }: { color: string; emissiveIntensity: number }) => (
  <>
    <mesh rotation={[0, Math.PI / 4, 0]}>
      <boxGeometry args={[0.7, 0.15, 0.15]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        toneMapped={false}
      />
    </mesh>
    <mesh rotation={[0, -Math.PI / 4, 0]}>
      <boxGeometry args={[0.7, 0.15, 0.15]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissiveIntensity}
        toneMapped={false}
      />
    </mesh>
  </>
);

const OMesh = ({ color, emissiveIntensity }: { color: string; emissiveIntensity: number }) => (
  <mesh>
    <torusGeometry args={[0.3, 0.08, 16, 32]} />
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={emissiveIntensity}
      toneMapped={false}
    />
  </mesh>
);

export const Piece = ({ mark, isWinning, color, isCorrupted = false }: PieceProps) => {
  const groupRef = useRef<Group>(null);
  const yRef = useRef(DROP_START_Y);

  const pieceColor = color ?? DEFAULT_COLORS[mark];
  const emissiveIntensity = isWinning ? 3 : 2;

  useFrame(() => {
    if (!groupRef.current) return;

    yRef.current += (DROP_TARGET_Y - yRef.current) * LERP_FACTOR;
    groupRef.current.position.y = yRef.current;

    if (isCorrupted) {
      groupRef.current.position.x = (Math.random() - 0.5) * GLITCH_INTENSITY;
      groupRef.current.position.z = (Math.random() - 0.5) * GLITCH_INTENSITY;
    }
  });

  return (
    <group ref={groupRef} position={[0, DROP_START_Y, 0]}>
      {mark === 'X' ? (
        <XMesh color={pieceColor} emissiveIntensity={emissiveIntensity} />
      ) : (
        <OMesh color={pieceColor} emissiveIntensity={emissiveIntensity} />
      )}
    </group>
  );
};
