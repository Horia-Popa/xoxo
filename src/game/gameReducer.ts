import type { GameState, GameAction, PlayerData, CellIndex } from './types';
import {
  createBoard,
  placeMark,
  checkWin,
  checkDraw,
  getRandomEmptyCell,
  nextPlayer,
} from './gameLogic';
import { awardCredits, purchaseSkin, getAvailableSkins } from './creditLogic';

const OVERCLOCK_DURATION = 10;
const WIN_CREDITS = 25;

/** Type-safe helper to map a 2-player tuple while preserving the tuple type. */
const mapPlayers = (
  players: readonly [PlayerData, PlayerData],
  fn: (p: PlayerData, i: number) => PlayerData,
): readonly [PlayerData, PlayerData] => [fn(players[0], 0), fn(players[1], 1)];

const defaultPlayer = (mark: 'X' | 'O'): PlayerData => ({
  name: '',
  mark,
  credits: 0,
  wins: 0,
  activeSkin: 'default',
  unlockedSkins: ['default'],
});

export const createInitialGameState = (): GameState => ({
  board: createBoard(),
  currentPlayer: 'X',
  phase: 'setup',
  winResult: null,
  players: [defaultPlayer('X'), defaultPlayer('O')],
  overclockEnabled: false,
  turnTimeRemaining: null,
  lastMove: null,
  moveCount: 0,
});

const handlePlaceMark = (state: GameState, index: CellIndex, _isCorrupted = false): GameState => {
  const newBoard = placeMark(state.board, index, state.currentPlayer);
  if (newBoard === null) return state;

  const winResult = checkWin(newBoard);
  const isDraw = !winResult && checkDraw(newBoard);

  if (winResult) {
    const updatedPlayers = mapPlayers(state.players, (p) =>
      p.mark === winResult.winner
        ? { ...awardCredits(p, WIN_CREDITS), wins: p.wins + 1 }
        : p,
    );

    return {
      ...state,
      board: newBoard,
      phase: 'won',
      winResult,
      players: updatedPlayers,
      lastMove: index,
      moveCount: state.moveCount + 1,
      turnTimeRemaining: null,
    };
  }

  if (isDraw) {
    return {
      ...state,
      board: newBoard,
      phase: 'draw',
      winResult: null,
      lastMove: index,
      moveCount: state.moveCount + 1,
      turnTimeRemaining: null,
    };
  }

  return {
    ...state,
    board: newBoard,
    currentPlayer: nextPlayer(state.currentPlayer),
    lastMove: index,
    moveCount: state.moveCount + 1,
    turnTimeRemaining: state.overclockEnabled ? OVERCLOCK_DURATION : null,
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'PLACE_MARK': {
      if (state.phase !== 'playing') return state;
      return handlePlaceMark(state, action.index);
    }

    case 'RESET_GAME': {
      return {
        ...state,
        board: createBoard(),
        phase: 'coin-flip',
        winResult: null,
        lastMove: null,
        moveCount: 0,
        turnTimeRemaining: null,
      };
    }

    case 'START_GAME': {
      return {
        ...state,
        players: action.players,
        overclockEnabled: action.overclockEnabled,
        phase: 'coin-flip',
      };
    }

    case 'COIN_FLIP_COMPLETE': {
      return {
        ...state,
        currentPlayer: action.startingMark,
        phase: 'playing',
        turnTimeRemaining: state.overclockEnabled ? OVERCLOCK_DURATION : null,
      };
    }

    case 'OVERCLOCK_TIMEOUT': {
      if (state.phase !== 'playing') return state;
      const randomCell = getRandomEmptyCell(state.board);
      if (randomCell === null) return state;
      return handlePlaceMark(state, randomCell, true);
    }

    case 'TICK_TIMER': {
      if (!state.overclockEnabled || state.phase !== 'playing' || state.turnTimeRemaining === null) {
        return state;
      }
      const newTime = state.turnTimeRemaining - 1;
      if (newTime <= 0) {
        // Timer expired — trigger overclock timeout inline
        const randomCell = getRandomEmptyCell(state.board);
        if (randomCell === null) return state;
        return handlePlaceMark(state, randomCell, true);
      }
      return { ...state, turnTimeRemaining: newTime };
    }

    case 'PURCHASE_SKIN': {
      const playerIndex = state.players.findIndex((p) => p.mark === action.playerMark);
      if (playerIndex === -1) return state;

      const player = state.players[playerIndex];
      const otherPlayer = state.players[playerIndex === 0 ? 1 : 0];
      const skin = getAvailableSkins().find((s) => s.id === action.skinId);
      if (!skin) return state;

      // Non-default skins are exclusive — can't use one the other player has active
      if (action.skinId !== 'default' && otherPlayer.activeSkin === action.skinId) return state;

      const updatedPlayer = purchaseSkin(player, skin);
      if (updatedPlayer === null) return state;

      const updatedPlayers = mapPlayers(state.players, (p, i) =>
        i === playerIndex ? updatedPlayer : p,
      );

      return { ...state, players: updatedPlayers };
    }

    case 'EQUIP_SKIN': {
      const playerIndex = state.players.findIndex((p) => p.mark === action.playerMark);
      if (playerIndex === -1) return state;

      const player = state.players[playerIndex];
      const otherPlayer = state.players[playerIndex === 0 ? 1 : 0];
      if (!player.unlockedSkins.includes(action.skinId)) return state;

      // Non-default skins are exclusive
      if (action.skinId !== 'default' && otherPlayer.activeSkin === action.skinId) return state;

      const updatedPlayers = mapPlayers(state.players, (p, i) =>
        i === playerIndex ? { ...p, activeSkin: action.skinId } : p,
      );

      return { ...state, players: updatedPlayers };
    }

    default:
      return state;
  }
};
