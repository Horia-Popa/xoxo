import { type CSSProperties } from 'react';
import { type GameState, type Mark } from '../game/types';
import { TerminalText } from './TerminalText';

interface HUDProps {
  gameState: GameState;
  onReset: () => void;
  onStartGame: () => void;
  onOpenShop: () => void;
  skinColors?: Partial<Record<Mark, string>>;
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    fontFamily: 'monospace',
    color: '#00ffff',
    zIndex: 10,
  } satisfies CSSProperties,

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '16px 24px',
    pointerEvents: 'auto' as const,
  } satisfies CSSProperties,

  playerCard: (isActive: boolean, color: string): CSSProperties => ({
    background: isActive ? `rgba(0, 0, 0, 0.85)` : 'rgba(0, 0, 0, 0.7)',
    border: `2px solid ${isActive ? color : '#00ffff44'}`,
    borderRadius: '6px',
    padding: isActive ? '12px 20px' : '10px 16px',
    minWidth: '160px',
    boxShadow: isActive
      ? `0 0 20px ${color}88, 0 0 40px ${color}44, inset 0 0 15px ${color}22`
      : 'none',
    transition: 'all 0.3s ease',
    transform: isActive ? 'scale(1.05)' : 'scale(1)',
    animation: isActive ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
  }),

  playerName: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '4px',
  } satisfies CSSProperties,

  playerCredits: {
    fontSize: '12px',
    color: '#ff00ff',
  } satisfies CSSProperties,

  centerInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  } satisfies CSSProperties,

  phaseLabel: {
    background: 'rgba(0, 0, 0, 0.7)',
    padding: '4px 12px',
    borderRadius: '4px',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: '#00ffff88',
  } satisfies CSSProperties,

  turnIndicator: (color: string): CSSProperties => ({
    background: 'rgba(0, 0, 0, 0.7)',
    padding: '8px 20px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: `2px solid ${color}`,
    color,
    boxShadow: `0 0 12px ${color}66`,
    textShadow: `0 0 8px ${color}`,
  }),

  timer: {
    background: 'rgba(0, 0, 0, 0.8)',
    padding: '6px 16px',
    borderRadius: '4px',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ff00ff',
    border: '1px solid #ff00ff',
    letterSpacing: '2px',
  } satisfies CSSProperties,

  bottomBar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 24px',
    pointerEvents: 'auto' as const,
  } satisfies CSSProperties,

  button: (variant: 'primary' | 'secondary'): CSSProperties => ({
    background: variant === 'primary' ? '#ff00ff22' : 'rgba(0, 0, 0, 0.7)',
    border: `1px solid ${variant === 'primary' ? '#ff00ff' : '#00ffff'}`,
    color: variant === 'primary' ? '#ff00ff' : '#00ffff',
    padding: '8px 20px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    transition: 'background 0.2s',
  }),

  endMessage: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(0, 0, 0, 0.85)',
    border: '2px solid #ff00ff',
    borderRadius: '8px',
    padding: '24px 40px',
    textAlign: 'center',
    pointerEvents: 'auto' as const,
    boxShadow: '0 0 30px #ff00ff44',
  } satisfies CSSProperties,

  endTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ff00ff',
    marginBottom: '8px',
  } satisfies CSSProperties,

  endSubtitle: {
    fontSize: '14px',
    color: '#00ffff',
  } satisfies CSSProperties,
};

const getCurrentPlayer = (gameState: GameState): string => {
  const player = gameState.players.find(p => p.mark === gameState.currentPlayer);
  return player?.name || gameState.currentPlayer;
};

const getWinnerName = (gameState: GameState): string => {
  if (!gameState.winResult) return '';
  const player = gameState.players.find(p => p.mark === gameState.winResult!.winner);
  return player?.name || gameState.winResult.winner;
};

const formatTime = (seconds: number | null): string => {
  if (seconds === null) return '';
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

export const HUD = ({ gameState, onReset, onStartGame, onOpenShop, skinColors }: HUDProps) => {
  const { phase, players, overclockEnabled, turnTimeRemaining, currentPlayer } = gameState;
  const isPlaying = phase === 'playing';
  const isGameOver = phase === 'won' || phase === 'draw';
  const showTimer = overclockEnabled && isPlaying && turnTimeRemaining !== null;

  const p0Color = skinColors?.[players[0].mark] ?? '#00ffff';
  const p1Color = skinColors?.[players[1].mark] ?? '#ff00ff';
  const activeColor = skinColors?.[currentPlayer] ?? '#ff00ff';

  return (
    <div style={styles.container} data-testid="hud">
      {/* Inject pulse animation */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>

      {/* Top bar: player cards + center info */}
      <div style={styles.topBar}>
        {/* Player 1 card */}
        <div style={styles.playerCard(currentPlayer === players[0].mark && isPlaying, p0Color)} data-testid="player-card-0">
          <div style={{ ...styles.playerName, color: p0Color }}>
            {players[0].mark} — {players[0].name}
          </div>
          <div style={styles.playerCredits}>
            ¢ {players[0].credits}
          </div>
        </div>

        {/* Center: phase + turn + timer */}
        <div style={styles.centerInfo}>
          <div style={styles.phaseLabel} data-testid="phase-label">
            {phase}
          </div>
          {isPlaying && (
            <div style={styles.turnIndicator(activeColor)} data-testid="turn-indicator">
              <TerminalText text={`${getCurrentPlayer(gameState)}'s turn (${currentPlayer})`} />
            </div>
          )}
          {showTimer && (
            <div style={styles.timer} data-testid="overclock-timer">
              ⏱ {formatTime(turnTimeRemaining)}
            </div>
          )}
        </div>

        {/* Player 2 card */}
        <div style={styles.playerCard(currentPlayer === players[1].mark && isPlaying, p1Color)} data-testid="player-card-1">
          <div style={{ ...styles.playerName, color: p1Color }}>
            {players[1].mark} — {players[1].name}
          </div>
          <div style={styles.playerCredits}>
            ¢ {players[1].credits}
          </div>
        </div>
      </div>

      {/* End game message overlay */}
      {isGameOver && (
        <div style={styles.endMessage} data-testid="end-message">
          <TerminalText text={phase === 'won' ? `${getWinnerName(gameState)} wins!` : 'Draw!'} style={styles.endTitle} />
          <TerminalText text={phase === 'won' ? 'Glitch detected in the matrix' : 'System deadlock — no winner'} style={styles.endSubtitle} />
        </div>
      )}

      {/* Bottom bar: action buttons */}
      <div style={styles.bottomBar}>
        {phase === 'setup' && (
          <button
            style={styles.button('primary')}
            onClick={onStartGame}
            data-testid="start-game-btn"
          >
            Start Game
          </button>
        )}
        {(isPlaying || isGameOver) && (
          <button
            style={styles.button('secondary')}
            onClick={onReset}
            data-testid="reset-btn"
          >
            Reset
          </button>
        )}
        <button
          style={styles.button('secondary')}
          onClick={onOpenShop}
          data-testid="shop-btn"
        >
          Skin Shop
        </button>
      </div>
    </div>
  );
};
