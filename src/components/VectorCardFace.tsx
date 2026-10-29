import React from 'react';
import type { Card } from '../engine/types';
import { getRankLabel } from '../engine/rules';

interface VectorCardFaceProps {
  card: Card;
  theme: 'large-print' | 'modern-bold' | 'four-color';
}

export function getSuitColor(
  suit: Card['suit'],
  theme: 'large-print' | 'modern-bold' | 'four-color'
): string {
  if (theme === 'four-color') {
    switch (suit) {
      case 'hearts':
        return '#dc2626'; // Vivid Red
      case 'spades':
        return '#0f172a'; // Deep Black
      case 'diamonds':
        return '#2563eb'; // Royal Blue
      case 'clubs':
        return '#16a34a'; // Emerald Green
    }
  }

  if (theme === 'modern-bold') {
    switch (suit) {
      case 'hearts':
        return '#e11d48'; // Rose Red
      case 'diamonds':
        return '#ea580c'; // Orange-Red
      case 'spades':
        return '#000000'; // Pitch Black
      case 'clubs':
        return '#1e293b'; // Slate Black
    }
  }

  // large-print (classic ultra high contrast)
  return suit === 'hearts' || suit === 'diamonds' ? '#dc2626' : '#0a0a0a';
}

export const SuitIcon: React.FC<{
  suit: Card['suit'];
  className?: string;
  style?: React.CSSProperties;
}> = ({ suit, className = 'w-full h-full', style }) => {
  switch (suit) {
    case 'hearts':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} fill="currentColor">
          <path d="M50,88 C22,64 6,46 6,28 C6,13 16,3 30,3 C39,3 46,7 50,14 C54,7 61,3 70,3 C84,3 94,13 94,28 C94,46 78,64 50,88 Z" />
        </svg>
      );
    case 'spades':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} fill="currentColor">
          <path d="M50,10 C60,32 94,46 94,66 C94,82 82,90 68,90 C58,90 53,84 50,78 C47,84 42,90 32,90 C18,90 6,82 6,66 C6,46 40,32 50,10 Z" />
          <path d="M47,68 C47,84 38,94 34,96 L66,96 C62,94 53,84 53,68 Z" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} fill="currentColor">
          <path d="M50,4 C51,4 53,6 55,10 L90,46 C93,50 93,50 90,54 L55,90 C53,94 51,96 50,96 C49,96 47,94 45,90 L10,54 C7,50 7,50 10,46 L45,10 C47,6 49,4 50,4 Z" />
        </svg>
      );
    case 'clubs':
      return (
        <svg viewBox="0 0 100 100" className={className} style={style} fill="currentColor">
          <circle cx="50" cy="30" r="21" />
          <circle cx="29" cy="58" r="21" />
          <circle cx="71" cy="58" r="21" />
          <polygon points="32,52 68,52 50,30" />
          <path d="M47,60 C47,82 38,94 34,96 L66,96 C62,94 53,82 53,60 Z" />
        </svg>
      );
  }
};

export const VectorCardFace: React.FC<VectorCardFaceProps> = ({ card, theme }) => {
  const color = getSuitColor(card.suit, theme);
  const rankLabel = getRankLabel(card.rank);
  const isCourt = card.rank === 11 || card.rank === 12 || card.rank === 13;
  const isTen = card.rank === 10;

  return (
    <div
      className="relative w-full h-full bg-white select-none pointer-events-none flex flex-col justify-between overflow-hidden"
      style={{ color }}
    >
      {/* Optional classic inner border frame for large-print */}
      {theme === 'large-print' && (
        <div className="absolute inset-0.5 border border-black/10 rounded-sm pointer-events-none" />
      )}

      {/* Top-Left Index (Rank & Suit) - Maximized for cascade visibility */}
      <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 flex flex-col items-center leading-none z-10">
        <span
          className={`font-black tracking-tighter ${
            theme === 'large-print' ? 'font-serif' : 'font-sans'
          } ${
            isTen
              ? 'text-[15px] sm:text-[18px] md:text-[22px]'
              : 'text-[17px] sm:text-[21px] md:text-[25px]'
          }`}
          style={{ letterSpacing: isTen ? '-0.09em' : '-0.03em' }}
        >
          {rankLabel}
        </span>
        <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mt-0.5">
          <SuitIcon suit={card.suit} />
        </div>
      </div>

      {/* Center Artwork - Single Large Uncluttered Suit Icon */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <div className="w-[48%] h-[48%] max-w-[54px] max-h-[54px] flex items-center justify-center drop-shadow-xs">
          <SuitIcon suit={card.suit} />
        </div>

        {/* For court cards (J, Q, K), add a small tasteful royal crown/symbol above suit */}
        {isCourt && (
          <div className="absolute top-[18%] flex items-center justify-center pointer-events-none">
            <span className="text-[11px] sm:text-xs font-bold opacity-80">
              {card.rank === 13 ? '👑' : card.rank === 12 ? '👸' : '⚔️'}
            </span>
          </div>
        )}
      </div>

      {/* Bottom-Right Index (Mirrored) */}
      <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 flex flex-col items-center leading-none rotate-180 z-10">
        <span
          className={`font-black tracking-tighter ${
            theme === 'large-print' ? 'font-serif' : 'font-sans'
          } ${
            isTen
              ? 'text-[15px] sm:text-[18px] md:text-[22px]'
              : 'text-[17px] sm:text-[21px] md:text-[25px]'
          }`}
          style={{ letterSpacing: isTen ? '-0.09em' : '-0.03em' }}
        >
          {rankLabel}
        </span>
        <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 mt-0.5">
          <SuitIcon suit={card.suit} />
        </div>
      </div>
    </div>
  );
};
