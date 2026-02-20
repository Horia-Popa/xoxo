import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import type { Group } from 'three';
import type { LeaderboardEntry } from '../game/types';
import { DethroneExplosion } from './DethroneExplosion';

interface Leaderboard3DProps {
  leaderboard: readonly LeaderboardEntry[];
  newLeader: string | null;
  dethronedLeader: string | null;
  dethroneActive: boolean;
  onDethroneComplete: () => void;
}

const ROW_HEIGHT = 0.32;
const BOARD_X = 5.5;
const BOARD_Y = 3.2;
const BOARD_Z = -2;
const FONT_SIZE = 0.14;
const HEADER_SIZE = 0.12;
const TITLE_SIZE = 0.2;

const CYAN = '#00ffff';
const MAGENTA = '#ff00ff';
const DIM_CYAN = '#00ffff88';

const TypewriterText = ({ text, position, fontSize, color }: {
  text: string;
  position: [number, number, number];
  fontSize: number;
  color: string;
}) => {
  const [visibleChars, setVisibleChars] = useState(0);
  const elapsedRef = useRef(0);

  useEffect(() => {
    setVisibleChars(0);
    elapsedRef.current = 0;
  }, [text]);

  useFrame((_, delta) => {
    if (visibleChars >= text.length) return;
    elapsedRef.current += delta;
    const chars = Math.min(Math.floor(elapsedRef.current / 0.08), text.length);
    if (chars !== visibleChars) setVisibleChars(chars);
  });

  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="left"
      anchorY="middle"
      font={undefined}
    >
      {text.slice(0, visibleChars) + (visibleChars < text.length ? '█' : '')}
    </Text>
  );
};

const LeaderboardRow = ({ entry, rank, y, isNewLeader, isDethroned }: {
  entry: LeaderboardEntry;
  rank: number;
  y: number;
  isNewLeader: boolean;
  isDethroned: boolean;
}) => {
  const groupRef = useRef<Group>(null);
  const targetY = useRef(y);
  const color = rank === 1 ? MAGENTA : CYAN;
  const stats = `${entry.wins}W ${entry.losses}L ${entry.draws}D  stk:${entry.bestStreak}  ¢${entry.credits}`;

  // Animate drop when dethroned
  useEffect(() => {
    targetY.current = y;
  }, [y]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const current = groupRef.current.position.y;
    const diff = targetY.current - current;
    if (Math.abs(diff) > 0.001) {
      groupRef.current.position.y += diff * Math.min(delta * 6, 1);
    }
  });

  return (
    <group ref={groupRef} position={[0, isDethroned ? y + 0.5 : y, 0]}>
      {/* Rank */}
      <Text
        position={[0, 0, 0]}
        fontSize={FONT_SIZE}
        color={DIM_CYAN}
        anchorX="left"
        anchorY="middle"
      >
        {`${rank}.`}
      </Text>

      {/* Name — typewriter for new leader */}
      {isNewLeader ? (
        <TypewriterText
          text={entry.name}
          position={[0.3, 0, 0]}
          fontSize={FONT_SIZE}
          color={color}
        />
      ) : (
        <Text
          position={[0.3, 0, 0]}
          fontSize={FONT_SIZE}
          color={color}
          anchorX="left"
          anchorY="middle"
          fontWeight="bold"
        >
          {entry.name}
        </Text>
      )}

      {/* Stats line below name */}
      <Text
        position={[0.3, -0.14, 0]}
        fontSize={HEADER_SIZE * 0.85}
        color={DIM_CYAN}
        anchorX="left"
        anchorY="middle"
      >
        {stats}
      </Text>
    </group>
  );
};

export const Leaderboard3D = ({
  leaderboard,
  newLeader,
  dethronedLeader,
  dethroneActive,
  onDethroneComplete,
}: Leaderboard3DProps) => {
  // Find the dethroned entry's Y position for the explosion
  const dethronedIndex = dethronedLeader
    ? leaderboard.findIndex((e) => e.name === dethronedLeader)
    : -1;
  const dethronedY = dethronedIndex >= 0
    ? BOARD_Y - 0.6 - dethronedIndex * ROW_HEIGHT
    : BOARD_Y;

  return (
    <group position={[BOARD_X, 0, BOARD_Z]}>
      {/* Title */}
      <Text
        position={[0, BOARD_Y, 0]}
        fontSize={TITLE_SIZE}
        color={MAGENTA}
        anchorX="left"
        anchorY="middle"
        letterSpacing={0.1}
      >
        LEADERBOARD
      </Text>

      {/* Header row */}
      <Text
        position={[0, BOARD_Y - 0.35, 0]}
        fontSize={HEADER_SIZE}
        color={DIM_CYAN}
        anchorX="left"
        anchorY="middle"
      >
        #  Name
      </Text>

      {/* Entries */}
      {leaderboard.length === 0 ? (
        <Text
          position={[0, BOARD_Y - 0.7, 0]}
          fontSize={FONT_SIZE}
          color={DIM_CYAN}
          anchorX="left"
          anchorY="middle"
        >
          No entries yet
        </Text>
      ) : (
        leaderboard.map((entry, i) => {
          const rowY = BOARD_Y - 0.65 - i * ROW_HEIGHT;
          const isFirst = i === 0;
          const isNewLdr = isFirst && entry.name === newLeader;
          const isDeth = entry.name === dethronedLeader;

          return (
            <LeaderboardRow
              key={entry.name}
              entry={entry}
              rank={i + 1}
              y={rowY}
              isNewLeader={isNewLdr}
              isDethroned={isDeth}
            />
          );
        })
      )}

      {/* Dethrone explosion at the dethroned entry's position */}
      <DethroneExplosion
        active={dethroneActive}
        position={[1, dethronedY, 0]}
        onComplete={onDethroneComplete}
      />
    </group>
  );
};
