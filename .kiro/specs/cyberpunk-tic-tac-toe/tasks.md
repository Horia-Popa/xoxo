# Implementation Plan: XOXO — Cyberpunk 3D Tic-Tac-Toe

## Overview

Incremental implementation starting with pure game logic and types, then storage/credits, then the 3D scene and HUD components, and finally visual effects and polish. Tests are written alongside each module — all test tasks are required.

## Tasks

- [x] 1. Project setup and dependencies
  - Initialize Vite + React + TypeScript project
  - Install dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `fast-check`
  - Configure `tsconfig.json` with strict mode
  - Configure Vitest in `vite.config.ts`
  - Create directory structure: `src/game/`, `src/game/__tests__/`, `src/components/`
  - _Requirements: All_

- [ ] 2. Core types and game logic
  - [x] 2.1 Create `src/game/types.ts` with all type definitions
    - Define `Mark`, `CellValue`, `BoardState`, `CellIndex`, `WinResult`, `GamePhase`, `GameStatus`, `PlayerData`, `SkinId`, `Skin`, `GameState`, `LeaderboardEntry`, `PersistentState`, `GameAction`
    - Define `WIN_LINES` constant array with all 8 winning line tuples
    - _Requirements: 2.6, 3.1, 3.2, 3.3_

  - [x] 2.2 Implement `src/game/gameLogic.ts`
    - Implement `createBoard()` — returns a 9-element tuple of nulls
    - Implement `placeMark(board, index, mark)` — returns new board or null if cell occupied
    - Implement `isCellEmpty(board, index)` — checks if cell is null
    - Implement `checkWin(board)` — iterates WIN_LINES, returns WinResult or null
    - Implement `checkDraw(board)` — all cells filled and no winner
    - Implement `getGameStatus(board)` — returns GameStatus with phase and winResult
    - Implement `getRandomEmptyCell(board)` — picks random empty cell index or null
    - Implement `nextPlayer(current)` — toggles X/O
    - Implement `validatePlayerNames(name1, name2)` — rejects empty/whitespace-only names
    - _Requirements: 1.4, 2.1, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 6.3_

  - [x] 2.3 Write unit tests for `gameLogic.ts` in `src/game/__tests__/gameLogic.test.ts`
    - Test `createBoard` returns 9 nulls
    - Test `placeMark` on empty cell returns updated board
    - Test `placeMark` on occupied cell returns null
    - Test `checkWin` with known horizontal, vertical, diagonal wins
    - Test `checkWin` returns null on empty board and partial board
    - Test `checkDraw` on a known drawn board
    - Test `checkDraw` returns false on incomplete board
    - Test `getGameStatus` returns correct phase for playing, won, draw states
    - Test `getRandomEmptyCell` returns null on full board
    - Test `nextPlayer` toggles X to O and O to X
    - Test `validatePlayerNames` rejects empty strings, whitespace-only, and accepts valid names
    - _Requirements: 1.4, 2.1, 2.4, 3.1, 3.2, 3.3, 3.4, 6.3_

  - [x] 2.4 Write property tests for `gameLogic.ts` in `src/game/__tests__/gameLogic.prop.test.ts`
    - [x] 2.4.1 Write property-based test for name validation prevents empty names — Validates: Requirements 1.4
    - [x] 2.4.2 Write property-based test for valid moves on empty cells succeed — Validates: Requirements 2.1
    - [x] 2.4.3 Write property-based test for turn alternation after placement — Validates: Requirements 2.3
    - [x] 2.4.4 Write property-based test for occupied cell rejection — Validates: Requirements 2.4
    - [x] 2.4.5 Write property-based test for terminal state rejection — Validates: Requirements 2.5
    - [x] 2.4.6 Write property-based test for win detection across all winning lines — Validates: Requirements 3.1, 3.2, 3.3
    - [x] 2.4.7 Write property-based test for draw detection on full board — Validates: Requirements 3.4
    - [x] 2.4.8 Write property-based test for reset clears board and preserves player identity — Validates: Requirements 5.2, 5.4
    - [x] 2.4.9 Write property-based test for overclock timeout places mark in empty cell — Validates: Requirements 6.3

- [x] 3. Checkpoint — Core game logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Credit logic and storage
  - [x] 4.1 Implement `src/game/creditLogic.ts`
    - Implement `awardCredits(player, amount)` — returns player with increased balance
    - Implement `purchaseSkin(player, skin)` — deducts credits, unlocks skin, sets active; returns null if insufficient
    - Implement `canAffordSkin(player, skin)` — boolean check
    - Implement `getAvailableSkins()` — returns array of Skin objects (Default, Acid Green, Synthwave Pink, Hazard Orange)
    - Implement `updateLeaderboard(leaderboard, playerName, creditsEarned, winsEarned)` — updates entry and re-sorts descending by credits
    - _Requirements: 7.1, 7.4, 7.6, 8.1, 8.2_

  - [x] 4.2 Implement `src/game/storage.ts`
    - Implement `serializeGameState(state)` — JSON.stringify wrapper
    - Implement `deserializeGameState(json)` — JSON.parse with schema validation, returns null on failure
    - Implement `saveState(state)` — writes to localStorage key `xoxo-game-state`, wrapped in try/catch
    - Implement `loadState()` — reads from localStorage, deserializes, returns default state on failure
    - Implement `getDefaultState()` — returns fresh PersistentState with empty leaderboard
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 4.3 Write unit tests for `creditLogic.ts` in `src/game/__tests__/creditLogic.test.ts`
    - Test `awardCredits` increases balance by exact amount
    - Test `purchaseSkin` deducts credits and adds skin to unlocked list
    - Test `purchaseSkin` returns null when credits insufficient
    - Test `canAffordSkin` returns correct boolean
    - Test `getAvailableSkins` returns at least 3 skins (Acid Green, Synthwave Pink, Hazard Orange)
    - Test `updateLeaderboard` adds new entry and sorts correctly
    - Test `updateLeaderboard` updates existing entry
    - _Requirements: 7.1, 7.4, 7.6, 8.1, 8.2_

  - [x] 4.4 Write property tests for `creditLogic.ts` in `src/game/__tests__/creditLogic.prop.test.ts`
    - **Property 10: Credit awarding increases balance**
    - **Validates: Requirements 7.1**
    - **Property 11: Skin purchase deducts credits and unlocks skin**
    - **Validates: Requirements 7.4**
    - **Property 12: Leaderboard maintains descending credit order after updates**
    - **Validates: Requirements 8.1, 8.2**

  - [x] 4.5 Write unit tests for `storage.ts` in `src/game/__tests__/storage.test.ts`
    - Test `serializeGameState` produces valid JSON
    - Test `deserializeGameState` with valid JSON returns correct state
    - Test `deserializeGameState` with invalid JSON returns null
    - Test `deserializeGameState` with malformed schema returns null
    - Test `loadState` returns default when localStorage is empty
    - Test `saveState` and `loadState` round-trip with a known state
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 4.6 Write property tests for `storage.ts` in `src/game/__tests__/storage.prop.test.ts`
    - **Property 13: Serialization round-trip**
    - **Validates: Requirements 12.4**
    - **Property 14: Corrupted data produces default state**
    - **Validates: Requirements 12.5**

- [x] 5. Checkpoint — All pure logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. App state management and reducer
  - [x] 6.1 Implement game state reducer in `src/game/gameReducer.ts`
    - Implement reducer function handling all `GameAction` types: `PLACE_MARK`, `RESET_GAME`, `START_GAME`, `COIN_FLIP_COMPLETE`, `OVERCLOCK_TIMEOUT`, `TICK_TIMER`, `PURCHASE_SKIN`
    - Delegate to `gameLogic.ts` and `creditLogic.ts` pure functions
    - Implement `createInitialGameState()` factory
    - _Requirements: 1.5, 2.1, 2.3, 2.5, 5.2, 5.4, 6.3, 6.5, 7.1, 7.4_

  - [x] 6.2 Write unit tests for the reducer in `src/game/__tests__/gameReducer.test.ts`
    - Test `PLACE_MARK` updates board and switches turn
    - Test `PLACE_MARK` on occupied cell does nothing
    - Test `PLACE_MARK` triggers win detection and awards credits
    - Test `RESET_GAME` clears board, preserves players
    - Test `START_GAME` sets players and phase to coin-flip
    - Test `COIN_FLIP_COMPLETE` sets current player and phase to playing
    - Test `OVERCLOCK_TIMEOUT` places mark in random empty cell
    - Test `TICK_TIMER` decrements timer
    - Test `PURCHASE_SKIN` deducts credits and updates skin
    - _Requirements: 1.5, 2.1, 2.3, 2.5, 5.2, 5.4, 6.3, 6.5, 7.1, 7.4_

- [x] 7. Checkpoint — Reducer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. 3D Scene and Board components
  - [x] 8.1 Implement `src/components/Scene.tsx`
    - R3F `<Canvas>` wrapper with dark background color
    - Ambient + point lighting for neon aesthetic
    - OrbitControls with auto-rotate (pauses on user interaction)
    - `@react-three/postprocessing` EffectComposer with Bloom and Scanline effects
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

  - [x] 8.2 Implement `src/components/Board.tsx`
    - Render 3x3 grid of `Cell` components at correct 3D positions
    - Render neon-glowing grid lines using BoxGeometry with emissive material
    - Accept `board`, `onCellClick`, `winResult`, `gamePhase` props
    - _Requirements: 10.1, 2.1_

  - [x] 8.3 Implement `src/components/Cell.tsx`
    - Clickable invisible mesh at cell position
    - Renders `Piece` component when cell is occupied
    - Handles click events, passes cell index to parent
    - _Requirements: 2.1, 2.4_

  - [x] 8.4 Implement `src/components/Piece.tsx`
    - Render X as two crossed box meshes, O as a torus mesh
    - Apply skin color via emissive material
    - Drop animation from y=3 to y=0.5 using `useFrame` lerp
    - Corrupted piece variant with glitch distortion (for overclock timeout)
    - _Requirements: 2.2, 6.4_

- [ ] 9. HUD and modal components
  - [x] 9.1 Implement `src/components/HUD.tsx`
    - 2D overlay with CSS modules
    - Display current player turn, player names, credit balances
    - Start Game and Reset buttons
    - Overclock timer display (when enabled)
    - _Requirements: 1.1, 2.6, 5.1, 6.2, 7.2, 8.4_

  - [x] 9.2 Implement `src/components/StartModal.tsx`
    - Modal overlay for player name entry (two text inputs)
    - Mark selection (X/O toggle — selecting one auto-assigns the other)
    - Overclock Mode toggle
    - Begin button (disabled until both names entered)
    - Validation error display for empty names
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1_

  - [x] 9.3 Implement `src/components/SkinShop.tsx`
    - Modal overlay listing available skins with prices
    - Shows current credit balance per player
    - Purchase button (disabled if insufficient credits)
    - Visual preview of skin colors
    - _Requirements: 7.3, 7.4, 7.6_

  - [x] 9.4 Implement `src/components/Leaderboard.tsx`
    - Panel showing player names, credits, and wins sorted by credits descending
    - Reads from persistent state
    - _Requirements: 8.1, 8.4_

- [ ] 10. Wire App component
  - [x] 10.1 Implement `src/App.tsx`
    - Use `useReducer` with game reducer and initial state from `loadState()`
    - Wire `Scene` and `HUD` with game state and dispatch callbacks
    - Manage modal visibility (StartModal, SkinShop)
    - Overclock timer interval via `useEffect` — dispatches `TICK_TIMER` every second when enabled
    - Persist state to localStorage on every state change via `useEffect`
    - _Requirements: 1.1, 1.5, 5.1, 6.2, 6.5, 12.1_

  - [x] 10.2 Implement `src/main.tsx`
    - Vite entry point, renders `App` into DOM root
    - _Requirements: All_

  - [x] 10.3 Create `src/components/HUD.module.css` and `src/components/CRTOverlay.module.css`
    - Cyberpunk-themed styles: dark backgrounds, neon text colors, monospace fonts
    - CRT scanline overlay using CSS repeating-linear-gradient
    - _Requirements: 10.5_

- [x] 11. Checkpoint — Core game playable
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Visual effects
  - [x] 12.1 Implement `src/components/WinLine.tsx`
    - Animated neon line between winning cell positions
    - Uses tube geometry with emissive material
    - Animates opacity/scale on mount
    - _Requirements: 4.2_

  - [x] 12.2 Implement `src/components/CoinFlip.tsx`
    - 3D coin mesh with flip animation (rotation on Y axis)
    - Displays result (player name) after animation completes
    - Calls `onComplete` callback with starting mark
    - _Requirements: 1.5, 1.6, 5.3_

  - [x] 12.3 Implement `src/components/DataGhost.tsx`
    - Translucent copy of a Piece at a given position
    - Fades opacity from 0.4 to 0 over 2 seconds using `useFrame`
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 12.4 Implement `src/components/ParticleBurst.tsx`
    - Burst of neon-colored particles using `Points` or `InstancedMesh`
    - Particles expand outward from placement position and fade
    - Triggered on piece placement
    - _Requirements: 11.1_

  - [x] 12.5 Implement `src/components/GlitchEffect.tsx`
    - Board shake effect using position oscillation on the Board group
    - Losing pieces dissolve: scale down + opacity fade to 0
    - Activated when `gamePhase === 'won'`
    - Static glitch variant for draw
    - _Requirements: 4.1, 4.3_

  - [x] 12.6 Implement `src/components/MatrixRain.tsx`
    - Falling character columns behind the board using `Points` or `Text` instances
    - Characters fall at varying speeds, reset to top when reaching bottom
    - Green/cyan neon color palette
    - _Requirements: 11.2_

  - [x] 12.7 Implement `src/components/CRTOverlay.tsx`
    - CSS overlay div with scanline effect covering the full viewport
    - Subtle opacity so it doesn't obscure gameplay
    - _Requirements: 10.5_

- [ ] 13. Progressive corruption and final polish
  - [x] 13.1 Add progressive corruption effect to Board grid lines
    - Track `moveCount` from game state
    - Gradually shift grid line color/distortion as moves increase
    - Reset on game reset
    - _Requirements: 11.3_

  - [x] 13.2 Wire all visual effects into Scene and Board
    - Integrate ParticleBurst into Cell on placement
    - Integrate DataGhost into Board for previous move
    - Integrate GlitchEffect into Scene on win/draw
    - Integrate WinLine into Scene on win
    - Integrate MatrixRain into Scene background
    - Integrate CoinFlip into Scene during coin-flip phase
    - _Requirements: 4.1, 4.2, 9.1, 11.1, 11.2_

- [x] 14. Final checkpoint — All tests pass, full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All test tasks are required — none are optional
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- Files must stay under 300 lines — split into focused modules if approaching the limit
