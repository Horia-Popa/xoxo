import { useState, useEffect, useRef, type ReactNode } from 'react';
import type { CellIndex, CellValue, Mark } from '../game/types';
import { Piece } from './Piece';
import { ParticleBurst } from './ParticleBurst';

interface CellProps {
  index: CellIndex;
  mark: CellValue;
  position: [number, number, number];
  onClick: () => void;
  isWinning: boolean;
  color?: string;
}

const BURST_DURATION = 1000; // ms — matches ParticleBurst DURATION

export const Cell = ({ mark, position, onClick, isWinning, color }: CellProps): ReactNode => {
  const [showBurst, setShowBurst] = useState(false);
  const prevMarkRef = useRef<CellValue>(mark);

  useEffect(() => {
    if (mark !== null && prevMarkRef.current === null) {
      setShowBurst(true);
      const timer = setTimeout(() => setShowBurst(false), BURST_DURATION);
      return () => clearTimeout(timer);
    }
    prevMarkRef.current = mark;
  }, [mark]);

  // Sync when mark resets to null (game reset)
  useEffect(() => {
    if (mark === null) {
      prevMarkRef.current = null;
      setShowBurst(false);
    }
  }, [mark]);

  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <boxGeometry args={[1, 0.1, 1]} />
        <meshStandardMaterial transparent opacity={0} />
      </mesh>
      {mark !== null && <Piece mark={mark as Mark} isWinning={isWinning} color={color} />}
      {showBurst && <ParticleBurst position={[0, 0.5, 0]} />}
    </group>
  );
};
