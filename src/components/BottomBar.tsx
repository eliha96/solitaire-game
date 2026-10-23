import React from 'react';
import { Undo2, RotateCcw, Lightbulb, Settings as SettingsIcon, Trophy } from 'lucide-react';

interface BottomBarProps {
  canUndo: boolean;
  onUndo: () => void;
  onNewGame: () => void;
  onHint: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  canUndo,
  onUndo,
  onNewGame,
  onHint,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  return (
    <nav className="w-full bg-[#044317] border-t border-emerald-700/50 text-white px-1 sm:px-4 py-1.5 pb-safe flex items-center justify-around shadow-2xl select-none shrink-0 z-20">
      {/* New Game */}
      <button
        onClick={onNewGame}
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[52px] sm:min-w-[60px] cursor-pointer"
        title="משחק חדש"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-700/80 flex items-center justify-center border border-emerald-400/40 shadow-sm">
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium tracking-tight">חדש</span>
      </button>

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl transition min-w-[52px] sm:min-w-[60px] ${
          canUndo
            ? 'hover:bg-white/10 active:scale-95 text-white cursor-pointer'
            : 'opacity-40 text-white/40 cursor-not-allowed'
        }`}
        title="בטל מהלך אחרון (Ctrl+Z)"
      >
        <div
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border shadow-sm ${
            canUndo ? 'bg-[#076324] border-white/20' : 'bg-black/20 border-transparent'
          }`}
        >
          <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium tracking-tight">בטל</span>
      </button>

      {/* Hint */}
      <button
        onClick={onHint}
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[52px] sm:min-w-[60px] cursor-pointer"
        title="הצג רמז למהלך הבא"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#076324] flex items-center justify-center border border-white/20 shadow-sm">
          <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium tracking-tight">רמז</span>
      </button>

      {/* Leaderboard */}
      <button
        onClick={onOpenLeaderboard}
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[52px] sm:min-w-[60px] cursor-pointer"
        title="לוח שיאים ותוצאות"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#076324] flex items-center justify-center border border-amber-400/40 shadow-sm">
          <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium tracking-tight text-amber-200">שיאים</span>
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition text-green-100 min-w-[52px] sm:min-w-[60px] cursor-pointer"
        title="הגדרות המשחק"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#076324] flex items-center justify-center border border-white/20 shadow-sm">
          <SettingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <span className="text-[10px] sm:text-[11px] font-medium tracking-tight">הגדרות</span>
      </button>
    </nav>
  );
};
