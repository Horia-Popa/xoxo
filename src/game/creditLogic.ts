import type { PlayerData, Skin, SkinId, LeaderboardEntry } from './types';

const AVAILABLE_SKINS: readonly Skin[] = [
  { id: 'default', name: 'Default', color: '#00ffff', price: 0 },
  { id: 'acid-green', name: 'Acid Green', color: '#39ff14', price: 50 },
  { id: 'synthwave-pink', name: 'Synthwave Pink', color: '#ff00ff', price: 50 },
  { id: 'hazard-orange', name: 'Hazard Orange', color: '#ff6600', price: 75 },
];

export const awardCredits = (player: PlayerData, amount: number): PlayerData => ({
  ...player,
  credits: player.credits + amount,
});

export const purchaseSkin = (player: PlayerData, skin: Skin): PlayerData | null => {
  if (player.credits < skin.price) {
    return null;
  }

  const unlockedSkins: readonly SkinId[] = player.unlockedSkins.includes(skin.id)
    ? player.unlockedSkins
    : [...player.unlockedSkins, skin.id];

  return {
    ...player,
    credits: player.credits - skin.price,
    activeSkin: skin.id,
    unlockedSkins,
  };
};

export const canAffordSkin = (player: PlayerData, skin: Skin): boolean =>
  player.credits >= skin.price;

export const getAvailableSkins = (): Skin[] => [...AVAILABLE_SKINS];

export const createDefaultEntry = (name: string): LeaderboardEntry => ({
  name,
  credits: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  currentStreak: 0,
  bestStreak: 0,
});

export const sortLeaderboard = (leaderboard: LeaderboardEntry[]): LeaderboardEntry[] =>
  [...leaderboard].sort((a, b) => {
    if (b.credits !== a.credits) return b.credits - a.credits;
    return b.wins - a.wins;
  });

export const updateLeaderboard = (
  leaderboard: readonly LeaderboardEntry[],
  playerName: string,
  creditsEarned: number,
  winsEarned: number,
): LeaderboardEntry[] => {
  const existing = leaderboard.find((entry) => entry.name === playerName);

  const updated: LeaderboardEntry[] = existing
    ? leaderboard.map((entry) =>
        entry.name === playerName
          ? {
              ...entry,
              credits: entry.credits + creditsEarned,
              wins: entry.wins + winsEarned,
            }
          : entry,
      )
    : [...leaderboard, { ...createDefaultEntry(playerName), credits: creditsEarned, wins: winsEarned }];

  return sortLeaderboard(updated);
};

export const updateLeaderboardAfterWin = (
  leaderboard: readonly LeaderboardEntry[],
  winnerName: string,
  loserName: string,
  creditsEarned: number,
): LeaderboardEntry[] => {
  const getEntry = (name: string): LeaderboardEntry =>
    leaderboard.find((e) => e.name === name) ?? createDefaultEntry(name);

  const winnerEntry = getEntry(winnerName);
  const loserEntry = getEntry(loserName);

  const newWinnerStreak = winnerEntry.currentStreak + 1;
  const updatedWinner: LeaderboardEntry = {
    ...winnerEntry,
    wins: winnerEntry.wins + 1,
    credits: winnerEntry.credits + creditsEarned,
    currentStreak: newWinnerStreak,
    bestStreak: Math.max(winnerEntry.bestStreak, newWinnerStreak),
  };

  const updatedLoser: LeaderboardEntry = {
    ...loserEntry,
    losses: loserEntry.losses + 1,
    currentStreak: 0,
  };

  const filtered = leaderboard.filter(
    (e) => e.name !== winnerName && e.name !== loserName,
  );

  return sortLeaderboard([...filtered, updatedWinner, updatedLoser]);
};

export const updateLeaderboardAfterDraw = (
  leaderboard: readonly LeaderboardEntry[],
  player1Name: string,
  player2Name: string,
): LeaderboardEntry[] => {
  const getEntry = (name: string): LeaderboardEntry =>
    leaderboard.find((e) => e.name === name) ?? createDefaultEntry(name);

  const player1Entry = getEntry(player1Name);
  const player2Entry = getEntry(player2Name);

  const updatedPlayer1: LeaderboardEntry = {
    ...player1Entry,
    draws: player1Entry.draws + 1,
    currentStreak: 0,
  };

  const updatedPlayer2: LeaderboardEntry = {
    ...player2Entry,
    draws: player2Entry.draws + 1,
    currentStreak: 0,
  };

  const filtered = leaderboard.filter(
    (e) => e.name !== player1Name && e.name !== player2Name,
  );

  return sortLeaderboard([...filtered, updatedPlayer1, updatedPlayer2]);
};

export const resetLeaderboard = (): LeaderboardEntry[] => [];

export const detectDethrone = (
  previousLeader: string | null,
  newLeaderboard: readonly LeaderboardEntry[],
): { dethroned: boolean; oldLeader: string | null; newLeader: string | null } => {
  if (newLeaderboard.length === 0) {
    return { dethroned: false, oldLeader: previousLeader, newLeader: null };
  }

  const newLeader = newLeaderboard[0].name;

  if (previousLeader === null) {
    return { dethroned: false, oldLeader: null, newLeader };
  }

  if (previousLeader !== newLeader) {
    return { dethroned: true, oldLeader: previousLeader, newLeader };
  }

  return { dethroned: false, oldLeader: previousLeader, newLeader: previousLeader };
};
