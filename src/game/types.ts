export type Mark = 'X' | 'O';
export type CellValue = Mark | null;
export type BoardState = readonly [
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue
];
export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface WinResult {
  readonly winner: Mark;
  readonly line: readonly [CellIndex, CellIndex, CellIndex];
}

export type GamePhase = 'setup' | 'coin-flip' | 'playing' | 'won' | 'draw';

export interface GameStatus {
  readonly phase: GamePhase;
  readonly winResult: WinResult | null;
}

export interface PlayerData {
  readonly name: string;
  readonly mark: Mark;
  readonly credits: number;
  readonly wins: number;
  readonly activeSkin: SkinId;
  readonly unlockedSkins: readonly SkinId[];
}

export type SkinId = 'default' | 'acid-green' | 'synthwave-pink' | 'hazard-orange';

export interface Skin {
  readonly id: SkinId;
  readonly name: string;
  readonly color: string;
  readonly price: number;
}

export interface GameState {
  readonly board: BoardState;
  readonly currentPlayer: Mark;
  readonly phase: GamePhase;
  readonly winResult: WinResult | null;
  readonly players: readonly [PlayerData, PlayerData];
  readonly overclockEnabled: boolean;
  readonly turnTimeRemaining: number | null;
  readonly lastMove: CellIndex | null;
  readonly moveCount: number;
}

export interface LeaderboardEntry {
  readonly name: string;
  readonly credits: number;
  readonly wins: number;
  readonly losses: number;
  readonly draws: number;
  readonly currentStreak: number;
  readonly bestStreak: number;
}

export interface PersistentState {
  readonly leaderboard: readonly LeaderboardEntry[];
  readonly playerSkins: Record<string, { activeSkin: SkinId; unlockedSkins: readonly SkinId[] }>;
}

export type GameAction =
  | { type: 'PLACE_MARK'; index: CellIndex }
  | { type: 'RESET_GAME' }
  | { type: 'START_GAME'; players: [PlayerData, PlayerData]; overclockEnabled: boolean }
  | { type: 'COIN_FLIP_COMPLETE'; startingMark: Mark }
  | { type: 'OVERCLOCK_TIMEOUT' }
  | { type: 'TICK_TIMER' }
  | { type: 'PURCHASE_SKIN'; playerMark: Mark; skinId: SkinId }
  | { type: 'EQUIP_SKIN'; playerMark: Mark; skinId: SkinId };

export const WIN_LINES: readonly (readonly [CellIndex, CellIndex, CellIndex])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
