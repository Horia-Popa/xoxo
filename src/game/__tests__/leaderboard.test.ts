import { describe, it, expect } from 'vitest';
import {
  createDefaultEntry,
  updateLeaderboardAfterWin,
  updateLeaderboardAfterDraw,
  resetLeaderboard,
  detectDethrone,
  sortLeaderboard,
} from '../creditLogic';
import type { LeaderboardEntry } from '../types';

const makeEntry = (overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry => ({
  name: 'Player',
  credits: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
  ...overrides,
});

describe('updateLeaderboardAfterWin', () => {
  it('increments winner wins and loser losses for new players', () => {
    const result = updateLeaderboardAfterWin([], 'Alice', 'Bob', 25);
    const alice = result.find((e) => e.name === 'Alice')!;
    const bob = result.find((e) => e.name === 'Bob')!;
    expect(alice.wins).toBe(1);
    expect(alice.credits).toBe(25);
    expect(bob.losses).toBe(1);
  });

  it('updates existing players rather than creating duplicates', () => {
    const lb: LeaderboardEntry[] = [
      makeEntry({ name: 'Alice', credits: 50, wins: 2 }),
      makeEntry({ name: 'Bob', credits: 30, wins: 1 }),
    ];
    const result = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 25);
    expect(result).toHaveLength(2);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.wins).toBe(3);
    expect(alice.credits).toBe(75);
  });

  it('increments winner currentStreak by 1', () => {
    const lb = [makeEntry({ name: 'Alice', currentStreak: 2, bestStreak: 2 })];
    const result = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.currentStreak).toBe(3);
  });

  it('updates bestStreak when currentStreak exceeds it', () => {
    const lb = [makeEntry({ name: 'Alice', currentStreak: 2, bestStreak: 2 })];
    const result = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.bestStreak).toBe(3);
  });

  it('preserves bestStreak when currentStreak does not exceed it', () => {
    const lb = [makeEntry({ name: 'Alice', currentStreak: 0, bestStreak: 5 })];
    const result = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.currentStreak).toBe(1);
    expect(alice.bestStreak).toBe(5);
  });

  it('resets loser currentStreak to 0', () => {
    const lb = [
      makeEntry({ name: 'Alice' }),
      makeEntry({ name: 'Bob', currentStreak: 3, bestStreak: 3 }),
    ];
    const result = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    const bob = result.find((e) => e.name === 'Bob')!;
    expect(bob.currentStreak).toBe(0);
    expect(bob.bestStreak).toBe(3);
  });

  it('does not modify other entries in the leaderboard', () => {
    const lb = [
      makeEntry({ name: 'Alice', credits: 100 }),
      makeEntry({ name: 'Bob', credits: 50 }),
      makeEntry({ name: 'Charlie', credits: 80, wins: 3 }),
    ];
    const result = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    const charlie = result.find((e) => e.name === 'Charlie')!;
    expect(charlie.credits).toBe(80);
    expect(charlie.wins).toBe(3);
  });
});

describe('updateLeaderboardAfterDraw', () => {
  it('increments draws for both players', () => {
    const lb = [
      makeEntry({ name: 'Alice' }),
      makeEntry({ name: 'Bob' }),
    ];
    const result = updateLeaderboardAfterDraw(lb, 'Alice', 'Bob');
    const alice = result.find((e) => e.name === 'Alice')!;
    const bob = result.find((e) => e.name === 'Bob')!;
    expect(alice.draws).toBe(1);
    expect(bob.draws).toBe(1);
  });

  it('resets both players currentStreak to 0', () => {
    const lb = [
      makeEntry({ name: 'Alice', currentStreak: 3 }),
      makeEntry({ name: 'Bob', currentStreak: 1 }),
    ];
    const result = updateLeaderboardAfterDraw(lb, 'Alice', 'Bob');
    const alice = result.find((e) => e.name === 'Alice')!;
    const bob = result.find((e) => e.name === 'Bob')!;
    expect(alice.currentStreak).toBe(0);
    expect(bob.currentStreak).toBe(0);
  });

  it('preserves bestStreak for both players', () => {
    const lb = [
      makeEntry({ name: 'Alice', currentStreak: 2, bestStreak: 5 }),
      makeEntry({ name: 'Bob', currentStreak: 1, bestStreak: 3 }),
    ];
    const result = updateLeaderboardAfterDraw(lb, 'Alice', 'Bob');
    const alice = result.find((e) => e.name === 'Alice')!;
    const bob = result.find((e) => e.name === 'Bob')!;
    expect(alice.bestStreak).toBe(5);
    expect(bob.bestStreak).toBe(3);
  });

  it('creates new entries for players not in leaderboard', () => {
    const result = updateLeaderboardAfterDraw([], 'Alice', 'Bob');
    expect(result).toHaveLength(2);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.draws).toBe(1);
    expect(alice.currentStreak).toBe(0);
  });
});

describe('streak edge cases', () => {
  it('first win sets streak from 0 to 1', () => {
    const result = updateLeaderboardAfterWin([], 'Alice', 'Bob', 10);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.currentStreak).toBe(1);
    expect(alice.bestStreak).toBe(1);
  });

  it('streak broken by loss resets to 0', () => {
    const lb = [makeEntry({ name: 'Alice', currentStreak: 4, bestStreak: 4 })];
    const result = updateLeaderboardAfterWin(lb, 'Bob', 'Alice', 10);
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.currentStreak).toBe(0);
    expect(alice.bestStreak).toBe(4);
  });

  it('streak broken by draw resets to 0', () => {
    const lb = [
      makeEntry({ name: 'Alice', currentStreak: 3, bestStreak: 3 }),
      makeEntry({ name: 'Bob' }),
    ];
    const result = updateLeaderboardAfterDraw(lb, 'Alice', 'Bob');
    const alice = result.find((e) => e.name === 'Alice')!;
    expect(alice.currentStreak).toBe(0);
    expect(alice.bestStreak).toBe(3);
  });

  it('consecutive wins build streak correctly', () => {
    let lb: LeaderboardEntry[] = [];
    lb = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    lb = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    lb = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    const alice = lb.find((e) => e.name === 'Alice')!;
    expect(alice.currentStreak).toBe(3);
    expect(alice.bestStreak).toBe(3);
  });

  it('bestStreak preserved when currentStreak resets and rebuilds', () => {
    let lb: LeaderboardEntry[] = [];
    lb = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    lb = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    lb = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    // Alice has streak 3, bestStreak 3
    lb = updateLeaderboardAfterWin(lb, 'Bob', 'Alice', 10);
    // Alice loses, streak resets
    lb = updateLeaderboardAfterWin(lb, 'Alice', 'Bob', 10);
    const alice = lb.find((e) => e.name === 'Alice')!;
    expect(alice.currentStreak).toBe(1);
    expect(alice.bestStreak).toBe(3);
  });
});

describe('detectDethrone', () => {
  it('returns dethroned false for empty leaderboard', () => {
    const result = detectDethrone('Alice', []);
    expect(result).toEqual({ dethroned: false, oldLeader: 'Alice', newLeader: null });
  });

  it('returns dethroned false when previousLeader is null (first game)', () => {
    const lb = [makeEntry({ name: 'Alice', credits: 25 })];
    const result = detectDethrone(null, lb);
    expect(result).toEqual({ dethroned: false, oldLeader: null, newLeader: 'Alice' });
  });

  it('returns dethroned false when same leader stays on top', () => {
    const lb = [
      makeEntry({ name: 'Alice', credits: 100 }),
      makeEntry({ name: 'Bob', credits: 50 }),
    ];
    const result = detectDethrone('Alice', lb);
    expect(result).toEqual({ dethroned: false, oldLeader: 'Alice', newLeader: 'Alice' });
  });

  it('returns dethroned true when a different player takes over', () => {
    const lb = [
      makeEntry({ name: 'Bob', credits: 150 }),
      makeEntry({ name: 'Alice', credits: 100 }),
    ];
    const result = detectDethrone('Alice', lb);
    expect(result).toEqual({ dethroned: true, oldLeader: 'Alice', newLeader: 'Bob' });
  });

  it('handles single entry with no previous leader', () => {
    const lb = [makeEntry({ name: 'Neo', credits: 10 })];
    const result = detectDethrone(null, lb);
    expect(result.dethroned).toBe(false);
    expect(result.newLeader).toBe('Neo');
  });
});

describe('resetLeaderboard', () => {
  it('returns an empty array', () => {
    const result = resetLeaderboard();
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });
});

describe('sortLeaderboard', () => {
  it('sorts by credits descending', () => {
    const lb = [
      makeEntry({ name: 'Alice', credits: 50 }),
      makeEntry({ name: 'Bob', credits: 100 }),
      makeEntry({ name: 'Charlie', credits: 75 }),
    ];
    const result = sortLeaderboard(lb);
    expect(result.map((e) => e.name)).toEqual(['Bob', 'Charlie', 'Alice']);
  });

  it('uses wins as tiebreaker when credits are equal', () => {
    const lb = [
      makeEntry({ name: 'Alice', credits: 100, wins: 3 }),
      makeEntry({ name: 'Bob', credits: 100, wins: 5 }),
      makeEntry({ name: 'Charlie', credits: 100, wins: 4 }),
    ];
    const result = sortLeaderboard(lb);
    expect(result.map((e) => e.name)).toEqual(['Bob', 'Charlie', 'Alice']);
  });

  it('does not mutate the original array', () => {
    const lb = [
      makeEntry({ name: 'Alice', credits: 50 }),
      makeEntry({ name: 'Bob', credits: 100 }),
    ];
    const result = sortLeaderboard(lb);
    expect(lb[0].name).toBe('Alice');
    expect(result[0].name).toBe('Bob');
    expect(result).not.toBe(lb);
  });
});
