import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { Card } from '../engine/types';
import { getRankLabel, getSuitSymbol } from '../engine/rules';
import { sounds } from '../engine/sound';
import { recordGameResult, type RecordResultOutcome } from '../engine/leaderboard';
import { Trophy, Crown, RotateCcw, Medal } from 'lucide-react';

interface WinCanvasProps {
  foundations: Card[][];
  score: number;
  movesCount: number;
  elapsedSeconds: number;
  drawCount: 1 | 3;
  scoringMode: 'relaxed' | 'standard';
  onRestart: () => void;
  onOpenLeaderboard: () => void;
}

interface BouncingCard {
  card: Card;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  active: boolean;
}

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const WinCanvas: React.FC<WinCanvasProps> = ({
  foundations,
  score,
  movesCount,
  elapsedSeconds,
  drawCount,
  scoringMode,
  onRestart,
  onOpenLeaderboard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [outcome, setOutcome] = useState<RecordResultOutcome | null>(null);

  useEffect(() => {
    // Record game result and determine record / top 5 status
    const result = recordGameResult(score, elapsedSeconds, movesCount, drawCount, scoringMode);
    setOutcome(result);

    if (result.isNewRecord) {
      // Grand record fanfare!
      sounds.playRecordFanfare();

      // Double celebratory fireworks & golden confetti burst!
      const end = Date.now() + 3.5 * 1000;
      const colors = ['#f59e0b', '#fbbf24', '#ffffff', '#10b981', '#3b82f6'];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 65,
          origin: { x: 0, y: 0.65 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 65,
          origin: { x: 1, y: 0.65 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else {
      // Regular win fanfare & confetti
      sounds.playWinFanfare();

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Render cards from foundation
    // Flatten foundations from top (Kings) down to Aces
    const cardsToBounce: Card[] = [];
    for (let rank = 13; rank >= 1; rank--) {
      for (let f = 0; f < 4; f++) {
        const found = foundations[f].find((c) => c.rank === rank);
        if (found) cardsToBounce.push(found);
      }
    }

    if (cardsToBounce.length === 0) return;

    const cardWidth = Math.min(80, Math.floor(canvas.width / 6));
    const cardHeight = Math.floor(cardWidth * 1.4);

    // Initial launch positions near the top center/right
    const startX = canvas.width * 0.7;
    const startY = 80;

    let currentCardIndex = 0;
    const activeCards: BouncingCard[] = [];

    const drawCardToCanvas = (c: BouncingCard) => {
      ctx.save();
      ctx.translate(c.x, c.y);

      // Card Body
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0, 0, c.width, c.height, 6);
      ctx.fill();
      ctx.stroke();

      // Card Text
      const isRed = c.card.color === 'red';
      ctx.fillStyle = isRed ? '#d32f2f' : '#1a1a1a';
      ctx.font = `bold ${Math.floor(c.height * 0.2)}px Arial, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const label = getRankLabel(c.card.rank);
      const symbol = getSuitSymbol(c.card.suit);

      ctx.fillText(label, 6, 4);
      ctx.font = `${Math.floor(c.height * 0.18)}px Arial, sans-serif`;
      ctx.fillText(symbol, 6, 4 + c.height * 0.2);

      // Center Symbol
      ctx.font = `${Math.floor(c.height * 0.35)}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, c.width / 2, c.height / 2);

      ctx.restore();
    };

    let animationId: number;
    let frameCount = 0;

    const loop = () => {
      frameCount++;

      // Launch a new card every 12 frames
      if (frameCount % 12 === 0 && currentCardIndex < cardsToBounce.length) {
        const card = cardsToBounce[currentCardIndex];
        activeCards.push({
          card,
          x: startX + (Math.random() * 60 - 30),
          y: startY,
          vx: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 5),
          vy: -(4 + Math.random() * 6),
          width: cardWidth,
          height: cardHeight,
          active: true,
        });
        currentCardIndex++;
      }

      // DO NOT clear canvas on each frame!
      // This is the classic Windows Solitaire trick that creates the iconic trailing cascading waterfall of cards!
      for (const c of activeCards) {
        if (!c.active) continue;

        drawCardToCanvas(c);

        // Update physics
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.45; // gravity

        // Floor bounce
        if (c.y + c.height >= canvas.height) {
          c.y = canvas.height - c.height;
          c.vy = -c.vy * 0.82; // bounce damping
          if (Math.abs(c.vy) < 1.5) {
            c.vy = 0;
          }
        }

        // Wall bounce
        if (c.x <= 0) {
          c.x = 0;
          c.vx = -c.vx * 0.9;
        } else if (c.x + c.width >= canvas.width) {
          c.x = canvas.width - c.width;
          c.vx = -c.vx * 0.9;
        }

        // Off screen top/bottom escape
        if (c.x < -c.width || c.x > canvas.width + c.width) {
          c.active = false;
        }
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [foundations, score, movesCount, elapsedSeconds, drawCount, scoringMode]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto p-4 bg-black/50 backdrop-blur-xs">
      {/* Canvas for the classic Windows bouncing streak */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Celebration Overlay Card */}
      <div
        className="relative z-10 bg-[#044317] rounded-2xl shadow-2xl p-5 sm:p-6 max-w-sm w-full text-center border-3 border-amber-400 animate-in fade-in zoom-in duration-300 text-white"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-3 animate-bounce shadow-lg">
          <Trophy className="w-8 h-8 text-amber-300" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-amber-300 mb-1">
          ניצחון מזהיר!
        </h2>
        <p className="text-xs sm:text-sm text-green-200/90 mb-3">
          סיימת את המשחק בהצלחה מלאה!
        </p>

        {/* Record or Top 5 Badge */}
        {outcome?.isNewRecord ? (
          <div className="mb-3 py-2 px-3 bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 border-2 border-amber-300 rounded-xl flex items-center justify-center gap-2 shadow-lg animate-pulse">
            <Crown className="w-5 h-5 text-amber-300 fill-amber-300" />
            <span className="font-black text-sm sm:text-base text-amber-200">
              👑 שיא חדש נשבר! כל הכבוד!
            </span>
          </div>
        ) : outcome?.rank ? (
          <div className="mb-3 py-1.5 px-3 bg-emerald-500/25 border border-emerald-400 rounded-xl flex items-center justify-center gap-1.5 shadow">
            <Medal className="w-4 h-4 text-amber-300" />
            <span className="font-bold text-xs sm:text-sm text-emerald-200">
              🌟 נכנסת ל-5 הגדולים! (מקום {outcome.rank})
            </span>
          </div>
        ) : null}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 bg-black/35 p-3 rounded-xl border border-white/10 mb-4 text-xs sm:text-sm">
          <div className="flex flex-col items-center">
            <span className="text-green-300/80 text-[11px]">ניקוד המשחק</span>
            <span className="text-xl font-mono font-black text-white">{score}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-green-300/80 text-[11px]">שיא כל הזמנים</span>
            <span className="text-xl font-mono font-black text-amber-300">
              {outcome?.allTimeHighScore ?? score}
            </span>
          </div>
          <div className="flex flex-col items-center pt-2 border-t border-white/10">
            <span className="text-green-300/80 text-[11px]">זמן משחק</span>
            <span className="font-mono font-bold text-white">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <div className="flex flex-col items-center pt-2 border-t border-white/10">
            <span className="text-green-300/80 text-[11px]">מהלכים</span>
            <span className="font-mono font-bold text-white">{movesCount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-base rounded-xl shadow-lg active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>משחק חדש</span>
          </button>

          <button
            onClick={onOpenLeaderboard}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white/10 hover:bg-white/15 text-green-100 font-semibold text-xs sm:text-sm rounded-xl border border-white/15 active:scale-95 transition cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>הצג לוח שיאים מלא</span>
          </button>
        </div>
      </div>
    </div>
  );
};
