import React from 'react';
import { X, Trophy, Crown, Medal, Calendar, Clock, Footprints } from 'lucide-react';
import { loadLeaderboard } from '../engine/leaderboard';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightEntryId?: string | null;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  highlightEntryId,
}) => {
  if (!isOpen) return null;

  const data = loadLeaderboard();
  const medals = ['🥇', '🥈', '🥉', '4', '5'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="w-full max-w-sm sm:max-w-md bg-[#044317] border-2 border-amber-400/70 rounded-2xl shadow-2xl p-4 sm:p-5 text-white animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/15 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-300" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">לוח שיאים ותוצאות</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* All-Time High Score Banner */}
        <div className="my-3 p-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 border border-amber-400/50 rounded-xl flex items-center justify-between shadow-inner shrink-0">
          <div className="flex items-center gap-2.5">
            <Crown className="w-6 h-6 text-amber-300 drop-shadow" />
            <div>
              <div className="text-[11px] text-amber-200/85 font-medium">שיא כל הזמנים</div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                {data.allTimeHighScore} <span className="text-xs font-normal">נקודות</span>
              </div>
            </div>
          </div>
          <span className="text-xs bg-amber-400/20 border border-amber-400/40 text-amber-200 px-2 py-1 rounded-md font-semibold">
            סוליטר
          </span>
        </div>

        {/* Top 5 List */}
        <div className="flex-1 overflow-y-auto pr-0.5 space-y-2 my-1">
          <div className="text-xs font-bold text-green-300 flex items-center gap-1 mb-1">
            <Medal className="w-3.5 h-3.5 text-amber-300" />
            <span>חמשת המשחקים המובילים (Top 5):</span>
          </div>

          {data.topScores.length === 0 ? (
            <div className="text-center py-8 text-green-200/70 text-sm bg-black/20 rounded-xl border border-white/5">
              טרם נרשמו שיאים. נצח במשחק כדי להיכנס ללוח השיאים! 🃏
            </div>
          ) : (
            data.topScores.map((entry, idx) => {
              const isHighlighted = highlightEntryId === entry.id;

              return (
                <div
                  key={entry.id}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isHighlighted
                      ? 'bg-amber-500/25 border-amber-300 ring-2 ring-amber-300 shadow-lg scale-[1.02]'
                      : idx === 0
                      ? 'bg-black/35 border-amber-400/40'
                      : 'bg-black/20 border-white/10 hover:bg-black/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Rank & Score */}
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold w-6 text-center">
                        {medals[idx]}
                      </span>
                      <div>
                        <span className="text-base sm:text-lg font-black font-mono text-white">
                          {entry.score}
                        </span>
                        <span className="text-[11px] text-green-300/80 mr-1">נק'</span>
                        {entry.isAllTimeRecord && (
                          <span className="mr-1.5 text-[10px] bg-amber-400/30 text-amber-200 px-1.5 py-0.5 rounded font-bold border border-amber-400/40">
                            שיא
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mode badge */}
                    <span className="text-[10px] text-green-200/80 bg-white/10 px-2 py-0.5 rounded">
                      {entry.drawCount === 3 ? '3 קלפים' : 'קלף 1'}
                    </span>
                  </div>

                  {/* Details row: Date, Time, Moves */}
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] text-green-100/70 font-mono">
                    <div className="flex items-center gap-1" title="תאריך המשחק">
                      <Calendar className="w-3 h-3 text-green-300/70" />
                      <span>{entry.date}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1" title="זמן משחק">
                        <Clock className="w-3 h-3 text-green-300/70" />
                        <span>{formatTime(entry.elapsedSeconds)}</span>
                      </div>
                      <div className="flex items-center gap-1" title="מהלכים">
                        <Footprints className="w-3 h-3 text-green-300/70" />
                        <span>{entry.movesCount} מ'</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/15 shrink-0 mt-2">
          <button
            onClick={onClose}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 py-2.5 rounded-xl font-bold text-sm shadow transition cursor-pointer"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
