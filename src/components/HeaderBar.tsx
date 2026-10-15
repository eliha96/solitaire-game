import React from 'react';
import { Clock, Footprints, Trophy } from 'lucide-react';
import type { GameSettings } from '../engine/types';

interface HeaderBarProps {
  score: number;
  moves: number;
  elapsedSeconds: number;
  settings: GameSettings;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  score,
  moves,
  elapsedSeconds,
  settings,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full bg-[#044317]/95 border-b border-emerald-700/50 shadow-md text-white px-2.5 sm:px-4 py-1 sm:py-1.5 flex items-center justify-between select-none shrink-0 z-20 pt-safe">
      {/* Right side: Score & Moves */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-1.5 bg-black/25 px-2 py-0.5 sm:py-1 rounded-md border border-white/10">
          <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="text-emerald-200 text-xs">ניקוד:</span>
          <strong className="text-white font-mono text-xs sm:text-sm">{score}</strong>
        </div>

        <div className="flex items-center gap-1.5 bg-black/25 px-2 py-0.5 sm:py-1 rounded-md border border-white/10">
          <Footprints className="w-3.5 h-3.5 text-green-300 shrink-0" />
          <span className="text-emerald-200 text-xs">מהלכים:</span>
          <strong className="text-white font-mono text-xs sm:text-sm">{moves}</strong>
        </div>
      </div>

      {/* Left side: Draw mode & Timer */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="bg-emerald-950/60 px-2 py-0.5 rounded text-amber-300 border border-emerald-800 text-[11px] font-medium hidden sm:inline">
          {settings.drawCount === 3 ? '3 קלפים' : 'קלף 1'}
        </span>

        <div className="flex items-center gap-1 bg-black/25 px-2 py-0.5 sm:py-1 rounded-md border border-white/10">
          <Clock className="w-3.5 h-3.5 text-green-300 shrink-0" />
          <span className="font-mono font-bold text-white text-xs sm:text-sm min-w-[38px] text-center">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>
    </header>
  );
};
