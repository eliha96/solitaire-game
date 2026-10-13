import React from 'react';
import type { Card, CardBackStyle } from '../engine/types';
import { getRankLabel, getSuitSymbol } from '../engine/rules';
import { CardBack } from './CardBack';

interface CardViewProps {
  card: Card;
  cardBack?: CardBackStyle;
  largeFonts?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}


export const CardView: React.FC<CardViewProps> = ({
  card,
  cardBack = 'classic-blue',
  largeFonts = true,
  isHighlighted = false,
  isSelected = false,
  onClick,
  style,
  className = '',
}) => {
  if (!card.isFaceUp) {
    return (
      <div
        onClick={onClick}
        style={style}
        className={`relative aspect-[5/7] w-full rounded-md shadow-md cursor-pointer select-none transition-transform active:scale-95 ${className}`}
      >
        <CardBack styleName={cardBack} />
      </div>
    );
  }

  const isRed = card.color === 'red';
  const textColor = isRed ? 'text-[#d32f2f]' : 'text-[#1a1a1a]';
  const suitSymbol = getSuitSymbol(card.suit);
  const rankLabel = getRankLabel(card.rank);

  return (
    <div
      onClick={onClick}
      style={style}
      className={`relative aspect-[5/7] w-full rounded-md bg-white border border-gray-300 shadow-md cursor-pointer select-none transition-all flex flex-col justify-between p-1 overflow-hidden ${
        isHighlighted
          ? 'ring-4 ring-amber-400 ring-offset-1 scale-105 z-30 shadow-xl'
          : ''
      } ${
        isSelected
          ? 'ring-2 ring-blue-500 scale-102 z-20 shadow-lg'
          : 'hover:brightness-95 active:scale-98'
      } ${className}`}
    >
      {/* Top Left Corner */}
      <div className={`flex flex-col items-center leading-none ${textColor}`}>
        <span
          className={`font-black tracking-tighter ${
            largeFonts ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          }`}
        >
          {rankLabel}
        </span>
        <span className="text-xs sm:text-sm -mt-0.5">{suitSymbol}</span>
      </div>

      {/* Center Artwork / Face design */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {card.rank === 1 ? (
          // Ace: Grand center symbol
          <span className={`text-2xl sm:text-3xl ${textColor} drop-shadow-sm`}>
            {suitSymbol}
          </span>
        ) : card.rank >= 11 ? (
          // Royal Court Cards (J, Q, K)
          <div
            className={`w-3/5 h-3/5 rounded border border-gray-200 bg-gray-50/80 flex flex-col items-center justify-center shadow-inner ${textColor}`}
          >
            <span className="text-xs sm:text-sm font-bold tracking-widest opacity-40">
              {card.rank === 11 ? 'JACK' : card.rank === 12 ? 'QUEEN' : 'KING'}
            </span>
            <span className="text-base sm:text-xl font-black mt-[-2px]">
              {rankLabel}
            </span>
            <span className="text-xs sm:text-sm mt-[-2px]">{suitSymbol}</span>
          </div>
        ) : (
          // Number Cards (2-10)
          <div className="flex flex-col items-center justify-center opacity-85">
            <span className={`text-base sm:text-xl ${textColor}`}>
              {suitSymbol}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Right Corner (Inverted) */}
      <div
        className={`flex flex-col items-center leading-none rotate-180 self-end ${textColor}`}
      >
        <span
          className={`font-black tracking-tighter ${
            largeFonts ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
          }`}
        >
          {rankLabel}
        </span>
        <span className="text-xs sm:text-sm -mt-0.5">{suitSymbol}</span>
      </div>
    </div>
  );
};
