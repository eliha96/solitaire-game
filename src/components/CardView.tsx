import React from 'react';
import type { Card, CardBackStyle, CardFaceTheme } from '../engine/types';
import { getRankLabel, getSuitSymbol } from '../engine/rules';
import { CardBack } from './CardBack';
import { CourtCardArt } from './CourtCardArt';

interface CardViewProps {
  card: Card;
  cardBack?: CardBackStyle;
  cardFaceTheme?: CardFaceTheme;
  largeFonts?: boolean;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  cardBack = 'classic-blue',
  cardFaceTheme = 'classic',
  largeFonts = false,
  isHighlighted = false,
  isSelected = false,
  isDragging = false,
  onClick,
  onPointerDown,
  style,
  className = '',
}) => {
  if (!card.isFaceUp) {
    return (
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
        className={`relative aspect-[5/7] w-full rounded-md shadow-md cursor-pointer select-none transition-transform active:scale-95 ${
          isDragging ? 'opacity-30' : ''
        } ${className}`}
      >
        <CardBack styleName={cardBack} />
      </div>
    );
  }

  const isRed = card.color === 'red';
  const textColor = isRed ? 'text-[#d32f2f]' : 'text-[#1a1a1a]';
  const suitSymbol = getSuitSymbol(card.suit);
  const rankLabel = getRankLabel(card.rank);

  // Big differences for large fonts mode
  const rankFontSize = largeFonts
    ? 'text-base sm:text-lg font-black'
    : 'text-xs sm:text-sm font-bold';
  const suitFontSize = largeFonts ? 'text-sm sm:text-base' : 'text-[11px] sm:text-xs';

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`relative aspect-[5/7] w-full rounded-md bg-white border border-gray-300 shadow-md select-none transition-all flex flex-col justify-between p-1 overflow-hidden touch-none ${
        isHighlighted
          ? 'ring-4 ring-amber-400 ring-offset-1 scale-105 z-30 shadow-xl'
          : ''
      } ${
        isSelected
          ? 'ring-2 ring-blue-500 scale-102 z-20 shadow-lg'
          : ''
      } ${isDragging ? 'opacity-20' : 'cursor-grab active:cursor-grabbing hover:brightness-98'} ${className}`}
    >
      {/* Top Left Corner */}
      <div className={`flex flex-col items-center leading-none ${textColor} z-10 pointer-events-none`}>
        <span className={`tracking-tighter ${rankFontSize}`}>
          {rankLabel}
        </span>
        <span className={`${suitFontSize} -mt-0.5`}>{suitSymbol}</span>
      </div>

      {/* Center Artwork / Face design */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-1">
        {card.rank === 1 ? (
          // Ace: Grand center symbol
          <div className="flex flex-col items-center justify-center">
            <span className={`${largeFonts ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} ${textColor} drop-shadow-sm`}>
              {suitSymbol}
            </span>
          </div>
        ) : card.rank >= 11 ? (
          // Royal Court Cards (J, Q, K) with Authentic Vector Art!
          <div className="w-full h-full flex items-center justify-center">
            <CourtCardArt rank={card.rank} suit={card.suit} theme={cardFaceTheme} />
          </div>
        ) : (
          // Number Cards (2-10)
          <div className="flex flex-col items-center justify-center opacity-90">
            <span className={`${largeFonts ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} ${textColor}`}>
              {suitSymbol}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Right Corner (Inverted) */}
      <div
        className={`flex flex-col items-center leading-none rotate-180 self-end ${textColor} z-10 pointer-events-none`}
      >
        <span className={`tracking-tighter ${rankFontSize}`}>
          {rankLabel}
        </span>
        <span className={`${suitFontSize} -mt-0.5`}>{suitSymbol}</span>
      </div>
    </div>
  );
};
