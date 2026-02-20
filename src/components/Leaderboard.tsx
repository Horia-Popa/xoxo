import { type CSSProperties } from 'react';
import { type LeaderboardEntry } from '../game/types';

interface LeaderboardProps {
  leaderboard: readonly LeaderboardEntry[];
  onReset: () => void;
  newLeader: string | null;
  dethronedLeader: string | null;
}

const PANEL_WIDTH = 280;

const keyframes = `
@keyframes typewriter {
  from { width: 0; }
  to { width: var(--name-len); }
}
@keyframes blink-caret {
  50% { border-color: transparent; }
}
@keyframes drop-down {
  0% { transform: translateY(-8px); opacity: 0.4; }
  60% { transform: translateY(4px); opacity: 1; }
  100% { transform: translateY(0); opacity: 1; }
}
`;

const styles = {
  panel: {
    position: 'fixed',
    right: 0,
    top: 0,
    width: `${PANEL_WIDTH}px`,
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.85)',
    borderLeft: '1px solid #00ffff44',
    fontFamily: 'monospace',
    color: '#00ffff',
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 12px',
    boxSizing: 'border-box',
    overflowY: 'auto',
    pointerEvents: 'auto',
  } satisfies CSSProperties,

  title: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ff00ff',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    textAlign: 'center',
    marginBottom: '12px',
    borderBottom: '1px solid #ff00ff44',
    paddingBottom: '8px',
  } satisfies CSSProperties,

  headerRow: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
    borderBottom: '1px solid #00ffff44',
    marginBottom: '4px',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#00ffff88',
  } satisfies CSSProperties,

  row: (isFirst: boolean, isDethroned: boolean): CSSProperties => ({
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
    borderBottom: '1px solid #00ffff11',
    color: isFirst ? '#ff00ff' : '#00ffff',
    fontSize: '11px',
    animation: isDethroned ? 'drop-down 0.6s ease-out' : 'none',
  }),

  colRank: { width: '22px', textAlign: 'right', flexShrink: 0 } satisfies CSSProperties,
  colName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontWeight: 'bold',
  } satisfies CSSProperties,
  colStat: { width: '24px', textAlign: 'right', flexShrink: 0, opacity: 0.9 } satisfies CSSProperties,

  empty: {
    fontSize: '12px',
    color: '#00ffff66',
    textAlign: 'center',
    padding: '16px 0',
  } satisfies CSSProperties,

  typewriterName: (charCount: number): CSSProperties => ({
    display: 'inline-block',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontWeight: 'bold',
    borderRight: '2px solid #ff00ff',
    width: `${charCount}ch`,
    animation: `typewriter 0.8s steps(${charCount}) forwards, blink-caret 0.5s step-end 3`,
  }),

  resetButton: {
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid #00ffff22',
  } satisfies CSSProperties,

  button: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.7)',
    border: '1px solid #00ffff',
    color: '#00ffff',
    padding: '8px 16px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'background 0.2s',
  } satisfies CSSProperties,
};

export const Leaderboard = ({ leaderboard, onReset, newLeader, dethronedLeader }: LeaderboardProps) => (
  <div style={styles.panel} data-testid="leaderboard">
    <style>{keyframes}</style>
    <div style={styles.title}>Leaderboard</div>

    {/* Column headers */}
    <div style={styles.headerRow}>
      <span style={styles.colRank}>#</span>
      <span style={styles.colName}>Name</span>
      <span style={styles.colStat}>W</span>
      <span style={styles.colStat}>L</span>
      <span style={styles.colStat}>D</span>
      <span style={styles.colStat}>Stk</span>
      <span style={{ ...styles.colStat, width: '32px' }}>¢</span>
    </div>

    {/* Entries */}
    {leaderboard.length === 0 ? (
      <div style={styles.empty}>No entries yet</div>
    ) : (
      leaderboard.map((entry, i) => {
        const isFirst = i === 0;
        const isDethroned = entry.name === dethronedLeader;
        const isNewLeader = isFirst && entry.name === newLeader;

        return (
          <div
            key={entry.name}
            style={styles.row(isFirst, isDethroned)}
            data-testid={`leaderboard-row-${i}`}
          >
            <span style={styles.colRank}>{i + 1}</span>
            <span style={styles.colName}>
              {isNewLeader ? (
                <span style={styles.typewriterName(entry.name.length)}>
                  {entry.name}
                </span>
              ) : (
                entry.name
              )}
            </span>
            <span style={styles.colStat}>{entry.wins}</span>
            <span style={styles.colStat}>{entry.losses}</span>
            <span style={styles.colStat}>{entry.draws}</span>
            <span style={styles.colStat}>{entry.bestStreak}</span>
            <span style={{ ...styles.colStat, width: '32px' }}>{entry.credits}</span>
          </div>
        );
      })
    )}

    {/* Reset button */}
    <div style={styles.resetButton}>
      <button
        style={styles.button}
        onClick={onReset}
        data-testid="leaderboard-reset-btn"
      >
        Reset Leaderboard
      </button>
    </div>
  </div>
);
