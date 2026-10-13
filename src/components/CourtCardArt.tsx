import React from 'react';
import type { Rank, Suit, CardFaceTheme } from '../engine/types';

interface CourtCardArtProps {
  rank: Rank; // 11 (J), 12 (Q), 13 (K)
  suit: Suit;
  theme?: CardFaceTheme;
}

export const CourtCardArt: React.FC<CourtCardArtProps> = ({ rank, suit, theme = 'classic' }) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const suitColor = isRed ? '#d32f2f' : '#1e293b';

  // Jumbo theme: Simplified bold crown & huge centered monogram
  if (theme === 'jumbo') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-1 pointer-events-none">
        <svg viewBox="0 0 100 120" className="w-full h-full max-h-24">
          {/* Crown */}
          <path
            d="M 20,55 L 25,25 L 40,40 L 50,15 L 60,40 L 75,25 L 80,55 Z"
            fill={isRed ? '#f59e0b' : '#3b82f6'}
            stroke="#1e293b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          {/* Crown jewels */}
          <circle cx="50" cy="25" r="3.5" fill="#ef4444" />
          <circle cx="30" cy="35" r="3" fill="#ffffff" />
          <circle cx="70" cy="35" r="3" fill="#ffffff" />
          {/* Bold Letter */}
          <text
            x="50"
            y="95"
            textAnchor="middle"
            fill={suitColor}
            fontSize="38"
            fontWeight="900"
            fontFamily="Arial, sans-serif"
          >
            {rank === 11 ? 'J' : rank === 12 ? 'Q' : 'K'}
          </text>
        </svg>
      </div>
    );
  }

  // Modern theme: Sleek geometric royal silhouettes
  if (theme === 'modern') {
    return (
      <div className="w-full h-full flex items-center justify-center p-0.5 pointer-events-none">
        <svg viewBox="0 0 120 160" className="w-full h-full max-h-28">
          <rect x="10" y="10" width="100" height="140" rx="6" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
          {/* Diagonal ribbon */}
          <path d="M 10,40 L 110,120 L 110,140 L 10,60 Z" fill={isRed ? '#fee2e2' : '#e2e8f0'} opacity="0.6" />
          {/* Crown / Headdress */}
          {rank === 13 && (
            <path d="M 35,45 L 42,25 L 53,35 L 60,18 L 67,35 L 78,25 L 85,45 Z" fill="#d97706" stroke="#78350f" strokeWidth="2" />
          )}
          {rank === 12 && (
            <path d="M 38,45 C 38,28 82,28 82,45 Z" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
          )}
          {rank === 11 && (
            <path d="M 38,45 L 82,45 L 75,30 L 45,30 Z" fill="#64748b" stroke="#334155" strokeWidth="2" />
          )}
          {/* Head & Face */}
          <circle cx="60" cy="62" r="16" fill="#fed7aa" stroke="#78350f" strokeWidth="1.5" />
          {/* Facial feature (Eye / Beard / Smile) */}
          {rank === 13 && <path d="M 50,68 Q 60,80 70,68 Z" fill="#78350f" />}
          {rank === 12 && <path d="M 54,64 Q 60,68 66,64" stroke="#e11d48" strokeWidth="1.5" fill="none" />}
          {rank === 11 && <circle cx="56" cy="60" r="1.5" fill="#0f172a" />}
          {/* Robe */}
          <path
            d="M 30,125 C 30,85 90,85 90,125 Z"
            fill={isRed ? '#b91c1c' : '#1e3a8a'}
            stroke="#0f172a"
            strokeWidth="2"
          />
          {/* Sceptre / Sword */}
          <line x1="85" y1="50" x2="85" y2="135" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="85" cy="46" r="4" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  // Classic Windows / French Court Pattern: Double-headed vintage court art
  return (
    <div className="w-full h-full flex items-center justify-center p-0.5 pointer-events-none">
      <svg viewBox="0 0 140 190" className="w-full h-full max-h-32">
        {/* Outer Court Card Border Frame */}
        <rect x="6" y="6" width="128" height="178" rx="4" fill="#fffdfa" stroke="#b45309" strokeWidth="1.5" />
        <rect x="9" y="9" width="122" height="172" fill="#fffdfa" stroke="#d97706" strokeWidth="0.8" strokeDasharray="2,2" />

        {/* Dividing Center Line */}
        <line x1="12" y1="95" x2="128" y2="95" stroke="#b45309" strokeWidth="1" strokeDasharray="3,3" />

        {/* === TOP HALF === */}
        <g id="top-court">
          {/* Robes / Torso */}
          <path
            d="M 30,95 L 34,70 L 48,58 L 92,58 L 106,70 L 110,95 Z"
            fill={isRed ? '#b91c1c' : '#1e3a8a'}
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          {/* Inner Tunic patterns */}
          <path d="M 50,60 L 70,95 L 90,60 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          <circle cx="70" cy="72" r="2.5" fill="#ffffff" />
          <circle cx="70" cy="84" r="2.5" fill="#ffffff" />

          {/* Neck & Head */}
          <rect x="62" y="48" width="16" height="14" fill="#fed7aa" />
          <circle cx="70" cy="42" r="14" fill="#fed7aa" stroke="#78350f" strokeWidth="1" />

          {/* Hair & Beard */}
          {rank === 13 && (
            <>
              {/* King's hair and majestic beard */}
              <path d="M 54,38 Q 50,56 60,56 Q 70,62 80,56 Q 90,56 86,38" fill="#e2e8f0" stroke="#78350f" strokeWidth="0.8" />
              <path d="M 64,48 Q 70,54 76,48 Q 70,58 64,48 Z" fill="#cbd5e1" />
            </>
          )}

          {rank === 12 && (
            <>
              {/* Queen's curls and veil */}
              <path d="M 54,34 Q 48,55 58,56 Q 54,42 60,34" fill="#eab308" stroke="#78350f" strokeWidth="0.8" />
              <path d="M 86,34 Q 92,55 82,56 Q 86,42 80,34" fill="#eab308" stroke="#78350f" strokeWidth="0.8" />
            </>
          )}

          {rank === 11 && (
            <>
              {/* Jack's youthful curls */}
              <path d="M 54,35 Q 50,50 56,52" stroke="#b45309" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M 86,35 Q 90,50 84,52" stroke="#b45309" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </>
          )}

          {/* Face details */}
          <ellipse cx="66" cy="40" rx="1.5" ry="2" fill="#1e293b" />
          <ellipse cx="74" cy="40" rx="1.5" ry="2" fill="#1e293b" />
          <path d="M 69,42 L 70,45" stroke="#b45309" strokeWidth="1" />
          <path d="M 67,47 Q 70,49 73,47" stroke={rank === 12 ? '#e11d48' : '#78350f'} strokeWidth="1" fill="none" />

          {/* Crowns and hats */}
          {rank === 13 && (
            // King Crown
            <path
              d="M 54,33 L 56,18 L 63,26 L 70,14 L 77,26 L 84,18 L 86,33 Z"
              fill="#f59e0b"
              stroke="#78350f"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          )}

          {rank === 12 && (
            // Queen Tiara
            <path
              d="M 56,32 L 60,20 L 70,16 L 80,20 L 84,32 Z"
              fill="#fbbf24"
              stroke="#78350f"
              strokeWidth="1.2"
            />
          )}

          {rank === 11 && (
            // Jack Plumed Cap
            <g>
              <ellipse cx="70" cy="30" rx="18" ry="6" fill="#047857" stroke="#064e3b" strokeWidth="1.2" />
              <path d="M 56,28 Q 50,14 62,12 Q 58,22 66,26" fill="#ef4444" stroke="#991b1b" strokeWidth="0.8" />
            </g>
          )}

          {/* Sceptre or Sword */}
          <g>
            <line x1="98" y1="35" x2="98" y2="92" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="98,30 94,36 102,36" fill="#fbbf24" stroke="#78350f" strokeWidth="1" />
            <circle cx="98" cy="60" r="3" fill={suitColor} />
          </g>
        </g>

        {/* === BOTTOM HALF (180deg Rotated Symmetry) === */}
        <use href="#top-court" transform="rotate(180 70 95)" />
      </svg>
    </div>
  );
};
