import { useState, useEffect, useCallback } from 'react';
import type { GameSettings, GameState } from './engine/types';
import {
  createNewGame,
  loadGameStateFromStorage,
  saveSettings,
  undoMove,
} from './engine/gameManager';

import { findHint } from './engine/solver';
import { HeaderBar } from './components/HeaderBar';
import { BottomBar } from './components/BottomBar';
import { GameBoard } from './components/GameBoard';
import { SettingsModal } from './components/SettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { WinCanvas } from './components/WinCanvas';
import { sounds } from './engine/sound';

export function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    return loadGameStateFromStorage() || createNewGame();
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [dealTrigger, setDealTrigger] = useState(1); // 1 triggers initial deal on game mount
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

  // Sync sound settings with audio engine
  useEffect(() => {
    sounds.setMuted(!gameState.settings.soundEnabled);
  }, [gameState.settings.soundEnabled]);

  // Game timer loop & Standard scoring time deduction
  useEffect(() => {
    if (!gameState.startTime || gameState.isWon) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (!prev.startTime || prev.isWon) return prev;
        const newElapsed = prev.elapsedSeconds + 1;
        let newScore = prev.score;

        // In standard scoring mode: deduct 2 points every 10 seconds
        if (
          prev.settings.scoringMode === 'standard' &&
          newElapsed % 10 === 0 &&
          newElapsed > 0
        ) {
          newScore = Math.max(0, prev.score - 2);
        }

        return {
          ...prev,
          elapsedSeconds: newElapsed,
          score: newScore,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.startTime, gameState.isWon]);

  // Handler for New Game
  const handleNewGame = useCallback(() => {
    sounds.playCardFlip();
    const newGame = createNewGame(gameState.settings, true);
    setGameState(newGame);
    setHighlightedCardId(null);
    setDealTrigger((prev) => prev + 1);
  }, [gameState.settings]);

  // Handler for Undo
  const handleUndo = useCallback(() => {
    if (gameState.history.length === 0 || gameState.isWon) return;
    sounds.playCardFlip();
    sounds.triggerHaptic(20);
    const prev = undoMove(gameState);
    setGameState(prev);
    setHighlightedCardId(null);
  }, [gameState]);

  // Handler for Hint
  const handleHint = useCallback(() => {
    const hint = findHint(gameState);
    if (!hint) {
      sounds.triggerHaptic(30);
      return;
    }

    sounds.playCardFlip();
    sounds.triggerHaptic(15);

    let targetCardId: string | null = null;
    if (hint.source.pile === 'waste' && gameState.waste.length > 0) {
      targetCardId = gameState.waste[gameState.waste.length - 1].id;
    } else if (
      hint.source.pile === 'tableau' &&
      hint.source.colIndex !== undefined &&
      hint.source.cardIndex !== undefined
    ) {
      const col = gameState.tableau[hint.source.colIndex];
      if (col[hint.source.cardIndex]) {
        targetCardId = col[hint.source.cardIndex].id;
      }
    }

    if (targetCardId) {
      setHighlightedCardId(targetCardId);
      setTimeout(() => {
        setHighlightedCardId((curr) => (curr === targetCardId ? null : curr));
      }, 2200);
    }
  }, [gameState]);

  // Update Settings
  const handleUpdateSettings = (newSettings: GameSettings) => {
    saveSettings(newSettings);
    setGameState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  return (
    <div className="w-full h-full h-[100dvh] flex flex-col green-felt overflow-hidden select-none">
      {/* Top Status HUD Bar */}
      <HeaderBar
        score={gameState.score}
        moves={gameState.movesCount}
        elapsedSeconds={gameState.elapsedSeconds}
        settings={gameState.settings}
      />

      {/* Main Solitaire Board - Dynamically fills height with dealing animation */}
      <GameBoard
        state={gameState}
        onStateChange={setGameState}
        highlightedCardId={highlightedCardId}
        dealTrigger={dealTrigger}
      />

      {/* Bottom Action Bar (Thumb Zone) - Always visible, never cut off */}
      <BottomBar
        canUndo={gameState.history.length > 0 && !gameState.isWon}
        onUndo={handleUndo}
        onNewGame={handleNewGame}
        onHint={handleHint}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={gameState.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Winning Celebration Canvas with Score & Record recognition */}
      {gameState.isWon && (
        <WinCanvas
          foundations={gameState.foundations}
          score={gameState.score}
          movesCount={gameState.movesCount}
          elapsedSeconds={gameState.elapsedSeconds}
          drawCount={gameState.settings.drawCount}
          scoringMode={gameState.settings.scoringMode}
          onRestart={handleNewGame}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {/* Leaderboard Modal (rendered on top of everything including WinCanvas) */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}

export default App;
