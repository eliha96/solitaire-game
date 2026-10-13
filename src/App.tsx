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
import { GameBoard } from './components/GameBoard';
import { SettingsModal } from './components/SettingsModal';
import { WinCanvas } from './components/WinCanvas';
import { sounds } from './engine/sound';

export function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    return loadGameStateFromStorage() || createNewGame();
  });

  const [showSettings, setShowSettings] = useState(false);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

  // Sync sound settings with audio engine
  useEffect(() => {
    sounds.setMuted(!gameState.settings.soundEnabled);
  }, [gameState.settings.soundEnabled]);

  // Game timer loop
  useEffect(() => {
    if (!gameState.startTime || gameState.isWon) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        if (!prev.startTime || prev.isWon) return prev;
        return {
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1,
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
      // Auto clear highlight after 2.2 seconds
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
    <div className="w-full h-full flex flex-col green-felt overflow-hidden select-none">
      {/* Top Controls Bar */}
      <HeaderBar
        score={gameState.score}
        moves={gameState.movesCount}
        elapsedSeconds={gameState.elapsedSeconds}
        undoAvailable={gameState.history.length > 0 && !gameState.isWon}
        onNewGame={handleNewGame}
        onUndo={handleUndo}
        onHint={handleHint}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Solitaire Board */}
      <GameBoard
        state={gameState}
        onStateChange={setGameState}
        highlightedCardId={highlightedCardId}
      />

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={gameState.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Winning Celebration Canvas */}
      {gameState.isWon && (
        <WinCanvas
          foundations={gameState.foundations}
          onRestart={handleNewGame}
        />
      )}
    </div>
  );
}

export default App;
