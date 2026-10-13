import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { Card } from '../engine/types';
import { getRankLabel, getSuitSymbol } from '../engine/rules';

import { sounds } from '../engine/sound';

interface WinCanvasProps {
  foundations: Card[][];
  onRestart: () => void;
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

export const WinCanvas: React.FC<WinCanvasProps> = ({ foundations, onRestart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    sounds.playWinFanfare();

    // Fire festive confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

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
          vy: - (4 + Math.random() * 6),
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
  }, [foundations]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-auto">
      {/* Canvas for the classic Windows bouncing streak */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Celebration Overlay Card */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 max-w-xs w-11/12 text-center border-4 border-amber-400 animate-in fade-in zoom-in duration-300">
        <div className="text-4xl mb-2">🏆</div>
        <h2 className="text-2xl font-black text-gray-900 mb-1">כל הכבוד סבתא!</h2>
        <p className="text-base text-gray-700 font-medium mb-5">
          ניצחת את המשחק בהצלחה מדהימה!
        </p>

        <button
          onClick={onRestart}
          className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-lg rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          משחק חדש
        </button>
      </div>
    </div>
  );
};
