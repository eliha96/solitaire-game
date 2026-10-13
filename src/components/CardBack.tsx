import React from 'react';
import type { CardBackStyle } from '../engine/types';


interface CardBackProps {
  styleName: CardBackStyle;
}

export const CardBack: React.FC<CardBackProps> = ({ styleName }) => {
  switch (styleName) {
    case 'castle':
      return (
        <div className="w-full h-full rounded-md bg-[#0d1b2a] border border-[#1b263b] flex flex-col items-center justify-center p-1.5 overflow-hidden relative shadow-inner">
          {/* Moon */}
          <div className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-[#f4d35e] shadow-sm"></div>
          {/* Bat silhouette */}
          <svg className="absolute top-4 left-3 w-4 h-2 text-[#415a77]" viewBox="0 0 24 12" fill="currentColor">
            <path d="M12 2 C8 0 4 3 0 1 C2 6 6 8 12 12 C18 8 22 6 24 1 C20 3 16 0 12 2 Z"/>
          </svg>
          {/* Castle silhouette */}
          <div className="absolute bottom-1 w-5/6 flex flex-col items-center">
            <div className="w-full flex justify-between items-end">
              <div className="w-3 h-8 bg-[#1b263b] rounded-t-sm border-t border-[#415a77]"></div>
              <div className="w-5 h-11 bg-[#1b263b] rounded-t-sm border-t border-[#415a77] flex justify-center">
                <div className="w-1.5 h-2.5 bg-[#f4d35e] mt-1.5 rounded-t-full"></div>
              </div>
              <div className="w-3 h-8 bg-[#1b263b] rounded-t-sm border-t border-[#415a77]"></div>
            </div>
            <div className="w-full h-4 bg-[#0a1128] rounded-b-sm"></div>
          </div>
        </div>
      );

    case 'beach':
      return (
        <div className="w-full h-full rounded-md bg-gradient-to-b from-[#3a86ff] via-[#8338ec] to-[#ff006e] border border-[#fb5607] flex flex-col items-center justify-between p-1.5 overflow-hidden relative shadow-inner">
          {/* Sun */}
          <div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-[#ffbe0b] shadow-md"></div>
          {/* Palm tree */}
          <div className="absolute bottom-1 right-2 flex flex-col items-center">
            {/* Fronds */}
            <svg className="w-8 h-6 text-[#38b000]" viewBox="0 0 32 24" fill="currentColor">
              <path d="M16 22 C14 12 8 8 2 10 C8 6 14 6 16 12 C18 6 24 6 30 10 C24 8 18 12 16 22 Z"/>
            </svg>
            {/* Trunk */}
            <div className="w-1.5 h-7 bg-[#7f4f24] -mt-2 rounded-sm rotate-6"></div>
          </div>
          {/* Island wave */}
          <div className="absolute bottom-0 w-full h-2.5 bg-[#ffbe0b] rounded-t-full opacity-80"></div>
        </div>
      );

    case 'roses':
      return (
        <div className="w-full h-full rounded-md bg-[#2d6a4f] border-2 border-[#1b4332] p-1 flex items-center justify-center relative overflow-hidden">
          <div className="w-full h-full border border-[#52b788] rounded flex flex-col items-center justify-center p-1 bg-[#1b4332]/50">
            <svg className="w-6 h-6 text-[#d90429]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
            <div className="text-[8px] font-bold text-[#d8f3dc] mt-0.5 tracking-wider">CLASSIC</div>
          </div>
        </div>
      );

    case 'classic-blue':
    default:
      return (
        <div className="w-full h-full rounded-md bg-[#003884] border-2 border-white/80 p-1 flex items-center justify-center relative overflow-hidden shadow-sm">
          {/* Outer retro frame */}
          <div className="w-full h-full border border-white/60 rounded flex items-center justify-center relative bg-[#0b4ea2]">
            {/* Crosshatch pattern */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #ffffff 1px, transparent 1px), radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 4px 4px',
              }}
            ></div>
            {/* Center diamond emblem */}
            <div className="w-5 h-5 rotate-45 border-2 border-white/80 bg-[#003884] flex items-center justify-center shadow">
              <div className="w-2 h-2 rounded-full bg-white/90"></div>
            </div>
          </div>
        </div>
      );
  }
};
