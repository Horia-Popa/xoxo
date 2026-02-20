# Implementation Plan: Feedback Loop & Terminal UI

## Overview

Implement two visual features for the XOXO cyberpunk tic-tac-toe game: screen shake + chromatic aberration on piece placement, and typewriter/hex-scramble terminal text for the HUD. All new pure logic goes in `src/game/textScramble.ts`, visual components in `src/components/`.

## Tasks

- [x] 1. Implement text scramble pure logic
  - [x] 1.1 Create `src/game/textScramble.ts` with `randomHexChar`, `scrambleText`, and `typewriterText` functions
    - `randomHexChar()` returns a random character from `0-9A-F._`
    - `scrambleText(target, resolvedCount)` returns a string where the first `resolvedCount` chars match `target` and the rest are random hex chars
    - `typewriterText(target, revealedCount)` returns the first `revealedCount` chars of `target` plus a cursor `▌` when incomplete, or just the target when complete
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 4.4_

  - [x] 1.2 Write property tests for text scramble functions
    - Create `src/game/__tests__/textScramble.prop.test.ts`
    - **Property 1: Scramble resolved prefix matches target**
    - **Validates: Requirements 4.1, 4.2**
    - **Property 2: Scramble unresolved suffix uses only hex characters**
    - **Validates: Requirements 4.4**
    - **Property 3: Typewriter reveal shows correct prefix with cursor behavior**
    - **Validates: Requirements 3.1, 3.2**
    - Use `fast-check` with minimum 100 iterations per property

  - [x] 1.3 Write unit tests for text scramble edge cases
    - Create `src/game/__tests__/textScramble.test.ts`
    - Test: `scrambleText` with empty string returns empty string
    - Test: `scrambleText` with full resolvedCount returns target exactly
    - Test: `typewriterText` with revealedCount 0 returns just cursor
    - Test: `typewriterText` with empty target returns empty string
    - Test: `randomHexChar` returns a single character from the allowed set
    - _Requirements: 3.3, 4.1_

- [x] 2. Checkpoint — Ensure all text scramble tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement screen shake component
  - [x] 3.1 Create `src/components/ScreenShake.tsx`
    - Accept `trigger` (number), `intensity` (default 0.15), `duration` (default 200ms) props
    - Use `useThree()` to access camera, `useFrame()` to apply per-frame random offsets during shake
    - Store original camera position on trigger change, apply random x/y offsets within `[-intensity, +intensity]`, lerp back to original over duration
    - Use `useRef` for shake state to avoid re-renders
    - No-op gracefully if camera is unavailable or intensity/duration are invalid
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Implement chromatic aberration feedback
  - [x] 4.1 Modify `src/components/Scene.tsx` to add chromatic aberration and screen shake
    - Add `moveCount` to `SceneProps` interface
    - Add `ChromaticAberration` effect to `SceneEffects` (import from `@react-three/postprocessing`)
    - Use `useEffect` on `moveCount` to set chromatic offset to peak value (e.g., `[0.008, 0.008]`)
    - Use `useFrame` inside a small helper component to decay offset back to `[0, 0]` over ~300ms
    - Add `<ScreenShake trigger={moveCount} />` inside the Canvas
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.1_

  - [x] 4.2 Update `src/App.tsx` to pass `moveCount` to Scene
    - Add `moveCount={gameState.moveCount}` prop to `<Scene>` component
    - _Requirements: 1.1, 2.1_

- [x] 5. Implement TerminalText component
  - [x] 5.1 Create `src/components/TerminalText.tsx`
    - Accept `text`, `scrambleDuration` (default 400ms), `typewriterSpeed` (default 50ms), `className`, `style` props
    - Implement three animation phases: scramble → typewriter → complete
    - Use `useEffect` + `setInterval` to drive animation, calling `scrambleText` and `typewriterText` from `textScramble.ts`
    - On `text` prop change, cancel current animation and restart with new text
    - On empty text, render nothing
    - Clean up all timers on unmount
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 6. Integrate TerminalText into HUD
  - [x] 6.1 Modify `src/components/HUD.tsx` to use TerminalText
    - Replace static turn indicator text (`{getCurrentPlayer(gameState)}'s turn ({currentPlayer})`) with `<TerminalText>` component
    - Replace static end-game message text (winner/draw) with `<TerminalText>`
    - Pass existing inline styles through to TerminalText
    - On game reset (phase changes to setup/coin-flip), TerminalText receives new text which triggers animation restart
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 7. Final checkpoint — Ensure all tests pass and features integrate
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including tests are required
- Each task references specific requirements for traceability
- Property tests validate the pure `textScramble.ts` functions; visual components are tested manually
- The `postprocessing` package (peer dependency of `@react-three/postprocessing`) should already provide `ChromaticAberrationEffect` — no new npm installs needed for that
- GSAP is NOT used — the original feature request mentioned GSAP, but the design uses R3F's `useFrame` for camera shake to avoid adding a new dependency
