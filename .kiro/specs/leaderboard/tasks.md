# Implementation Plan: Leaderboard Enhancement

## Overview

Enhance the existing leaderboard with comprehensive stats tracking (wins, losses, draws, streaks), reposition as a fixed right-side panel, add reset functionality, persist via localStorage, and add dethrone/typewriter 3D animations. Implementation follows the existing architecture: pure logic in `src/game/`, components in `src/components/`.

## Tasks

- [x] 1. Extend data model and update leaderboard logic
  - [x] 1.1 Extend `LeaderboardEntry` type in `src/game/types.ts`
    - Add `losses`, `draws`, `currentStreak`, `bestStreak` fields (all `number`, `readonly`)
    - _Requirements: 2.1_

  - [x] 1.2 Implement `updateLeaderboardAfterWin` in `src/game/creditLogic.ts`
    - Replace or augment existing `updateLeaderboard` function
    - Accepts leaderboard, winnerName, loserName, creditsEarned
    - Increments winner's wins, credits, currentStreak; updates bestStreak
    - Increments loser's losses; resets loser's currentStreak to 0
    - Creates new entries for players not yet in leaderboard
    - Sorts result by credits desc, then wins desc
    - _Requirements: 2.2, 2.4, 2.5, 2.6, 3.2, 3.3, 6.1, 9.1, 9.2_

  - [x] 1.3 Implement `updateLeaderboardAfterDraw` in `src/game/creditLogic.ts`
    - Accepts leaderboard, player1Name, player2Name
    - Increments draws for both players; resets both currentStreaks to 0
    - Creates new entries for players not yet in leaderboard
    - Sorts result by credits desc, then wins desc
    - _Requirements: 2.3, 2.5, 6.2, 9.1, 9.2_

  - [x] 1.4 Implement `resetLeaderboard` and `detectDethrone` in `src/game/creditLogic.ts`
    - `resetLeaderboard()` returns empty array
    - `detectDethrone(previousLeader, newLeaderboard)` returns `{ dethroned, oldLeader, newLeader }`
    - _Requirements: 5.2, 7.1_

  - [x] 1.5 Write property tests for leaderboard logic in `src/game/__tests__/leaderboard.prop.test.ts`
    - **Property 1: Win update correctness**
    - **Validates: Requirements 2.2, 2.4, 2.6**
    - **Property 2: Draw update correctness**
    - **Validates: Requirements 2.3, 2.5, 2.6**
    - **Property 3: Entry uniqueness invariant**
    - **Validates: Requirements 3.2, 3.3**
    - **Property 4: Sorting invariant**
    - **Validates: Requirements 6.1, 6.2, 9.1, 9.2**
    - **Property 5: Dethrone detection**
    - **Validates: Requirements 7.1**
    - **Property 8: Reset clears all entries**
    - **Validates: Requirements 5.2**

  - [x] 1.6 Write unit tests for leaderboard logic in `src/game/__tests__/leaderboard.test.ts`
    - Test specific win/loss/draw scenarios with known expected values
    - Test streak edge cases: first win, streak broken by loss vs draw
    - Test dethrone detection edge cases: empty leaderboard, single entry, ties
    - Test tiebreaker sorting with equal credits
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 5.2, 7.1, 9.1, 9.2_

- [x] 2. Update storage layer for extended leaderboard entries
  - [x] 2.1 Update `deserializeGameState` in `src/game/storage.ts`
    - Validate new LeaderboardEntry fields (losses, draws, currentStreak, bestStreak)
    - Migrate old entries missing new fields by defaulting to 0
    - _Requirements: 4.2, 4.3_

  - [x] 2.2 Write property tests for storage in `src/game/__tests__/storage.prop.test.ts`
    - **Property 6: Serialization round-trip** (with extended LeaderboardEntry)
    - **Validates: Requirements 4.4**
    - **Property 7: Corrupted data handling**
    - **Validates: Requirements 4.3**

  - [x] 2.3 Write unit tests for storage migration in `src/game/__tests__/storage.test.ts`
    - Test old format entries are migrated with defaults
    - Test entries with all new fields pass validation
    - _Requirements: 4.2, 4.3_

- [x] 3. Checkpoint — Ensure all logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Rewrite Leaderboard panel component
  - [x] 4.1 Rewrite `src/components/Leaderboard.tsx` as fixed right-side panel
    - Fixed position on right side of viewport
    - Display rank, name, wins, losses, draws, best streak, credits for each entry
    - Add reset button that calls `onReset` prop
    - Support `newLeader` and `dethronedLeader` props for animation triggers
    - Typewriter effect for new #1 leader name (CSS-based character reveal)
    - Cyberpunk styling consistent with existing HUD
    - _Requirements: 1.1, 1.2, 2.7, 5.1, 8.1, 8.2_

- [x] 5. Create DethroneExplosion 3D component
  - [x] 5.1 Create `src/components/DethroneExplosion.tsx`
    - R3F particle burst component (similar to existing ParticleBurst.tsx pattern)
    - Larger particle count and longer duration for dramatic effect
    - Magenta/cyan color scheme
    - `active` prop triggers animation, `onComplete` callback when done
    - _Requirements: 7.1, 7.2_

- [x] 6. Wire leaderboard into App.tsx
  - [x] 6.1 Update `src/App.tsx` to orchestrate leaderboard updates and animations
    - Track previous #1 leader in a `useRef`
    - Update leaderboard on win using `updateLeaderboardAfterWin` (replace current `updateLeaderboard` call)
    - Update leaderboard on draw using `updateLeaderboardAfterDraw`
    - Call `detectDethrone` after each update; set animation state if dethroned
    - Pass `onReset`, `newLeader`, `dethronedLeader` props to Leaderboard
    - Wire reset button to `resetLeaderboard` + `saveState`
    - Render `DethroneExplosion` in Scene when dethrone is active
    - _Requirements: 3.1, 4.1, 5.2, 6.1, 6.2, 6.3, 7.1, 7.2, 8.1_

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including tests are required
- Each task references specific requirements for traceability
- Pure logic tasks (1, 2) come before component tasks (4, 5, 6) to enable early testing
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
