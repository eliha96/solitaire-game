import React from 'react';
import type { Card, CardBackStyle, CardFaceTheme } from '../engine/types';
import { CardBack } from './CardBack';
import { CourtCardArt } from './CourtCardArt';
import { getRankLabel, getSuitSymbol } from '../engine/rules';

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

const SUIT_TO_STANDARD_CHAR: Record<string, string> = {
  clubs: 'c',
  diamonds: 'd',
  hearts: 'h',
  spades: 's',
};

const SUIT_TO_VICTORIAN_CHAR: Record<string, string> = {
  clubs: 'C',
  diamonds: 'D',
  hearts: 'H',
  spades: 'S',
};

const SUIT_TO_WIN95_ROW: Record<string, number> = {
  clubs: 0,
  diamonds: 1,
  hearts: 2,
  spades: 3,
};

export const CardView: React.FC<CardViewProps> = ({
  card,
  cardBack = 'classic-blue',
  cardFaceTheme = 'standard',
  largeFonts = false,
  isHighlighted = false,
  isSelected = false,
  isDragging = false,
  onClick,
  onPointerDown,
  style,
  className = '',
}) => {
  // 1. Face-down card
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

  // Common wrapper styling
  const wrapperClasses = `relative aspect-[5/7] w-full rounded-md shadow-md select-none transition-all flex items-center justify-center overflow-hidden touch-none ${
    isHighlighted ? 'ring-4 ring-amber-400 ring-offset-1 scale-105 z-30 shadow-xl' : ''
  } ${isSelected ? 'ring-2 ring-blue-500 scale-102 z-20 shadow-lg' : ''} ${
    isDragging ? 'opacity-20' : 'cursor-grab active:cursor-grabbing hover:brightness-98'
  } ${className}`;

  // 2. Standard Bicycle / Anglo-American SVG Deck
  if (cardFaceTheme === 'standard') {
    const sChar = SUIT_TO_STANDARD_CHAR[card.suit];
    const fileName = `${card.rank}${sChar}.svg`;
    return (
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
        className={`${wrapperClasses} bg-white`}
      >
        <img
          src={`/decks/standard/${fileName}`}
          alt={`${card.rank} of ${card.suit}`}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      </div>
    );
  }

  // 3. Victorian Goodall & Son (RevK) SVG Deck
  if (cardFaceTheme === 'victorian') {
    const sLetter = SUIT_TO_VICTORIAN_CHAR[card.suit];
    const rLetter =
      card.rank === 1
        ? 'A'
        : card.rank === 11
        ? 'J'
        : card.rank === 12
        ? 'Q'
        : card.rank === 13
        ? 'K'
        : `${card.rank}`;
    const fileName = `${sLetter}-${rLetter}.svg`;
    return (
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
        className={`${wrapperClasses} bg-white`}
      >
        <img
          src={`/decks/victorian/${fileName}`}
          alt={`${card.rank} of ${card.suit}`}
          draggable={false}
          className="w-full h-full object-contain pointer-events-none select-none"
        />
      </div>
    );
  }

  // 4. Windows 95/XP Classic Pixel-Art (cards.dll)
  if (cardFaceTheme === 'windows95') {
    const row = SUIT_TO_WIN95_ROW[card.suit];
    const col = card.rank - 1; // 0 (Ace) to 12 (King)
    const posX = (col / 12) * 100;
    const posY = (row / 3) * 100;

    return (
      <div
        onClick={onClick}
        onPointerDown={onPointerDown}
        style={style}
        className={`${wrapperClasses} bg-white`}
      >
        <div
          className="w-full h-full pointer-events-none select-none"
          style={{
            backgroundImage: 'url(/decks/windows95/cards.png)',
            backgroundPosition: `${posX}% ${posY}%`,
            backgroundSize: '1300% 400%',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    );
  }

  // 5. Modern or Jumbo Theme (Pure Vector SVG inlined for maximum speed)
  const isRed = card.color === 'red';
  const textColor = isRed ? '#d32f2f' : '#1e293b';
  const suitSymbol = getSuitSymbol(card.suit);
  const rankLabel = getRankLabel(card.rank);

  return (
    <div
      onClick={onClick}
      onPointerDown={onPointerDown}
      style={style}
      className={`${wrapperClasses} bg-white border border-gray-300 flex-col justify-between p-1`}
    >
      {/* Top Left Corner */}
      <div className="flex flex-col items-center leading-none z-10 pointer-events-none" style={{ color: textColor }}>
        <span className={largeFonts ? 'text-lg sm:text-xl font-black' : 'text-xs sm:text-sm font-bold'}>
          {rankLabel}
        </span>
        <span className={largeFonts ? 'text-sm sm:text-base' : 'text-[11px] sm:text-xs'}>
          {suitSymbol}
        </span>
      </div>

      {/* Center Artwork / Face design */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-1">
        {card.rank === 1 ? (
          <span className={`${largeFonts ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'} drop-shadow-sm`} style={{ color: textColor }}>
            {suitSymbol}
          </span>
        ) : card.rank >= 11 ? (
          <div className="w-full h-full flex items-center justify-center">
            <CourtCardArt rank={card.rank} suit={card.suit} theme={cardFaceTheme} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center opacity-90" style={{ color: textColor }}>
            <span className={largeFonts ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}>
              {suitSymbol}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Right Corner (Inverted) */}
      <div className="flex flex-col items-center leading-none rotate-180 self-end z-10 pointer-events-none" style={{ color: textColor }}>
        <span className={largeFonts ? 'text-lg sm:text-xl font-black' : 'text-xs sm:text-sm font-bold'}>
          {rankLabel}
        </span>
        <span className={largeFonts ? 'text-sm sm:text-base' : 'text-[11px] sm:text-xs'}>
          {suitSymbol}
        </span>
      </div>
    </div>
  );
};
