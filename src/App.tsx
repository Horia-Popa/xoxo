import { useReducer, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { gameReducer, createInitialGameState } from './game/gameReducer';
import { saveState, loadState } from './game/storage';
import {
  updateLeaderboardAfterWin,
  updateLeaderboardAfterDraw,
  resetLeaderboard,
  detectDethrone,
  getAvailableSkins,
} from './game/creditLogic';
import type { CellIndex, PlayerData, Mark, SkinId, PersistentState } from './game/types';
import { Scene } from './components/Scene';
import { Board } from './components/Board';
import { HUD } from './components/HUD';
import { StartModal } from './components/StartModal';
import { SkinShop } from './components/SkinShop';
import { Leaderboard } from './components/Leaderboard';
import { Leaderboard3D } from './components/Leaderboard3D';
import { CRTOverlay } from './components/CRTOverlay';

export const App = () => {
  const [gameState, dispatch] = useReducer(gameReducer, undefined, () => {
    const persisted = loadState();
    const initial = createInitialGameState();
    const [p0, p1] = initial.players;
    const skinData0 = persisted.playerSkins[p0.name];
    const skinData1 = persisted.playerSkins[p1.name];
    return {
      ...initial,
      players: [
        skinData0 ? { ...p0, activeSkin: skinData0.activeSkin, unlockedSkins: skinData0.unlockedSkins } : p0,
        skinData1 ? { ...p1, activeSkin: skinData1.activeSkin, unlockedSkins: skinData1.unlockedSkins } : p1,
      ] as const,
    };
  });

  const [showStartModal, setShowStartModal] = useState(false);
  const [showSkinShop, setShowSkinShop] = useState(false);
  const [persistedState, setPersistedState] = useState<PersistentState>(() => loadState());

  // Dethrone animation state
  const previousLeaderRef = useRef<string | null>(null);
  const [newLeader, setNewLeader] = useState<string | null>(null);
  const [dethronedLeader, setDethronedLeader] = useState<string | null>(null);
  const [dethroneActive, setDethroneActive] = useState(false);

  // Initialize previousLeaderRef from persisted leaderboard
  useEffect(() => {
    if (persistedState.leaderboard.length > 0 && previousLeaderRef.current === null) {
      previousLeaderRef.current = persistedState.leaderboard[0].name;
    }
  }, [persistedState.leaderboard]);

  // Persist skin data to localStorage when players change
  useEffect(() => {
    setPersistedState((prev) => {
      const updated: PersistentState = {
        ...prev,
        playerSkins: gameState.players.reduce(
          (acc, p) => {
            if (p.name) {
              acc[p.name] = {
                activeSkin: p.activeSkin,
                unlockedSkins: p.unlockedSkins,
              };
            }
            return acc;
          },
          { ...prev.playerSkins } as PersistentState['playerSkins'],
        ),
      };
      saveState(updated);
      return updated;
    });
  }, [gameState.players]);

  // Update leaderboard when a game is won
  useEffect(() => {
    if (gameState.phase !== 'won' || !gameState.winResult) return;

    const winner = gameState.players.find(
      (p) => p.mark === gameState.winResult!.winner,
    );
    const loser = gameState.players.find(
      (p) => p.mark !== gameState.winResult!.winner,
    );
    if (!winner || !loser) return;

    setPersistedState((prev) => {
      const newLeaderboard = updateLeaderboardAfterWin(
        prev.leaderboard,
        winner.name,
        loser.name,
        25,
      );

      const dethroneResult = detectDethrone(previousLeaderRef.current, newLeaderboard);
      const currentTop = newLeaderboard.length > 0 ? newLeaderboard[0].name : null;

      // Trigger animations when #1 changes
      if (dethroneResult.dethroned) {
        setNewLeader(dethroneResult.newLeader);
        setDethronedLeader(dethroneResult.oldLeader);
        setDethroneActive(true);
      } else if (currentTop && currentTop !== previousLeaderRef.current) {
        // Someone claimed #1 for the first time — typewriter + celebration explosion
        setNewLeader(currentTop);
        setDethronedLeader(null);
        setDethroneActive(true);
      }

      previousLeaderRef.current = currentTop;

      const next: PersistentState = { ...prev, leaderboard: newLeaderboard };
      saveState(next);
      return next;
    });
  }, [gameState.phase, gameState.winResult]);

  // Update leaderboard when a game ends in a draw
  useEffect(() => {
    if (gameState.phase !== 'draw') return;

    const [player1, player2] = gameState.players;

    setPersistedState((prev) => {
      const newLeaderboard = updateLeaderboardAfterDraw(
        prev.leaderboard,
        player1.name,
        player2.name,
      );

      const dethroneResult = detectDethrone(previousLeaderRef.current, newLeaderboard);
      const currentTop = newLeaderboard.length > 0 ? newLeaderboard[0].name : null;

      if (dethroneResult.dethroned) {
        setNewLeader(dethroneResult.newLeader);
        setDethronedLeader(dethroneResult.oldLeader);
        setDethroneActive(true);
      } else if (currentTop && currentTop !== previousLeaderRef.current) {
        setNewLeader(currentTop);
        setDethronedLeader(null);
        setDethroneActive(true);
      }

      previousLeaderRef.current = currentTop;

      const next: PersistentState = { ...prev, leaderboard: newLeaderboard };
      saveState(next);
      return next;
    });
  }, [gameState.phase]);

  // CoinFlip completion is handled by the CoinFlip component in Scene
  const onCoinFlipComplete = useCallback(
    (startingMark: Mark) => {
      dispatch({ type: 'COIN_FLIP_COMPLETE', startingMark });
    },
    [],
  );

  // Overclock timer: dispatch TICK_TIMER every second when enabled and playing
  useEffect(() => {
    if (!gameState.overclockEnabled || gameState.phase !== 'playing') return;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.overclockEnabled, gameState.phase]);

  // Callbacks
  const onCellClick = useCallback(
    (index: CellIndex) => {
      dispatch({ type: 'PLACE_MARK', index });
    },
    [],
  );

  const onReset = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const onStartGame = useCallback(() => {
    setShowStartModal(true);
  }, []);

  const handleStartGame = useCallback(
    (players: [PlayerData, PlayerData], overclockEnabled: boolean) => {
      // Merge persisted skin data into player data
      const persisted = loadState();
      const mergedPlayers = players.map((p) => {
        const skinData = persisted.playerSkins[p.name];
        if (!skinData) return p;
        return {
          ...p,
          credits: 0,
          activeSkin: skinData.activeSkin,
          unlockedSkins: skinData.unlockedSkins,
        };
      }) as [PlayerData, PlayerData];

      dispatch({ type: 'START_GAME', players: mergedPlayers, overclockEnabled });
      setShowStartModal(false);
    },
    [],
  );

  const onOpenShop = useCallback(() => {
    setShowSkinShop(true);
  }, []);

  const onPurchase = useCallback(
    (playerMark: Mark, skinId: SkinId) => {
      dispatch({ type: 'PURCHASE_SKIN', playerMark, skinId });
    },
    [],
  );

  const onEquip = useCallback(
    (playerMark: Mark, skinId: SkinId) => {
      dispatch({ type: 'EQUIP_SKIN', playerMark, skinId });
    },
    [],
  );

  const onCloseShop = useCallback(() => {
    setShowSkinShop(false);
  }, []);

  // Reset leaderboard callback
  const onResetLeaderboard = useCallback(() => {
    const emptyLeaderboard = resetLeaderboard();
    const next: PersistentState = { ...persistedState, leaderboard: emptyLeaderboard };
    saveState(next);
    setPersistedState(next);
    previousLeaderRef.current = null;
    setNewLeader(null);
    setDethronedLeader(null);
    setDethroneActive(false);
  }, [persistedState]);

  // Dethrone animation complete callback
  const onDethroneComplete = useCallback(() => {
    setTimeout(() => {
      setDethroneActive(false);
      setNewLeader(null);
      setDethronedLeader(null);
    }, 3000);
  }, []);

  // Resolve skin colors for each player's active skin
  const skinColors = useMemo(() => {
    const skins = getAvailableSkins();
    const colors: Partial<Record<Mark, string>> = {};
    for (const player of gameState.players) {
      const skin = skins.find((s) => s.id === player.activeSkin);
      if (skin) {
        colors[player.mark] = skin.color;
      }
    }
    return colors;
  }, [gameState.players]);

  return (
    <>
      <Scene
        gamePhase={gameState.phase}
        winResult={gameState.winResult}
        playerNames={[gameState.players[0].name, gameState.players[1].name]}
        onCoinFlipComplete={onCoinFlipComplete}
        skinColors={skinColors}
        moveCount={gameState.moveCount}
      >
        <Board
          board={gameState.board}
          onCellClick={onCellClick}
          winResult={gameState.winResult}
          gamePhase={gameState.phase}
          moveCount={gameState.moveCount}
          lastMove={gameState.lastMove}
          skinColors={skinColors}
        />
        <Leaderboard3D
          leaderboard={persistedState.leaderboard}
          newLeader={newLeader}
          dethronedLeader={dethronedLeader}
          dethroneActive={dethroneActive}
          onDethroneComplete={onDethroneComplete}
        />
      </Scene>

      <CRTOverlay />

      <HUD
        gameState={gameState}
        onReset={onReset}
        onStartGame={onStartGame}
        onOpenShop={onOpenShop}
        skinColors={skinColors}
      />

      <Leaderboard
        leaderboard={persistedState.leaderboard}
        onReset={onResetLeaderboard}
        newLeader={newLeader}
        dethronedLeader={dethronedLeader}
      />

      {showStartModal && (
        <StartModal onStart={handleStartGame} />
      )}

      {showSkinShop && (
        <SkinShop
          players={gameState.players}
          onPurchase={onPurchase}
          onEquip={onEquip}
          onClose={onCloseShop}
        />
      )}
    </>
  );
};
