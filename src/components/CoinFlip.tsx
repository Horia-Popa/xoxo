import { useRef, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Group, type MeshStandardMaterial } from 'three';
import type { Mark } from '../game/types';

interface CoinFlipProps {
  playerNames: readonly [string, string];
  onComplete: (startingMark: Mark) => void;
  skinColors?: Partial<Record<Mark, string>>;
}

const SPIN_DURATION = 2.0;
const SPIN_SPEED = 10;
const DEFAULT_X_COLOR = '#00ffff';
const DEFAULT_O_COLOR = '#ff00ff';

export const CoinFlip = ({ onComplete, skinColors }: CoinFlipProps): React.ReactNode => {
  const groupRef = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const elapsedRef = useRef(0);
  const completedRef = useRef(false);
  const resultRef = useRef<Mark | null>(null);

  // Memoize Color objects to avoid re-creating every render
  const xColor = useMemo(() => new Color(skinColors?.X ?? DEFAULT_X_COLOR), [skinColors?.X]);
  const oColor = useMemo(() => new Color(skinColors?.O ?? DEFAULT_O_COLOR), [skinColors?.O]);

  // Reusable Color for blending in useFrame — avoids per-frame allocation
  const blendColor = useMemo(() => new Color(), []);

  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const mark: Mark = Math.random() < 0.5 ? 'X' : 'O';
    resultRef.current = mark;
    onComplete(mark);
  }, [onComplete]);

  useFrame((_, delta) => {
    if (!groupRef.current || !matRef.current) return;

    elapsedRef.current += delta;

    if (elapsedRef.current < SPIN_DURATION) {
      groupRef.current.rotation.x += SPIN_SPEED * delta;
      groupRef.current.position.y = 1.5 + Math.sin(elapsedRef.current * 3) * 0.3;

      // Alternate colors while spinning — reuse blendColor to avoid allocation
      const t = (Math.sin(elapsedRef.current * SPIN_SPEED) + 1) / 2;
      blendColor.copy(xColor).lerp(oColor, t);
      matRef.current.color.copy(blendColor);
      matRef.current.emissive.copy(blendColor);
    } else {
      handleComplete();
      const finalColor = resultRef.current === 'O' ? oColor : xColor;
      matRef.current.color.copy(finalColor);
      matRef.current.emissive.copy(finalColor);
    }
  });

  return (
    <group ref={groupRef} position={[0, 1.5, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.12, 32]} />
        <meshStandardMaterial
          ref={matRef}
          color={DEFAULT_X_COLOR}
          emissive={DEFAULT_X_COLOR}
          emissiveIntensity={2}
          metalness={0.8}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
};
