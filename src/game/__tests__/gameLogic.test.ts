import { describe, it, expect } from 'vitest';
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
import type { BoardState, Mark } from '../types';

// Helper to build a board from an array of CellValues
const board = (cells: (Mark | null)[]): BoardState =>
  cells as unknown as BoardState;

describe('createBoard', () => {
  it('returns a board with 9 null values', () => {
    const b = createBoard();
    expect(b).toHaveLength(9);
    expect(b.every((cell) => cell === null)).toBe(true);
  });
});

describe('placeMark', () => {
  it('places a mark on an empty cell and returns updated board', () => {
    const b = createBoard();
    const result = placeMark(b, 0, 'X');
    expect(result).not.toBeNull();
    expect(result![0]).toBe('X');
    // other cells unchanged
    for (let i = 1; i < 9; i++) {
      expect(result![i]).toBeNull();
    }
  });

  it('returns null when placing on an occupied cell', () => {
    const b = board(['X', null, null, null, null, null, null, null, null]);
    const result = placeMark(b, 0, 'O');
    expect(result).toBeNull();
  });

  it('does not mutate the original board', () => {
    const b = createBoard();
    placeMark(b, 4, 'O');
    expect(b[4]).toBeNull();
  });
});

describe('checkWin', () => {
  it('detects a horizontal win (top row)', () => {
    const b = board(['X', 'X', 'X', null, null, null, null, null, null]);
    const result = checkWin(b);
    expect(result).toEqual({ winner: 'X', line: [0, 1, 2] });
  });

  it('detects a horizontal win (middle row)', () => {
    const b = board([null, null, null, 'O', 'O', 'O', null, null, null]);
    const result = checkWin(b);
    expect(result).toEqual({ winner: 'O', line: [3, 4, 5] });
  });

  it('detects a horizontal win (bottom row)', () => {
    const b = board([null, null, null, null, null, null, 'X', 'X', 'X']);
    const result = checkWin(b);
    expect(result).toEqual({ winner: 'X', line: [6, 7, 8] });
  });

  it('detects a vertical win (left column)', () => {
    const b = board(['O', null, null, 'O', null, null, 'O', null, null]);
    const result = checkWin(b);
    expect(result).toEqual({ winner: 'O', line: [0, 3, 6] });
  });

  it('detects a vertical win (middle column)', () => {
    const b = board([null, 'X', null, null, 'X', null, null, 'X', null]);
    const result = checkWin(b);
    expect(result).toEqual({ winner: 'X', line: [1, 4, 7] });
  });

  it('detects a vertical win (right column)', () => {
    const b = board([null, null, 'O', null, null, 'O', null, null, 'O']);
    const result = checkWin(b);
    expect(result).toEqual({ winner: 'O', line: [2, 5, 8] });
  });

  it('detects a main diagonal win', () => {
    const b = board(['X', null, null, null, 'X', null, null, null, 'X']);
    const result = checkWin(b);
    expect(result).toEqual({ winner: 'X', line: [0, 4, 8] });
  });

  it('detects an anti-diagonal win', () => {
    const b = board([null, null, 'O', null, 'O', null, 'O', null, null]);
    const result = checkWin(b);
    expect(result).toEqual({ winner: 'O', line: [2, 4, 6] });
  });

  it('returns null on an empty board', () => {
    expect(checkWin(createBoard())).toBeNull();
  });

  it('returns null on a partial board with no winner', () => {
    const b = board(['X', 'O', null, null, 'X', null, null, null, 'O']);
    expect(checkWin(b)).toBeNull();
  });
});

describe('checkDraw', () => {
  it('returns true on a full board with no winner', () => {
    // Classic draw:
    // X O X
    // X X O
    // O X O
    const b = board(['X', 'O', 'X', 'X', 'X', 'O', 'O', 'X', 'O']);
    expect(checkDraw(b)).toBe(true);
  });

  it('returns false on an incomplete board', () => {
    const b = board(['X', 'O', null, null, null, null, null, null, null]);
    expect(checkDraw(b)).toBe(false);
  });

  it('returns false on a full board with a winner', () => {
    // X wins top row, board is full
    // X X X
    // O O X
    // X O O
    const b = board(['X', 'X', 'X', 'O', 'O', 'X', 'X', 'O', 'O']);
    expect(checkDraw(b)).toBe(false);
  });
});

describe('getGameStatus', () => {
  it('returns playing phase for an in-progress board', () => {
    const b = board(['X', null, null, null, 'O', null, null, null, null]);
    const status = getGameStatus(b);
    expect(status.phase).toBe('playing');
    expect(status.winResult).toBeNull();
  });

  it('returns won phase with winResult when a player wins', () => {
    const b = board(['O', 'O', 'O', null, 'X', null, 'X', null, 'X']);
    const status = getGameStatus(b);
    expect(status.phase).toBe('won');
    expect(status.winResult).toEqual({ winner: 'O', line: [0, 1, 2] });
  });

  it('returns draw phase on a drawn board', () => {
    const b = board(['X', 'O', 'X', 'X', 'X', 'O', 'O', 'X', 'O']);
    const status = getGameStatus(b);
    expect(status.phase).toBe('draw');
    expect(status.winResult).toBeNull();
  });

  it('returns playing phase for an empty board', () => {
    const status = getGameStatus(createBoard());
    expect(status.phase).toBe('playing');
    expect(status.winResult).toBeNull();
  });
});

describe('getRandomEmptyCell', () => {
  it('returns null on a full board', () => {
    const b = board(['X', 'O', 'X', 'O', 'X', 'O', 'X', 'O', 'X']);
    expect(getRandomEmptyCell(b)).toBeNull();
  });

  it('returns the only empty cell when one remains', () => {
    const b = board(['X', 'O', 'X', 'O', null, 'O', 'X', 'O', 'X']);
    expect(getRandomEmptyCell(b)).toBe(4);
  });

  it('returns an index of an empty cell', () => {
    const b = board(['X', null, null, null, 'O', null, null, null, null]);
    const result = getRandomEmptyCell(b);
    expect(result).not.toBeNull();
    expect(b[result as number]).toBeNull();
  });
});

describe('nextPlayer', () => {
  it('toggles X to O', () => {
    expect(nextPlayer('X')).toBe('O');
  });

  it('toggles O to X', () => {
    expect(nextPlayer('O')).toBe('X');
  });
});

describe('validatePlayerNames', () => {
  it('accepts two valid names', () => {
    expect(validatePlayerNames('Alice', 'Bob')).toBe(true);
  });

  it('rejects when first name is empty', () => {
    expect(validatePlayerNames('', 'Bob')).toBe(false);
  });

  it('rejects when second name is empty', () => {
    expect(validatePlayerNames('Alice', '')).toBe(false);
  });

  it('rejects when both names are empty', () => {
    expect(validatePlayerNames('', '')).toBe(false);
  });

  it('rejects whitespace-only first name', () => {
    expect(validatePlayerNames('   ', 'Bob')).toBe(false);
  });

  it('rejects whitespace-only second name', () => {
    expect(validatePlayerNames('Alice', '  \t ')).toBe(false);
  });

  it('accepts names with leading/trailing spaces if non-empty after trim', () => {
    expect(validatePlayerNames('  Alice  ', '  Bob  ')).toBe(true);
  });
});
