import type {
  BoardState,
  CellIndex,
  CellValue,
  GameStatus,
  Mark,
  WinResult,
} from './types';
import { WIN_LINES } from './types';

export const createBoard = (): BoardState =>
  [null, null, null, null, null, null, null, null, null] as const;

export const placeMark = (
  board: BoardState,
  index: CellIndex,
  mark: Mark
): BoardState | null => {
  if (!isCellEmpty(board, index)) return null;

  const newBoard: CellValue[] = [...board];
  newBoard[index] = mark;
  return newBoard as unknown as BoardState;
};

export const isCellEmpty = (board: BoardState, index: CellIndex): boolean =>
  board[index] === null;

export const checkWin = (board: BoardState): WinResult | null => {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    const cellA = board[a];
    if (cellA !== null && cellA === board[b] && cellA === board[c]) {
      return { winner: cellA, line };
    }
  }
  return null;
};

export const checkDraw = (board: BoardState): boolean =>
  board.every((cell) => cell !== null) && checkWin(board) === null;

export const getGameStatus = (board: BoardState): GameStatus => {
  const winResult = checkWin(board);
  if (winResult !== null) {
    return { phase: 'won', winResult };
  }
  if (checkDraw(board)) {
    return { phase: 'draw', winResult: null };
  }
  return { phase: 'playing', winResult: null };
};

export const getRandomEmptyCell = (board: BoardState): CellIndex | null => {
  const emptyCells: CellIndex[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) {
      emptyCells.push(i as CellIndex);
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

export const nextPlayer = (current: Mark): Mark =>
  current === 'X' ? 'O' : 'X';

export const validatePlayerNames = (name1: string, name2: string): boolean =>
  name1.trim().length > 0 && name2.trim().length > 0;
