import React, { useState, type CSSProperties } from 'react';
import type { PlayerData, Mark } from '../game/types';
import { validatePlayerNames } from '../game/gameLogic';

interface StartModalProps {
  onStart: (players: [PlayerData, PlayerData], overclockEnabled: boolean) => void;
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    fontFamily: 'monospace',
  } satisfies CSSProperties,

  modal: {
    background: 'rgba(10, 10, 20, 0.95)',
    border: '2px solid #00ffff',
    borderRadius: '8px',
    padding: '32px 40px',
    minWidth: '380px',
    maxWidth: '440px',
    boxShadow: '0 0 40px #00ffff33, 0 0 80px #ff00ff22',
  } satisfies CSSProperties,

  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#ff00ff',
    textAlign: 'center',
    marginBottom: '24px',
    letterSpacing: '3px',
    textTransform: 'uppercase',
  } satisfies CSSProperties,

  fieldGroup: {
    marginBottom: '16px',
  } satisfies CSSProperties,

  label: {
    display: 'block',
    fontSize: '12px',
    color: '#00ffff',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  } satisfies CSSProperties,

  input: {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.6)',
    border: '1px solid #00ffff44',
    borderRadius: '4px',
    color: '#00ffff',
    fontFamily: 'monospace',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  } satisfies CSSProperties,

  markSelector: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  } satisfies CSSProperties,

  markButton: (isSelected: boolean): CSSProperties => ({
    flex: 1,
    padding: '10px',
    background: isSelected ? '#ff00ff22' : 'rgba(0, 0, 0, 0.6)',
    border: `2px solid ${isSelected ? '#ff00ff' : '#00ffff44'}`,
    borderRadius: '4px',
    color: isSelected ? '#ff00ff' : '#00ffff88',
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    boxShadow: isSelected ? '0 0 12px #ff00ff44' : 'none',
  }),

  overclockRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    padding: '10px 12px',
    background: 'rgba(0, 0, 0, 0.4)',
    borderRadius: '4px',
    border: '1px solid #ff00ff44',
  } satisfies CSSProperties,

  checkbox: {
    accentColor: '#ff00ff',
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  } satisfies CSSProperties,

  overclockLabel: {
    fontSize: '13px',
    color: '#ff00ff',
    cursor: 'pointer',
    userSelect: 'none',
  } satisfies CSSProperties,

  error: {
    color: '#ff4444',
    fontSize: '12px',
    marginBottom: '12px',
    textAlign: 'center',
  } satisfies CSSProperties,

  beginButton: (disabled: boolean): CSSProperties => ({
    width: '100%',
    padding: '12px',
    background: disabled ? 'rgba(0, 0, 0, 0.4)' : '#ff00ff22',
    border: `2px solid ${disabled ? '#555' : '#ff00ff'}`,
    borderRadius: '4px',
    color: disabled ? '#555' : '#ff00ff',
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    transition: 'all 0.2s',
    boxShadow: disabled ? 'none' : '0 0 16px #ff00ff33',
  }),

  markHint: {
    fontSize: '11px',
    color: '#00ffff66',
    textAlign: 'center',
    marginBottom: '16px',
  } satisfies CSSProperties,
};

export const StartModal = ({ onStart }: StartModalProps) => {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [player1Mark, setPlayer1Mark] = useState<Mark>('X');
  const [overclockEnabled, setOverclockEnabled] = useState(false);
  const [error, setError] = useState('');

  const player2Mark: Mark = player1Mark === 'X' ? 'O' : 'X';
  const bothNamesFilled = name1.trim().length > 0 && name2.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePlayerNames(name1, name2)) {
      setError('Both player names are required.');
      return;
    }

    setError('');

    const players: [PlayerData, PlayerData] = [
      {
        name: name1.trim(),
        mark: player1Mark,
        credits: 0,
        wins: 0,
        activeSkin: 'default',
        unlockedSkins: ['default'],
      },
      {
        name: name2.trim(),
        mark: player2Mark,
        credits: 0,
        wins: 0,
        activeSkin: 'default',
        unlockedSkins: ['default'],
      },
    ];

    onStart(players, overclockEnabled);
  };

  return (
    <div style={styles.overlay} data-testid="start-modal">
      <form style={styles.modal} onSubmit={handleSubmit}>
        <div style={styles.title}>New Game</div>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="player1-name">Player 1</label>
          <input
            id="player1-name"
            style={styles.input}
            type="text"
            placeholder="Enter name..."
            value={name1}
            onChange={(e) => { setName1(e.target.value); setError(''); }}
            data-testid="player1-name"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label} htmlFor="player2-name">Player 2</label>
          <input
            id="player2-name"
            style={styles.input}
            type="text"
            placeholder="Enter name..."
            value={name2}
            onChange={(e) => { setName2(e.target.value); setError(''); }}
            data-testid="player2-name"
          />
        </div>

        <label style={styles.label}>Player 1 Mark</label>
        <div style={styles.markSelector}>
          <button
            type="button"
            style={styles.markButton(player1Mark === 'X')}
            onClick={() => setPlayer1Mark('X')}
            data-testid="mark-x"
          >
            X
          </button>
          <button
            type="button"
            style={styles.markButton(player1Mark === 'O')}
            onClick={() => setPlayer1Mark('O')}
            data-testid="mark-o"
          >
            O
          </button>
        </div>
        <div style={styles.markHint}>
          Player 2 will be assigned {player2Mark}
        </div>

        <div style={styles.overclockRow}>
          <input
            id="overclock-toggle"
            type="checkbox"
            style={styles.checkbox}
            checked={overclockEnabled}
            onChange={(e) => setOverclockEnabled(e.target.checked)}
            data-testid="overclock-toggle"
          />
          <label htmlFor="overclock-toggle" style={styles.overclockLabel}>
            Overclock Mode
          </label>
        </div>

        {error && (
          <div style={styles.error} data-testid="validation-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          style={styles.beginButton(!bothNamesFilled)}
          disabled={!bothNamesFilled}
          data-testid="begin-btn"
        >
          Begin
        </button>
      </form>
    </div>
  );
};
