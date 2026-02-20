import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { serializeGameState, deserializeGameState } from '../storage';
import type { PersistentState, SkinId, LeaderboardEntry } from '../types';

// --- Generators ---

const skinIdArb: fc.Arbitrary<SkinId> = fc.constantFrom(
  'default' as SkinId,
  'acid-green' as SkinId,
  'synthwave-pink' as SkinId,
  'hazard-orange' as SkinId,
);

const leaderboardEntryArb: fc.Arbitrary<LeaderboardEntry> = fc.record({
  name: fc.string({ minLength: 0, maxLength: 30 }),
  credits: fc.nat({ max: 100000 }),
  wins: fc.nat({ max: 10000 }),
  losses: fc.nat({ max: 10000 }),
  draws: fc.nat({ max: 10000 }),
  currentStreak: fc.nat({ max: 1000 }),
  bestStreak: fc.nat({ max: 1000 }),
});

const playerSkinEntryArb = fc.record({
  activeSkin: skinIdArb,
  unlockedSkins: fc.uniqueArray(skinIdArb, { minLength: 1, maxLength: 4 }),
});

const persistentStateArb: fc.Arbitrary<PersistentState> = fc.record({
  leaderboard: fc.array(leaderboardEntryArb, { minLength: 0, maxLength: 20 }),
  playerSkins: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    playerSkinEntryArb,
  ),
});

// --- Property Tests ---

describe('storage property tests', () => {
  // Feature: cyberpunk-tic-tac-toe, Property 13: Serialization round-trip
  it('Property 13: Serialization round-trip', () => {
    // **Validates: Requirements 12.4**
    fc.assert(
      fc.property(persistentStateArb, (state) => {
        const serialized = serializeGameState(state);
        const deserialized = deserializeGameState(serialized);

        expect(deserialized).not.toBeNull();
        expect(deserialized).toEqual(state);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: leaderboard, Property 6: Serialization round-trip
  it('Property 6: Serialization round-trip (extended LeaderboardEntry)', () => {
    // **Validates: Requirements 4.4**
    fc.assert(
      fc.property(persistentStateArb, (state) => {
        const serialized = serializeGameState(state);
        const deserialized = deserializeGameState(serialized);

        expect(deserialized).not.toBeNull();

        // Verify each leaderboard entry preserves all extended fields
        for (let i = 0; i < state.leaderboard.length; i++) {
          const original = state.leaderboard[i];
          const restored = deserialized!.leaderboard[i];
          expect(restored.name).toBe(original.name);
          expect(restored.credits).toBe(original.credits);
          expect(restored.wins).toBe(original.wins);
          expect(restored.losses).toBe(original.losses);
          expect(restored.draws).toBe(original.draws);
          expect(restored.currentStreak).toBe(original.currentStreak);
          expect(restored.bestStreak).toBe(original.bestStreak);
        }

        expect(deserialized!.playerSkins).toEqual(state.playerSkins);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: leaderboard, Property 7: Corrupted data handling
  it('Property 7: Corrupted data handling (extended fields)', () => {
    // **Validates: Requirements 4.3**
    fc.assert(
      fc.property(
        fc.oneof(
          // Entries where losses is wrong type
          fc.record({
            leaderboard: fc.constant([{ name: 'P1', credits: 10, wins: 1, losses: 'bad', draws: 0, currentStreak: 0, bestStreak: 0 }]),
            playerSkins: fc.constant({}),
          }).map((o) => JSON.stringify(o)),
          // Entries where draws is wrong type
          fc.record({
            leaderboard: fc.constant([{ name: 'P1', credits: 10, wins: 1, losses: 0, draws: true, currentStreak: 0, bestStreak: 0 }]),
            playerSkins: fc.constant({}),
          }).map((o) => JSON.stringify(o)),
          // Entries where currentStreak is wrong type
          fc.record({
            leaderboard: fc.constant([{ name: 'P1', credits: 10, wins: 1, losses: 0, draws: 0, currentStreak: null, bestStreak: 0 }]),
            playerSkins: fc.constant({}),
          }).map((o) => JSON.stringify(o)),
          // Entries where bestStreak is wrong type
          fc.record({
            leaderboard: fc.constant([{ name: 'P1', credits: 10, wins: 1, losses: 0, draws: 0, currentStreak: 0, bestStreak: [1, 2] }]),
            playerSkins: fc.constant({}),
          }).map((o) => JSON.stringify(o)),
          // Multiple new fields with wrong types
          fc.record({
            leaderboard: fc.constant([{ name: 'P1', credits: 10, wins: 1, losses: 'x', draws: false, currentStreak: 'y', bestStreak: {} }]),
            playerSkins: fc.constant({}),
          }).map((o) => JSON.stringify(o)),
          // Random non-number types for new fields via generator
          fc.record({
            leaderboard: fc.tuple(
              fc.oneof(fc.string(), fc.boolean(), fc.constant(null), fc.array(fc.nat(), { maxLength: 2 })),
              fc.oneof(fc.string(), fc.boolean(), fc.constant(null), fc.array(fc.nat(), { maxLength: 2 })),
              fc.oneof(fc.string(), fc.boolean(), fc.constant(null), fc.array(fc.nat(), { maxLength: 2 })),
              fc.oneof(fc.string(), fc.boolean(), fc.constant(null), fc.array(fc.nat(), { maxLength: 2 })),
            ).map(([l, d, cs, bs]) => [{ name: 'P1', credits: 10, wins: 1, losses: l, draws: d, currentStreak: cs, bestStreak: bs }]),
            playerSkins: fc.constant({}),
          }).map((o) => JSON.stringify(o)),
        ),
        (corrupted) => {
          const result = deserializeGameState(corrupted);
          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 14: Corrupted data produces default state
  it('Property 14: Corrupted data produces default state', () => {
    // **Validates: Requirements 12.5**
    fc.assert(
      fc.property(
        fc.oneof(
          // Arbitrary strings — unlikely to be valid PersistentState JSON
          fc.string(),
          // Valid JSON but wrong types: numbers, booleans, arrays, strings
          fc.nat().map((n) => JSON.stringify(n)),
          fc.boolean().map((b) => JSON.stringify(b)),
          fc.constant('null'),
          fc.array(fc.anything(), { maxLength: 5 }).map((a) => JSON.stringify(a)),
          // Objects missing required fields
          fc.record({ foo: fc.string() }).map((o) => JSON.stringify(o)),
          // Objects with leaderboard but wrong playerSkins type
          fc.record({
            leaderboard: fc.constant([]),
            playerSkins: fc.oneof(
              fc.string(),
              fc.nat(),
              fc.constant(null),
              fc.array(fc.anything(), { maxLength: 3 }),
            ),
          }).map((o) => JSON.stringify(o)),
          // Objects with invalid leaderboard entries
          fc.record({
            leaderboard: fc.constant([{ name: 123, credits: 'bad', wins: null }]),
            playerSkins: fc.constant({}),
          }).map((o) => JSON.stringify(o)),
          // Objects with invalid skin IDs
          fc.record({
            leaderboard: fc.constant([]),
            playerSkins: fc.constant({
              Player1: { activeSkin: 'neon-blue', unlockedSkins: ['invalid'] },
            }),
          }).map((o) => JSON.stringify(o)),
        ),
        (corrupted) => {
          const result = deserializeGameState(corrupted);
          expect(result).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
