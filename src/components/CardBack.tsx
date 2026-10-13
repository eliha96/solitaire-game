import React from 'react';
import type { CardBackStyle } from '../engine/types';

interface CardBackProps {
  styleName: CardBackStyle;
}

const BACK_IMAGES: Record<CardBackStyle, string> = {
  'classic-blue': '/decks/windows95/backs/classic-blue.png',
  'beach': '/decks/windows95/backs/beach.png',
  'castle': '/decks/windows95/backs/castle.png',
  'robot': '/decks/windows95/backs/robot.png',
  'roses': '/decks/windows95/backs/roses.png',
  'fish': '/decks/windows95/backs/fish.png',
  'shells': '/decks/windows95/backs/shells.png',
  'classic-red': '/decks/windows95/backs/classic-red.png',
};

export const CardBack: React.FC<CardBackProps> = ({ styleName }) => {
  const imgSrc = BACK_IMAGES[styleName] || BACK_IMAGES['classic-blue'];

  return (
    <div className="w-full h-full rounded-md overflow-hidden bg-white shadow-sm flex items-center justify-center">
      <img
        src={imgSrc}
        alt={styleName}
        draggable={false}
        className="w-full h-full object-fill pointer-events-none select-none"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
