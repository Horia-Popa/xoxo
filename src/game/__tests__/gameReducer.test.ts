import { describe, it, expect } from 'vitest';
import { createInitialGameState, gameReducer } from '../gameReducer';
import type { GameState, PlayerData, BoardState, Mark } from '../types';

// Helper: create a playing-phase state with known players
const makePlayingState = (overrides?: Partial<GameState>): GameState => {
  const base = createInitialGameState();
  return {
    ...base,
    phase: 'playing',
    currentPlayer: 'X',
    players: [
      { name: 'Alice', mark: 'X', credits: 0, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
      { name: 'Bob', mark: 'O', credits: 0, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
    ],
    ...overrides,
  };
};

const board = (cells: (Mark | null)[]): BoardState =>
  cells as unknown as BoardState;

describe('createInitialGameState', () => {
  it('returns a state in setup phase with empty board', () => {
    const state = createInitialGameState();
    expect(state.phase).toBe('setup');
    expect(state.board.every((c) => c === null)).toBe(true);
    expect(state.currentPlayer).toBe('X');
    expect(state.moveCount).toBe(0);
  });
});

describe('PLACE_MARK', () => {
  it('updates board and switches turn on valid move', () => {
    const state = makePlayingState();
    const next = gameReducer(state, { type: 'PLACE_MARK', index: 0 });
    expect(next.board[0]).toBe('X');
    expect(next.currentPlayer).toBe('O');
    expect(next.moveCount).toBe(1);
    expect(next.lastMove).toBe(0);
  });

  it('does nothing when placing on an occupied cell', () => {
    const state = makePlayingState({
      board: board(['X', null, null, null, null, null, null, null, null]),
      moveCount: 1,
    });
    const next = gameReducer(state, { type: 'PLACE_MARK', index: 0 });
    expect(next).toBe(state);
  });

  it('does nothing when phase is not playing', () => {
    const state = makePlayingState({ phase: 'setup' });
    const next = gameReducer(state, { type: 'PLACE_MARK', index: 0 });
    expect(next).toBe(state);
  });

  it('detects win and awards 25 credits to winner', () => {
    // X has top-left and top-center, placing top-right wins
    const state = makePlayingState({
      board: board(['X', 'X', null, 'O', 'O', null, null, null, null]),
      currentPlayer: 'X',
    });
    const next = gameReducer(state, { type: 'PLACE_MARK', index: 2 });
    expect(next.phase).toBe('won');
    expect(next.winResult).not.toBeNull();
    expect(next.winResult!.winner).toBe('X');
    // Alice (X) should get 25 credits and 1 win
    const alice = next.players.find((p) => p.mark === 'X')!;
    expect(alice.credits).toBe(25);
    expect(alice.wins).toBe(1);
    // Bob (O) unchanged
    const bob = next.players.find((p) => p.mark === 'O')!;
    expect(bob.credits).toBe(0);
    expect(bob.wins).toBe(0);
  });

  it('detects draw when board fills with no winner', () => {
    // One cell left, no winner possible
    // X O X
    // X X O
    // O X _  <- O places at index 8
    const state = makePlayingState({
      board: board(['X', 'O', 'X', 'X', 'X', 'O', 'O', 'X', null]),
      currentPlayer: 'O',
    });
    const next = gameReducer(state, { type: 'PLACE_MARK', index: 8 });
    expect(next.phase).toBe('draw');
    expect(next.winResult).toBeNull();
  });

  it('resets overclock timer after a valid move when overclock is enabled', () => {
    const state = makePlayingState({
      overclockEnabled: true,
      turnTimeRemaining: 3,
    });
    const next = gameReducer(state, { type: 'PLACE_MARK', index: 4 });
    expect(next.turnTimeRemaining).toBe(10);
  });

  it('keeps timer null when overclock is disabled', () => {
    const state = makePlayingState({ overclockEnabled: false });
    const next = gameReducer(state, { type: 'PLACE_MARK', index: 4 });
    expect(next.turnTimeRemaining).toBeNull();
  });
});

describe('RESET_GAME', () => {
  it('clears board and sets phase to coin-flip, preserves players', () => {
    const state = makePlayingState({
      board: board(['X', 'O', 'X', null, null, null, null, null, null]),
      moveCount: 3,
      lastMove: 2,
    });
    const next = gameReducer(state, { type: 'RESET_GAME' });
    expect(next.board.every((c) => c === null)).toBe(true);
    expect(next.phase).toBe('coin-flip');
    expect(next.winResult).toBeNull();
    expect(next.moveCount).toBe(0);
    expect(next.lastMove).toBeNull();
    expect(next.turnTimeRemaining).toBeNull();
    // Players preserved
    expect(next.players[0].name).toBe('Alice');
    expect(next.players[1].name).toBe('Bob');
    expect(next.players[0].mark).toBe('X');
    expect(next.players[1].mark).toBe('O');
  });

  it('preserves player credits and wins after reset', () => {
    const state = makePlayingState({
      players: [
        { name: 'Alice', mark: 'X', credits: 50, wins: 2, activeSkin: 'acid-green', unlockedSkins: ['default', 'acid-green'] },
        { name: 'Bob', mark: 'O', credits: 25, wins: 1, activeSkin: 'default', unlockedSkins: ['default'] },
      ],
    });
    const next = gameReducer(state, { type: 'RESET_GAME' });
    expect(next.players[0].credits).toBe(50);
    expect(next.players[0].wins).toBe(2);
    expect(next.players[1].credits).toBe(25);
  });
});

describe('START_GAME', () => {
  it('sets players, overclockEnabled, and phase to coin-flip', () => {
    const state = createInitialGameState();
    const players: [PlayerData, PlayerData] = [
      { name: 'Neo', mark: 'X', credits: 0, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
      { name: 'Trinity', mark: 'O', credits: 0, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
    ];
    const next = gameReducer(state, { type: 'START_GAME', players, overclockEnabled: true });
    expect(next.phase).toBe('coin-flip');
    expect(next.players[0].name).toBe('Neo');
    expect(next.players[1].name).toBe('Trinity');
    expect(next.overclockEnabled).toBe(true);
  });

  it('sets overclockEnabled to false when not enabled', () => {
    const state = createInitialGameState();
    const players: [PlayerData, PlayerData] = [
      { name: 'A', mark: 'X', credits: 0, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
      { name: 'B', mark: 'O', credits: 0, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
    ];
    const next = gameReducer(state, { type: 'START_GAME', players, overclockEnabled: false });
    expect(next.overclockEnabled).toBe(false);
  });
});

describe('COIN_FLIP_COMPLETE', () => {
  it('sets current player and phase to playing', () => {
    const state = makePlayingState({ phase: 'coin-flip' });
    const next = gameReducer(state, { type: 'COIN_FLIP_COMPLETE', startingMark: 'O' });
    expect(next.currentPlayer).toBe('O');
    expect(next.phase).toBe('playing');
  });

  it('sets timer to 10 when overclock is enabled', () => {
    const state = makePlayingState({ phase: 'coin-flip', overclockEnabled: true });
    const next = gameReducer(state, { type: 'COIN_FLIP_COMPLETE', startingMark: 'X' });
    expect(next.turnTimeRemaining).toBe(10);
  });

  it('keeps timer null when overclock is disabled', () => {
    const state = makePlayingState({ phase: 'coin-flip', overclockEnabled: false });
    const next = gameReducer(state, { type: 'COIN_FLIP_COMPLETE', startingMark: 'X' });
    expect(next.turnTimeRemaining).toBeNull();
  });
});

describe('OVERCLOCK_TIMEOUT', () => {
  it('places mark in a random empty cell', () => {
    const state = makePlayingState({
      overclockEnabled: true,
      turnTimeRemaining: 0,
    });
    const next = gameReducer(state, { type: 'OVERCLOCK_TIMEOUT' });
    // One cell should now be filled
    const filledCount = next.board.filter((c) => c !== null).length;
    expect(filledCount).toBe(1);
    expect(next.moveCount).toBe(1);
  });

  it('does nothing when phase is not playing', () => {
    const state = makePlayingState({ phase: 'won' });
    const next = gameReducer(state, { type: 'OVERCLOCK_TIMEOUT' });
    expect(next).toBe(state);
  });

  it('does nothing when board is full', () => {
    const state = makePlayingState({
      board: board(['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X']),
      phase: 'playing',
    });
    const next = gameReducer(state, { type: 'OVERCLOCK_TIMEOUT' });
    expect(next).toBe(state);
  });
});

describe('TICK_TIMER', () => {
  it('decrements timer by 1', () => {
    const state = makePlayingState({
      overclockEnabled: true,
      turnTimeRemaining: 5,
    });
    const next = gameReducer(state, { type: 'TICK_TIMER' });
    expect(next.turnTimeRemaining).toBe(4);
  });

  it('triggers overclock timeout when timer reaches 0', () => {
    const state = makePlayingState({
      overclockEnabled: true,
      turnTimeRemaining: 1,
    });
    const next = gameReducer(state, { type: 'TICK_TIMER' });
    // Timer expired, so a random mark should be placed
    const filledCount = next.board.filter((c) => c !== null).length;
    expect(filledCount).toBe(1);
  });

  it('does nothing when overclock is disabled', () => {
    const state = makePlayingState({ overclockEnabled: false });
    const next = gameReducer(state, { type: 'TICK_TIMER' });
    expect(next).toBe(state);
  });

  it('does nothing when phase is not playing', () => {
    const state = makePlayingState({
      phase: 'won',
      overclockEnabled: true,
      turnTimeRemaining: 5,
    });
    const next = gameReducer(state, { type: 'TICK_TIMER' });
    expect(next).toBe(state);
  });

  it('does nothing when turnTimeRemaining is null', () => {
    const state = makePlayingState({
      overclockEnabled: true,
      turnTimeRemaining: null,
    });
    const next = gameReducer(state, { type: 'TICK_TIMER' });
    expect(next).toBe(state);
  });
});

describe('PURCHASE_SKIN', () => {
  it('deducts credits and updates skin for the correct player', () => {
    const state = makePlayingState({
      players: [
        { name: 'Alice', mark: 'X', credits: 100, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
        { name: 'Bob', mark: 'O', credits: 50, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
      ],
    });
    const next = gameReducer(state, { type: 'PURCHASE_SKIN', playerMark: 'X', skinId: 'acid-green' });
    const alice = next.players.find((p) => p.mark === 'X')!;
    expect(alice.credits).toBe(50); // 100 - 50
    expect(alice.activeSkin).toBe('acid-green');
    expect(alice.unlockedSkins).toContain('acid-green');
    // Bob unchanged
    const bob = next.players.find((p) => p.mark === 'O')!;
    expect(bob.credits).toBe(50);
  });

  it('does nothing when player has insufficient credits', () => {
    const state = makePlayingState({
      players: [
        { name: 'Alice', mark: 'X', credits: 10, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
        { name: 'Bob', mark: 'O', credits: 0, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
      ],
    });
    const next = gameReducer(state, { type: 'PURCHASE_SKIN', playerMark: 'X', skinId: 'hazard-orange' });
    // hazard-orange costs 75, Alice has 10 — should be unchanged
    expect(next).toBe(state);
  });

  it('does nothing for an invalid skin id', () => {
    const state = makePlayingState({
      players: [
        { name: 'Alice', mark: 'X', credits: 100, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
        { name: 'Bob', mark: 'O', credits: 0, wins: 0, activeSkin: 'default', unlockedSkins: ['default'] },
      ],
    });
    const next = gameReducer(state, { type: 'PURCHASE_SKIN', playerMark: 'X', skinId: 'nonexistent' as never });
    expect(next).toBe(state);
  });
});
