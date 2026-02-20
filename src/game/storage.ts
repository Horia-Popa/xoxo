import type { PersistentState } from './types';

const STORAGE_KEY = 'xoxo-game-state';

const VALID_SKIN_IDS: readonly string[] = ['default', 'acid-green', 'synthwave-pink', 'hazard-orange'];

export const getDefaultState = (): PersistentState => ({
  leaderboard: [],
  playerSkins: {},
});

export const serializeGameState = (state: PersistentState): string =>
  JSON.stringify(state);

export const deserializeGameState = (json: string): PersistentState | null => {
  try {
    const parsed = JSON.parse(json);

    if (typeof parsed !== 'object' || parsed === null) return null;
    if (!Array.isArray(parsed.leaderboard)) return null;
    if (typeof parsed.playerSkins !== 'object' || parsed.playerSkins === null || Array.isArray(parsed.playerSkins)) return null;

    const migratedLeaderboard: Array<Record<string, unknown>> = [];
    for (const entry of parsed.leaderboard) {
      if (typeof entry !== 'object' || entry === null) return null;
      if (typeof entry.name !== 'string') return null;
      if (typeof entry.credits !== 'number') return null;
      if (typeof entry.wins !== 'number') return null;

      const numericDefaults = ['losses', 'draws', 'currentStreak', 'bestStreak'] as const;
      for (const field of numericDefaults) {
        if (field in entry) {
          if (typeof entry[field] !== 'number') return null;
        }
      }

      migratedLeaderboard.push({
        name: entry.name,
        credits: entry.credits,
        wins: entry.wins,
        losses: typeof entry.losses === 'number' ? entry.losses : 0,
        draws: typeof entry.draws === 'number' ? entry.draws : 0,
        currentStreak: typeof entry.currentStreak === 'number' ? entry.currentStreak : 0,
        bestStreak: typeof entry.bestStreak === 'number' ? entry.bestStreak : 0,
      });
    }

    for (const [, skinData] of Object.entries(parsed.playerSkins)) {
      if (typeof skinData !== 'object' || skinData === null) return null;
      const sd = skinData as Record<string, unknown>;
      if (typeof sd.activeSkin !== 'string' || !VALID_SKIN_IDS.includes(sd.activeSkin)) return null;
      if (!Array.isArray(sd.unlockedSkins)) return null;
      for (const s of sd.unlockedSkins) {
        if (typeof s !== 'string' || !VALID_SKIN_IDS.includes(s)) return null;
      }
    }

    return {
      leaderboard: migratedLeaderboard,
      playerSkins: parsed.playerSkins,
    } as unknown as PersistentState;
  } catch {
    return null;
  }
};

export const saveState = (state: PersistentState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, serializeGameState(state));
  } catch {
    // localStorage unavailable or full — silently fail
  }
};

export const loadState = (): PersistentState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return getDefaultState();
    const state = deserializeGameState(raw);
    return state ?? getDefaultState();
  } catch {
    return getDefaultState();
  }
};
