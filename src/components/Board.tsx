import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, type Mesh } from 'three';
import type { BoardState, CellIndex, CellValue, GamePhase, Mark, WinResult } from '../game/types';
import { Cell } from './Cell';
import { DataGhost } from './DataGhost';

interface BoardProps {
  board: BoardState;
  onCellClick: (index: CellIndex) => void;
  winResult: WinResult | null;
  gamePhase: GamePhase;
  moveCount: number;
  lastMove: CellIndex | null;
  skinColors?: Partial<Record<Mark, string>>;
}

const CELL_SPACING = 1.1;

const CELL_POSITIONS: readonly [number, number, number][] = [
  [-CELL_SPACING, 0, -CELL_SPACING], [0, 0, -CELL_SPACING], [CELL_SPACING, 0, -CELL_SPACING],
  [-CELL_SPACING, 0, 0],             [0, 0, 0],             [CELL_SPACING, 0, 0],
  [-CELL_SPACING, 0, CELL_SPACING],  [0, 0, CELL_SPACING],  [CELL_SPACING, 0, CELL_SPACING],
];

const GRID_LINE_LENGTH = 3.3;
const GRID_LINE_THICKNESS = 0.05;
const GRID_LINE_HEIGHT = 0.02;

const GRID_LINES: { position: [number, number, number]; size: [number, number, number] }[] = [
  // Vertical lines (along Z axis)
  { position: [-CELL_SPACING / 2, 0, 0], size: [GRID_LINE_THICKNESS, GRID_LINE_HEIGHT, GRID_LINE_LENGTH] },
  { position: [CELL_SPACING / 2, 0, 0],  size: [GRID_LINE_THICKNESS, GRID_LINE_HEIGHT, GRID_LINE_LENGTH] },
  // Horizontal lines (along X axis)
  { position: [0, 0, -CELL_SPACING / 2], size: [GRID_LINE_LENGTH, GRID_LINE_HEIGHT, GRID_LINE_THICKNESS] },
  { position: [0, 0, CELL_SPACING / 2],  size: [GRID_LINE_LENGTH, GRID_LINE_HEIGHT, GRID_LINE_THICKNESS] },
];

const CYAN = new Color('#00ffff');
const CORRUPTED = new Color('#ff4400');

interface GridLineProps {
  position: [number, number, number];
  size: [number, number, number];
  corruptionFactor: number;
  index: number;
}

const GridLine = ({ position, size, corruptionFactor, index }: GridLineProps): ReactNode => {
  const meshRef = useRef<Mesh>(null);
  const basePosition = useRef(position);
  const tempColor = useRef(new Color());

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const jitter = corruptionFactor * 0.02;
    meshRef.current.position.x = basePosition.current[0] + Math.sin(t * 3 + index * 2) * jitter;
    meshRef.current.position.z = basePosition.current[2] + Math.cos(t * 4 + index * 1.5) * jitter;

    tempColor.current.copy(CYAN).lerp(CORRUPTED, corruptionFactor);
    const mat = meshRef.current.material as import('three').MeshStandardMaterial;
    mat.color.copy(tempColor.current);
    mat.emissive.copy(tempColor.current);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={CYAN}
        emissive={CYAN}
        emissiveIntensity={2}
        toneMapped={false}
      />
    </mesh>
  );
};

interface GridLinesProps {
  moveCount: number;
}

const GridLines = ({ moveCount }: GridLinesProps): ReactNode => {
  const corruptionFactor = Math.min(moveCount / 9, 1);
  return (
    <>
      {GRID_LINES.map((line, i) => (
        <GridLine
          key={i}
          position={line.position}
          size={line.size}
          corruptionFactor={corruptionFactor}
          index={i}
        />
      ))}
    </>
  );
};

const isWinningCell = (index: CellIndex, winResult: WinResult | null): boolean => {
  if (!winResult) return false;
  return winResult.line.includes(index);
};

export const Board = ({ board, onCellClick, winResult, gamePhase: _gamePhase, moveCount, lastMove, skinColors }: BoardProps): ReactNode => (
  <group>
    <GridLines moveCount={moveCount} />
    {CELL_POSITIONS.map((position, i) => {
      const index = i as CellIndex;
      const mark = board[index] as CellValue;
      const color = mark ? skinColors?.[mark] : undefined;
      return (
        <Cell
          key={index}
          index={index}
          mark={mark}
          position={position}
          onClick={() => onCellClick(index)}
          isWinning={isWinningCell(index, winResult)}
          color={color}
        />
      );
    })}
    {lastMove !== null && board[lastMove] !== null && (
      <DataGhost
        mark={board[lastMove] as Mark}
        position={[CELL_POSITIONS[lastMove][0], 0.5, CELL_POSITIONS[lastMove][2]]}
        color={skinColors?.[board[lastMove] as Mark]}
      />
    )}
  </group>
);
