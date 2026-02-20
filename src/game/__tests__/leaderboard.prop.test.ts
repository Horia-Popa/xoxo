import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  updateLeaderboardAfterWin,
  updateLeaderboardAfterDraw,
  resetLeaderboard,
  detectDethrone,
  sortLeaderboard,
} from '../creditLogic';
import type { LeaderboardEntry } from '../types';

// --- Generators ---

const leaderboardEntryArb: fc.Arbitrary<LeaderboardEntry> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 20 }),
  credits: fc.nat({ max: 10000 }),
  wins: fc.nat({ max: 1000 }),
  losses: fc.nat({ max: 1000 }),
  draws: fc.nat({ max: 1000 }),
  currentStreak: fc.nat({ max: 100 }),
  bestStreak: fc.nat({ max: 100 }),
});

const uniqueLeaderboardArb = fc.uniqueArray(leaderboardEntryArb, {
  comparator: (a, b) => a.name === b.name,
  minLength: 0,
  maxLength: 10,
});

/** Generate a unique leaderboard + two distinct player names not in the leaderboard */
const leaderboardWithTwoDistinctNames = uniqueLeaderboardArb.chain((board) => {
  const existingNames = new Set(board.map((e) => e.name));
  const freshName = fc.string({ minLength: 1, maxLength: 20 }).filter(
    (n) => !existingNames.has(n),
  );
  return freshName.chain((name1) =>
    fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((n) => n !== name1 && !existingNames.has(n))
      .map((name2) => ({ board, name1, name2 })),
  );
});

// --- Property Tests ---

describe('leaderboard property tests', () => {
  // Feature: leaderboard, Property 1: Win update correctness
  // **Validates: Requirements 2.2, 2.4, 2.6**
  it('Property 1: Win update correctness', () => {
    fc.assert(
      fc.property(
        leaderboardWithTwoDistinctNames,
        fc.nat({ max: 500 }),
        ({ board, name1: winnerName, name2: loserName }, creditsEarned) => {
          const oldWinner = board.find((e) => e.name === winnerName);
          const oldLoser = board.find((e) => e.name === loserName);

          const result = updateLeaderboardAfterWin(board, winnerName, loserName, creditsEarned);

          const newWinner = result.find((e) => e.name === winnerName)!;
          const newLoser = result.find((e) => e.name === loserName)!;

          // Winner's wins incremented by 1
          const expectedWins = (oldWinner?.wins ?? 0) + 1;
          expect(newWinner.wins).toBe(expectedWins);

          // Winner's currentStreak incremented by 1
          const expectedStreak = (oldWinner?.currentStreak ?? 0) + 1;
          expect(newWinner.currentStreak).toBe(expectedStreak);

          // Winner's bestStreak = max(old bestStreak, new currentStreak)
          const expectedBest = Math.max(oldWinner?.bestStreak ?? 0, expectedStreak);
          expect(newWinner.bestStreak).toBe(expectedBest);

          // Winner's credits increased by creditsEarned
          expect(newWinner.credits).toBe((oldWinner?.credits ?? 0) + creditsEarned);

          // Loser's losses incremented by 1
          expect(newLoser.losses).toBe((oldLoser?.losses ?? 0) + 1);

          // Loser's currentStreak reset to 0
          expect(newLoser.currentStreak).toBe(0);

          // All other entries unchanged
          const otherOld = board.filter((e) => e.name !== winnerName && e.name !== loserName);
          const otherNew = result.filter((e) => e.name !== winnerName && e.name !== loserName);
          expect(otherNew.length).toBe(otherOld.length);
          for (const oldEntry of otherOld) {
            const match = otherNew.find((e) => e.name === oldEntry.name);
            expect(match).toEqual(oldEntry);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: leaderboard, Property 2: Draw update correctness
  // **Validates: Requirements 2.3, 2.5, 2.6**
  it('Property 2: Draw update correctness', () => {
    fc.assert(
      fc.property(
        leaderboardWithTwoDistinctNames,
        ({ board, name1: player1Name, name2: player2Name }) => {
          const oldP1 = board.find((e) => e.name === player1Name);
          const oldP2 = board.find((e) => e.name === player2Name);

          const result = updateLeaderboardAfterDraw(board, player1Name, player2Name);

          const newP1 = result.find((e) => e.name === player1Name)!;
          const newP2 = result.find((e) => e.name === player2Name)!;

          // Both players' draws incremented by 1
          expect(newP1.draws).toBe((oldP1?.draws ?? 0) + 1);
          expect(newP2.draws).toBe((oldP2?.draws ?? 0) + 1);

          // Both players' currentStreak reset to 0
          expect(newP1.currentStreak).toBe(0);
          expect(newP2.currentStreak).toBe(0);

          // Both players' bestStreak unchanged
          expect(newP1.bestStreak).toBe(oldP1?.bestStreak ?? 0);
          expect(newP2.bestStreak).toBe(oldP2?.bestStreak ?? 0);

          // All other entries unchanged
          const otherOld = board.filter((e) => e.name !== player1Name && e.name !== player2Name);
          const otherNew = result.filter((e) => e.name !== player1Name && e.name !== player2Name);
          expect(otherNew.length).toBe(otherOld.length);
          for (const oldEntry of otherOld) {
            const match = otherNew.find((e) => e.name === oldEntry.name);
            expect(match).toEqual(oldEntry);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: leaderboard, Property 3: Entry uniqueness invariant
  // **Validates: Requirements 3.2, 3.3**
  it('Property 3: Entry uniqueness invariant', () => {
    fc.assert(
      fc.property(
        leaderboardWithTwoDistinctNames,
        fc.boolean(),
        fc.nat({ max: 500 }),
        ({ board, name1, name2 }, isWin, credits) => {
          const result = isWin
            ? updateLeaderboardAfterWin(board, name1, name2, credits)
            : updateLeaderboardAfterDraw(board, name1, name2);

          // Each name appears exactly once
          const names = result.map((e) => e.name);
          const uniqueNames = new Set(names);
          expect(uniqueNames.size).toBe(names.length);

          // Count logic: both names are new (not in board), so count increases by 2
          const existedBefore = board.map((e) => e.name);
          const name1Existed = existedBefore.includes(name1);
          const name2Existed = existedBefore.includes(name2);
          const expectedIncrease = (name1Existed ? 0 : 1) + (name2Existed ? 0 : 1);
          expect(result.length).toBe(board.length + expectedIncrease);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: leaderboard, Property 4: Sorting invariant
  // **Validates: Requirements 6.1, 6.2, 9.1, 9.2**
  it('Property 4: Sorting invariant', () => {
    fc.assert(
      fc.property(
        leaderboardWithTwoDistinctNames,
        fc.boolean(),
        fc.nat({ max: 500 }),
        ({ board, name1, name2 }, isWin, credits) => {
          const result = isWin
            ? updateLeaderboardAfterWin(board, name1, name2, credits)
            : updateLeaderboardAfterDraw(board, name1, name2);

          // Result is sorted by credits desc, then wins desc as tiebreaker
          for (let i = 1; i < result.length; i++) {
            const prev = result[i - 1];
            const curr = result[i];
            if (prev.credits === curr.credits) {
              expect(prev.wins).toBeGreaterThanOrEqual(curr.wins);
            } else {
              expect(prev.credits).toBeGreaterThan(curr.credits);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: leaderboard, Property 5: Dethrone detection
  // **Validates: Requirements 7.1**
  it('Property 5: Dethrone detection', () => {
    fc.assert(
      fc.property(
        uniqueLeaderboardArb.filter((b) => b.length >= 1),
        fc.nat({ max: 500 }),
        (board, credits) => {
          const sorted = sortLeaderboard([...board]);
          const previousLeader = sorted[0].name;

          // Pick the winner as a non-leader to potentially cause a dethrone
          const winnerName = sorted.length > 1 ? sorted[1].name : sorted[0].name;
          const loserName = sorted[0].name;

          const result = updateLeaderboardAfterWin(sorted, winnerName, loserName, credits);
          const detection = detectDethrone(previousLeader, result);

          const newTopName = result[0].name;

          if (newTopName !== previousLeader) {
            // Dethrone occurred
            expect(detection.dethroned).toBe(true);
            expect(detection.oldLeader).toBe(previousLeader);
            expect(detection.newLeader).toBe(newTopName);
          } else {
            // No dethrone
            expect(detection.dethroned).toBe(false);
            expect(detection.oldLeader).toBe(previousLeader);
            expect(detection.newLeader).toBe(previousLeader);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: leaderboard, Property 8: Reset clears all entries
  // **Validates: Requirements 5.2**
  it('Property 8: Reset clears all entries', () => {
    fc.assert(
      fc.property(
        fc.array(leaderboardEntryArb, { minLength: 0, maxLength: 50 }),
        (_leaderboard) => {
          const result = resetLeaderboard();
          expect(result).toEqual([]);
          expect(result.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });
});
