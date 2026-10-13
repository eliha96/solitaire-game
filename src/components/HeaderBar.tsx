import React from 'react';
import { RotateCcw, Lightbulb, Settings as SettingsIcon, Play, Sparkles } from 'lucide-react';

interface HeaderBarProps {
  score: number;
  moves: number;
  elapsedSeconds: number;
  undoAvailable: boolean;
  onNewGame: () => void;
  onUndo: () => void;
  onHint: () => void;
  onOpenSettings: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  score,
  moves,
  elapsedSeconds,
  undoAvailable,
  onNewGame,
  onUndo,
  onHint,
  onOpenSettings,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <header className="w-full bg-[#044317] border-b border-emerald-700/60 shadow-md text-white px-2.5 py-1.5 flex flex-col gap-1 select-none z-20">
      {/* Top Stats Row */}
      <div className="flex items-center justify-between text-xs sm:text-sm font-semibold text-emerald-200 px-1">
        <div className="flex items-center gap-3">
          <span>
            ניקוד: <strong className="text-white text-sm sm:text-base">{score}</strong>
          </span>
          <span>
            מהלכים: <strong className="text-white">{moves}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded text-amber-300 border border-emerald-800">
            <Sparkles size={12} /> משחק פתיר
          </span>
          <span className="font-mono text-emerald-100">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Buttons Action Row */}
      <div className="flex items-center justify-between gap-1.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          {/* New Game */}
          <button
            onClick={onNewGame}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg shadow border border-emerald-500/40 transition-transform"
          >
            <Play size={14} />
            <span>חדש</span>
          </button>

          {/* Undo (Large, prominent for Grandma!) */}
          <button
            onClick={onUndo}
            disabled={!undoAvailable}
            className={`flex items-center gap-1 px-3 py-1.5 font-bold text-xs sm:text-sm rounded-lg shadow transition-all ${
              undoAvailable
                ? 'bg-amber-600 hover:bg-amber-500 active:scale-95 text-white border border-amber-400'
                : 'bg-emerald-900/40 text-emerald-600 border border-emerald-900/60 cursor-not-allowed opacity-50'
            }`}
          >
            <RotateCcw size={14} />
            <span>בטל</span>
          </button>

          {/* Hint */}
          <button
            onClick={onHint}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 active:scale-95 text-emerald-100 font-bold text-xs sm:text-sm rounded-lg border border-emerald-600/40 transition-transform"
          >
            <Lightbulb size={14} className="text-amber-300" />
            <span>רמז</span>
          </button>
        </div>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 bg-emerald-900/60 hover:bg-emerald-800 active:scale-95 text-emerald-200 rounded-lg border border-emerald-700/60 transition-transform"
          aria-label="הגדרות"
        >
          <SettingsIcon size={18} />
        </button>
      </div>
    </header>
  );
};
