import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PersistentState } from '../types';
import {
  serializeGameState,
  deserializeGameState,
  saveState,
  loadState,
  getDefaultState,
} from '../storage';

// --- localStorage mock ---
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

beforeEach(() => {
  localStorageMock.clear();
  vi.stubGlobal('localStorage', localStorageMock);
});

const validState: PersistentState = {
  leaderboard: [
    { name: 'Alice', credits: 100, wins: 4, losses: 1, draws: 0, currentStreak: 2, bestStreak: 3 },
    { name: 'Bob', credits: 50, wins: 2, losses: 3, draws: 1, currentStreak: 0, bestStreak: 1 },
  ],
  playerSkins: {
    Alice: { activeSkin: 'acid-green', unlockedSkins: ['default', 'acid-green'] },
    Bob: { activeSkin: 'default', unlockedSkins: ['default'] },
  },
};

describe('serializeGameState', () => {
  it('produces valid JSON', () => {
    const json = serializeGameState(validState);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('serializes an empty default state', () => {
    const json = serializeGameState(getDefaultState());
    const parsed = JSON.parse(json);
    expect(parsed).toEqual({ leaderboard: [], playerSkins: {} });
  });
});

describe('deserializeGameState', () => {
  it('returns correct state for valid JSON', () => {
    const json = serializeGameState(validState);
    const result = deserializeGameState(json);
    expect(result).toEqual(validState);
  });

  it('returns null for invalid JSON', () => {
    expect(deserializeGameState('not json at all')).toBeNull();
    expect(deserializeGameState('{broken')).toBeNull();
    expect(deserializeGameState('')).toBeNull();
  });

  it('returns null when top-level is not an object', () => {
    expect(deserializeGameState('"hello"')).toBeNull();
    expect(deserializeGameState('42')).toBeNull();
    expect(deserializeGameState('null')).toBeNull();
    expect(deserializeGameState('true')).toBeNull();
  });

  it('returns null when leaderboard is missing or not an array', () => {
    expect(deserializeGameState(JSON.stringify({ playerSkins: {} }))).toBeNull();
    expect(deserializeGameState(JSON.stringify({ leaderboard: 'nope', playerSkins: {} }))).toBeNull();
  });

  it('returns null when playerSkins is missing or not an object', () => {
    expect(deserializeGameState(JSON.stringify({ leaderboard: [] }))).toBeNull();
    expect(deserializeGameState(JSON.stringify({ leaderboard: [], playerSkins: 'bad' }))).toBeNull();
    expect(deserializeGameState(JSON.stringify({ leaderboard: [], playerSkins: [1, 2] }))).toBeNull();
  });

  it('returns null when leaderboard entry has wrong types', () => {
    const bad1 = { leaderboard: [{ name: 123, credits: 0, wins: 0 }], playerSkins: {} };
    const bad2 = { leaderboard: [{ name: 'A', credits: 'x', wins: 0 }], playerSkins: {} };
    const bad3 = { leaderboard: [{ name: 'A', credits: 0, wins: null }], playerSkins: {} };
    expect(deserializeGameState(JSON.stringify(bad1))).toBeNull();
    expect(deserializeGameState(JSON.stringify(bad2))).toBeNull();
    expect(deserializeGameState(JSON.stringify(bad3))).toBeNull();
  });

  it('returns null when skin data has invalid activeSkin', () => {
    const bad = {
      leaderboard: [],
      playerSkins: { P1: { activeSkin: 'neon-blue', unlockedSkins: ['default'] } },
    };
    expect(deserializeGameState(JSON.stringify(bad))).toBeNull();
  });

  it('returns null when skin data has invalid unlockedSkins entries', () => {
    const bad = {
      leaderboard: [],
      playerSkins: { P1: { activeSkin: 'default', unlockedSkins: ['default', 'invalid-skin'] } },
    };
    expect(deserializeGameState(JSON.stringify(bad))).toBeNull();
  });

  it('returns null when skin data is missing fields', () => {
    const bad = {
      leaderboard: [],
      playerSkins: { P1: { activeSkin: 'default' } },
    };
    expect(deserializeGameState(JSON.stringify(bad))).toBeNull();
  });
});

describe('loadState', () => {
  it('returns default state when localStorage is empty', () => {
    expect(loadState()).toEqual(getDefaultState());
  });

  it('returns default state when localStorage contains invalid JSON', () => {
    store['xoxo-game-state'] = 'garbage{{{';
    expect(loadState()).toEqual(getDefaultState());
  });

  it('returns default state when localStorage contains malformed schema', () => {
    store['xoxo-game-state'] = JSON.stringify({ wrong: true });
    expect(loadState()).toEqual(getDefaultState());
  });
});

describe('saveState and loadState round-trip', () => {
  it('round-trips a known state through localStorage', () => {
    saveState(validState);
    const loaded = loadState();
    expect(loaded).toEqual(validState);
  });

  it('round-trips the default empty state', () => {
    const defaultState = getDefaultState();
    saveState(defaultState);
    expect(loadState()).toEqual(defaultState);
  });
});

describe('migration', () => {
  it('migrates old format entry (only name, credits, wins) with defaults', () => {
    const oldFormat = {
      leaderboard: [{ name: 'OldPlayer', credits: 80, wins: 5 }],
      playerSkins: {},
    };
    const result = deserializeGameState(JSON.stringify(oldFormat));
    expect(result).not.toBeNull();
    expect(result!.leaderboard).toHaveLength(1);
    expect(result!.leaderboard[0]).toEqual({
      name: 'OldPlayer',
      credits: 80,
      wins: 5,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0,
    });
  });

  it('preserves all new fields when they are valid numbers', () => {
    const fullEntry = {
      leaderboard: [
        { name: 'FullPlayer', credits: 200, wins: 10, losses: 3, draws: 2, currentStreak: 4, bestStreak: 6 },
      ],
      playerSkins: {},
    };
    const result = deserializeGameState(JSON.stringify(fullEntry));
    expect(result).not.toBeNull();
    expect(result!.leaderboard[0]).toEqual({
      name: 'FullPlayer',
      credits: 200,
      wins: 10,
      losses: 3,
      draws: 2,
      currentStreak: 4,
      bestStreak: 6,
    });
  });

  it('defaults only the missing new fields when some are present', () => {
    const partial = {
      leaderboard: [
        { name: 'Partial', credits: 50, wins: 3, losses: 1, bestStreak: 2 },
      ],
      playerSkins: {},
    };
    const result = deserializeGameState(JSON.stringify(partial));
    expect(result).not.toBeNull();
    expect(result!.leaderboard[0]).toEqual({
      name: 'Partial',
      credits: 50,
      wins: 3,
      losses: 1,
      draws: 0,
      currentStreak: 0,
      bestStreak: 2,
    });
  });

  it('returns null when a new field has wrong type', () => {
    const badLosses = {
      leaderboard: [
        { name: 'Bad', credits: 10, wins: 1, losses: 'bad' },
      ],
      playerSkins: {},
    };
    expect(deserializeGameState(JSON.stringify(badLosses))).toBeNull();

    const badDraws = {
      leaderboard: [
        { name: 'Bad', credits: 10, wins: 1, draws: true },
      ],
      playerSkins: {},
    };
    expect(deserializeGameState(JSON.stringify(badDraws))).toBeNull();

    const badStreak = {
      leaderboard: [
        { name: 'Bad', credits: 10, wins: 1, currentStreak: null },
      ],
      playerSkins: {},
    };
    expect(deserializeGameState(JSON.stringify(badStreak))).toBeNull();

    const badBest = {
      leaderboard: [
        { name: 'Bad', credits: 10, wins: 1, bestStreak: [1] },
      ],
      playerSkins: {},
    };
    expect(deserializeGameState(JSON.stringify(badBest))).toBeNull();
  });

  it('round-trips through saveState/loadState with migrated old entries', () => {
    store['xoxo-game-state'] = JSON.stringify({
      leaderboard: [
        { name: 'Legacy', credits: 40, wins: 2 },
      ],
      playerSkins: {},
    });
    const loaded = loadState();
    expect(loaded.leaderboard[0]).toEqual({
      name: 'Legacy',
      credits: 40,
      wins: 2,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      bestStreak: 0,
    });
  });
});
