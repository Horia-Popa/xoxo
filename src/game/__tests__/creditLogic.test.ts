import { describe, it, expect } from 'vitest';
import {
  awardCredits,
  purchaseSkin,
  canAffordSkin,
  getAvailableSkins,
  updateLeaderboard,
} from '../creditLogic';
import type { PlayerData, Skin, LeaderboardEntry } from '../types';

// Helper to build a test PlayerData object
const makePlayer = (overrides: Partial<PlayerData> = {}): PlayerData => ({
  name: 'TestPlayer',
  mark: 'X',
  credits: 100,
  wins: 0,
  activeSkin: 'default',
  unlockedSkins: ['default'],
  ...overrides,
});

describe('awardCredits', () => {
  it('increases balance by the exact amount', () => {
    const player = makePlayer({ credits: 50 });
    const result = awardCredits(player, 25);
    expect(result.credits).toBe(75);
  });

  it('works with zero starting balance', () => {
    const player = makePlayer({ credits: 0 });
    const result = awardCredits(player, 25);
    expect(result.credits).toBe(25);
  });

  it('preserves all other player fields', () => {
    const player = makePlayer({ name: 'Neo', mark: 'O', wins: 3 });
    const result = awardCredits(player, 10);
    expect(result.name).toBe('Neo');
    expect(result.mark).toBe('O');
    expect(result.wins).toBe(3);
    expect(result.activeSkin).toBe('default');
    expect(result.unlockedSkins).toEqual(['default']);
  });
});

describe('purchaseSkin', () => {
  const acidGreen: Skin = { id: 'acid-green', name: 'Acid Green', color: '#39ff14', price: 50 };
  const hazardOrange: Skin = { id: 'hazard-orange', name: 'Hazard Orange', color: '#ff6600', price: 75 };

  it('deducts credits and adds skin to unlocked list', () => {
    const player = makePlayer({ credits: 100 });
    const result = purchaseSkin(player, acidGreen);
    expect(result).not.toBeNull();
    expect(result!.credits).toBe(50);
    expect(result!.unlockedSkins).toContain('acid-green');
    expect(result!.activeSkin).toBe('acid-green');
  });

  it('returns null when credits are insufficient', () => {
    const player = makePlayer({ credits: 30 });
    const result = purchaseSkin(player, acidGreen);
    expect(result).toBeNull();
  });

  it('returns null when credits exactly one short', () => {
    const player = makePlayer({ credits: 74 });
    const result = purchaseSkin(player, hazardOrange);
    expect(result).toBeNull();
  });

  it('succeeds when credits exactly match the price', () => {
    const player = makePlayer({ credits: 50 });
    const result = purchaseSkin(player, acidGreen);
    expect(result).not.toBeNull();
    expect(result!.credits).toBe(0);
  });

  it('does not duplicate skin in unlocked list if already owned', () => {
    const player = makePlayer({ credits: 100, unlockedSkins: ['default', 'acid-green'] });
    const result = purchaseSkin(player, acidGreen);
    expect(result).not.toBeNull();
    const count = result!.unlockedSkins.filter((s) => s === 'acid-green').length;
    expect(count).toBe(1);
  });

  it('sets the purchased skin as active', () => {
    const player = makePlayer({ credits: 100, activeSkin: 'default' });
    const result = purchaseSkin(player, hazardOrange);
    expect(result).not.toBeNull();
    expect(result!.activeSkin).toBe('hazard-orange');
  });
});

describe('canAffordSkin', () => {
  const acidGreen: Skin = { id: 'acid-green', name: 'Acid Green', color: '#39ff14', price: 50 };

  it('returns true when player has more credits than price', () => {
    const player = makePlayer({ credits: 100 });
    expect(canAffordSkin(player, acidGreen)).toBe(true);
  });

  it('returns true when player has exactly enough credits', () => {
    const player = makePlayer({ credits: 50 });
    expect(canAffordSkin(player, acidGreen)).toBe(true);
  });

  it('returns false when player has fewer credits than price', () => {
    const player = makePlayer({ credits: 49 });
    expect(canAffordSkin(player, acidGreen)).toBe(false);
  });

  it('returns true for a free skin with zero credits', () => {
    const freeSkin: Skin = { id: 'default', name: 'Default', color: '#00ffff', price: 0 };
    const player = makePlayer({ credits: 0 });
    expect(canAffordSkin(player, freeSkin)).toBe(true);
  });
});

describe('getAvailableSkins', () => {
  it('returns at least 3 skins', () => {
    const skins = getAvailableSkins();
    expect(skins.length).toBeGreaterThanOrEqual(3);
  });

  it('includes Acid Green, Synthwave Pink, and Hazard Orange', () => {
    const skins = getAvailableSkins();
    const names = skins.map((s) => s.name);
    expect(names).toContain('Acid Green');
    expect(names).toContain('Synthwave Pink');
    expect(names).toContain('Hazard Orange');
  });

  it('includes a default skin with price 0', () => {
    const skins = getAvailableSkins();
    const defaultSkin = skins.find((s) => s.id === 'default');
    expect(defaultSkin).toBeDefined();
    expect(defaultSkin!.price).toBe(0);
  });

  it('returns a new array each call (no shared mutation)', () => {
    const a = getAvailableSkins();
    const b = getAvailableSkins();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('updateLeaderboard', () => {
  const defaultStats = { losses: 0, draws: 0, currentStreak: 0, bestStreak: 0 };

  it('adds a new entry and sorts by credits descending', () => {
    const lb: LeaderboardEntry[] = [
      { name: 'Alice', credits: 100, wins: 4, ...defaultStats },
    ];
    const result = updateLeaderboard(lb, 'Bob', 150, 6);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Bob');
    expect(result[0].credits).toBe(150);
    expect(result[0].wins).toBe(6);
    expect(result[1].name).toBe('Alice');
  });

  it('updates an existing entry and re-sorts', () => {
    const lb: LeaderboardEntry[] = [
      { name: 'Alice', credits: 100, wins: 4, ...defaultStats },
      { name: 'Bob', credits: 50, wins: 2, ...defaultStats },
    ];
    const result = updateLeaderboard(lb, 'Bob', 75, 3);
    // Bob now has 125 credits, should be first
    expect(result[0].name).toBe('Bob');
    expect(result[0].credits).toBe(125);
    expect(result[0].wins).toBe(5);
    expect(result[1].name).toBe('Alice');
  });

  it('adds a new entry to an empty leaderboard', () => {
    const result = updateLeaderboard([], 'Neo', 25, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ name: 'Neo', credits: 25, wins: 1, ...defaultStats });
  });

  it('maintains sort order when existing entry stays in same position', () => {
    const lb: LeaderboardEntry[] = [
      { name: 'Alice', credits: 200, wins: 8, ...defaultStats },
      { name: 'Bob', credits: 100, wins: 4, ...defaultStats },
    ];
    const result = updateLeaderboard(lb, 'Alice', 25, 1);
    expect(result[0].name).toBe('Alice');
    expect(result[0].credits).toBe(225);
    expect(result[1].name).toBe('Bob');
  });
});
