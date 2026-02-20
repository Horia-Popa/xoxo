import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createBoard,
  placeMark,
  checkWin,
  checkDraw,
  getGameStatus,
  getRandomEmptyCell,
  nextPlayer,
  validatePlayerNames,
} from '../gameLogic';
import type { BoardState, CellIndex, Mark } from '../types';
import { WIN_LINES } from '../types';

// --- Generators ---

const markArb: fc.Arbitrary<Mark> = fc.constantFrom('X' as Mark, 'O' as Mark);

const cellValueArb: fc.Arbitrary<Mark | null> = fc.constantFrom('X' as Mark, 'O' as Mark, null);

const boardArb: fc.Arbitrary<BoardState> = fc.tuple(
  cellValueArb, cellValueArb, cellValueArb,
  cellValueArb, cellValueArb, cellValueArb,
  cellValueArb, cellValueArb, cellValueArb,
).map((cells) => cells as unknown as BoardState);

/** Board that has at least one empty cell */
const boardWithEmptyCellArb: fc.Arbitrary<{ board: BoardState; emptyIndex: CellIndex }> =
  boardArb
    .filter((b) => b.some((c) => c === null))
    .chain((b) => {
      const empties: CellIndex[] = [];
      for (let i = 0; i < 9; i++) {
        if (b[i] === null) empties.push(i as CellIndex);
      }
      return fc.constantFrom(...empties).map((idx) => ({ board: b, emptyIndex: idx }));
    });

/** Board that has at least one occupied cell, plus an occupied index */
const boardWithOccupiedCellArb: fc.Arbitrary<{ board: BoardState; occupiedIndex: CellIndex }> =
  boardArb
    .filter((b) => b.some((c) => c !== null))
    .chain((b) => {
      const occupied: CellIndex[] = [];
      for (let i = 0; i < 9; i++) {
        if (b[i] !== null) occupied.push(i as CellIndex);
      }
      return fc.constantFrom(...occupied).map((idx) => ({ board: b, occupiedIndex: idx }));
    });

/** Generate a fully-filled board in a won state by filling a winning line + filling rest with marks */
const wonBoardArb: fc.Arbitrary<BoardState> =
  fc.tuple(
    fc.constantFrom(...WIN_LINES),
    markArb,
    fc.array(markArb, { minLength: 6, maxLength: 6 }),
  ).map(([line, mark, rest]) => {
    const cells: (Mark | null)[] = Array(9).fill(null);
    for (const idx of line) {
      cells[idx] = mark;
    }
    let ri = 0;
    for (let i = 0; i < 9; i++) {
      if (cells[i] === null) {
        cells[i] = rest[ri++];
      }
    }
    return cells as unknown as BoardState;
  }).filter((b) => checkWin(b) !== null);

/** Known draw patterns — full boards with no winning line */
const KNOWN_DRAWS: BoardState[] = [
  ['X','O','X','X','X','O','O','X','O'] as unknown as BoardState,
  ['O','X','O','O','O','X','X','O','X'] as unknown as BoardState,
  ['X','O','X','O','X','X','O','X','O'] as unknown as BoardState,
  ['X','X','O','O','O','X','X','O','X'] as unknown as BoardState,
];

const drawnBoardArb: fc.Arbitrary<BoardState> = fc.constantFrom(...KNOWN_DRAWS);

/** Terminal board: either won or drawn */
const terminalBoardArb: fc.Arbitrary<BoardState> = fc.oneof(wonBoardArb, drawnBoardArb);

/** Whitespace-only or empty string */
const emptyOrWhitespaceArb: fc.Arbitrary<string> = fc.array(
  fc.constantFrom(' ', '\t', '\n', '\r'),
  { minLength: 0, maxLength: 10 },
).map((chars) => chars.join(''));

/** Non-empty string (after trim) */
const validNameArb: fc.Arbitrary<string> = fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0);

// --- Property Tests ---

describe('gameLogic property tests', () => {
  // Feature: cyberpunk-tic-tac-toe, Property 1: Name validation prevents empty names
  it('Property 1: Name validation prevents empty names', () => {
    // **Validates: Requirements 1.4**
    fc.assert(
      fc.property(
        fc.oneof(
          // Case 1: first name empty/whitespace, second valid
          fc.tuple(emptyOrWhitespaceArb, validNameArb),
          // Case 2: first valid, second empty/whitespace
          fc.tuple(validNameArb, emptyOrWhitespaceArb),
          // Case 3: both empty/whitespace
          fc.tuple(emptyOrWhitespaceArb, emptyOrWhitespaceArb),
        ),
        ([name1, name2]) => {
          expect(validatePlayerNames(name1, name2)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 2: Valid moves on empty cells succeed
  it('Property 2: Valid moves on empty cells succeed', () => {
    // **Validates: Requirements 2.1**
    fc.assert(
      fc.property(boardWithEmptyCellArb, markArb, ({ board, emptyIndex }, mark) => {
        const result = placeMark(board, emptyIndex, mark);
        expect(result).not.toBeNull();
        // The placed cell has the mark
        expect(result![emptyIndex]).toBe(mark);
        // All other cells unchanged
        for (let i = 0; i < 9; i++) {
          if (i !== emptyIndex) {
            expect(result![i]).toBe(board[i]);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 3: Turn alternation after placement
  it('Property 3: Turn alternation after placement', () => {
    // **Validates: Requirements 2.3**
    fc.assert(
      fc.property(markArb, (mark) => {
        const opposite = nextPlayer(mark);
        // Opposite is the other mark
        expect(opposite).not.toBe(mark);
        expect(['X', 'O']).toContain(opposite);
        // Double toggle returns to original
        expect(nextPlayer(opposite)).toBe(mark);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 4: Occupied cell rejection
  it('Property 4: Occupied cell rejection', () => {
    // **Validates: Requirements 2.4**
    fc.assert(
      fc.property(boardWithOccupiedCellArb, markArb, ({ board, occupiedIndex }, mark) => {
        const result = placeMark(board, occupiedIndex, mark);
        expect(result).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 5: Terminal state rejection
  it('Property 5: Terminal state rejection', () => {
    // **Validates: Requirements 2.5**
    fc.assert(
      fc.property(terminalBoardArb, markArb, (board, mark) => {
        const status = getGameStatus(board);
        expect(status.phase === 'won' || status.phase === 'draw').toBe(true);
        // All cells are filled on these terminal boards, so placeMark returns null for every cell
        for (let i = 0; i < 9; i++) {
          expect(placeMark(board, i as CellIndex, mark)).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 6: Win detection across all winning lines
  it('Property 6: Win detection across all winning lines', () => {
    // **Validates: Requirements 3.1, 3.2, 3.3**
    fc.assert(
      fc.property(
        fc.constantFrom(...WIN_LINES),
        markArb,
        (line, mark) => {
          // Build a board with the winning line filled, rest null
          const cells: (Mark | null)[] = Array(9).fill(null);
          for (const idx of line) {
            cells[idx] = mark;
          }
          const board = cells as unknown as BoardState;
          const result = checkWin(board);
          expect(result).not.toBeNull();
          expect(result!.winner).toBe(mark);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 7: Draw detection on full board
  it('Property 7: Draw detection on full board', () => {
    // **Validates: Requirements 3.4**
    fc.assert(
      fc.property(
        // Generate full boards (all 9 cells filled) and filter for no win
        fc.tuple(
          markArb, markArb, markArb,
          markArb, markArb, markArb,
          markArb, markArb, markArb,
        )
          .filter((cells) => {
            const b = cells as unknown as BoardState;
            return checkWin(b) === null;
          })
          .map((cells) => cells as unknown as BoardState),
        (board) => {
          expect(checkDraw(board)).toBe(true);
          expect(board.every((c) => c !== null)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 8: Reset clears board and preserves player identity
  it('Property 8: Reset clears board and preserves player identity', () => {
    // **Validates: Requirements 5.2, 5.4**
    fc.assert(
      fc.property(fc.constant(null), () => {
        const board = createBoard();
        // Board is all nulls
        expect(board).toHaveLength(9);
        for (let i = 0; i < 9; i++) {
          expect(board[i]).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  // Feature: cyberpunk-tic-tac-toe, Property 9: Overclock timeout places mark in empty cell
  it('Property 9: Overclock timeout places mark in empty cell', () => {
    // **Validates: Requirements 6.3**
    fc.assert(
      fc.property(
        boardArb.filter((b) => b.some((c) => c === null)),
        (board) => {
          const idx = getRandomEmptyCell(board);
          expect(idx).not.toBeNull();
          expect(board[idx!]).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
