import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  awardCredits,
  purchaseSkin,
  getAvailableSkins,
  updateLeaderboard,
} from '../creditLogic';
import type { PlayerData, SkinId, LeaderboardEntry, Mark, Skin } from '../types';

// --- Generators ---

const markArb: fc.Arbitrary<Mark> = fc.constantFrom('X' as Mark, 'O' as Mark);

const skinIdArb: fc.Arbitrary<SkinId> = fc.constantFrom(
  'default' as SkinId,
  'acid-green' as SkinId,
  'synthwave-pink' as SkinId,
  'hazard-orange' as SkinId,
);

const playerDataArb: fc.Arbitrary<PlayerData> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  mark: markArb,
  credits: fc.nat({ max: 10000 }),
  wins: fc.nat({ max: 1000 }),
  activeSkin: skinIdArb,
  unlockedSkins: fc.uniqueArray(skinIdArb, { minLength: 1, maxLength: 4 }),
});

const leaderboardEntryArb: fc.Arbitrary<LeaderboardEntry> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  credits: fc.nat({ max: 10000 }),
  wins: fc.nat({ max: 1000 }),
  losses: fc.nat({ max: 1000 }),
  draws: fc.nat({ max: 1000 }),
  currentStreak: fc.nat({ max: 100 }),
  bestStreak: fc.nat({ max: 100 }),
});

// --- Property Tests ---

describe('creditLogic property tests', () => {
  // Feature: cyberpunk-tic-tac-toe, Property 10: Credit awarding increases balance
  it('Property 10: Credit awarding increases balance', () => {
    // **Validates: Requirements 7.1**
    fc.assert(
      fc.property(
        playerDataArb,
        fc.integer({ min: 1, max: 10000 }),
        (player, amount) => {
          const result = awardCredits(player, amount);

          // Credit balance equals original + award amount
          expect(result.credits).toBe(player.credits + amount);

          // All other fields remain unchanged
          expect(result.name).toBe(player.name);
          expect(result.mark).toBe(player.mark);
          expect(result.wins).toBe(player.wins);
          expect(result.activeSkin).toBe(player.activeSkin);
          expect(result.unlockedSkins).toEqual(player.unlockedSkins);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 11: Skin purchase deducts credits and unlocks skin
  it('Property 11: Skin purchase deducts credits and unlocks skin', () => {
    // **Validates: Requirements 7.4**
    const skins = getAvailableSkins();
    // Only non-free skins for meaningful purchase tests
    const purchasableSkins = skins.filter((s) => s.price > 0);

    fc.assert(
      fc.property(
        playerDataArb,
        fc.constantFrom(...purchasableSkins),
        (player, skin: Skin) => {
          // Ensure the skin is not already unlocked so we test the unlock path
          const cleanPlayer: PlayerData = {
            ...player,
            unlockedSkins: player.unlockedSkins.filter((id) => id !== skin.id),
          };

          if (cleanPlayer.credits >= skin.price) {
            // Sufficient credits case
            const result = purchaseSkin(cleanPlayer, skin);
            expect(result).not.toBeNull();
            expect(result!.credits).toBe(cleanPlayer.credits - skin.price);
            expect(result!.unlockedSkins).toContain(skin.id);
            expect(result!.activeSkin).toBe(skin.id);
          } else {
            // Insufficient credits case
            const result = purchaseSkin(cleanPlayer, skin);
            expect(result).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 12: Leaderboard maintains descending credit order after updates
  it('Property 12: Leaderboard maintains descending credit order after updates', () => {
    // **Validates: Requirements 8.1, 8.2**
    fc.assert(
      fc.property(
        fc.array(leaderboardEntryArb, { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.nat({ max: 500 }),
        fc.nat({ max: 100 }),
        (leaderboard, playerName, creditsEarned, winsEarned) => {
          const result = updateLeaderboard(leaderboard, playerName, creditsEarned, winsEarned);

          // Result is sorted in descending order by credits
          for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].credits).toBeGreaterThanOrEqual(result[i].credits);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
